"use client";

import { useState } from "react";

export function EmpireCommandInput() {
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  function handleCommandChange(value: string) {
    setCommand(value);
    setIsProcessing(Boolean(value.trim()));
  }

  return (
    <div className="mt-5">
      <input
        type="search"
        value={command}
        onChange={(event) => handleCommandChange(event.target.value)}
        placeholder="פקד על האימפריה... שאל את ה-AI"
        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-5 py-4 text-left text-lg font-bold text-white outline-none focus:border-fuchsia-300/60"
        dir="rtl"
      />
      {isProcessing ? (
        <div className="mt-3 flex items-center gap-3 text-sm font-bold text-fuchsia-100">
          <span className="h-2 w-2 animate-pulse rounded-full bg-fuchsia-300" />
          <span>BAZ AI סורק את נתוני האימפריה...</span>
        </div>
      ) : null}
    </div>
  );
}
