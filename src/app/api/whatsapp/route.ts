import { NextRequest, NextResponse } from "next/server";

// ─── Meta WhatsApp Cloud API config ─────────────────────────
const VERIFY_TOKEN = process.env.META_WHATSAPP_VERIFY_TOKEN ?? "";
const ACCESS_TOKEN = process.env.META_WHATSAPP_ACCESS_TOKEN ?? "";

// Phone number IDs for source routing
const PHONE_IDS = {
  marketing: process.env.META_WA_PHONE_MARKETING ?? "",
  office: process.env.META_WA_PHONE_OFFICE ?? "",
};

// ─── In-memory comms log (persisted to console; swap for DB) ─
// Shape: { id, source, from, body, timestamp }
type CommsEntry = {
  id: string;
  source: "marketing" | "office" | "unknown";
  from: string;
  body: string;
  timestamp: string;
  status: "received" | "read" | "replied";
};

// Shared store (survives hot-reload in dev via globalThis)
declare global {
  // eslint-disable-next-line no-var
  var __waCommsLog: CommsEntry[];
}
if (!globalThis.__waCommsLog) globalThis.__waCommsLog = [];

function routeSource(phoneNumberId: string): CommsEntry["source"] {
  if (phoneNumberId && phoneNumberId === PHONE_IDS.marketing) return "marketing";
  if (phoneNumberId && phoneNumberId === PHONE_IDS.office) return "office";
  return "unknown";
}

// ─── GET — Meta webhook verification handshake ──────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    console.log("[WhatsApp] Webhook verified by Meta");
    return new NextResponse(challenge, { status: 200 });
  }

  // Health check (no Meta params)
  if (!mode) {
    return NextResponse.json({
      status: "active",
      source_routing: { marketing: !!PHONE_IDS.marketing, office: !!PHONE_IDS.office },
      verify_token_set: !!VERIFY_TOKEN,
      access_token_set: !!ACCESS_TOKEN,
      messages_logged: globalThis.__waCommsLog.length,
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ─── POST — incoming Meta webhook events ────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    // Meta sends: { object: "whatsapp_business_account", entry: [...] }
    const entries = (body.entry ?? []) as Array<Record<string, unknown>>;

    for (const entry of entries) {
      const changes = (entry.changes ?? []) as Array<Record<string, unknown>>;
      for (const change of changes) {
        const value = change.value as Record<string, unknown> | undefined;
        if (!value) continue;

        const phoneNumberId = String(value.metadata
          ? (value.metadata as Record<string, unknown>).phone_number_id ?? ""
          : "");
        const source = routeSource(phoneNumberId);
        const messages = (value.messages ?? []) as Array<Record<string, unknown>>;

        for (const msg of messages) {
          const entry: CommsEntry = {
            id: String(msg.id ?? Date.now()),
            source,
            from: String(msg.from ?? "unknown"),
            body: String(
              (msg.text as Record<string, unknown> | undefined)?.body ??
              `[${String(msg.type ?? "media")}]`
            ),
            timestamp: new Date(Number(msg.timestamp ?? Date.now()) * 1000).toISOString(),
            status: "received",
          };

          globalThis.__waCommsLog.unshift(entry);
          if (globalThis.__waCommsLog.length > 200) globalThis.__waCommsLog.pop();

          console.log(`[WhatsApp:${source}] from=${entry.from} body=${entry.body.slice(0, 80)}`);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Webhook parse error";
    console.error("[WhatsApp] Error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
