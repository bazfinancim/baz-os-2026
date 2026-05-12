"use client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import COMPANIES_RAW from "@/src/data/baz_companies.json";

/** עומק כמו shell.mainBg — רק עטיפה, בלי לגעת ב-layout הסיידבר */
const ENGINE_DEPTH_BG =
  "radial-gradient(ellipse 100% 80% at 50% -10%, rgba(49, 46, 129, 0.35) 0%, #07070f 42%, #040406 100%)";

type Company = {
  id: number | string;
  name: string;
  group?: string;
  category?: string;
  description?: string;
  desc?: string;
  status?: string;
  url?: string;
  emoji?: string;
  icon?: string;
};

const GROUP_LABELS: Record<string, string> = {
  live: "🔥 לייבה",
  digital: "💻 דיגיטל",
  ai: "🤖 AI",
  automation: "⚙️ אוטומציה",
  finance: "💰 פיננסים",
  services: "🛠️ שירותים",
  other: "🏢 אחר",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const companies = (COMPANIES_RAW as any[]) as Company[];

const grouped = companies.reduce<Record<string, Company[]>>((acc, c) => {
  const cat = ((c.group ?? c.category) || "other").toLowerCase();
  if (!acc[cat]) acc[cat] = [];
  acc[cat].push(c);
  return acc;
}, {});

export default function AppsPage() {
  return (
    <div dir="rtl" style={{ minHeight: "100%", background: ENGINE_DEPTH_BG }}>
      <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "0.7rem", letterSpacing: "0.2em", color: "#3b82f6", textTransform: "uppercase", marginBottom: "8px", fontWeight: 600 }}>
          BAZ ECOSYSTEM — {companies.length} חברות
        </div>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", margin: 0 }}>
          אפליקציות BAZ
        </h1>
        <p style={{ color: "#64748b", marginTop: "6px", fontSize: "0.9rem" }}>
          כל חברות ואפליקציות האימפריה
        </p>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: "40px" }}>
          <div style={{
            fontSize: "0.75rem", letterSpacing: "0.15em", color: "#475569",
            textTransform: "uppercase", marginBottom: "16px", fontWeight: 600,
            borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px",
          }}>
            {GROUP_LABELS[cat] ?? cat} — {items.length} אפליקציות
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "14px",
          }}>
            {items.map((c) => (
              <div key={String(c.id)} style={{
                background: "linear-gradient(135deg, #0d1117, #111827)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "14px",
                padding: "20px",
                cursor: c.url ? "pointer" : "default",
              }}
                onClick={() => c.url && window.open(c.url, "_blank")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "1.6rem", marginBottom: "8px" }}>{c.icon ?? c.emoji ?? "🏢"}</div>
                  <div style={{
                    fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em",
                    color: c.status === "active" ? "#22c55e" : "#64748b",
                    background: c.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(100,116,139,0.1)",
                    borderRadius: "10px", padding: "2px 8px",
                  }}>
                    {c.status ?? "active"}
                  </div>
                </div>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "4px" }}>{c.name}</div>
                <div style={{ fontSize: "0.74rem", color: "#475569", lineHeight: 1.4 }}>{c.desc ?? c.description ?? ""}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
