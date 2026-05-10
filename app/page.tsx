export default function Home() {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0f1e",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
        padding: "24px",
        gap: "48px",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2.2rem", color: "#facc15", fontWeight: "bold", marginBottom: "8px" }}>
          ⚡ BAZ OS — מרכז הפיקוד
        </h1>
        <p style={{ color: "#475569", fontSize: "1rem" }}>
          בחר מערכת לכניסה
        </p>
      </div>

      {/* Two main portals */}
      <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", justifyContent: "center" }}>
        {/* Hunter */}
        <a
          href="/hunter"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            background: "#0f172a",
            border: "2px solid #ca8a04",
            borderRadius: "20px",
            padding: "40px 48px",
            textDecoration: "none",
            color: "inherit",
            transition: "transform 0.15s",
            minWidth: "220px",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "3.5rem" }}>🎯</span>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#facc15" }}>
              Hunter Hub
            </p>
            <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "6px" }}>
              AiPrograms · Credit Logic
            </p>
            <p style={{ fontSize: "0.75rem", color: "#374151", marginTop: "4px" }}>
              VIP — מבודד לחלוטין
            </p>
          </div>
        </a>

        {/* Base44 */}
        <a
          href="/base44"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            background: "#0f172a",
            border: "2px solid #4c1d95",
            borderRadius: "20px",
            padding: "40px 48px",
            textDecoration: "none",
            color: "inherit",
            minWidth: "220px",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "3.5rem" }}>📦</span>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#818cf8" }}>
              Base44 Ecosystem
            </p>
            <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "6px" }}>
              14 אפליקציות · 5 סוכנים
            </p>
            <p style={{ fontSize: "0.75rem", color: "#374151", marginTop: "4px" }}>
              כל הכלים שנבנו
            </p>
          </div>
        </a>

        {/* WhatsApp */}
        <a
          href="/base44"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            background: "#0f172a",
            border: "2px solid #166534",
            borderRadius: "20px",
            padding: "40px 48px",
            textDecoration: "none",
            color: "inherit",
            minWidth: "220px",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "3.5rem" }}>💬</span>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#4ade80" }}>
              WhatsApp Hub
            </p>
            <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "6px" }}>
              054-829-4343 · 054-555-9934
            </p>
            <p style={{ fontSize: "0.75rem", color: "#374151", marginTop: "4px" }}>
              N8N Webhook Status
            </p>
          </div>
        </a>
      </div>

      <p style={{ color: "#1e3a5f", fontSize: "0.7rem" }}>
        BAZ OS 2026 · Baz-F Tech &amp; AI Factory
      </p>
    </div>
  );
}
