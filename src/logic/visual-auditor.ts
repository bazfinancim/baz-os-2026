/**
 * Visual Auditor — דו"ח טקסטואלי של מבנה הפאנל (Header / Sidebar / Main)
 * לשימוש ג'מיני / סוכנים ללא רינדור ויזואלי.
 *
 * עדכן כאן כשמבנה ה-Hub או ה-Admin משתנה.
 */

export type RegionId = "root" | "header" | "sidebar" | "main" | "footer" | "admin_header" | "admin_body";

export type LayoutRegion = {
  id: RegionId;
  routeScope: string;
  positionHe: string;
  role: string;
  children: string[];
  notes?: string;
};

const PANEL_MANIFEST: LayoutRegion[] = [
  {
    id: "root",
    routeScope: "(baz-hub)/*",
    positionHe: "מכלל העמוד — flex שורה, כיוון לפי שפה (RTL עברית / LTR אנגלית)",
    role: "HubLanguageProvider → HubBazCompaniesProvider → HubLayout",
    children: ["sidebar", "main"],
  },
  {
    id: "sidebar",
    routeScope: "(baz-hub)/*",
    positionHe: "בעברית: צד ימין של המסך; באנגלית: צד שמאל — רוחב ~248px",
    role: "ניווט Master Hub: מפקדה (Gemini Eyes), תקשורת, ליבה, כסף ודלק, עוד",
    children: ["כותרת מותג", "מתג שפה עברית/English", "סקשנים עם קישורים"],
    notes: "קובץ: src/components/HubLayout.tsx",
  },
  {
    id: "main",
    routeScope: "(baz-hub)/*",
    positionHe: "משטח תוכן ראשי — משמאל לסיידבר ב-RTL",
    role: "תוכן העמוד (apps, hunter, whatsapp, …)",
    children: ["אזור גלילה אנכית", "רקע #f8fafc"],
    notes: "קובץ: src/components/HubLayout.tsx (תג main)",
  },
  {
    id: "admin_header",
    routeScope: "/admin/*",
    positionHe: "חלק עליון — פס דק עם כותרת Gemini Control Center וקישור חזרה ל-Hub",
    role: "Header אדמין",
    children: ["לוגו ◆", "כותרת", "קישור ← Hub"],
    notes: "קובץ: app/admin/layout.tsx",
  },
  {
    id: "admin_body",
    routeScope: "/admin/*",
    positionHe: "תחת ה-header — רוחב מקסימלי ~1280px ממורכז",
    role: "תוכן אדמין (למשל Eyes ניטור)",
    children: ["טבלה", "AutomationRunner", "כפתורי רענון"],
    notes: "קובץ: app/admin/status/page.tsx",
  },
];

function formatRegion(r: LayoutRegion, depth: number): string {
  const pad = "  ".repeat(depth);
  const lines = [
    `${pad}[${r.id}] ${r.routeScope}`,
    `${pad}  מיקום: ${r.positionHe}`,
    `${pad}  תפקיד: ${r.role}`,
    `${pad}  ילדים: ${r.children.join(" · ")}`,
  ];
  if (r.notes) lines.push(`${pad}  הערה: ${r.notes}`);
  return lines.join("\n");
}

/** מפיק דו"ח טקסטואלי מלא של מבנה הפאנל */
export function buildPanelLayoutReport(): string {
  const lines: string[] = [
    "=== BAZ OS — Visual Auditor (Panel Layout Report) ===",
    `נוצר: ${new Date().toISOString()}`,
    "",
    "--- אזורים ---",
    ...PANEL_MANIFEST.map((r) => formatRegion(r, 0)),
    "",
    "--- מפת נתיבים (Hub) ---",
    "/apps — 60 חברות (baz_companies)",
    "/hunter — ספריית ציד + Comparison Engine",
    "/whatsapp — n8n webhooks",
    "/credits-hub — פיננסים",
    "/projects, /clients, /vault, /wip",
    "",
    "--- נתיב אדמין ---",
    "/admin/status — Gemini Eyes (ניטור n8n לחברות)",
    "",
    "סוף דו\"ח",
  ];
  return lines.join("\n");
}
