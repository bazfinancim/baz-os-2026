"use client";

import { useState } from "react";

type BrainTask = {
  id: string;
  lane: "A" | "B" | "C" | "D";
  text: string;
  done: boolean;
};

const initialTasks: BrainTask[] = [
  { id: "task-a", lane: "A", text: "Call Yossi", done: false },
  { id: "task-b", lane: "B", text: "Review Hunter workflows", done: false },
  { id: "task-c", lane: "C", text: "Check WhatsApp agent logs", done: false },
  { id: "task-d", lane: "D", text: "Sync Drive reports", done: true },
];

export function BrainDumpDock() {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [tasks, setTasks] = useState<BrainTask[]>(initialTasks);
  const [syncStatus, setSyncStatus] = useState("READY");

  async function syncBrainDump(nextNotes = notes, nextTasks = tasks) {
    setSyncStatus("SYNCING...");

    try {
      const response = await fetch("/api/brain-dump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: nextNotes, tasks: nextTasks }),
      });

      if (!response.ok) {
        throw new Error("Brain dump sync failed");
      }

      setSyncStatus("SYNCED TO N8N / DRIVE");
    } catch {
      setSyncStatus("LOCAL ONLY - N8N CHECK NEEDED");
    }
  }

  function addNote() {
    const cleanNote = note.trim();

    if (!cleanNote) {
      return;
    }

    const nextNotes = [`${new Date().toLocaleTimeString("he-IL")} | ${cleanNote}`, ...notes];
    setNotes(nextNotes);
    setNote("");
    void syncBrainDump(nextNotes, tasks);
  }

  function toggleTask(taskId: string) {
    const nextTasks = tasks.map((item) =>
      item.id === taskId ? { ...item, done: !item.done } : item,
    );

    setTasks(nextTasks);
    void syncBrainDump(notes, nextTasks);
  }

  return (
    <aside className="fixed bottom-5 left-5 z-50 max-w-[calc(100vw-2.5rem)] text-right" dir="rtl">
      {isOpen ? (
        <div className="mb-3 w-[min(28rem,calc(100vw-2.5rem))] rounded-[2rem] border border-orange-300/30 bg-slate-950/95 p-5 shadow-[0_0_44px_rgba(251,146,60,0.2)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-200">
                Captain&apos;s Log
              </p>
              <h3 className="mt-1 text-2xl font-black text-white">Brain Dump</h3>
            </div>
            <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 font-mono text-xs font-black text-emerald-100">
              {syncStatus}
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="רשום הערה, משימה או פקודה..."
              className="min-h-24 rounded-2xl border border-orange-300/20 bg-black/70 p-4 text-sm font-bold text-orange-50 outline-none placeholder:text-slate-500"
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={addNote}
                className="rounded-2xl bg-orange-300 px-4 py-3 font-black text-slate-950 transition hover:bg-white"
              >
                Save Note
              </button>
              <button
                type="button"
                onClick={() => setNote((current) => `${current} [voice note placeholder]`)}
                className="rounded-2xl border border-orange-300/35 px-4 py-3 font-black text-orange-100 transition hover:bg-orange-300 hover:text-slate-950"
              >
                Voice
              </button>
              <button
                type="button"
                onClick={() => void syncBrainDump(notes, tasks)}
                className="rounded-2xl border border-emerald-300/35 px-4 py-3 font-black text-emerald-100 transition hover:bg-emerald-300 hover:text-slate-950"
              >
                Sync Drive
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {tasks.map((task) => (
              <label key={task.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 p-3">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                />
                <span className="rounded-full bg-cyan-300/10 px-2 py-1 font-mono text-xs font-black text-cyan-100">
                  {task.lane}
                </span>
                <span className={task.done ? "text-slate-500 line-through" : "text-slate-100"}>{task.text}</span>
              </label>
            ))}
          </div>

          <div className="mt-5 max-h-36 overflow-y-auto rounded-2xl border border-orange-300/15 bg-black/55 p-3">
            {notes.length ? notes.map((item) => (
              <p key={item} className="mb-2 text-sm font-bold text-orange-100">{item}</p>
            )) : (
              <p className="text-sm font-bold text-slate-500">אין הערות עדיין.</p>
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="rounded-full border border-orange-300/40 bg-orange-300 px-5 py-4 font-black text-slate-950 shadow-[0_0_28px_rgba(251,146,60,0.35)] transition hover:bg-white"
      >
        Brain Dump
      </button>
    </aside>
  );
}
