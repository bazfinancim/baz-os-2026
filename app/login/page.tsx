
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 🔐 שאלות אבטחה — רק אבי יודע את התשובות
// hash פשוט כדי שהתשובות לא יהיו plain-text בקוד
function h(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

const ALL_QUESTIONS = [
  { q: "מה שם הרחוב שגדלת בו?",           a: h("הגפן") },
  { q: "מה שם בית הספר היסודי שלך?",        a: h("בן גוריון") },
  { q: "מה שם האח/אחות הבכור/ה שלך?",       a: h("רמי") },
  { q: "מה העיר שבה נולדת?",                a: h("חולון") },
  { q: "מה שם האמא שלך?",                   a: h("אבלין") },
  { q: "כמה אחים ואחיות יש לך?",            a: h("3") },
  { q: "מהו מיל כל העובדים?",               a: h("job") },
  { q: "מהו מיל החשבוניות?",                a: h("bil") },
  { q: "מה שם כלב הילדות שלך?",             a: h("ריקי") },
];

// בחר 2 שאלות אקראיות מתוך הרשימה (seed לפי תאריך = שאלות יציבות ליום)
function pickQuestions() {
  const seed = Math.floor(Date.now() / 86400000); // משתנה כל יום
  const idx1 = seed % ALL_QUESTIONS.length;
  const idx2 = (seed + 3) % ALL_QUESTIONS.length;
  return [ALL_QUESTIONS[idx1], ALL_QUESTIONS[idx2 === idx1 ? (idx2+1) % ALL_QUESTIONS.length : idx2]];
}

const SESSION_KEY = "baz_auth_ok";
const SESSION_HOURS = 12;

export default function LoginPage() {
  const router = useRouter();
  const [questions] = useState(pickQuestions);
  const [answers, setAnswers] = useState(["", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // בדוק session קיים
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const { ts } = JSON.parse(raw);
        if (Date.now() - ts < SESSION_HOURS * 3600 * 1000) {
          router.replace("/apps");
          return;
        }
      }
    } catch {}
    setChecking(false);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const ok0 = h(answers[0].trim().toLowerCase()) === questions[0].a;
    const ok1 = h(answers[1].trim().toLowerCase()) === questions[1].a;

    setTimeout(() => {
      if (ok0 && ok1) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ts: Date.now() }));
        router.replace("/apps");
      } else {
        setError("❌ תשובה שגויה — נסה שנית");
        setAnswers(["", ""]);
      }
      setLoading(false);
    }, 400);
  };

  if (checking) return (
    <div style={{ minHeight: "100vh", background: "#07070f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#6366f1", fontSize: "1.2rem" }}>⚡</div>
    </div>
  );

  return (
    <div dir="rtl" style={{
      minHeight: "100vh", background: "#07070f",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: "420px", padding: "0 20px",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>⚡</div>
          <h1 style={{ color: "#f8fafc", fontSize: "1.6rem", fontWeight: 900, margin: 0 }}>
            BAZ <span style={{ color: "#6366f1" }}>OS</span>
          </h1>
          <p style={{ color: "#475569", fontSize: "0.8rem", marginTop: "6px" }}>
            מערכת פקודה — כניסה מאובטחת
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: "#0f0f1a",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: "16px",
          padding: "28px 24px",
          display: "flex", flexDirection: "column", gap: "20px",
        }}>
          {questions.map((qObj, idx) => (
            <div key={idx}>
              <label style={{ color: "#94a3b8", fontSize: "0.82rem", display: "block", marginBottom: "8px" }}>
                {qObj.q}
              </label>
              <input
                type="text"
                value={answers[idx]}
                onChange={e => {
                  const next = [...answers];
                  next[idx] = e.target.value;
                  setAnswers(next);
                }}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="תשובה..."
                required
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "#111118",
                  border: "1px solid rgba(99,102,241,0.3)",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  color: "#e2e8f0", fontSize: "0.95rem",
                  outline: "none",
                }}
              />
            </div>
          ))}

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px", padding: "10px 14px",
              color: "#f87171", fontSize: "0.85rem", textAlign: "center",
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            background: loading ? "#1e1b4b" : "linear-gradient(135deg, #4f46e5, #7c3aed)",
            border: "none", borderRadius: "10px",
            padding: "14px", color: "#fff",
            fontSize: "1rem", fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            transition: "all 0.2s",
          }}>
            {loading ? "בודק..." : "כניסה ⚡"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "#1e293b", fontSize: "0.7rem", marginTop: "20px" }}>
          BAZ-F · Authorized Access Only
        </p>
      </div>
    </div>
  );
}
