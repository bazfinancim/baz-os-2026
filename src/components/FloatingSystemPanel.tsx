"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** כמו shell.mainBg / ENGINE_DEPTH_BG — בלי globals.css */
const ENGINE_DEPTH_BG =
  "radial-gradient(ellipse 100% 80% at 50% -10%, rgba(49, 46, 129, 0.35) 0%, #07070f 42%, #040406 100%)";

type PanelTab = "logs" | "whatsapp" | "council" | "vision";

const TABS: { id: PanelTab; label: string; icon: string }[] = [
  { id: "logs", label: "Logs", icon: "📋" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬" },
  { id: "council", label: "AI Council", icon: "🧠" },
  { id: "vision", label: "Vision", icon: "👁️" },
];

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

export function FloatingSystemPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PanelTab>("logs");
  const [logText, setLogText] = useState<string>("טוען לוגים…");
  const [logError, setLogError] = useState<string | null>(null);
  const [logUpdated, setLogUpdated] = useState<string>("");
  const [waDraft, setWaDraft] = useState("");
  const [waThread, setWaThread] = useState<{ id: string; from: string; body: string; at: string }[]>([
    { id: "1", from: "Hub", body: "חלון WhatsApp — הודעות מקומיות (דמו).", at: new Date().toLocaleTimeString("he-IL") },
  ]);
  const [councilDraft, setCouncilDraft] = useState("");
  const [councilLines, setCouncilLines] = useState<string[]>([
    "מועצת המוחות: האזן בין לוגים, ווטסאפ, AI ו-Vision.",
    "הזן החלטה אסטרטגית ושמור לתיעוד מקומי.",
  ]);
  const visionVideoRef = useRef<HTMLVideoElement | null>(null);
  const [visionError, setVisionError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!open || tab !== "vision") return;
    setVisionError(null);
    const v = visionVideoRef.current;
    if (!v) return;
    let stream: MediaStream | null = null;
    const run = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setVisionError("הדפדפן לא תומך ב-getUserMedia");
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        v.srcObject = stream;
        v.muted = true;
        v.playsInline = true;
        await v.play().catch((e) => {
          const msg = e instanceof Error ? e.message : "שגיאת ניגון";
          setVisionError(msg);
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "לא ניתן לגשת למצלמה";
        setVisionError(msg);
      }
    };
    void run();
    return () => {
      try {
        v.pause();
        v.srcObject = null;
      } catch {
        /* ignore */
      }
      stream?.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
      });
    };
  }, [open, tab]);

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

  const councilSubmit = useCallback(() => {
    const line = councilDraft.trim();
    if (!line) return;
    setCouncilLines((prev) => [...prev, `[${new Date().toLocaleTimeString("he-IL")}] ${line}`]);
    setCouncilDraft("");
  }, [councilDraft]);

  const panelTitle = useMemo(() => TABS.find((t) => t.id === tab)?.label ?? "", [tab]);

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 9999,
        fontFamily: "system-ui, -apple-system, sans-serif",
        pointerEvents: "none",
      }}
    >
      <div style={{ pointerEvents: "auto", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
        {open ? (
          <section
            style={{
              width: "min(92vw, 400px)",
              maxHeight: "min(70vh, 520px)",
              display: "flex",
              flexDirection: "column",
              borderRadius: 16,
              overflow: "hidden",
              background: ENGINE_DEPTH_BG,
              border: "1px solid rgba(129, 140, 248, 0.35)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
            }}
          >
            <header
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "10px 12px",
                borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
                background: "rgba(15,23,42,0.65)",
              }}
            >
              <span style={{ fontWeight: 800, fontSize: "0.82rem", color: "#e2e8f0" }}>Floating System · {panelTitle}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  background: "rgba(248,113,113,0.2)",
                  color: "#fecaca",
                }}
              >
                סגור
              </button>
            </header>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 10px", borderBottom: "1px solid rgba(51,65,85,0.35)" }}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  style={{
                    border: tab === t.id ? "none" : "1px solid rgba(71,85,105,0.5)",
                    borderRadius: 8,
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    background: tab === t.id ? "rgba(99,102,241,0.5)" : "rgba(15,23,42,0.5)",
                    color: tab === t.id ? "#fff" : "#94a3b8",
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, minHeight: 220, overflow: "auto", padding: 12 }}>
              {tab === "logs" && (
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: "0.68rem", color: "#64748b" }}>
                    עדכון אחרון: {logUpdated || "—"}
                    {logError ? ` · שגיאה: ${logError}` : ""}
                  </p>
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontSize: "0.68rem",
                      lineHeight: 1.45,
                      color: "#cbd5e1",
                      fontFamily: "ui-monospace, monospace",
                      direction: "ltr",
                      textAlign: "left",
                    }}
                  >
                    {logError ? `לא ניתן לטעון דוח: ${logError}` : logText}
                  </pre>
                </div>
              )}

              {tab === "whatsapp" && (
                <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 200, gap: 8 }}>
                  <div
                    style={{
                      flex: 1,
                      overflow: "auto",
                      borderRadius: 10,
                      padding: 8,
                      background: "rgba(15,23,42,0.55)",
                      border: "1px solid rgba(51,65,85,0.4)",
                    }}
                  >
                    {waThread.map((m) => (
                      <div key={m.id} style={{ marginBottom: 10, fontSize: "0.78rem", color: "#e2e8f0" }}>
                        <span style={{ color: "#94a3b8", fontSize: "0.65rem" }}>{m.at}</span>{" "}
                        <strong style={{ color: "#a5b4fc" }}>{m.from}:</strong> {m.body}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      value={waDraft}
                      onChange={(e) => setWaDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") waSend();
                      }}
                      placeholder="הודעה…"
                      style={{
                        flex: 1,
                        borderRadius: 8,
                        border: "1px solid rgba(71,85,105,0.6)",
                        padding: "8px 10px",
                        fontSize: "0.8rem",
                        background: "#0f172a",
                        color: "#f1f5f9",
                      }}
                    />
                    <button
                      type="button"
                      onClick={waSend}
                      style={{
                        border: "none",
                        borderRadius: 8,
                        padding: "8px 14px",
                        fontWeight: 700,
                        cursor: "pointer",
                        background: "rgba(34,197,94,0.35)",
                        color: "#bbf7d0",
                      }}
                    >
                      שלח
                    </button>
                  </div>
                </div>
              )}

              {tab === "council" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 200 }}>
                  <ul style={{ margin: 0, paddingRight: 18, color: "#94a3b8", fontSize: "0.78rem", lineHeight: 1.55 }}>
                    {councilLines.map((line, i) => (
                      <li key={`${i}-${line.slice(0, 24)}`} style={{ marginBottom: 6 }}>
                        {line}
                      </li>
                    ))}
                  </ul>
                  <textarea
                    value={councilDraft}
                    onChange={(e) => setCouncilDraft(e.target.value)}
                    placeholder="החלטת מועצה / הערה…"
                    rows={3}
                    style={{
                      width: "100%",
                      resize: "vertical",
                      borderRadius: 10,
                      border: "1px solid rgba(71,85,105,0.6)",
                      padding: 10,
                      fontSize: "0.8rem",
                      background: "#0f172a",
                      color: "#f1f5f9",
                    }}
                  />
                  <button
                    type="button"
                    onClick={councilSubmit}
                    style={{
                      alignSelf: "flex-start",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 16px",
                      fontWeight: 700,
                      cursor: "pointer",
                      background: "rgba(129,140,248,0.4)",
                      color: "#e0e7ff",
                    }}
                  >
                    רשום להיסטוריה מקומית
                  </button>
                </div>
              )}

              {tab === "vision" && (
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: "0.72rem", color: "#94a3b8" }}>
                    תצוגת מצלמה חיה (getUserMedia) — דורש הרשאת דפדפן.
                  </p>
                  {visionError ? (
                    <p style={{ color: "#fca5a5", fontSize: "0.78rem" }}>{visionError}</p>
                  ) : null}
                  <video
                    ref={visionVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{
                      width: "100%",
                      maxHeight: 240,
                      borderRadius: 12,
                      background: "#020617",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}
            </div>
          </section>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{
            border: "1px solid rgba(129, 140, 248, 0.45)",
            borderRadius: 999,
            padding: "12px 16px",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: "0.78rem",
            color: "#e0e7ff",
            background: ENGINE_DEPTH_BG,
            boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
          }}
        >
          {open ? "▼ סגור פאנל" : "▲ מערכת"}
        </button>
      </div>
    </div>
  );
}
