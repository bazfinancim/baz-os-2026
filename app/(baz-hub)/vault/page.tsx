"use client";

import React from "react";
import { useHubLang } from "@/src/components/HubLanguageProvider";

export default function VaultPage() {
  const { lang, dir } = useHubLang();

  const title = lang === "he" ? "כספת" : "Vault";
  const body =
    lang === "he"
      ? "ניהול מפתחות ונכסים רגישים מתבצע בשרת (API /api/vault). כאן שלד Hub — השתמש ב-Credits Hub לפירוט יתרות או בקריאות API מהצד שלך."
      : "Secrets and keys are handled on the server (/api/vault). This is a Hub shell — use Credits Hub for balances or call the API from your workflows.";

  return (
    <div dir={dir} style={{ padding: "24px 26px 40px", maxWidth: "720px", margin: "0 auto", color: "#e2e8f0" }}>
      <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#f8fafc", marginBottom: "10px" }}>{title}</h1>
      <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.55, marginBottom: "20px" }}>{body}</p>
      <div
        style={{
          background: "#111118",
          border: "1px solid #1e293b",
          borderRadius: "12px",
          padding: "16px 18px",
          fontSize: "0.85rem",
          color: "#94a3b8",
        }}
      >
        <code style={{ fontSize: "0.8rem", color: "#a5b4fc" }}>GET /api/vault</code>
        <span style={{ margin: "0 8px" }}>·</span>
        <code style={{ fontSize: "0.8rem", color: "#a5b4fc" }}>POST /api/vault/inject</code>
      </div>
    </div>
  );
}
