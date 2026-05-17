'use client';
import { useState, useRef } from 'react';

export default function VoiceStudioPage() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);

  const script = `שלום, שמי ${name || '[שמך]'}.
אני יועץ משכנתאות עם ניסיון של מעל עשר שנים.
אני מאמין שכל אחד מגיע לדיל הכי טוב שיש —
לא מה שהבנק מציע, אלא מה שמגיע לך.
בוא נדבר. זה בחינם, וזה יכול לחסוך לך עשרות אלפי שקלים.`;

  const startRec = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = e => chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      blobRef.current = blob;
      setAudioURL(URL.createObjectURL(blob));
    };
    mr.start();
    mediaRef.current = mr;
    setRecording(true);
  };

  const stopRec = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const submit = async () => {
    if (!blobRef.current) return;
    const form = new FormData();
    form.append('audio', blobRef.current, `${name || 'recording'}.webm`);
    form.append('name', name);
    await fetch('/api/voice-upload', { method: 'POST', body: form });
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎙️</div>
          <h1 className="text-3xl font-bold text-white mb-2">BAZ Voice Studio</h1>
          <p className="text-indigo-300">הקלט את הטקסט הבא — אנחנו נייצר לך סרטון AI עם הקול שלך</p>
        </div>

        <div className="mb-6">
          <label className="text-gray-300 text-sm mb-2 block">השם שלך</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="לדוגמה: בני חבסוב"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-2xl p-5 mb-6">
          <h3 className="text-indigo-300 font-semibold mb-3 text-sm">📝 קרא את הטקסט הזה בקול רם:</h3>
          <p className="text-white text-lg leading-relaxed whitespace-pre-line font-medium">{script}</p>
        </div>

        {!submitted ? (
          <div className="space-y-4">
            <div className="flex gap-3">
              {!recording ? (
                <button onClick={startRec}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl text-lg transition-all flex items-center justify-center gap-2">
                  <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  התחל הקלטה
                </button>
              ) : (
                <button onClick={stopRec}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-2xl text-lg transition-all flex items-center justify-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  עצור הקלטה
                </button>
              )}
            </div>

            {audioURL && (
              <div className="space-y-3">
                <audio src={audioURL} controls className="w-full" />
                <button onClick={submit}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl text-lg transition-all">
                  ✅ שלח את ההקלטה לBAZ
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-2">ההקלטה התקבלה!</h2>
            <p className="text-gray-300">הצוות יצור לך סרטון AI מדהים בקרוב.</p>
            <p className="text-indigo-400 text-sm mt-2">BAZ — Making AI Personal</p>
          </div>
        )}
      </div>
    </div>
  );
}
