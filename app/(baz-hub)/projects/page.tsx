"use client";

import React, { useEffect, useState } from "react";
import { useHubLang } from "@/src/components/HubLanguageProvider";

type Project = { id?: string; name?: string; status?: string; description?: string };

export default function ProjectsPage() {
  const { lang, dir } = useHubLang();
  const [projects, setProjects] = useState<Project[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/base44/projects");
        const data = (await res.json()) as { projects?: Project[]; ok?: boolean; error?: string };
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        if (!cancelled) setProjects(Array.isArray(data.projects) ? data.projects : []);
      } catch (e) {
        if (!cancelled) setErr(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const title = lang === "he" ? "פרויקטים" : "Projects";
  const subtitle =
    lang === "he"
      ? "נתונים מ־Base44 (CodeX) דרך /api/base44/projects"
      : "Data from Base44 (CodeX) via /api/base44/projects";

  return (
    <div dir={dir} style={{ padding: "24px 26px 40px", maxWidth: "960px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>{title}</h1>
      <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "20px" }}>{subtitle}</p>
      {err && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px", marginBottom: "16px", color: "#b91c1c", fontSize: "0.85rem" }}>
          {err}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {projects.map((p, i) => (
          <div
            key={String(p.id ?? i)}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "14px 16px",
            }}
          >
            <p style={{ fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>{p.name ?? "—"}</p>
            {p.description && <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0 }}>{p.description}</p>}
            {p.status && (
              <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "8px" }}>
                {lang === "he" ? "סטטוס" : "Status"}: {p.status}
              </p>
            )}
          </div>
        ))}
        {!err && projects.length === 0 && (
          <p style={{ color: "#94a3b8", fontSize: "0.88rem" }}>{lang === "he" ? "אין פרויקטים להצגה." : "No projects to show."}</p>
        )}
      </div>
    </div>
  );
}
