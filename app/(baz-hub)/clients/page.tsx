"use client";

import React, { useEffect, useState } from "react";
import { useHubLang } from "@/src/components/HubLanguageProvider";

type Client = {
  id: string;
  name: string;
  health: number;
  fuelStatus: number;
  activeAutomations: string[];
  needsHumanHelp: boolean;
};

export default function ClientsPage() {
  const { lang, dir } = useHubLang();
  const [clients, setClients] = useState<Client[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/clients");
        const data = (await res.json()) as { clients?: Client[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        if (!cancelled) setClients(Array.isArray(data.clients) ? data.clients : []);
      } catch (e) {
        if (!cancelled) setErr(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const title = lang === "he" ? "לקוחות" : "Clients";
  const subtitle =
    lang === "he" ? "מסד Empire מקומי דרך /api/clients" : "Local Empire DB via /api/clients";

  return (
    <div dir={dir} style={{ padding: "24px 26px 40px", maxWidth: "960px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>{title}</h1>
      <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "20px" }}>{subtitle}</p>
      {err && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            padding: "12px",
            marginBottom: "16px",
            color: "#b91c1c",
            fontSize: "0.85rem",
          }}
        >
          {err}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {clients.map((c) => (
          <div
            key={c.id}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "14px 16px",
            }}
          >
            <p style={{ fontWeight: 700, margin: "0 0 6px", color: "#0f172a" }}>{c.name}</p>
            <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
              {lang === "he" ? "בריאות" : "Health"}: {c.health} · {lang === "he" ? "דלק" : "Fuel"}: {c.fuelStatus}
              {c.needsHumanHelp ? ` · ${lang === "he" ? "דורש טיפול אנושי" : "Needs human"}` : ""}
            </p>
            {c.activeAutomations?.length > 0 && (
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "8px" }}>
                {c.activeAutomations.join(", ")}
              </p>
            )}
          </div>
        ))}
        {!err && clients.length === 0 && (
          <p style={{ color: "#94a3b8", fontSize: "0.88rem" }}>{lang === "he" ? "אין לקוחות." : "No clients."}</p>
        )}
      </div>
    </div>
  );
}
