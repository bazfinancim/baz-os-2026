/** סכימת משימות משותפת ל-API ול-UI — בלי ייבוא מקומפוננטות React */

export type MissionLane =
  | "lane_council"
  | "lane_personal"
  | "lane_projects"
  | "lane_reminders"
  | "lane_strategic";

export type MissionTask = { id: string; text: string; done: boolean; urgent: boolean };

export const MISSION_LANES: MissionLane[] = [
  "lane_council",
  "lane_personal",
  "lane_projects",
  "lane_reminders",
  "lane_strategic",
];

export function createDefaultMissions(): Record<MissionLane, MissionTask[]> {
  return {
    lane_council: [
      { id: "mc1", text: "ייצוב /api/logs מול N8N Executions — בדיקה אחרי deploy", done: true, urgent: false },
      { id: "mc2", text: "Council /api/council — אימות Gemini + CodeX בסביבה חיה", done: false, urgent: true },
      { id: "mc3", text: "FloatingSystemPanel — ערוצים + Mission Control בלי לשבור Lightning", done: false, urgent: false },
    ],
    lane_personal: [
      { id: "mp1", text: "מעקב בנקים — סנכרון דוחות וזיהוי חריגות", done: false, urgent: false },
      { id: "mp2", text: "ניהול לקוחות — עדכון סטטוסים ב-Hub / clients", done: false, urgent: true },
      { id: "mp3", text: "אדמין: וידוא ש-.env.local לא עולה ל-Git", done: true, urgent: false },
    ],
    lane_projects: [
      { id: "mj1", text: "מיון תמונות P0 — ארגון Media לפרויקט (עדיפות גבוהה)", done: false, urgent: true },
      { id: "mj2", text: "Base44 Hunter Intel — בדיקת זרימה אחרי שינויי golden-empire-final", done: false, urgent: false },
      { id: "mj3", text: "אינטגרציית WhatsApp Hub — הודעות ו-webhook n8n", done: false, urgent: false },
    ],
    lane_reminders: [
      { id: "mr1", text: "מערכת: לרענן מפתחות API בשרת — תזכורת לעוד 30 יום", done: false, urgent: true },
      { id: "mr2", text: "אחרי כל push — npm run build לפני סגירת גרסה", done: true, urgent: false },
      { id: "mr3", text: "בדיקת Lightning FAB במובייל (viewport צר)", done: false, urgent: false },
    ],
    lane_strategic: [
      { id: "ms1", text: "חוק ברזל: לא לגעת ב-DNA (globals / HubLayout) ללא אישור", done: true, urgent: false },
      { id: "ms2", text: "Append-only לעיצוב Empire — רק הרחבות מבוקרות", done: true, urgent: false },
      { id: "ms3", text: "שלב הבא: חיבור משימות ל-DB / persistence מחוץ ל-local state", done: false, urgent: true },
    ],
  };
}

function isMissionTask(v: unknown): v is MissionTask {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.text === "string" &&
    typeof o.done === "boolean" &&
    typeof o.urgent === "boolean"
  );
}

/** מיזוג קלט מהקובץ עם ברירות מחדל ותיקון שדות חסרים */
export function normalizeMissions(input: unknown): Record<MissionLane, MissionTask[]> {
  const base = createDefaultMissions();
  if (!input || typeof input !== "object") return base;
  const root = input as Record<string, unknown>;
  for (const lane of MISSION_LANES) {
    const arr = root[lane];
    if (!Array.isArray(arr)) continue;
    const tasks: MissionTask[] = [];
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id : `m-${lane}-${Date.now()}-${tasks.length}`;
      const text = typeof o.text === "string" ? o.text : "";
      const done = typeof o.done === "boolean" ? o.done : false;
      const urgent = typeof o.urgent === "boolean" ? o.urgent : false;
      const t: MissionTask = { id, text, done, urgent };
      if (isMissionTask(t) && text.length > 0) tasks.push(t);
    }
    base[lane] = tasks;
  }
  return base;
}
