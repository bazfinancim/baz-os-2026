"use client";
import { useState, useRef } from "react";

const PIN = process.env.NEXT_PUBLIC_VAULT_PIN ?? "1947";
const WAKE_WORDS = ["בז", "baz", "bas"];

const QUESTIONS = [
  {
    q: "מה שם המייל לחשבוניות?",
    check: (a: string) => a.includes("ביל") || a.toLowerCase().includes("bill") || a.includes("gmail"),
  },
  {
    q: "מה השליחות של BAZ?",
    check: (a: string) => a.includes("עולם") || a.includes("תקן") || a.includes("נוכח") || a.includes("עזור") || a.includes("טוב"),
  },
];

type Phase = "idle" | "listening_wake" | "asking" | "listening_answer" | "success" | "fail";

export default function SoulVault({ onSuccess }: { onSuccess: () => void }) {
  const [phase, setPhase]   = useState<Phase>("idle");
  const [pin, setPin]       = useState("");
  const [pinError, setPinError] = useState(false);
  const [question, setQuestion] = useState(QUESTIONS[0]);
  const [statusText, setStatusText] = useState("");
  const recRef = useRef<any>(null);

  const pickQuestion = () => QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];

  const startListening = (lang: string, onResult: (text: string) => void, onEnd?: () => void) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return false;
    const rec = new SR() as any;
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const t: string = e.results[0][0].transcript.trim();
      onResult(t);
    };
    rec.onerror = () => { if (onEnd) onEnd(); };
    rec.onend   = () => { if (onEnd) onEnd(); };
    rec.start();
    recRef.current = rec;
    return true;
  };

  const startWake = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setStatusText("נדרש Chrome — השתמש ב-PIN"); return; }

    setPhase("listening_wake");
    setStatusText('מקשיב... אמור "בז"');

    const rec = new SR() as any;
    rec.lang = "he-IL";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t: string = e.results[i][0].transcript.toLowerCase().trim();
        if (WAKE_WORDS.some(w => t.includes(w))) {
          rec.stop();
          // בחר שאלה אקראית ושאל
          const q = pickQuestion();
          setQuestion(q);
          setPhase("asking");
          setStatusText(q.q);
          // אחרי 2 שניות — התחל להקשיב לתשובה
          setTimeout(() => {
            setPhase("listening_answer");
            setStatusText("מקשיב לתשובה...");
            startListening("he-IL", (answer) => {
              if (q.check(answer)) {
                setPhase("success");
                setStatusText("✅ ברוך הבא, אבי");
                setTimeout(onSuccess, 900);
              } else {
                setPhase("fail");
                setStatusText("לא מדויק — נסה שוב");
                setTimeout(() => { setPhase("idle"); setStatusText(""); }, 1500);
              }
            });
          }, 2200);
          return;
        }
      }
    };
    rec.onerror = () => { setPhase("idle"); setStatusText("שגיאת מיקרופון"); };
    rec.start();
    recRef.current = rec;
  };

  const submitPin = () => {
    if (pin === PIN) { setPhase("success"); setTimeout(onSuccess, 300); }
    else { setPinError(true); setTimeout(() => { setPinError(false); setPin(""); }, 900); }
  };

  const c = phase === "success" ? "#22c55e"
          : phase === "fail"    ? "#ef4444"
          : phase === "asking"  ? "#f59e0b"
          : phase === "listening_wake" || phase === "listening_answer" ? "#22d3ee"
          : "#6366f1";

  const orbEmoji = phase === "success" ? "✅"
                 : phase === "fail"    ? "❌"
                 : phase === "asking"  ? "🧠"
                 : phase === "listening_wake" || phase === "listening_answer" ? "🎙️"
                 : "🔮";

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:99999,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      background:"radial-gradient(circle at 50% 30%, #0d1a2e 0%, #020617 100%)",
      gap:28, fontFamily:"system-ui,sans-serif",
    }}>
      {/* Logo */}
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:52, fontWeight:900, color:"#22d3ee", letterSpacing:6,
          textShadow:"0 0 50px rgba(34,211,238,0.55)"}}>BAZ OS</div>
        <div style={{color:"#1e3a5f", fontSize:11, marginTop:6, letterSpacing:3}}>SOUL VAULT</div>
      </div>

      {/* ORB */}
      <div onClick={phase === "idle" ? startWake : undefined} style={{
        width:160, height:160, borderRadius:"50%",
        border:`3px solid ${c}`,
        boxShadow:`0 0 80px ${c}44, inset 0 0 40px ${c}0d`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:70, cursor: phase === "idle" ? "pointer" : "default",
        transition:"all 0.35s",
        animation: (phase==="listening_wake"||phase==="listening_answer")
          ? "pulse-glow 1.4s ease-in-out infinite" : "none",
      }}>{orbEmoji}</div>

      {/* Status */}
      <div style={{
        color: c, fontSize:16, textAlign:"center",
        minHeight:24, fontWeight:500, direction:"rtl",
        transition:"color 0.3s",
      }}>
        {statusText || (phase === "idle" ? <>לחץ ואמור <b>"בז"</b></> : "")}
      </div>

      {/* Divider */}
      {phase === "idle" && <div style={{color:"#1e293b", fontSize:12}}>— או —</div>}

      {/* PIN */}
      {phase === "idle" && (
        <div style={{display:"flex", gap:10, alignItems:"center"}}>
          <input
            type="password" value={pin} maxLength={6}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key==="Enter" && submitPin()}
            placeholder="PIN"
            style={{
              background:"rgba(255,255,255,0.04)",
              border:`1.5px solid ${pinError ? "#ef4444" : "rgba(255,255,255,0.08)"}`,
              borderRadius:14, padding:"12px 20px",
              color:"#f1f5f9", fontSize:22, outline:"none",
              width:150, textAlign:"center", letterSpacing:10,
              transition:"border 0.2s",
            }}
          />
          <button onClick={submitPin} style={{
            padding:"12px 24px", borderRadius:14,
            background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.35)",
            color:"#818cf8", fontSize:18, cursor:"pointer",
          }}>→</button>
        </div>
      )}

      <style>{`
        @keyframes pulse-glow {
          0%,100% { box-shadow: 0 0 40px ${c}44; }
          50%      { box-shadow: 0 0 110px ${c}88; }
        }
      `}</style>
    </div>
  );
}
