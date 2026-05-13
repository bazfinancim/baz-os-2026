import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

type CouncilBody = {
  message?: string;
  model?: "gemini" | "codex";
};

function failReply(model: "gemini" | "codex", ts: string) {
  return { reply: "שגיאת חיבור", model, timestamp: ts };
}

async function callGemini(message: string, apiKey: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: message }] }],
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${t.slice(0, 180)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("תשובה ריקה מ-Gemini");
  return text;
}

async function callAnthropic(message: string, apiKey: string): Promise<string> {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: message }],
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${t.slice(0, 180)}`);
  }
  const data = (await res.json()) as {
    content?: { type?: string; text?: string }[];
  };
  const block = data.content?.find((c) => c.type === "text" && c.text);
  const text = block?.text?.trim();
  if (!text) throw new Error("תשובה ריקה מ-Anthropic");
  return text;
}

export async function POST(request: Request) {
  const ts = new Date().toISOString();
  let model: "gemini" | "codex" = "gemini";

  try {
    const body = (await request.json()) as CouncilBody;
    const message = typeof body.message === "string" ? body.message.trim() : "";
    model = body.model === "codex" ? "codex" : "gemini";

    if (!message) {
      return NextResponse.json({ reply: "הודעה ריקה", model, timestamp: ts }, { status: 400 });
    }

    if (model === "gemini") {
      const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY ?? "";
      if (!key) {
        return NextResponse.json(
          failReply("gemini", ts),
          { status: 200 },
        );
      }
      try {
        const reply = await callGemini(message, key);
        return NextResponse.json({ reply, model: "gemini", timestamp: ts });
      } catch {
        return NextResponse.json(failReply("gemini", ts), { status: 200 });
      }
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY ?? "";
    if (!anthropicKey) {
      return NextResponse.json(failReply("codex", ts), { status: 200 });
    }
    try {
      const reply = await callAnthropic(message, anthropicKey);
      return NextResponse.json({ reply, model: "codex", timestamp: ts });
    } catch {
      return NextResponse.json(failReply("codex", ts), { status: 200 });
    }
  } catch {
    return NextResponse.json(failReply(model, ts), { status: 200 });
  }
}
