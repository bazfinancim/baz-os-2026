"use client";
import { useState, useRef, useCallback } from "react";

type ModelId = "gemini" | "codex" | "hunter";
type Msg = { role: "user"|"assistant"; text: string };

const MODELS = [
  { id:"gemini" as ModelId, emoji:"🧠", name:"James",  color:"#22d3ee", angle:-30  },
  { id:"codex"  as ModelId, emoji:"⚡", name:"CodeX",  color:"#a855f7", angle:90   },
  { id:"hunter" as ModelId, emoji:"🎯", name:"Hunter", color:"#fbbf24", angle:210  },
];

export default function FloatingOrb() {
  const [open, setOpen]     = useState(false);
  const [active, setActive] = useState<ModelId>("gemini");
  const [draft, setDraft]   = useState("");
  const [busy, setBusy]     = useState(false);
  const [listening, setListening] = useState(false);

  // היסטוריה משותפת — כל המועצה רואה אותו שיח
  const [sharedHistory, setSharedHistory] = useState<Msg[]>([]);

  // Draggable
  const [pos, setPos] = useState({ x:24, y:24 });
  const dragging   = useRef(false);
  const dragStart  = useRef({ mx:0, my:0, ox:0, oy:0 });
  const didDrag    = useRef(false);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true; didDrag.current = false;
    dragStart.current = { mx:e.clientX, my:e.clientY, ox:pos.x, oy:pos.y };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    if (Math.abs(dx)+Math.abs(dy) > 4) didDrag.current = true;
    setPos({ x: dragStart.current.ox + dx, y: dragStart.current.oy - dy });
  }, []);
  const onMouseUp = useCallback(() => {
    dragging.current = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  // Voice
  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("נדרש Chrome לזיהוי קולי"); return; }
    if (listening) { (window as any).__bazRec?.stop(); setListening(false); return; }
    const rec = new SR() as any;
    rec.lang = "he-IL";
    rec.onresult = (e: any) => setDraft(p => (p + " " + e.results[0][0].transcript).trim());
    rec.onend = () => setListening(false);
    rec.start();
    (window as any).__bazRec = rec;
    setListening(true);
  };

  const send = async () => {
    if (!draft.trim() || busy) return;
    const msg = draft.trim();
    setDraft("");
    setBusy(true);

    // היסטוריה משותפת — כל המועצה רואה
    const newHistory: Msg[] = [...sharedHistory, { role:"user", text:msg }];
    setSharedHistory(newHistory);

    try {
      const r = await fetch("/api/council", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          message: msg,
          model: active,
          history: sharedHistory.map(m => ({ role: m.role, text: m.text }))
        }),
      });
      const d = await r.json() as { reply?: string };
      const reply = d.reply ?? "שגיאה";
      setSharedHistory(h => [...h, { role:"assistant", text:`[${cfg.name}] ${reply}` }]);
    } catch {
      setSharedHistory(h => [...h, { role:"assistant", text:"שגיאת חיבור" }]);
    } finally {
      setBusy(false);
    }
  };

  const cfg = MODELS.find(m => m.id === active)!;
  const msgs = sharedHistory;

  return (
    <>
      {/* Main Orb */}
      <div
        onMouseDown={onMouseDown}
        onClick={() => { if (!didDrag.current) setOpen(o => !o); }}
        style={{
          position:"fixed", bottom:pos.y, left:pos.x, zIndex:9999,
          width:72, height:72, borderRadius:"50%",
          background:"radial-gradient(circle at 35% 35%, #22d3ee, #6366f1, #a855f7)",
          boxShadow: open
            ? "0 0 0 4px rgba(99,102,241,0.45), 0 0 60px rgba(99,102,241,0.55)"
            : "0 0 0 2px rgba(99,102,241,0.2), 0 8px 32px rgba(0,0,0,0.7)",
          cursor:"grab", display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:30, transition:"box-shadow 0.25s, transform 0.2s",
          transform: open ? "scale(1.1)" : "scale(1)", userSelect:"none",
        }}
      >
        {open ? "✕" : "⚡"}
      </div>

      {/* Satellites */}
      {open && MODELS.map(m => {
        const rad = (m.angle * Math.PI) / 180;
        const dist = 96;
        return (
          <div key={m.id} onClick={() => setActive(m.id)} style={{
            position:"fixed",
            bottom: pos.y + 36 - Math.sin(rad)*dist - 24,
            left:   pos.x + 36 + Math.cos(rad)*dist - 24,
            zIndex:9998, width:48, height:48, borderRadius:"50%",
            background: active===m.id ? m.color+"33" : "rgba(6,9,20,0.9)",
            border:`2px solid ${m.color}`,
            boxShadow: active===m.id ? `0 0 24px ${m.color}99` : "none",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, cursor:"pointer", transition:"all 0.2s",
          }} title={m.name}>{m.emoji}</div>
        );
      })}

      {/* Chat Panel */}
      {open && (
        <div style={{
          position:"fixed",
          bottom: pos.y + 90,
          left: Math.max(8, Math.min(pos.x - 130, window.innerWidth - 360)),
          zIndex:9997, width: Math.min(360, window.innerWidth - 16),
          borderRadius:20,
          background:"rgba(4,8,20,0.95)",
          backdropFilter:"blur(24px)",
          border:`1px solid ${cfg.color}44`,
          boxShadow:`0 0 60px ${cfg.color}18`,
          padding:16, display:"flex", flexDirection:"column", gap:12,
        }}>
          {/* Header */}
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <span style={{width:9, height:9, borderRadius:"50%", background:cfg.color, display:"inline-block",
              boxShadow:`0 0 8px ${cfg.color}`}} />
            <span style={{color:cfg.color, fontWeight:700, fontSize:15}}>{cfg.name}</span>
            {msgs.length > 0 && (
              <button onClick={() => setSharedHistory([])}
                style={{marginLeft:"auto", color:"#334155", fontSize:11,
                  background:"none", border:"none", cursor:"pointer"}}>נקה</button>
            )}
          </div>

          {/* Messages */}
          {msgs.length > 0 && (
            <div style={{
              maxHeight:280, overflowY:"auto",
              display:"flex", flexDirection:"column", gap:8,
            }}>
              {msgs.map((m, i) => (
                <div key={i} style={{
                  background: m.role==="user" ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.04)",
                  borderRadius:12, padding:"10px 14px",
                  fontSize:14, lineHeight:1.65, color:"#e2e8f0",
                  direction:"rtl", textAlign:"right",
                  border: m.role==="user"
                    ? "1px solid rgba(99,102,241,0.2)"
                    : `1px solid ${cfg.color}18`,
                  alignSelf: m.role==="user" ? "flex-end" : "flex-start",
                  maxWidth:"90%",
                }}>
                  {m.role==="assistant" && (
                    <div style={{color:cfg.color, fontSize:11, marginBottom:4, fontWeight:700}}>
                      {cfg.emoji} {cfg.name}
                    </div>
                  )}
                  {busy && i === msgs.length-1 && m.role==="user" ? "..." : m.text}
                </div>
              ))}
              {busy && (
                <div style={{
                  background:"rgba(255,255,255,0.04)", borderRadius:12,
                  padding:"10px 14px", fontSize:14, color:cfg.color,
                  border:`1px solid ${cfg.color}18`,
                  animation:"blink 1s ease-in-out infinite",
                }}>⏳</div>
              )}
            </div>
          )}

          {/* Input */}
          <div style={{display:"flex", gap:8, alignItems:"center"}}>
            <button onClick={toggleVoice} style={{
              width:42, height:42, borderRadius:"50%", flexShrink:0,
              background: listening ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.04)",
              border: listening ? "1.5px solid #ef444488" : "1px solid rgba(255,255,255,0.08)",
              color: listening ? "#f87171" : "#475569",
              cursor:"pointer", fontSize:18,
            }}>🎤</button>
            <input
              value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key==="Enter" && !e.shiftKey && send()}
              placeholder="שאל..." dir="rtl"
              style={{
                flex:1, background:"rgba(255,255,255,0.05)",
                border:`1px solid ${cfg.color}33`,
                borderRadius:12, padding:"10px 14px",
                color:"#f1f5f9", fontSize:15, outline:"none",
              }}
            />
            <button onClick={send} disabled={busy || !draft.trim()} style={{
              width:42, height:42, borderRadius:"50%", flexShrink:0,
              background: `${cfg.color}22`,
              border:`1.5px solid ${cfg.color}55`,
              color:cfg.color, cursor:"pointer", fontSize:18,
              opacity: busy || !draft.trim() ? 0.4 : 1,
            }}>▶</button>
          </div>
        </div>
      )}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </>
  );
}
