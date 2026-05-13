"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { createDefaultMissions, normalizeMissions, type MissionLane, type MissionTask } from "@/src/lib/missions-store";

/** עומק מנוע — בלי globals.css */
const ENGINE_DEPTH_BG =
  "radial-gradient(ellipse 100% 80% at 50% -10%, rgba(49, 46, 129, 0.35) 0%, #07070f 42%, #040406 100%)";

type PanelTab = "council" | "vision" | "logs" | "whatsapp" | "missions";

const TABS: { id: PanelTab; label: string; icon: string }[] = [
  { id: "council", label: "AI Council", icon: "🧠" },
  { id: "vision", label: "Vision", icon: "👁️" },
  { id: "logs", label: "Logs", icon: "📡" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬" },
  { id: "missions", label: "Missions", icon: "📋" },
];

/** מסלולי Mission Control — הפרדה ברורה בין סוגי משימות (טיפוסים ב-lib/missions-store) */

/** טאב פנימי במשימות: הכל או קטגוריה בודדת */
type MissionSubTab = "all" | MissionLane;

const MISSION_NAV: { id: MissionLane; icon: string; title: string; subtitle: string }[] = [
  { id: "lane_council", icon: "🤖", title: "Council", subtitle: "מועצה · AI · תשתית" },
  { id: "lane_personal", icon: "👤", title: "Personal", subtitle: "אישי · אדמין · לקוחות" },
  { id: "lane_projects", icon: "🏗️", title: "Projects", subtitle: "פרויקטים ספציפיים" },
  { id: "lane_reminders", icon: "🧠", title: "Reminders", subtitle: "תזכורות מכונה" },
  { id: "lane_strategic", icon: "📜", title: "Strategic", subtitle: "חוקי ברזל · ארוך טווח" },
];

const MISSION_INNER_TABS: { id: MissionSubTab; label: string }[] = [
  { id: "all", label: "הכל" },
  { id: "lane_council", label: "🤖 Council" },
  { id: "lane_personal", label: "👤 Personal" },
  { id: "lane_projects", label: "🏗️ Projects" },
  { id: "lane_reminders", label: "🧠 Reminders" },
  { id: "lane_strategic", label: "📜 Strategic" },
];

/** דחופות תמיד בראש — יציב בתוך כל קבוצה */
function sortMissionTasksByUrgent(tasks: MissionTask[]): MissionTask[] {
  return [...tasks].sort((a, b) => {
    if (a.urgent === b.urgent) return 0;
    return a.urgent ? -1 : 1;
  });
}

type MissionsWorkspaceProps = {
  layout: "panel" | "modal";
  missionSubTab: MissionSubTab;
  setMissionSubTab: Dispatch<SetStateAction<MissionSubTab>>;
  missionAddTargetLane: MissionLane;
  setMissionAddTargetLane: Dispatch<SetStateAction<MissionLane>>;
  missions: Record<MissionLane, MissionTask[]>;
  toggleMissionTask: (lane: MissionLane, id: string) => void;
  missionNewText: string;
  setMissionNewText: (v: string) => void;
  addMissionTask: () => void;
  onOpenModal?: () => void;
  missionSaveError: string | null;
};

function MissionsWorkspace({
  layout,
  missionSubTab,
  setMissionSubTab,
  missionAddTargetLane,
  setMissionAddTargetLane,
  missions,
  toggleMissionTask,
  missionNewText,
  setMissionNewText,
  addMissionTask,
  onOpenModal,
  missionSaveError,
}: MissionsWorkspaceProps) {
  const gap = layout === "modal" ? 12 : 10;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap, minHeight: 0 }}>
      {layout === "panel" ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.68rem",
              color: "#a5b4fc",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Mission Control
          </p>
          {onOpenModal ? (
            <button
              type="button"
              onClick={onOpenModal}
              aria-label="פתיחת ניהול משימות במסך מלא"
              title="מסך מלא"
              style={{
                border: "1px solid rgba(0,255,255,0.45)",
                borderRadius: 10,
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: "1rem",
                lineHeight: 1,
                background: "rgba(15,23,42,0.75)",
                color: "#ecfeff",
              }}
            >
              🔍
            </button>
          ) : null}
        </div>
      ) : null}
      {missionSaveError ? (
        <div
          style={{
            fontSize: "0.62rem",
            color: "#fecaca",
            background: "rgba(127,29,29,0.35)",
            borderRadius: 8,
            padding: "6px 8px",
            border: "1px solid rgba(248,113,113,0.35)",
          }}
        >
          {missionSaveError}
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 5,
          paddingBottom: 8,
          borderBottom: "1px solid rgba(168,85,247,0.22)",
        }}
      >
        {MISSION_INNER_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              if (t.id === "all") {
                setMissionSubTab("all");
                return;
              }
              setMissionSubTab(t.id);
              setMissionAddTargetLane(t.id);
            }}
            style={{
              border:
                missionSubTab === t.id ? "1px solid rgba(0,255,255,0.55)" : "1px solid rgba(71,85,105,0.45)",
              borderRadius: 9,
              padding: "5px 8px",
              cursor: "pointer",
              fontSize: layout === "modal" ? "0.68rem" : "0.62rem",
              fontWeight: 700,
              textAlign: "center",
              background:
                missionSubTab === t.id
                  ? "linear-gradient(135deg, rgba(0,255,255,0.12), rgba(168,85,247,0.18))"
                  : "rgba(15,23,42,0.55)",
              color: missionSubTab === t.id ? "#ecfeff" : "#94a3b8",
              flex: "0 1 auto",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {missionSubTab === "all" && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 6,
            fontSize: "0.6rem",
            color: "#94a3b8",
          }}
        >
          <span style={{ fontWeight: 700, color: "#c4b5fd" }}>הוספה ל:</span>
          {MISSION_NAV.map((nav) => (
            <button
              key={nav.id}
              type="button"
              onClick={() => setMissionAddTargetLane(nav.id)}
              style={{
                border:
                  missionAddTargetLane === nav.id ? "1px solid rgba(34,211,238,0.65)" : "1px solid rgba(71,85,105,0.45)",
                borderRadius: 8,
                padding: "3px 7px",
                cursor: "pointer",
                fontSize: "0.58rem",
                fontWeight: 700,
                background: missionAddTargetLane === nav.id ? "rgba(0,255,255,0.12)" : "rgba(15,23,42,0.65)",
                color: missionAddTargetLane === nav.id ? "#ecfeff" : "#94a3b8",
              }}
            >
              {nav.icon} {nav.title}
            </button>
          ))}
        </div>
      )}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          borderRadius: 12,
          padding: 10,
          background: "rgba(2,6,23,0.45)",
          border: "1px solid rgba(0,255,255,0.12)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {missionSubTab === "all"
          ? MISSION_NAV.map((nav) => (
              <div key={nav.id} style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontSize: layout === "modal" ? "0.8rem" : "0.72rem",
                    fontWeight: 800,
                    color: "#e0e7ff",
                    marginBottom: 8,
                    paddingBottom: 6,
                    borderBottom: "1px solid rgba(168,85,247,0.25)",
                  }}
                >
                  {nav.icon} {nav.title}
                  <span style={{ display: "block", fontSize: "0.58rem", fontWeight: 500, color: "#94a3b8", marginTop: 2 }}>
                    {nav.subtitle}
                  </span>
                </div>
                {sortMissionTasksByUrgent(missions[nav.id]).map((task) => (
                  <label
                    key={task.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      marginBottom: 10,
                      padding: "8px 10px",
                      borderRadius: 10,
                      cursor: "pointer",
                      background: task.urgent ? "rgba(0,255,255,0.08)" : "rgba(0,255,255,0.05)",
                      border: task.urgent ? "1px solid rgba(34,211,238,0.85)" : "1px solid rgba(168,85,247,0.18)",
                      boxShadow: task.urgent ? "0 0 14px rgba(34,211,238,0.5), 0 0 26px rgba(0,255,255,0.2)" : undefined,
                      animation: task.urgent ? "fsp-mission-urgent-glow 2.2s ease-in-out infinite" : undefined,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleMissionTask(nav.id, task.id)}
                      style={{ marginTop: 3, width: 16, height: 16, accentColor: "#22d3ee", flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: layout === "modal" ? "0.85rem" : "0.78rem",
                        lineHeight: 1.45,
                        color: task.done ? "#64748b" : "#e0e7ff",
                        textDecoration: task.done ? "line-through" : "none",
                      }}
                    >
                      {task.urgent ? <span style={{ color: "#22d3ee", fontWeight: 800, marginLeft: 4 }}>⚡ </span> : null}
                      {task.text}
                    </span>
                  </label>
                ))}
              </div>
            ))
          : sortMissionTasksByUrgent(missions[missionSubTab]).map((task) => (
              <label
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  marginBottom: 10,
                  padding: "8px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: task.urgent ? "rgba(0,255,255,0.08)" : "rgba(0,255,255,0.05)",
                  border: task.urgent ? "1px solid rgba(34,211,238,0.85)" : "1px solid rgba(168,85,247,0.18)",
                  boxShadow: task.urgent ? "0 0 14px rgba(34,211,238,0.5), 0 0 26px rgba(0,255,255,0.2)" : undefined,
                  animation: task.urgent ? "fsp-mission-urgent-glow 2.2s ease-in-out infinite" : undefined,
                }}
              >
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleMissionTask(missionSubTab, task.id)}
                  style={{ marginTop: 3, width: 16, height: 16, accentColor: "#22d3ee", flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: layout === "modal" ? "0.85rem" : "0.78rem",
                    lineHeight: 1.45,
                    color: task.done ? "#64748b" : "#e0e7ff",
                    textDecoration: task.done ? "line-through" : "none",
                  }}
                >
                  {task.urgent ? <span style={{ color: "#22d3ee", fontWeight: 800, marginLeft: 4 }}>⚡ </span> : null}
                  {task.text}
                </span>
              </label>
            ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
        <input
          value={missionNewText}
          onChange={(e) => setMissionNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addMissionTask();
          }}
          placeholder={
            missionSubTab === "all"
              ? `משימה חדשה (${MISSION_NAV.find((n) => n.id === missionAddTargetLane)?.title ?? ""})…`
              : "משימה חדשה…"
          }
          style={{
            flex: 1,
            borderRadius: 10,
            border: "1px solid rgba(0,255,255,0.25)",
            padding: "8px 10px",
            fontSize: layout === "modal" ? "0.85rem" : "0.78rem",
            background: "rgba(15,23,42,0.75)",
            color: "#f8fafc",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={addMissionTask}
          aria-label="הוסף משימה"
          title="הוסף משימה"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1px solid rgba(168,85,247,0.45)",
            cursor: "pointer",
            fontSize: "1.15rem",
            fontWeight: 800,
            lineHeight: 1,
            color: "#e0e7ff",
            background: "linear-gradient(145deg, rgba(168,85,247,0.35), rgba(99,102,241,0.35))",
            flexShrink: 0,
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

const PANEL_W = 400;
const PANEL_H = 600;

type N8nExecutionLog = {
  id: string;
  workflowName: string;
  status: "success" | "error" | "running";
  startedAt: string;
  stoppedAt: string | null;
};

type LogsApiResponse = {
  logs?: N8nExecutionLog[];
  error?: string;
};

function hhmmssFromIso(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "??:??:??";
    return d.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return "??:??:??";
  }
}

function formatN8nTerminalLine(log: N8nExecutionLog): string {
  const t = hhmmssFromIso(log.startedAt);
  const icon = log.status === "success" ? "✅" : log.status === "error" ? "❌" : "⏳";
  return `[${t}] ${icon} ${log.workflowName} — ${log.status}`;
}

async function fetchN8nLogs(): Promise<{ ok: true; logs: N8nExecutionLog[]; apiError?: string } | { ok: false; message: string }> {
  try {
    const res = await fetch("/api/logs", { cache: "no-store" });
    if (!res.ok) {
      return { ok: false, message: `HTTP ${res.status}` };
    }
    const json = (await res.json()) as LogsApiResponse;
    const logs = Array.isArray(json.logs) ? json.logs : [];
    return { ok: true, logs, apiError: json.error };
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
    @keyframes fsp-mission-urgent-glow {
      0%, 100% { box-shadow: 0 0 10px rgba(34,211,238,0.45), 0 0 22px rgba(0,255,255,0.25), inset 0 0 12px rgba(0,255,255,0.06); }
      50% { box-shadow: 0 0 18px rgba(34,211,238,0.85), 0 0 32px rgba(0,255,255,0.45), inset 0 0 14px rgba(0,255,255,0.1); }
    }
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

export function FloatingSystemPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PanelTab>("council");
  const [n8nLogs, setN8nLogs] = useState<N8nExecutionLog[]>([]);
  const [logError, setLogError] = useState<string | null>(null);
  const [logApiNote, setLogApiNote] = useState<string | null>(null);
  const [logUpdated, setLogUpdated] = useState<string>("");
  const [waDraft, setWaDraft] = useState("");
  const [waThread, setWaThread] = useState<{ id: string; from: string; body: string; at: string }[]>([
    { id: "1", from: "מערכת", body: "ערוץ WhatsApp — מוכן.", at: new Date().toLocaleTimeString("he-IL") },
  ]);
  const [councilModel, setCouncilModel] = useState<"gemini" | "codex">("gemini");
  const [councilBusy, setCouncilBusy] = useState(false);
  const [councilDraft, setCouncilDraft] = useState("");
  const [councilMessages, setCouncilMessages] = useState<
    { id: string; role: "avi" | "ai"; text: string; at: string; modelLabel?: string }[]
  >([
    {
      id: "c0",
      role: "ai",
      text: "מועצת המוחות פעילה. בחרו Gemini או CodeX, כתבו הנחיה ושלחו.",
      at: new Date().toLocaleTimeString("he-IL"),
      modelLabel: "מערכת",
    },
  ]);

  const [missionSubTab, setMissionSubTab] = useState<MissionSubTab>("all");
  const [missionAddTargetLane, setMissionAddTargetLane] = useState<MissionLane>("lane_council");
  const [missions, setMissions] = useState<Record<MissionLane, MissionTask[]>>(() => createDefaultMissions());
  const [missionNewText, setMissionNewText] = useState("");
  const [missionsModalOpen, setMissionsModalOpen] = useState(false);
  const [missionsSaveError, setMissionsSaveError] = useState<string | null>(null);
  const missionsSaveEnabledRef = useRef(false);

  const effectiveMissionAddLane = useMemo(
    (): MissionLane => (missionSubTab === "all" ? missionAddTargetLane : missionSubTab),
    [missionSubTab, missionAddTargetLane],
  );

  const toggleMissionTask = useCallback((lane: MissionLane, id: string) => {
    setMissions((prev) => ({
      ...prev,
      [lane]: prev[lane].map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  }, []);

  const addMissionTask = useCallback(() => {
    const text = missionNewText.trim();
    if (!text) return;
    const lane = effectiveMissionAddLane;
    const id = `m-${lane}-${Date.now()}`;
    setMissions((prev) => ({
      ...prev,
      [lane]: [...prev[lane], { id, text, done: false, urgent: false }],
    }));
    setMissionNewText("");
  }, [missionNewText, effectiveMissionAddLane]);

  const loadMissionsFromApi = useCallback(async () => {
    try {
      const res = await fetch("/api/missions", { cache: "no-store" });
      const data = (await res.json()) as { missions?: unknown; error?: string };
      if (data.missions && typeof data.missions === "object") {
        setMissions(normalizeMissions(data.missions));
      }
      setMissionsSaveError(typeof data.error === "string" && data.error ? data.error : null);
    } catch (e) {
      setMissionsSaveError(e instanceof Error ? e.message : "טעינת משימות נכשלה");
    } finally {
      missionsSaveEnabledRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      missionsSaveEnabledRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (tab !== "missions" && !missionsModalOpen) return;
    void loadMissionsFromApi();
  }, [open, tab, missionsModalOpen, loadMissionsFromApi]);

  useEffect(() => {
    if (!missionsSaveEnabledRef.current) return;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch("/api/missions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ missions }),
          });
          const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
          if (!res.ok || data.ok === false) {
            setMissionsSaveError(typeof data.error === "string" ? data.error : `שמירה HTTP ${res.status}`);
          } else {
            setMissionsSaveError(null);
          }
        } catch (e) {
          setMissionsSaveError(e instanceof Error ? e.message : "שמירת משימות נכשלה");
        }
      })();
    }, 500);
    return () => window.clearTimeout(t);
  }, [missions]);

  const refreshLogs = useCallback(async () => {
    const r = await fetchN8nLogs();
    if (r.ok) {
      setN8nLogs(r.logs);
      setLogError(null);
      setLogApiNote(r.apiError ?? null);
    } else {
      setLogError(r.message);
      setN8nLogs([]);
      setLogApiNote(null);
    }
    setLogUpdated(new Date().toLocaleString("he-IL"));
  }, []);

  useEffect(() => {
    if (!open || tab !== "logs") return;
    void refreshLogs();
    const id = window.setInterval(() => {
      void refreshLogs();
    }, 10_000);
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

  const councilSend = useCallback(async () => {
    const text = councilDraft.trim();
    if (!text || councilBusy) return;
    setCouncilBusy(true);
    const at = new Date().toLocaleTimeString("he-IL");
    const uid = `avi-${Date.now()}`;
    setCouncilMessages((prev) => [...prev, { id: uid, role: "avi", text, at }]);
    setCouncilDraft("");
    try {
      const res = await fetch("/api/council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, model: councilModel }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        model?: string;
        timestamp?: string;
      };
      const reply = typeof data.reply === "string" ? data.reply : "שגיאת חיבור";
      const modelName = data.model === "codex" ? "CodeX" : "Gemini";
      setCouncilMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          text: reply,
          at: new Date().toLocaleTimeString("he-IL"),
          modelLabel: modelName,
        },
      ]);
    } catch {
      setCouncilMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          text: "שגיאת חיבור",
          at: new Date().toLocaleTimeString("he-IL"),
          modelLabel: councilModel === "codex" ? "CodeX" : "Gemini",
        },
      ]);
    } finally {
      setCouncilBusy(false);
    }
  }, [councilDraft, councilBusy, councilModel]);

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
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setCouncilModel("gemini")}
                        style={{
                          border: councilModel === "gemini" ? "1px solid rgba(0,255,255,0.6)" : "1px solid rgba(71,85,105,0.5)",
                          borderRadius: 10,
                          padding: "8px 14px",
                          cursor: "pointer",
                          fontWeight: 800,
                          fontSize: "0.75rem",
                          background:
                            councilModel === "gemini"
                              ? "linear-gradient(135deg, rgba(0,255,255,0.2), rgba(99,102,241,0.35))"
                              : "rgba(15,23,42,0.55)",
                          color: councilModel === "gemini" ? "#ecfeff" : "#94a3b8",
                        }}
                      >
                        🧠 Gemini
                      </button>
                      <button
                        type="button"
                        onClick={() => setCouncilModel("codex")}
                        style={{
                          border: councilModel === "codex" ? "1px solid rgba(168,85,247,0.65)" : "1px solid rgba(71,85,105,0.5)",
                          borderRadius: 10,
                          padding: "8px 14px",
                          cursor: "pointer",
                          fontWeight: 800,
                          fontSize: "0.75rem",
                          background:
                            councilModel === "codex"
                              ? "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(99,102,241,0.3))"
                              : "rgba(15,23,42,0.55)",
                          color: councilModel === "codex" ? "#fae8ff" : "#94a3b8",
                        }}
                      >
                        ⚡ CodeX
                      </button>
                    </div>
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
                            alignSelf: m.role === "avi" ? "flex-start" : "flex-end",
                            maxWidth: "92%",
                            borderRadius: 14,
                            padding: "10px 14px",
                            fontSize: "0.82rem",
                            lineHeight: 1.5,
                            color: m.role === "avi" ? "#0f172a" : "#e0e7ff",
                            background:
                              m.role === "avi"
                                ? "linear-gradient(135deg, #fde68a, #fbbf24)"
                                : "linear-gradient(135deg, rgba(30,27,75,0.95), rgba(49,46,129,0.8))",
                            border:
                              m.role === "avi" ? "1px solid rgba(234,179,8,0.45)" : "1px solid rgba(168,85,247,0.4)",
                            boxShadow: m.role === "ai" ? "0 0 20px rgba(168,85,247,0.12)" : "none",
                          }}
                        >
                          <div style={{ fontSize: "0.62rem", opacity: 0.88, marginBottom: 4 }}>
                            {m.role === "avi" ? "אבי" : m.modelLabel ?? "AI"} · {m.at}
                          </div>
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
                            void councilSend();
                          }
                        }}
                        placeholder="הנחיה למועצה… (Enter לשליחה)"
                        rows={2}
                        disabled={councilBusy}
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
                          opacity: councilBusy ? 0.6 : 1,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => void councilSend()}
                        disabled={councilBusy}
                        style={{
                          border: "none",
                          borderRadius: 12,
                          padding: "12px 16px",
                          fontWeight: 800,
                          cursor: councilBusy ? "wait" : "pointer",
                          background: "linear-gradient(135deg, #a855f7, #6366f1)",
                          color: "#fff",
                          boxShadow: "0 8px 24px rgba(168,85,247,0.35)",
                          opacity: councilBusy ? 0.7 : 1,
                        }}
                      >
                        {councilBusy ? "…" : "שלח"}
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
                      [SYS] N8N executions · עדכון: {logUpdated || "—"}
                      {logError ? ` | ERR: ${logError}` : ""}
                      {logApiNote ? ` | ${logApiNote}` : ""}
                    </div>
                    <pre
                      style={{
                        flex: 1,
                        margin: 0,
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontSize: "0.72rem",
                        lineHeight: 1.55,
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
                      {logError
                        ? `>> ERROR: ${logError}`
                        : n8nLogs.length === 0
                          ? logApiNote
                            ? `>> (ריק) ${logApiNote}`
                            : ">> (אין הרצות להצגה)"
                          : n8nLogs.map(formatN8nTerminalLine).join("\n")}
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

                {tab === "missions" && (
                  <MissionsWorkspace
                    layout="panel"
                    missionSubTab={missionSubTab}
                    setMissionSubTab={setMissionSubTab}
                    missionAddTargetLane={missionAddTargetLane}
                    setMissionAddTargetLane={setMissionAddTargetLane}
                    missions={missions}
                    toggleMissionTask={toggleMissionTask}
                    missionNewText={missionNewText}
                    setMissionNewText={setMissionNewText}
                    addMissionTask={addMissionTask}
                    onOpenModal={() => setMissionsModalOpen(true)}
                    missionSaveError={missionsSaveError}
                  />
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

      {missionsModalOpen ? (
        <div
          dir="rtl"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10002,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            pointerEvents: "auto",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
          role="presentation"
          onClick={() => setMissionsModalOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setMissionsModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="ניהול משימות מורחב"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(920px, 94vw)",
              height: "min(88vh, 820px)",
              display: "flex",
              flexDirection: "column",
              borderRadius: 18,
              overflow: "hidden",
              background: `linear-gradient(165deg, rgba(15,23,42,0.94) 0%, rgba(3,7,18,0.97) 100%), ${ENGINE_DEPTH_BG}`,
              border: "1px solid rgba(0, 255, 255, 0.42)",
              boxShadow: "0 0 48px rgba(0,255,255,0.22), 0 24px 64px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 16px",
                borderBottom: "1px solid rgba(0,255,255,0.2)",
                background: "rgba(2,6,23,0.55)",
              }}
            >
              <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "#ecfeff" }}>Mission Control · מורחב</span>
              <button
                type="button"
                onClick={() => setMissionsModalOpen(false)}
                style={{
                  border: "1px solid rgba(248,113,113,0.45)",
                  borderRadius: 10,
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  background: "rgba(127,29,29,0.35)",
                  color: "#fecaca",
                }}
              >
                ✕ סגור
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: 14 }}>
              <MissionsWorkspace
                layout="modal"
                missionSubTab={missionSubTab}
                setMissionSubTab={setMissionSubTab}
                missionAddTargetLane={missionAddTargetLane}
                setMissionAddTargetLane={setMissionAddTargetLane}
                missions={missions}
                toggleMissionTask={toggleMissionTask}
                missionNewText={missionNewText}
                setMissionNewText={setMissionNewText}
                addMissionTask={addMissionTask}
                missionSaveError={missionsSaveError}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
