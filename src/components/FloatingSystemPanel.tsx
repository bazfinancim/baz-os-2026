"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/** עומק מנוע — בלי globals.css */
const ENGINE_DEPTH_BG =
  "radial-gradient(ellipse 100% 80% at 50% -10%, rgba(49, 46, 129, 0.35) 0%, #07070f 42%, #040406 100%)";

type PanelTab = "council" | "vision" | "logs" | "whatsapp";

const TABS: { id: PanelTab; label: string; icon: string }[] = [
  { id: "council", label: "AI Council", icon: "🧠" },
  { id: "vision", label: "Vision", icon: "👁️" },
  { id: "logs", label: "Logs", icon: "📋" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬" },
];

const PANEL_W = 400;
const PANEL_H = 600;

async function fetchSystemLogsText(): Promise<{ ok: true; text: string } | { ok: false; message: string }> {
  try {
    const res = await fetch("/api/get-report", { cache: "no-store" });
    if (!res.ok) {
      return { ok: false, message: `HTTP ${res.status}` };
    }
    const text = await res.text();
    return { ok: true, text: text.trim() || "(דוח ריק)" };
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאת רשת לא ידועה";
    return { ok: false, message };
  }
}

/** אנימציית ברקים — Keyframes בלבד (לא globals.css) */
function LightningStyles() {
  const css = `
    @keyframes fsp-bolt-orbit {
      0% { transform: rotate(0deg) scale(0.92); opacity: 0.35; }
      25% { transform: rotate(90deg) scale(1.08); opacity: 1; }
      50% { transform: rotate(180deg) scale(0.95); opacity: 0.45; }
      75% { transform: rotate(270deg) scale(1.05); opacity: 0.95; }
      100% { transform: rotate(360deg) scale(0.92); opacity: 0.35; }
    }
    @keyframes fsp-bolt-orbit-rev {
      0% { transform: rotate(0deg) scale(0.88); opacity: 0.25; }
      25% { transform: rotate(-95deg) scale(1.1); opacity: 0.9; }
      50% { transform: rotate(-190deg) scale(0.9); opacity: 0.5; }
      75% { transform: rotate(-275deg) scale(1.02); opacity: 0.85; }
      100% { transform: rotate(-360deg) scale(0.88); opacity: 0.25; }
    }
    @keyframes fsp-dash-flow {
      0% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: -48; }
    }
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

export function FloatingSystemPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PanelTab>("council");
  const [logText, setLogText] = useState<string>("טוען לוגים…");
  const [logError, setLogError] = useState<string | null>(null);
  const [logUpdated, setLogUpdated] = useState<string>("");
  const [waDraft, setWaDraft] = useState("");
  const [waThread, setWaThread] = useState<{ id: string; from: string; body: string; at: string }[]>([
    { id: "1", from: "מערכת", body: "ערוץ WhatsApp — מוכן.", at: new Date().toLocaleTimeString("he-IL") },
  ]);
  const [councilDraft, setCouncilDraft] = useState("");
  const [councilMessages, setCouncilMessages] = useState<{ id: string; role: "council" | "you"; text: string; at: string }[]>([
    {
      id: "c0",
      role: "council",
      text: "מועצת המוחות פעילה. נסח החלטה או הנחיה — התיעוד נשמר מקומית בסשן זה.",
      at: new Date().toLocaleTimeString("he-IL"),
    },
  ]);

  const refreshLogs = useCallback(async () => {
    const r = await fetchSystemLogsText();
    if (r.ok) {
      setLogText(r.text);
      setLogError(null);
    } else {
      setLogError(r.message);
      setLogText("");
    }
    setLogUpdated(new Date().toLocaleString("he-IL"));
  }, []);

  useEffect(() => {
    if (!open || tab !== "logs") return;
    void refreshLogs();
    const id = window.setInterval(() => {
      void refreshLogs();
    }, 12_000);
    return () => window.clearInterval(id);
  }, [open, tab, refreshLogs]);

  const waSend = useCallback(() => {
    const body = waDraft.trim();
    if (!body) return;
    setWaThread((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        from: "אתה",
        body,
        at: new Date().toLocaleTimeString("he-IL"),
      },
    ]);
    setWaDraft("");
  }, [waDraft]);

  const councilSend = useCallback(() => {
    const text = councilDraft.trim();
    if (!text) return;
    const at = new Date().toLocaleTimeString("he-IL");
    setCouncilMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "you", text, at },
      {
        id: `c-${Date.now()}`,
        role: "council",
        text: "נקלט. (תגובת מועצה מקומית — אינטגרציית AI תתווסף בהמשך.)",
        at,
      },
    ]);
    setCouncilDraft("");
  }, [councilDraft]);

  const panelTitle = useMemo(() => TABS.find((t) => t.id === tab)?.label ?? "", [tab]);

  return (
    <>
      <LightningStyles />
      <div
        dir="rtl"
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 10000,
          fontFamily: "system-ui, -apple-system, sans-serif",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 12,
          }}
        >
          {open ? (
            <section
              style={{
                width: PANEL_W,
                height: PANEL_H,
                maxWidth: "min(92vw, 400px)",
                maxHeight: "min(85vh, 600px)",
                display: "flex",
                flexDirection: "column",
                borderRadius: 18,
                overflow: "hidden",
                background: `linear-gradient(165deg, rgba(15,23,42,0.5) 0%, rgba(3,7,18,0.65) 100%), ${ENGINE_DEPTH_BG}`,
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1px solid rgba(0, 255, 255, 0.42)",
                boxShadow:
                  "0 0 0 1px rgba(168,85,247,0.15) inset, 0 0 28px rgba(0,255,255,0.18), 0 24px 64px rgba(0,0,0,0.55)",
              }}
            >
              <header
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "12px 14px",
                  borderBottom: "1px solid rgba(0,255,255,0.2)",
                  background: "rgba(2,6,23,0.45)",
                }}
              >
                <span style={{ fontWeight: 800, fontSize: "0.8rem", color: "#ecfeff", letterSpacing: "0.04em" }}>
                  Lightning Core · {panelTitle}
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    border: "1px solid rgba(248,113,113,0.35)",
                    borderRadius: 10,
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    background: "rgba(127,29,29,0.35)",
                    color: "#fecaca",
                  }}
                >
                  סגור
                </button>
              </header>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  padding: "10px 12px",
                  borderBottom: "1px solid rgba(51,65,85,0.45)",
                  background: "rgba(15,23,42,0.35)",
                }}
              >
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    style={{
                      border: tab === t.id ? "1px solid rgba(0,255,255,0.55)" : "1px solid rgba(71,85,105,0.45)",
                      borderRadius: 10,
                      padding: "7px 11px",
                      cursor: "pointer",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background:
                        tab === t.id
                          ? "linear-gradient(135deg, rgba(0,255,255,0.18), rgba(168,85,247,0.2))"
                          : "rgba(15,23,42,0.55)",
                      color: tab === t.id ? "#ecfeff" : "#94a3b8",
                      boxShadow: tab === t.id ? "0 0 12px rgba(0,255,255,0.15)" : "none",
                    }}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 14 }}>
                {tab === "council" && (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 12, minHeight: 0 }}>
                    <div
                      style={{
                        flex: 1,
                        overflow: "auto",
                        borderRadius: 14,
                        padding: 12,
                        background: "linear-gradient(180deg, rgba(2,6,23,0.65) 0%, rgba(15,23,42,0.5) 100%)",
                        border: "1px solid rgba(168,85,247,0.25)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      {councilMessages.map((m) => (
                        <div
                          key={m.id}
                          style={{
                            alignSelf: m.role === "you" ? "flex-end" : "flex-start",
                            maxWidth: "92%",
                            borderRadius: 14,
                            padding: "10px 14px",
                            fontSize: "0.82rem",
                            lineHeight: 1.5,
                            color: m.role === "you" ? "#0f172a" : "#e0e7ff",
                            background:
                              m.role === "you"
                                ? "linear-gradient(135deg, #a5b4fc, #818cf8)"
                                : "linear-gradient(135deg, rgba(30,27,75,0.9), rgba(49,46,129,0.75))",
                            border:
                              m.role === "you" ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(168,85,247,0.35)",
                            boxShadow: m.role === "council" ? "0 0 20px rgba(168,85,247,0.12)" : "none",
                          }}
                        >
                          <div style={{ fontSize: "0.62rem", opacity: 0.85, marginBottom: 4 }}>{m.at}</div>
                          {m.text}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <textarea
                        value={councilDraft}
                        onChange={(e) => setCouncilDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            councilSend();
                          }
                        }}
                        placeholder="הנחיה למועצה… (Enter לשליחה)"
                        rows={2}
                        style={{
                          flex: 1,
                          resize: "none",
                          borderRadius: 12,
                          border: "1px solid rgba(168,85,247,0.35)",
                          padding: "10px 12px",
                          fontSize: "0.82rem",
                          background: "rgba(2,6,23,0.75)",
                          color: "#f8fafc",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={councilSend}
                        style={{
                          border: "none",
                          borderRadius: 12,
                          padding: "12px 16px",
                          fontWeight: 800,
                          cursor: "pointer",
                          background: "linear-gradient(135deg, #a855f7, #6366f1)",
                          color: "#fff",
                          boxShadow: "0 8px 24px rgba(168,85,247,0.35)",
                        }}
                      >
                        שלח
                      </button>
                    </div>
                  </div>
                )}

                {tab === "vision" && (
                  <div>
                    <h2
                      style={{
                        margin: "0 0 12px",
                        fontSize: "1rem",
                        fontWeight: 900,
                        color: "#ecfeff",
                        textShadow: "0 0 18px rgba(0,255,255,0.35)",
                      }}
                    >
                      Live Intel Feed
                    </h2>
                    <p style={{ margin: "0 0 12px", fontSize: "0.74rem", color: "#94a3b8", lineHeight: 1.5 }}>
                      Placeholder מוכן להזרמת וידאו / מקור חיצוני — ללא גישה למצלמה כברירת מחדל.
                    </p>
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: 220,
                        borderRadius: 14,
                        background:
                          "repeating-linear-gradient(0deg, #020617, #020617 2px, #0f172a 2px, #0f172a 4px), radial-gradient(ellipse at center, rgba(0,255,255,0.08), transparent 70%)",
                        border: "1px dashed rgba(0,255,255,0.35)",
                        display: "grid",
                        placeItems: "center",
                        color: "#22d3ee",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                      }}
                    >
                      <video
                        muted
                        playsInline
                        controls={false}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: 14,
                          opacity: 0.2,
                          pointerEvents: "none",
                        }}
                        aria-hidden
                      />
                      <span style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 12px" }}>
                        ממתין להזרמת Intel
                        <br />
                        <span style={{ fontSize: "0.68rem", fontWeight: 500, color: "#94a3b8" }}>(Video placeholder)</span>
                      </span>
                    </div>
                  </div>
                )}

                {tab === "logs" && (
                  <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: "0.65rem", color: "#22c55e", fontFamily: "ui-monospace, monospace" }}>
                      [SYS] עדכון: {logUpdated || "—"}
                      {logError ? ` | ERR: ${logError}` : ""}
                    </div>
                    <pre
                      style={{
                        flex: 1,
                        margin: 0,
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontSize: "0.72rem",
                        lineHeight: 1.5,
                        color: "#4ade80",
                        background: "#020617",
                        fontFamily: "ui-monospace, Consolas, monospace",
                        direction: "ltr",
                        textAlign: "left",
                        padding: 12,
                        borderRadius: 10,
                        border: "1px solid #14532d",
                        boxShadow: "inset 0 0 24px rgba(34,197,94,0.08)",
                      }}
                    >
                      {logError ? `>> ERROR: ${logError}` : logText}
                    </pre>
                  </div>
                )}

                {tab === "whatsapp" && (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 10, minHeight: 0 }}>
                    <div
                      style={{
                        flex: 1,
                        overflow: "auto",
                        borderRadius: 14,
                        padding: 10,
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      {waThread.map((m) => (
                        <div
                          key={m.id}
                          style={{
                            marginBottom: 10,
                            padding: "8px 10px",
                            borderRadius: 12,
                            background: m.from === "אתה" ? "#dbeafe" : "#fff",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <div style={{ fontSize: "0.62rem", color: "#64748b" }}>{m.at}</div>
                          <div style={{ fontSize: "0.82rem", color: "#0f172a", marginTop: 4 }}>
                            <strong style={{ color: "#2563eb" }}>{m.from}</strong> — {m.body}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={waDraft}
                        onChange={(e) => setWaDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") waSend();
                        }}
                        placeholder="הקלד הודעה…"
                        style={{
                          flex: 1,
                          borderRadius: 12,
                          border: "1px solid #cbd5e1",
                          padding: "10px 12px",
                          fontSize: "0.85rem",
                          background: "#fff",
                          color: "#0f172a",
                        }}
                      />
                      <button
                        type="button"
                        onClick={waSend}
                        style={{
                          border: "none",
                          borderRadius: 12,
                          padding: "10px 18px",
                          fontWeight: 800,
                          cursor: "pointer",
                          background: "#16a34a",
                          color: "#fff",
                        }}
                      >
                        שלח
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "סגור פאנל מערכת" : "פתח פאנל מערכת"}
            style={{
              position: "relative",
              width: 60,
              height: 60,
              borderRadius: "50%",
              border: "1px solid rgba(168,85,247,0.45)",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(145deg, #1e1b4b 0%, #312e81 42%, #0f172a 100%), ${ENGINE_DEPTH_BG}`,
              backgroundBlendMode: "normal",
              boxShadow: "0 12px 36px rgba(0,0,0,0.5), 0 0 24px rgba(99,102,241,0.35)",
              overflow: "visible",
            }}
          >
            {/* שכבת SVG ברקים — לופ ~2 שניות */}
            <svg
              width="72"
              height="72"
              viewBox="0 0 72 72"
              style={{
                position: "absolute",
                pointerEvents: "none",
                animation: "fsp-bolt-orbit 2s linear infinite",
              }}
              aria-hidden
            >
              <path
                d="M36 6 L44 28 L34 26 L40 48 L28 32 L36 36 L30 18 Z"
                fill="none"
                stroke="#00ffff"
                strokeWidth="1.2"
                strokeLinejoin="round"
                strokeDasharray="6 10"
                style={{ animation: "fsp-dash-flow 2s linear infinite" }}
              />
            </svg>
            <svg
              width="72"
              height="72"
              viewBox="0 0 72 72"
              style={{
                position: "absolute",
                pointerEvents: "none",
                animation: "fsp-bolt-orbit-rev 2s linear infinite",
              }}
              aria-hidden
            >
              <path
                d="M36 66 L30 40 L42 44 L26 22 L46 34 L36 30 L38 52 Z"
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.2"
                strokeLinejoin="round"
                strokeDasharray="8 8"
                style={{ animation: "fsp-dash-flow 2s linear infinite reverse" }}
              />
            </svg>
            <span style={{ position: "relative", zIndex: 2, fontSize: "1.45rem", lineHeight: 1, filter: "drop-shadow(0 0 6px rgba(250,250,250,0.5))" }}>
              ⚡
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
