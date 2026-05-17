"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type RecordingState = "idle" | "recording" | "recorded" | "uploading" | "done" | "error";

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]) {
    try { if (MediaRecorder.isTypeSupported(t)) return t; } catch { /* skip */ }
  }
  return undefined;
}

export default function VoiceStudioPage() {
  const [state, setState] = useState<RecordingState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [speakerName, setSpeakerName] = useState("בני חבסוב");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [bars, setBars] = useState<number[]>(Array(32).fill(4));

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ניקוי בעת unmount
  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      animRef.current && cancelAnimationFrame(animRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const stopVisualization = useCallback(() => {
    animRef.current && cancelAnimationFrame(animRef.current);
    animRef.current = null;
    setBars(Array(32).fill(4));
  }, []);

  const startVisualization = useCallback((stream: MediaStream) => {
    try {
      const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      analyserRef.current = analyser;

      const draw = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const step = Math.floor(data.length / 32);
        const newBars = Array.from({ length: 32 }, (_, i) => Math.max(4, (data[i * step] / 255) * 80));
        setBars(newBars);
        animRef.current = requestAnimationFrame(draw);
      };
      draw();
    } catch { /* visualizer optional */ }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      setSeconds(0);

      startVisualization(stream);

      const mime = pickMime();
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const mime2 = rec.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mime2 });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState("recorded");
        stopVisualization();
      };
      rec.start(250);
      setState("recording");

      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch (e: any) {
      setStatusMsg(e?.name === "NotAllowedError" ? "❌ הרשאת מיקרופון נדחתה — אפשר בהגדרות" : `❌ שגיאה: ${e?.message}`);
      setState("error");
    }
  }, [startVisualization, stopVisualization]);

  const stopRecording = useCallback(() => {
    timerRef.current && clearInterval(timerRef.current);
    recorderRef.current?.state !== "inactive" && recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    stopVisualization();
  }, [stopVisualization]);

  const sendToServer = useCallback(async () => {
    if (!blobRef.current) return;
    setState("uploading");
    setStatusMsg("שולח לשרת...");
    try {
      const form = new FormData();
      form.append("audio", blobRef.current, `voice_${speakerName.replace(/\s/g,"_")}_${Date.now()}.webm`);
      form.append("name", speakerName);
      form.append("duration", String(seconds));

      const res = await fetch("/api/admin/save-voice", { method: "POST", body: form });
      const json = await res.json().catch(() => ({})) as any;

      if (!res.ok || json.ok === false) {
        setStatusMsg(`❌ שגיאה: ${json.error ?? "שגיאת שרת"}`);
        setState("error");
        return;
      }
      setStatusMsg(`✅ הקלטה נשמרה בהצלחה! Drive: ${json.fileName ?? "voice_recording"}`);
      setState("done");
    } catch (e: any) {
      setStatusMsg(`❌ שגיאת רשת: ${e?.message}`);
      setState("error");
    }
  }, [speakerName, seconds]);

  const reset = useCallback(() => {
    audioUrl && URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSeconds(0);
    setBars(Array(32).fill(4));
    setStatusMsg("");
    setState("idle");
    blobRef.current = null;
  }, [audioUrl]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const isRecording = state === "recording";
  const isRecorded = state === "recorded";
  const isUploading = state === "uploading";
  const isDone = state === "done";
  const isError = state === "error";

  return (
    <div style={{ minHeight: "100vh", background: "#07070f", color: "#e2e8f0", padding: "32px 24px", fontFamily: "system-ui,-apple-system,sans-serif", direction: "rtl" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>BAZ OS · Voice Studio</p>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, background: "linear-gradient(90deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          🎙 הקלטת קול
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "0.88rem", marginTop: "4px" }}>הקלט, שמע, ושלח לשרת — לבניית דמות קולית AI</p>
      </div>

      {/* Speaker Name */}
      <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px" }}>
        <label style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block", marginBottom: "8px" }}>שם הדובר / המוקלט</label>
        <input
          value={speakerName}
          onChange={e => setSpeakerName(e.target.value)}
          disabled={isRecording || isUploading}
          style={{
            width: "100%", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: "8px", padding: "10px 14px", color: "#e2e8f0", fontSize: "1rem", outline: "none", boxSizing: "border-box"
          }}
        />
      </div>

      {/* Visualizer */}
      <div style={{
        background: "rgba(10,10,20,0.9)", border: `1px solid ${isRecording ? "rgba(239,68,68,0.5)" : "rgba(99,102,241,0.2)"}`,
        borderRadius: "16px", padding: "24px 20px", marginBottom: "24px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
        transition: "border-color 0.3s"
      }}>
        {/* Timer */}
        <div style={{ fontSize: "3rem", fontWeight: 900, fontVariantNumeric: "tabular-nums", color: isRecording ? "#f87171" : "#a78bfa", letterSpacing: "-2px" }}>
          {fmt(seconds)}
        </div>

        {/* Waveform */}
        <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "80px" }}>
          {bars.map((h, i) => (
            <div key={i} style={{
              width: "5px", height: `${h}px`, borderRadius: "3px",
              background: isRecording
                ? `hsl(${0 + i * 3}, 90%, ${55 + Math.sin(i) * 10}%)`
                : "rgba(167,139,250,0.35)",
              transition: isRecording ? "height 0.08s ease" : "none"
            }} />
          ))}
        </div>

        {/* Status */}
        <div style={{ fontSize: "0.82rem", color: isRecording ? "#fca5a5" : "#64748b" }}>
          {isRecording ? "🔴 מקליט... לחץ עצור בסיום" :
            isRecorded ? "✅ הקלטה מוכנה — שמע ושלח" :
            isUploading ? "⏳ שולח לשרת..." :
            isDone ? "🚀 נשמר בהצלחה!" :
            isError ? statusMsg :
            "לחץ 'התחל הקלטה' כדי להתחיל"}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
        {/* Start */}
        {(state === "idle" || state === "error") && (
          <button onClick={startRecording} style={{
            flex: 1, minWidth: "140px", padding: "16px", borderRadius: "12px", border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #dc2626, #ea580c)", color: "#fff", fontSize: "1rem", fontWeight: 700
          }}>
            🔴 התחל הקלטה
          </button>
        )}

        {/* Stop */}
        {state === "recording" && (
          <button onClick={stopRecording} style={{
            flex: 1, padding: "16px", borderRadius: "12px", border: "2px solid rgba(239,68,68,0.8)", cursor: "pointer",
            background: "rgba(239,68,68,0.15)", color: "#fca5a5", fontSize: "1rem", fontWeight: 700
          }}>
            ⏹ עצור
          </button>
        )}

        {/* Playback + Send */}
        {(state === "recorded" || state === "done") && (
          <>
            <button onClick={reset} style={{
              padding: "16px 20px", borderRadius: "12px", border: "1px solid rgba(99,102,241,0.4)", cursor: "pointer",
              background: "transparent", color: "#a78bfa", fontSize: "0.9rem", fontWeight: 600
            }}>
              🔄 הקלטה חדשה
            </button>
            {state === "recorded" && (
              <button onClick={sendToServer} style={{
                flex: 1, padding: "16px", borderRadius: "12px", border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #6d28d9, #4f46e5, #2563eb)", color: "#fff", fontSize: "1rem", fontWeight: 700
              }}>
                🚀 שלח לעיבוד AI
              </button>
            )}
          </>
        )}

        {state === "uploading" && (
          <button disabled style={{
            flex: 1, padding: "16px", borderRadius: "12px", border: "none",
            background: "rgba(99,102,241,0.3)", color: "#94a3b8", fontSize: "1rem", fontWeight: 700
          }}>
            ⏳ שולח...
          </button>
        )}
      </div>

      {/* Audio Playback */}
      {audioUrl && (isRecorded || isDone) && (
        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
          <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginBottom: "8px" }}>🎧 האזן לפני שליחה:</p>
          <audio controls src={audioUrl} style={{ width: "100%", borderRadius: "8px" }} />
        </div>
      )}

      {/* Success message */}
      {isDone && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: "12px", padding: "16px 20px" }}>
          <p style={{ color: "#6ee7b7", fontWeight: 700, fontSize: "0.95rem" }}>{statusMsg}</p>
          <p style={{ color: "#94a3b8", fontSize: "0.82rem", marginTop: "6px" }}>הקבצים נשמרו בתיקיית Drive — CodeX יתחיל לעבד את הדמות הקולית</p>
        </div>
      )}

      {/* Info */}
      <div style={{ marginTop: "32px", background: "rgba(30,27,75,0.4)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", padding: "16px 20px" }}>
        <p style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 700, marginBottom: "8px" }}>💡 הנחיות להקלטה איכותית:</p>
        <ul style={{ color: "#64748b", fontSize: "0.78rem", lineHeight: "1.6", paddingRight: "16px", margin: 0 }}>
          <li>הקלט לפחות 30 שניות של דיבור טבעי</li>
          <li>דבר בנחת ובבהירות, ממרחק 20-30 ס"מ מהמיק</li>
          <li>נסה לגוון — שאלות, משפטים, רגשות שונים</li>
          <li>מניעת רעשי רקע (כיבוי מזגן / TV)</li>
        </ul>
      </div>
    </div>
  );
}
