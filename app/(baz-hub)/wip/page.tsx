
"use client";
import { useState } from "react";

type TaskCategory = "personal" | "system" | "client";

interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  done: boolean;
  createdAt: string;
}

const CATEGORY_LABELS: Record<TaskCategory, { label: string; emoji: string; color: string }> = {
  personal: { label: "אישי", emoji: "🟣", color: "#a855f7" },
  system:   { label: "מערכת", emoji: "🔵", color: "#3b82f6" },
  client:   { label: "לקוחות", emoji: "🟢", color: "#22c55e" },
};

export default function MissionsPage() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "לא לשכוח להתקשר ליוסי", category: "personal", done: false, createdAt: new Date().toISOString() },
    { id: "2", title: "בדיקת Hunter Bridge — מבחן אש", category: "system", done: true, createdAt: new Date().toISOString() },
    { id: "3", title: "פגישת אפיון עם לקוח חדש", category: "client", done: false, createdAt: new Date().toISOString() },
  ]);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<TaskCategory>("personal");
  const [filter, setFilter] = useState<TaskCategory | "all">("all");

  const addTask = () => {
    if (!newTitle.trim()) return;
    setTasks(prev => [...prev, {
      id: Date.now().toString(),
      title: newTitle.trim(),
      category: newCategory,
      done: false,
      createdAt: new Date().toISOString(),
    }]);
    setNewTitle("");
  };

  const toggle = (id: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.category === filter);
  const counts = { all: tasks.length, personal: tasks.filter(t=>t.category==="personal").length, system: tasks.filter(t=>t.category==="system").length, client: tasks.filter(t=>t.category==="client").length };

  return (
    <div dir="rtl" style={{ padding: "24px 28px 48px", maxWidth: "780px", margin: "0 auto", color: "#e2e8f0" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f8fafc", marginBottom: "4px" }}>
        ⚡ מרכז משימות
      </h1>
      <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "24px" }}>
        אישי · מערכת · לקוחות
      </p>

      {/* פילטרים */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {(["all","personal","system","client"] as const).map(cat => {
          const isAll = cat === "all";
          const info = isAll ? { label: "הכל", emoji: "📋", color: "#6366f1" } : CATEGORY_LABELS[cat];
          const active = filter === cat;
          return (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              background: active ? `${info.color}22` : "rgba(255,255,255,0.04)",
              border: `1px solid ${active ? info.color : "rgba(255,255,255,0.1)"}`,
              borderRadius: "20px", padding: "6px 14px", cursor: "pointer",
              color: active ? info.color : "#94a3b8", fontSize: "0.82rem", fontWeight: active ? 700 : 400,
            }}>
              {info.emoji} {info.label} ({counts[cat]})
            </button>
          );
        })}
      </div>

      {/* הוספת משימה */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addTask()}
          placeholder="משימה חדשה..."
          style={{
            flex: 1, background: "#111118", border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: "10px", padding: "10px 14px", color: "#e2e8f0", fontSize: "0.9rem",
            outline: "none", minWidth: 0,
          }}
        />
        <select value={newCategory} onChange={e => setNewCategory(e.target.value as TaskCategory)}
          style={{
            background: "#111118", border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: "10px", padding: "10px 12px", color: "#e2e8f0", fontSize: "0.85rem",
            cursor: "pointer", outline: "none",
          }}>
          <option value="personal">🟣 אישי</option>
          <option value="system">🔵 מערכת</option>
          <option value="client">🟢 לקוחות</option>
        </select>
        <button onClick={addTask} style={{
          background: "rgba(99,102,241,0.8)", border: "none", borderRadius: "10px",
          padding: "10px 18px", color: "#fff", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer",
        }}>+ הוסף</button>
      </div>

      {/* רשימת משימות */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "#475569", padding: "40px", fontSize: "0.9rem" }}>
            אין משימות כאן עדיין ✨
          </div>
        )}
        {filtered.map(task => {
          const info = CATEGORY_LABELS[task.category];
          return (
            <div key={task.id} onClick={() => toggle(task.id)} style={{
              display: "flex", alignItems: "center", gap: "12px",
              background: task.done ? "rgba(255,255,255,0.02)" : "#111118",
              border: `1px solid ${task.done ? "rgba(255,255,255,0.05)" : `${info.color}33`}`,
              borderRadius: "10px", padding: "12px 16px", cursor: "pointer",
              opacity: task.done ? 0.5 : 1, transition: "all 0.15s",
            }}>
              <div style={{
                width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                background: task.done ? info.color : "transparent",
                border: `2px solid ${info.color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {task.done && <span style={{ color: "#fff", fontSize: "10px" }}>✓</span>}
              </div>
              <span style={{
                flex: 1, fontSize: "0.9rem", color: task.done ? "#475569" : "#e2e8f0",
                textDecoration: task.done ? "line-through" : "none",
              }}>{task.title}</span>
              <span style={{
                fontSize: "0.72rem", color: info.color,
                background: `${info.color}15`, borderRadius: "6px", padding: "2px 8px",
              }}>{info.emoji} {info.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
