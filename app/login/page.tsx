
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// 🔐 Hash פשוט — תשובות לא plain-text
function h(s: string): string {
  let hash = 0;
  const lower = s.trim().toLowerCase();
  for (let i = 0; i < lower.length; i++) {
    hash = ((hash << 5) - hash) + lower.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

const ALL_QUESTIONS = [
  { q: "מה שם האמא שלך?",                    a: h("אבלין") },
  { q: "כמה אחים ואחיות יש לך?",             a: h("3") },
  { q: "מהו מיל כל העובדים?",                a: h("job") },
  { q: "מהו מיל החשבוניות?",                 a: h("bil") },
  { q: "מה העיר שבה אתה גר?",               a: h("חולון") },
  { q: "מה הכתובת שלך (רחוב + מספר)?",       a: h("יצחק הלוי 45") },
  { q: "מה המיל הראשי שלך?",                 a: h("avi") },
  { q: "מה שם הפרויקט הראשי שלך?",           a: h("baz") },
];

function pickQuestions() {
  const dayNum = Math.floor(Date.now() / 86400000);
  const idx1 = dayNum % ALL_QUESTIONS.length;
  const idx2 = (dayNum + 3) % ALL_QUESTIONS.length;
  const safeIdx2 = idx2 === idx1 ? (idx2 + 1) % ALL_QUESTIONS.length : idx2;
  return [ALL_QUESTIONS[idx1], ALL_QUESTIONS[safeIdx2]];
}

async function setAuthCookie() {
  await fetch("/api/auth/login", { method: "POST" });
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions] = useState(pickQuestions);
  const [answers, setAnswers] = useState(["", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const ok0 = h(answers[0]) === questions[0].a;
    const ok1 = h(answers[1]) === questions[1].a;

    await new Promise(r => setTimeout(r, 350));

    if (ok0 && ok1) {
      await setAuthCookie();
      const dest = searchParams.get("from") || "/apps";
      router.replace(dest);
    } else {
      setError("❌ תשובה שגויה — נסה שנית");
      setAnswers(["", ""]);
      setLoading(false);
    }
  };

  const inputRef0 = (el: HTMLInputElement | null) => el?.focus();

  return (
    <div dir="rtl" style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 0%, rgba(79,70,229,0.15) 0%, #07070f 55%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "0 20px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ fontSize: "3rem", lineHeight: 1 }}>⚡</div>
          <h1 style={{ color: "#f8fafc", fontSize: "1.8rem", fontWeight: 900, margin: "10px 0 4px" }}>
            BAZ <span style={{ color: "#6366f1" }}>OS</span>
          </h1>
          <p style={{ color: "#334155", fontSize: "0.78rem", margin: 0 }}>
            מערכת הפקודה — כניסה מאובטחת
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: "linear-gradient(145deg, #0d0d1a, #111120)",
          border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: "20px",
          padding: "28px 24px",
          display: "flex", flexDirection: "column", gap: "18px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
        }}>
          <div style={{ textAlign: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.78rem", color: "#475569" }}>
              🔐 אימות זהות — {new Date().toLocaleDateString("he-IL")}
            </span>
          </div>

          {questions.map((qObj, idx) => (
            <div key={idx}>
              <label style={{
                color: "#94a3b8", fontSize: "0.8rem",
                display: "block", marginBottom: "7px", fontWeight: 500,
              }}>
                {qObj.q}
              </label>
              <input
                ref={idx === 0 ? inputRef0 : undefined}
                type="text"
                value={answers[idx]}
                onChange={e => {
                  const next = [...answers];
                  next[idx] = e.target.value;
                  setAnswers(next);
                }}
                autoComplete="off" autoCorrect="off" spellCheck={false}
                placeholder="תשובה..."
                required
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "#0a0a14",
                  border: `1px solid ${error && !answers[idx] ? "rgba(239,68,68,0.4)" : "rgba(99,102,241,0.25)"}`,
                  borderRadius: "10px", padding: "12px 14px",
                  color: "#e2e8f0", fontSize: "1rem",
                  outline: "none", transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
                onBlur={e => e.target.style.borderColor = "rgba(99,102,241,0.25)"}
              />
            </div>
          ))}

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "8px", padding: "10px 14px",
              color: "#f87171", fontSize: "0.85rem", textAlign: "center",
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            background: loading
              ? "rgba(99,102,241,0.3)"
              : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            border: "none", borderRadius: "12px", padding: "14px",
            color: "#fff", fontSize: "1rem", fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            transition: "all 0.2s",
            boxShadow: loading ? "none" : "0 4px 20px rgba(99,102,241,0.35)",
          }}>
            {loading ? "⚡ בודק..." : "כניסה ⚡"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "#1e293b", fontSize: "0.65rem", marginTop: "20px" }}>
          BAZ-F COMMAND CENTER · Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
