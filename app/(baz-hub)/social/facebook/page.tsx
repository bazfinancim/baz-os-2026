"use client";

import Link from "next/link";

/** מסך Hub פנימי לפייסבוק — Heritage: ניווט פנימי בלבד מהסיידבר */
export default function HubFacebookPage() {
  return (
    <div dir="rtl" style={{ padding: "24px 28px 48px", maxWidth: "720px", margin: "0 auto", color: "#e2e8f0" }}>
      <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#f8fafc", marginBottom: "10px" }}>פייסבוק · Hub</h1>
      <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.55, marginBottom: "20px" }}>
        דף פנימי תחת Master Hub (<code style={{ color: "#a5b4fc" }}>/social/facebook</code>). מהסיידבר מגיעים לכאן — לא לדומיין חיצוני.
      </p>
      <div
        style={{
          background: "#111118",
          border: "1px solid #1e293b",
          borderRadius: "12px",
          padding: "18px 20px",
          marginBottom: "16px",
        }}
      >
        <p style={{ margin: "0 0 12px", fontSize: "0.88rem", color: "#cbd5e1" }}>
          לפתיחת Meta Business Suite בחלון נפרד (אחרי ניווט פנימי ל-Hub):
        </p>
        <a
          href="https://business.facebook.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#818cf8", fontWeight: 700, fontSize: "0.9rem" }}
        >
          business.facebook.com ↗
        </a>
      </div>
      <Link href="/apps" style={{ color: "#a5b4fc", fontWeight: 600 }}>
        ← חזרה לאפליקציות
      </Link>
    </div>
  );
}
