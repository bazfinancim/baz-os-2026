"use client";

import React, { useCallback, useState } from "react";

type RunState = "idle" | "running" | "done" | "error";

export function AutomationRunner() {
  const [state, setState] = useState<RunState>("idle");
  const [message, setMessage] = useState<string>("");

  const runGlobalSync = useCallback(async () => {
    setState("running");
    setMessage("");
    try {
      const res = await fetch("/api/admin/global-sync", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        upstreamStatus?: number;
        sentCompanies?: number;
      };
      if (!res.ok || data.ok === false) {
        setState("error");
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setState("done");
      setMessage(`נשלח ל-n8n · ${data.sentCompanies ?? "?"} חברות · upstream ${data.upstreamStatus ?? "—"}`);
    } catch (e) {
      setState("error");
      setMessage(e instanceof Error ? e.message : "שגיאה");
    }
  }, []);

  return (
    <div
      style={{
        background: "linear-gradient(145deg, rgba(99,102,241,0.15) 0%, rgba(15,23,42,0.9) 100%)",
        border: "1px solid rgba(99,102,241,0.35)",
        borderRadius: "14px",
        padding: "16px 18px",
        marginBottom: "22px",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem", color: "#e2e8f0" }}>Hands · Global Sync</p>
          <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#94a3b8", maxWidth: "520px", lineHeight: 1.45 }}>
            הרצה אחת שולחת את כל רשימת החברות מ־baz_companies.json ל-webhook של n8n (משתנה סביבה N8N_GLOBAL_SYNC_WEBHOOK).
          </p>
        </div>
        <button
          type="button"
          disabled={state === "running"}
          onClick={() => void runGlobalSync()}
          style={{
            border: "none",
            borderRadius: "10px",
            padding: "10px 20px",
            fontWeight: 800,
            fontSize: "0.88rem",
            cursor: state === "running" ? "wait" : "pointer",
            background: state === "running" ? "#334155" : "linear-gradient(135deg, #6366f1, #22d3ee)",
            color: "#fff",
            boxShadow: state === "running" ? "none" : "0 0 20px rgba(99,102,241,0.35)",
          }}
        >
          {state === "running" ? "⏳ מריץ…" : "⚡ Global Sync"}
        </button>
      </div>
      {message && (
        <p
          style={{
            marginTop: "12px",
            marginBottom: 0,
            fontSize: "0.8rem",
            color: state === "error" ? "#fca5a5" : "#86efac",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
