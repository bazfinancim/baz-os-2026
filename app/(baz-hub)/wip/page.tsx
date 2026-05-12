import React from "react";

export default function WipPage() {
  return (
    <div dir="rtl" style={{ padding: "24px 28px 48px", maxWidth: "720px", margin: "0 auto", color: "#e2e8f0" }}>
      <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#f8fafc", marginBottom: "8px" }}>
        WIP — בעבודה
      </h1>
      <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "24px" }}>
        אזור לשיפור כלים, ניסויים ופיצ׳רים לפני שילוב ב-Hub הראשי.
      </p>
      <div
        style={{
          background: "#111118",
          border: "1px dashed #334155",
          borderRadius: "12px",
          padding: "28px 22px",
          textAlign: "center",
          color: "#94a3b8",
          fontSize: "0.88rem",
        }}
      >
        <p style={{ marginBottom: "12px" }}>אין כאן עדיין כלים פעילים — השלד מוכן לרשימת משימות וטפסים.</p>
        <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
          מומלץ לקשר לוגים, טיוטות JSON ו-webhooks מכאן ברגע שתגדירו תהליך.
        </p>
      </div>
    </div>
  );
}
