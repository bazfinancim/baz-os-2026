"use client";

import { useState } from "react";

type DashboardActionButtonProps = {
  action: string;
  label: string;
  target?: string;
  className?: string;
};

export function DashboardActionButton({
  action,
  label,
  target = "",
  className = "",
}: DashboardActionButtonProps) {
  const [status, setStatus] = useState<"idle" | "active" | "error">("idle");

  async function logAction() {
    try {
      await fetch("/api/dashboard-actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          label,
          target,
          metadata: {
            philosophy: "Maximum automation, minimum manual friction.",
          },
        }),
      });

      if (action === "vision-scan") {
        await fetch("/api/vision-scan", { method: "POST" });
      }

      if (action === "whatsapp-bot" || action === "bazi-whatsapp-bot") {
        const response = await fetch("/api/whatsapp", { method: "GET" });
        setStatus(response.ok ? "active" : "error");
      }
    } catch (error) {
      setStatus("error");
      console.error("Dashboard action failed", error);
    }
  }

  const indicatorClass =
    status === "active"
      ? "bg-emerald-400 shadow-emerald-400/50"
      : status === "error"
        ? "bg-red-400 shadow-red-400/50"
        : "bg-slate-500 shadow-slate-500/20";

  const content = (
    <span className="inline-flex items-center gap-2">
      <span
        aria-label={`status-${status}`}
        className={`h-3 w-3 rounded-full shadow-lg ${indicatorClass}`}
      />
      {label}
    </span>
  );

  if (target && action !== "vision-scan" && action !== "whatsapp-bot" && action !== "bazi-whatsapp-bot") {
    return (
      <a
        href={target}
        onClick={logAction}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={logAction} className={className}>
      {content}
    </button>
  );
}
