"use client";

import { useState } from "react";

export function WhatsAppControlCenter() {
  const [botStatus, setBotStatus] = useState<"red" | "checking" | "green">("green");
  const [targetPhone, setTargetPhone] = useState("");
  const [message, setMessage] = useState("");

  async function testBot() {
    setBotStatus("checking");
    setMessage("בודק חיבור...");

    try {
      const response = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phoneNumber: targetPhone || "+972000000000",
          message: "BAZ OS WhatsApp engine test",
        }),
      });
      const data = (await response.json()) as {
        status?: string;
        message?: string;
        token_used?: string;
      };

      if (response.ok && data.status === "active") {
        setBotStatus("green");
        setMessage("WhatsApp Engine Linked Successfully");
        return;
      }

      setBotStatus("red");
      setMessage("הבוט לא החזיר סטטוס פעיל");
    } catch {
      setBotStatus("red");
      setMessage("בדיקת הבוט נכשלה");
    }
  }

  const statusClass =
    botStatus === "green"
      ? "bg-emerald-400 shadow-emerald-400/50"
      : botStatus === "checking"
        ? "bg-amber-300 shadow-amber-300/50"
        : "bg-red-500 shadow-red-500/50";

  return (
    <section className="mt-8 rounded-[2rem] border border-cyan-300/20 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/40">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            SYSTEM MONITOR / WhatsApp Bot
          </p>
          <h2 className="mt-2 text-3xl font-black">WhatsApp Control Center</h2>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3">
          <span className={`h-4 w-4 rounded-full shadow-lg ${statusClass}`} />
          <span className="font-bold">
            Bot Status: {botStatus === "green" ? "Green" : "Red"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-slate-300">
            Target Phone Number
          </span>
          <input
            value={targetPhone}
            onChange={(event) => setTargetPhone(event.target.value)}
            placeholder="+972..."
            dir="ltr"
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-left text-white outline-none focus:border-cyan-300/60"
          />
        </label>
        <button
          type="button"
          onClick={testBot}
          className="self-end rounded-2xl bg-cyan-300 px-6 py-3 font-black text-slate-950 transition hover:bg-white"
        >
          Test Bot
        </button>
      </div>

      {message ? (
        <p className="mt-4 text-sm font-bold text-cyan-100">{message}</p>
      ) : null}
    </section>
  );
}
