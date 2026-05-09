import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  buildBotPayload,
  normalizeBotSettings,
  validateBotAction,
  type WhatsAppBotAction,
  type WhatsAppBotSettings,
} from "@/lib/whatsapp/bot";

const logDir = join(process.cwd(), ".cursor", "logs");
const settingsFile = join(logDir, "whatsapp-bot-settings.json");
const eventLogFile = join(logDir, "whatsapp-bot-events.jsonl");

async function readSettings(): Promise<WhatsAppBotSettings> {
  try {
    const content = await readFile(settingsFile, "utf8");
    return normalizeBotSettings(JSON.parse(content) as Partial<WhatsAppBotSettings>);
  } catch {
    return normalizeBotSettings();
  }
}

async function writeSettings(settings: WhatsAppBotSettings): Promise<void> {
  await mkdir(logDir, { recursive: true });
  await writeFile(settingsFile, JSON.stringify(settings, null, 2), "utf8");
}

async function appendBotEvent(event: Record<string, unknown>): Promise<void> {
  await mkdir(logDir, { recursive: true });
  await appendFile(eventLogFile, `${JSON.stringify(event)}\n`, "utf8");
}

async function readEvents(): Promise<Record<string, unknown>[]> {
  try {
    const content = await readFile(eventLogFile, "utf8");
    return content
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>)
      .slice(-25)
      .reverse();
  } catch {
    return [];
  }
}

async function forwardToWebhook(payload: unknown, webhookUrl: string) {
  if (!webhookUrl) {
    return {
      forwarded: false,
      status: "mock",
      message: "No webhook configured; event logged locally only.",
    };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  return {
    forwarded: response.ok,
    status: response.status,
    message: response.ok ? "Webhook accepted payload" : await response.text(),
  };
}

export async function GET() {
  try {
    const [settings, events] = await Promise.all([readSettings(), readEvents()]);
    return NextResponse.json({ ok: true, settings, events });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unknown WhatsApp bot read error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      action?: WhatsAppBotAction;
      settings?: Partial<WhatsAppBotSettings>;
    };

    const settings = normalizeBotSettings({
      ...(await readSettings()),
      ...(body.settings ?? {}),
    });
    const action = body.action ?? { action: "sync_settings" };
    const validationErrors = validateBotAction(action);

    if (validationErrors.length) {
      return NextResponse.json(
        { ok: false, errors: validationErrors },
        { status: 400 },
      );
    }

    await writeSettings(settings);

    const payload = buildBotPayload(action, settings);
    const delivery = await forwardToWebhook(payload, settings.webhookUrl);
    const event = {
      ...payload,
      delivery,
    };

    await appendBotEvent(event);

    return NextResponse.json({ ok: true, settings, event });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown WhatsApp bot action error",
      },
      { status: 500 },
    );
  }
}
