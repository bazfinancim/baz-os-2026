"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AutomationRunner } from "@/src/components/AutomationRunner";
import { ActivitySpark } from "@/src/components/ActivitySpark";

type HealthRow = {
  id: number;
  name: string;
  group: string;
  status: string;
  health: "up" | "down" | "unknown";
  ms: number;
  error?: string;
};

type HealthPayload = {
  ok?: boolean;
  rows?: HealthRow[];
  generatedAt?: string;
  total?: number;
  usingSharedWebhook?: boolean;
  error?: string;
};

export default function AdminStatusPage() {
  const [data, setData] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/companies-health", { cache: "no-store" });
      const json = (await res.json()) as HealthPayload;
      setData(json);
    } catch {
      setData({ ok: false, error: "טעינה נכשלה" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 90_000);
    return () => clearInterval(id);
  }, [refresh]);

  const rows = data?.rows ?? [];

  return (
    <div>
      <div style={{ marginBottom: "22px" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: "1.55rem", fontWeight: 900, color: "#f8fafc" }}>Eyes · ניטור חברות</h1>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.86rem", maxWidth: "720px", lineHeight: 1.5 }}>
          טבלה דינמית של 60 החברות מ־baz_companies.json. חיווי ירוק/אדום מבוסס POST ל-webhook n8n (N8N_COMPANY_PING_WEBHOOK או מיפוי ב־company_n8n_webhooks.json).
        </p>
        {data?.generatedAt && (
          <p style={{ marginTop: "8px", fontSize: "0.72rem", color: "#475569" }}>עדכון: {data.generatedAt}</p>
        )}
      </div>

      <AutomationRunner />

      <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          style={{
            border: "1px solid rgba(99,102,241,0.4)",
            background: "rgba(30,27,75,0.6)",
            color: "#e2e8f0",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: loading ? "wait" : "pointer",
            fontWeight: 600,
            fontSize: "0.82rem",
          }}
        >
          {loading ? "סורק…" : "רענן ניטור"}
        </button>
        {data?.usingSharedWebhook ? (
          <span style={{ fontSize: "0.75rem", color: "#a78bfa" }}>מצב: webhook משותף לכל החברות (מבדילים ב-body)</span>
        ) : (
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>מצב: מיפוי per-company או סביבה חסרה → אפור</span>
        )}
      </div>

      {data?.error && !data.rows && (
        <div style={{ background: "rgba(127,29,29,0.35)", border: "1px solid #991b1b", borderRadius: "10px", padding: "12px", color: "#fecaca" }}>
          {data.error}
        </div>
      )}

      <div
        style={{
          borderRadius: "14px",
          border: "1px solid rgba(99,102,241,0.2)",
          overflow: "hidden",
          background: "rgba(10,10,20,0.65)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
          <thead>
            <tr style={{ background: "rgba(30,27,75,0.5)", color: "#cbd5e1", textAlign: "right" }}>
              <th style={{ padding: "12px 10px", width: "100px" }}>פעילות</th>
              <th style={{ padding: "12px 10px" }}>חברה</th>
              <th style={{ padding: "12px 10px", width: "120px" }}>קבוצה</th>
              <th style={{ padding: "12px 10px", width: "90px" }}>n8n</th>
              <th style={{ padding: "12px 10px", width: "70px" }}>ms</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid rgba(51,65,85,0.35)" }}>
                <td style={{ padding: "10px", verticalAlign: "middle" }}>
                  <ActivitySpark seed={r.id} />
                </td>
                <td style={{ padding: "10px 12px", color: "#f1f5f9", fontWeight: 600 }}>
                  <span style={{ marginLeft: "8px" }}>{r.name}</span>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 400 }}>#{r.id}</span>
                </td>
                <td style={{ padding: "10px", color: "#94a3b8" }}>{r.group}</td>
                <td style={{ padding: "10px" }}>
                  <span
                    title={r.error ?? r.health}
                    style={{
                      display: "inline-block",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background:
                        r.health === "up" ? "#22c55e" : r.health === "down" ? "#ef4444" : "#64748b",
                      boxShadow:
                        r.health === "up"
                          ? "0 0 12px rgba(34,197,94,0.65)"
                          : r.health === "down"
                            ? "0 0 12px rgba(239,68,68,0.5)"
                            : "none",
                    }}
                  />
                </td>
                <td style={{ padding: "10px", color: "#64748b", fontFamily: "monospace" }}>{r.health === "unknown" ? "—" : r.ms}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && (
          <p style={{ padding: "24px", color: "#64748b", textAlign: "center", margin: 0 }}>אין נתוני חברות.</p>
        )}
      </div>
    </div>
  );
}
