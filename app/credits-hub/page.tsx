"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import AI_PROGRAMS_RAW from "@/src/data/ai_export.json";
import DISCOVERED_RAW from "@/src/data/discovered_tools.json";
import {
  calculateCredits,
  formatCreditsCompact,
  parseCreditsValue,
  type CreditTool,
} from "@/src/lib/credits-calculator";

type Base44CreditsPayload = {
  status?: string;
  base44?: { connected: boolean; keyMasked: string };
  credits?: {
    usedCredits: number;
    totalCredits: number;
    giftCredits: number;
    remainingCredits: number;
    integrationCreditsRemaining: number;
    chatCreditsRemaining: number;
    syncWindow: string;
    status: string;
  };
};

type VaultAssetRow = {
  id: string;
  tool_name: string;
  credit_balance: number;
  status: string;
  expiry_date: string;
};

function cardStyle(accent: string): CSSProperties {
  return {
    background: "#0f172a",
    border: `1px solid ${accent}`,
    borderRadius: "14px",
    padding: "18px 20px",
    minWidth: "200px",
    flex: "1 1 240px",
  };
}

export default function CreditsHubPage() {
  const programs = useMemo(
    () => (AI_PROGRAMS_RAW as { programs?: CreditTool[] }).programs ?? [],
    [],
  );
  const discovered = useMemo(() => (DISCOVERED_RAW as CreditTool[]) ?? [], []);
  const allTools = useMemo(() => [...programs, ...discovered], [programs, discovered]);
  const hunterCredits = useMemo(() => calculateCredits(allTools), [allTools]);

  const topByValue = useMemo(() => {
    return [...allTools]
      .map((t) => ({ t, v: parseCreditsValue(t.credit_value) }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v)
      .slice(0, 12)
      .map((x) => x.t);
  }, [allTools]);

  const [base44, setBase44] = useState<Base44CreditsPayload | null>(null);
  const [vaultRows, setVaultRows] = useState<VaultAssetRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingApis, setLoadingApis] = useState(true);

  const refreshApis = useCallback(async () => {
    setLoadingApis(true);
    setLoadError(null);
    try {
      const [cRes, vRes] = await Promise.all([
        fetch("/api/base44/sync-credits", { cache: "no-store" }),
        fetch("/api/vault", { cache: "no-store" }),
      ]);

      if (!cRes.ok) {
        throw new Error(`Base44: ${cRes.status}`);
      }
      if (!vRes.ok) {
        throw new Error(`Vault: ${vRes.status}`);
      }

      const cJson = (await cRes.json()) as Base44CreditsPayload;
      const vJson = (await vRes.json()) as { assets?: VaultAssetRow[] };

      setBase44(cJson);
      setVaultRows(Array.isArray(vJson.assets) ? vJson.assets : []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "שגיאה לא ידועה";
      setLoadError(`טעינת נתוני שרת נכשלה: ${msg}`);
      setBase44(null);
      setVaultRows([]);
    } finally {
      setLoadingApis(false);
    }
  }, []);

  useEffect(() => {
    void refreshApis();
  }, [refreshApis]);

  const vaultTotal = useMemo(
    () => vaultRows.reduce((s, a) => s + (Number(a.credit_balance) || 0), 0),
    [vaultRows],
  );

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#07070f",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 900 }}>
              <span style={{ color: "#4ade80" }}>💎</span> Credits Hub
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "8px", marginBottom: 0 }}>
              סיכום קרדיטים: Hunter (מקומי) · Base44 · Vault — עדכון שרת בלחיצה
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => void refreshApis()}
              disabled={loadingApis}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #334155",
                background: "#1e293b",
                color: "#e2e8f0",
                cursor: loadingApis ? "wait" : "pointer",
                fontWeight: 700,
              }}
            >
              {loadingApis ? "טוען…" : "רענן נתוני שרת"}
            </button>
            <a
              href="/"
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #334155",
                background: "#0f172a",
                color: "#94a3b8",
                textDecoration: "none",
                fontWeight: 700,
                display: "inline-block",
              }}
            >
              ← מרכז הפיקוד
            </a>
            <a
              href="/hunter"
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #ca8a04",
                background: "#422006",
                color: "#fcd34d",
                textDecoration: "none",
                fontWeight: 700,
                display: "inline-block",
              }}
            >
              Hunter Hub
            </a>
          </div>
        </header>

        {loadError ? (
          <div
            role="alert"
            style={{
              background: "#450a0a",
              border: "1px solid #991b1b",
              color: "#fecaca",
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontSize: "0.9rem",
            }}
          >
            {loadError}
          </div>
        ) : null}

        <section
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "14px",
            marginBottom: "28px",
          }}
        >
          <div style={cardStyle("#16a34a")}>
            <div style={{ color: "#86efac", fontSize: "0.75rem", fontWeight: 700 }}>Hunter — פעילים</div>
            <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#4ade80", marginTop: "6px" }}>
              {formatCreditsCompact(hunterCredits.active)}
            </div>
            <div style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "6px" }}>
              {hunterCredits.activeCount} כלים · פוטנציאל {formatCreditsCompact(hunterCredits.potential)}
            </div>
          </div>

          <div style={cardStyle("#6366f1")}>
            <div style={{ color: "#a5b4fc", fontSize: "0.75rem", fontWeight: 700 }}>Base44 — יתרה</div>
            <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#818cf8", marginTop: "6px" }}>
              {base44?.credits
                ? base44.credits.remainingCredits.toLocaleString("he-IL")
                : loadingApis
                  ? "…"
                  : "—"}
            </div>
            <div style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "6px" }}>
              {base44?.credits
                ? `מתוך ${base44.credits.totalCredits.toLocaleString("he-IL")} · מתנה ${base44.credits.giftCredits}`
                : "אין נתון"}
              {base44?.base44 ? (
                <span style={{ display: "block", marginTop: "4px" }}>
                  מפתח: {base44.base44.connected ? base44.base44.keyMasked : "לא מוגדר"}
                </span>
              ) : null}
            </div>
          </div>

          <div style={cardStyle("#0ea5e9")}>
            <div style={{ color: "#7dd3fc", fontSize: "0.75rem", fontWeight: 700 }}>Vault — יתרות DB</div>
            <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#38bdf8", marginTop: "6px" }}>
              {vaultTotal.toLocaleString("he-IL")}
            </div>
            <div style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "6px" }}>
              {vaultRows.length} נכסים פעילים בקובץ
            </div>
          </div>

          <div style={cardStyle("#a855f7")}>
            <div style={{ color: "#d8b4fe", fontSize: "0.75rem", fontWeight: 700 }}>Hunter — סה״כ מדד</div>
            <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#c084fc", marginTop: "6px" }}>
              {formatCreditsCompact(hunterCredits.total)}
            </div>
            <div style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "6px" }}>
              פעילים + פוטנציאל (מספרים משוערים מטקסט credit_value)
            </div>
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
          <section style={{ ...cardStyle("#334155"), flex: "unset" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: "1rem", color: "#f1f5f9" }}>מובילים לפי ערך מוערך</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              {topByValue.map((t) => (
                <li
                  key={t.id ?? t.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    fontSize: "0.82rem",
                    borderBottom: "1px solid #1e293b",
                    paddingBottom: "6px",
                  }}
                >
                  <span style={{ color: "#cbd5e1" }}>{t.name ?? "—"}</span>
                  <span style={{ color: "#4ade80", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                    {formatCreditsCompact(parseCreditsValue(t.credit_value))}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section style={{ ...cardStyle("#334155"), flex: "unset" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: "1rem", color: "#f1f5f9" }}>Vault — פירוט</h2>
            {vaultRows.length === 0 && !loadingApis ? (
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>אין נכסים או טעינה נכשלה.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {vaultRows.map((a) => (
                  <li
                    key={a.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      fontSize: "0.82rem",
                      borderBottom: "1px solid #1e293b",
                      paddingBottom: "6px",
                    }}
                  >
                    <span style={{ color: "#cbd5e1" }}>{a.tool_name}</span>
                    <span style={{ color: "#38bdf8", fontFamily: "monospace" }}>
                      {a.credit_balance.toLocaleString("he-IL")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
