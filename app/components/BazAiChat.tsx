"use client";

import { useState } from "react";

type BazAiResponse = {
  ok?: boolean;
  answer?: string;
  provider?: string;
};

export function BazAiChat() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [provider, setProvider] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function askBazAi() {
    const cleanMessage = message.trim();

    if (!cleanMessage) {
      setAnswer("כתוב שאלה על בני, אבי או רשת הבוטים.");
      return;
    }

    setIsLoading(true);
    setAnswer("BAZ AI מנתח את זיכרון הפרויקטים...");
    setProvider("");

    try {
      const response = await fetch("/api/baz-ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: cleanMessage }),
      });
      const data = (await response.json()) as BazAiResponse;

      setAnswer(data.answer ?? "לא התקבלה תשובה.");
      setProvider(data.provider ?? "");
    } catch {
      setAnswer("שגיאה בחיבור ל־BAZ AI.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-fuchsia-300/20 bg-slate-950/80 p-6 shadow-2xl shadow-fuchsia-950/20">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-200">
          Chat with BAZ AI
        </p>
        <h2 className="mt-2 text-3xl font-black">שיחה עם מוח האימפריה</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          שאל על הפרויקטים של בני ואבי לפי הזיכרון הפנימי של המערכת.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void askBazAi();
            }
          }}
          placeholder="לדוגמה: מה המטרה של האתר של בני?"
          className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-4 text-white outline-none focus:border-fuchsia-300/60"
        />
        <button
          type="button"
          onClick={askBazAi}
          disabled={isLoading}
          className="rounded-2xl bg-fuchsia-300 px-6 py-4 font-black text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          שאל את BAZ AI
        </button>
      </div>

      <div className="mt-5 min-h-28 rounded-2xl border border-white/10 bg-slate-900 p-5 leading-8 text-slate-100">
        {answer || "התשובה תופיע כאן."}
      </div>

      {provider ? (
        <p className="mt-3 text-xs font-bold text-fuchsia-200">
          Provider: {provider}
        </p>
      ) : null}
    </section>
  );
}
