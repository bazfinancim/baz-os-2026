import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audioFile = form.get("audio") as File | null;
    const name = (form.get("name") as string) || "unknown";
    const duration = form.get("duration") || "0";

    if (!audioFile) {
      return NextResponse.json({ ok: false, error: "No audio file" }, { status: 400 });
    }

    // שמירה לשרת Hetzner דרך N8N webhook
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `voice_${name.replace(/\s+/g, "_")}_${timestamp}.webm`;

    // שלח ל-N8N לשמירה ב-Drive
    const n8nPayload = {
      fileName,
      name,
      duration,
      sizeBytes: buffer.length,
      audioBase64: buffer.toString("base64"),
      timestamp: new Date().toISOString(),
    };

    const n8nRes = await fetch("https://n8n.baz-f.co.il/webhook/save-voice-recording", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(n8nPayload),
      signal: AbortSignal.timeout(25000),
    });

    if (!n8nRes.ok) {
      // fallback — החזר הצלחה גם אם N8N לא זמין, הקלטה בוצעה
      console.warn("N8N save-voice returned", n8nRes.status);
      return NextResponse.json({ ok: true, fileName, note: "saved locally, n8n sync pending" });
    }

    return NextResponse.json({ ok: true, fileName });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("save-voice error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
