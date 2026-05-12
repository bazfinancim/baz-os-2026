"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const TOAST_MS = 5200;

/** הכנה ל-TTS — מימוש בעתיד (דפדפן / שרת) */
export function speakVoiceResponse(_text: string): void {
  void _text;
}

type ToastState = { kind: "success" | "error"; text: string } | null;

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const t of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch {
      /* נמשיך */
    }
  }
  return undefined;
}

export function GeminiVoiceButton() {
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const closeAudioContext = useCallback(() => {
    const ctx = audioContextRef.current;
    audioContextRef.current = null;
    if (!ctx) return;
    ctx.close().catch(() => {
      /* סגירה כפולה / הקשר כבר סגור */
    });
  }, []);

  const hideToastSoon = useCallback((ms: number) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), ms);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      closeAudioContext();
      streamRef.current?.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* כבר נעצר */
        }
      });
    };
  }, [closeAudioContext]);

  const stopStream = useCallback(() => {
    closeAudioContext();
    const s = streamRef.current;
    streamRef.current = null;
    if (!s) return;
    s.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch {
        /* מתעלמים */
      }
    });
  }, [closeAudioContext]);

  const uploadBlob = useCallback(
    async (blob: Blob) => {
      setBusy(true);
      try {
        const form = new FormData();
        form.append("audio", blob, "voice-command.webm");
        form.append("transcriptHint", "");
        const res = await fetch("/api/admin/voice-command", {
          method: "POST",
          body: form,
        });
        const json = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: string };
        if (!res.ok || json.ok === false) {
          setToast({ kind: "error", text: json.error ?? "שגיאת שרת בפקודת קול" });
          hideToastSoon(TOAST_MS);
          return;
        }
        const msg = json.message ?? "פקודה התקבלה.";
        setToast({ kind: "success", text: msg });
        hideToastSoon(TOAST_MS);
        speakVoiceResponse(msg);
      } catch (e) {
        const err = e instanceof Error ? e.message : "שגיאה לא ידועה";
        setToast({ kind: "error", text: `שליחה נכשלה: ${err}` });
        hideToastSoon(TOAST_MS);
      } finally {
        setBusy(false);
      }
    },
    [hideToastSoon],
  );

  const stopRecording = useCallback(() => {
    const rec = recorderRef.current;
    recorderRef.current = null;
    if (!rec || rec.state === "inactive") {
      stopStream();
      setListening(false);
      return;
    }
    try {
      rec.onstop = () => {
        try {
          const mime = rec.mimeType || "audio/webm";
          const blob = new Blob(chunksRef.current, { type: mime });
          chunksRef.current = [];
          stopStream();
          setListening(false);
          if (blob.size < 32) {
            setToast({ kind: "error", text: "הקלטה קצרה מדי — נסה שוב." });
            hideToastSoon(TOAST_MS);
            return;
          }
          void uploadBlob(blob);
        } catch (e) {
          const err = e instanceof Error ? e.message : "שגיאה";
          setToast({ kind: "error", text: `בניית קובץ אודיו נכשלה: ${err}` });
          hideToastSoon(TOAST_MS);
          setListening(false);
        }
      };
      if (rec.state === "recording") {
        try {
          rec.requestData();
        } catch {
          /* לא נתמך */
        }
      }
      rec.stop();
    } catch (e) {
      const err = e instanceof Error ? e.message : "שגיאה";
      setToast({ kind: "error", text: `עצירת הקלטה נכשלה: ${err}` });
      hideToastSoon(TOAST_MS);
      stopStream();
      setListening(false);
    }
  }, [stopStream, uploadBlob, hideToastSoon]);

  const startRecording = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setToast({ kind: "error", text: "הדפדפן לא תומך בהקלטה מקומית." });
      hideToastSoon(TOAST_MS);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      try {
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctx) {
          const ctx = new Ctx();
          await ctx.resume().catch(() => undefined);
          const source = ctx.createMediaStreamSource(stream);
          const gain = ctx.createGain();
          gain.gain.value = 0;
          source.connect(gain);
          gain.connect(ctx.destination);
          audioContextRef.current = ctx;
        }
      } catch {
        /* Web Audio אופציונלי — MediaRecorder עדיין עובד */
      }

      chunksRef.current = [];
      const mime = pickRecorderMime();
      let rec: MediaRecorder;
      try {
        rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      } catch {
        rec = new MediaRecorder(stream);
      }
      recorderRef.current = rec;
      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onerror = () => {
        setToast({ kind: "error", text: "שגיאת MediaRecorder" });
        hideToastSoon(TOAST_MS);
      };
      rec.start(250);
      setListening(true);
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      const msg = e instanceof Error ? e.message : "לא ניתן לגשת למיקרופון";
      setToast({
        kind: "error",
        text: name === "NotAllowedError" ? "הרשאת מיקרופון נדחתה — אפשר בהגדרות הדפדפן." : msg,
      });
      hideToastSoon(TOAST_MS);
      stopStream();
      setListening(false);
    }
  }, [hideToastSoon, stopStream, closeAudioContext]);

  const onToggle = useCallback(() => {
    if (busy) return;
    if (listening) {
      stopRecording();
      return;
    }
    void startRecording();
  }, [busy, listening, startRecording, stopRecording]);

  return (
    <>
      <style>{`
        @keyframes geminiVoicePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.55), 0 8px 32px rgba(245, 158, 11, 0.35); transform: scale(1); }
          50% { box-shadow: 0 0 0 18px rgba(239, 68, 68, 0), 0 12px 40px rgba(220, 38, 38, 0.45); transform: scale(1.03); }
        }
      `}</style>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            insetInlineStart: "50%",
            bottom: "112px",
            transform: "translateX(-50%)",
            zIndex: 9999,
            maxWidth: "min(92vw, 420px)",
            padding: "16px 20px",
            borderRadius: "16px",
            background:
              toast.kind === "success"
                ? "linear-gradient(145deg, rgba(15,23,42,0.97) 0%, rgba(30,27,75,0.98) 100%)"
                : "linear-gradient(145deg, rgba(69,10,10,0.96) 0%, rgba(30,10,10,0.98) 100%)",
            border:
              toast.kind === "success" ? "1px solid rgba(167,139,250,0.45)" : "1px solid rgba(248,113,113,0.5)",
            color: "#f8fafc",
            fontSize: "0.92rem",
            lineHeight: 1.45,
            fontWeight: 600,
            boxShadow: "0 24px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset",
            backdropFilter: "blur(10px)",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "1.1rem", marginLeft: "8px", verticalAlign: "middle" }} aria-hidden>
            {toast.kind === "success" ? "✦" : "⚠"}
          </span>
          {toast.text}
        </div>
      )}

      <div
        style={{
          position: "fixed",
          insetInlineStart: "28px",
          bottom: "28px",
          zIndex: 9998,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            fontSize: "0.68rem",
            color: "rgba(226,232,240,0.75)",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          }}
        >
          JARVIS · קול
        </span>
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          aria-pressed={listening}
          aria-label={listening ? "עצור הקלטה" : "התחל הקלטת פקודה"}
          title={listening ? "לחץ לעצירה" : "לחץ להקלטה — דורש מיקרופון"}
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            border: listening ? "2px solid rgba(252,211,77,0.9)" : "2px solid rgba(167,139,250,0.5)",
            cursor: busy ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: listening
              ? "linear-gradient(145deg, #b91c1c 0%, #ea580c 55%, #f59e0b 100%)"
              : "linear-gradient(145deg, #312e81 0%, #4c1d95 45%, #5b21b6 100%)",
            color: "#fefce8",
            animation: listening ? "geminiVoicePulse 1.15s ease-in-out infinite" : "none",
            opacity: busy ? 0.75 : 1,
            transition: "transform 0.2s ease, border-color 0.2s ease",
          }}
        >
          <MicIcon size={28} />
        </button>
      </div>
    </>
  );
}

function MicIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M19 11a7 7 0 1 1-14 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 18v3M8 21h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
