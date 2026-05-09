import { NextResponse } from "next/server";
import { routeAiPrompt } from "@/src/lib/ai-core";
import projects from "@/src/lib/projects.json";

type ChatRequest = {
  message?: string;
};

const projectContext = projects
  .map((project) => `${project.name}: ${project.context}`)
  .join("\n");

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { ok: false, answer: "נא לכתוב שאלה ל־BAZ AI." },
        { status: 400 },
      );
    }

    const response = await routeAiPrompt({
      prompt: message,
      system: [
        "אתה BAZ AI, עוזר פנימי של מפקדת האימפריה.",
        "ענה בעברית, קצר, חד ומבוסס רק על זיכרון הפרויקטים הבא.",
        projectContext,
      ].join("\n\n"),
    });

    return NextResponse.json({
      ok: true,
      provider: response.provider,
      answer: response.text || "לא התקבלה תשובה מהמודל.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI error";

    return NextResponse.json(
      {
        ok: false,
        answer: "BAZ AI לא זמין כרגע. בדוק מפתחות API בסביבת העבודה.",
        error: message,
      },
      { status: 500 },
    );
  }
}
