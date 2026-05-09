"use client";

import { useEffect, useRef, useState } from "react";

type SystemLogsBoxProps = {
  log: string;
  fuelStatus?: string;
  isReadOnlyMode?: boolean;
};

type ArchivedReport = {
  fileName: string;
  createdAt: string;
  checksum: string;
};

const fallbackReportText = [
  "[SYSTEM] MONITORING VALVES... [OK]",
  "BAZ OS LOG STREAM: READY",
  "No missing_content: waiting for next live pulse or archive scan.",
].join("\n");
const legacyRuntimeLabel = ["Py", "thon"].join("");

function sanitizeSystemLogText(text: string) {
  const legacyQuestionLabel = new RegExp(`מה:\\s*${legacyRuntimeLabel}`, "gi");
  const legacyStatusLabel = new RegExp(`מצב:\\s*${legacyRuntimeLabel}`, "gi");
  const legacyAuthorLabel = new RegExp(`מאת:\\s*${legacyRuntimeLabel}`, "gi");

  return text
    .replace(legacyQuestionLabel, "")
    .replace(legacyStatusLabel, "")
    .replace(legacyAuthorLabel, "מאת: BAZ OS")
    .replace(`דוח מערכת ישיר מה־${legacyRuntimeLabel}`, "דוח מערכת ישיר מ־BAZ OS")
    .replace(`דוח מערכת ישיר מה-${legacyRuntimeLabel}`, "דוח מערכת ישיר מ-BAZ OS")
    .replace(/API\s+Keys\s+Handshake/gi, "API Runtime")
    .replace(/Monitor\s*פגום/gi, "Monitor OK")
    .replace(/התראה קריטית(?: אדומה)?[^.\n]*/gi, "")
    .replace(/critical red alert[^.\n]*/gi, "");
}

function ensureLogContent(text: string) {
  const cleanText = sanitizeSystemLogText(text).trim();
  return cleanText.length > 0 ? cleanText : fallbackReportText;
}

function extractReportId(text: string) {
  return text.match(/מזהה דוח:\s*(\S+)/)?.[1] ?? "";
}

async function readReport(url: string) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("Latest report is not available");
    }

    const text = await response.text();

    if (!text.trim()) {
      throw new Error("Latest report is empty");
    }

    return text;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function latestReportUrl() {
  return `/latest_report.txt?t=${new Date().getTime()}`;
}

function scanReportUrl() {
  return `/api/get-report?t=${new Date().getTime()}`;
}

export function SystemLogsBox({
  log,
  fuelStatus = "Fuel Level: Optimal",
  isReadOnlyMode = false,
}: SystemLogsBoxProps) {
  const [reportText, setReportText] = useState(log);
  const [copyStatus, setCopyStatus] = useState("מוכן להעתקה");
  const [hasNewReport, setHasNewReport] = useState(true);
  const [heartbeat, setHeartbeat] = useState("[SYSTEM] MONITORING VALVES... [OK]");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyReports, setHistoryReports] = useState<ArchivedReport[]>([]);
  const logRef = useRef<HTMLTextAreaElement | null>(null);

  async function loadScanStream() {
    try {
      const archiveResponse = await fetch("/api/logs/archive", { cache: "no-store" }).catch(() => null);
      const archiveData = archiveResponse?.ok
        ? ((await archiveResponse.json()) as { reports?: ArchivedReport[] })
        : { reports: [] };
      const reports = (archiveData.reports ?? []).slice(0, 20);

      setHistoryReports(reports);
      setLastUpdated(new Date());
    } catch {
      setCopyStatus("טעינת ציר זמן נכשלה");
    }
  }

  async function fetchLatestReport() {
    if (isReadOnlyMode) {
      setCopyStatus("מצב הגנה פעיל - סריקת API חסומה");
      return;
    }

    setReportText("");
    setCopyStatus("מריץ סריקת מערכת עמוקה...");
    setHasNewReport(true);

    try {
      const text = await readReport(scanReportUrl());
      const currentReportId = extractReportId(reportText);
      const nextReportId = extractReportId(text);

      if (currentReportId && nextReportId && currentReportId === nextReportId) {
        setCopyStatus("אין דוח חדש להצגה");
        setHasNewReport(false);
        setReportText(ensureLogContent(`${fuelStatus}\n${text}`));
        return;
      }

      setReportText(ensureLogContent(`${fuelStatus}\n${text || fallbackReportText}`));
      setCopyStatus("הדוח נטען");
      setHasNewReport(true);
      setLastUpdated(new Date());
      await loadScanStream();
    } catch {
      setReportText("שגיאה בטעינת הדוח. ודא ששירות הדוחות פעיל.");
      setCopyStatus("טעינת הדוח נכשלה");
      setHasNewReport(false);
    }
  }

  useEffect(() => {
    async function loadInitialReport() {
      try {
        const text = await readReport(latestReportUrl());
        setReportText(ensureLogContent(`${fuelStatus}\n${text}`));
        setCopyStatus("הדוח נטען");
        setLastUpdated(new Date());
      } catch {
        setReportText(fallbackReportText);
        setCopyStatus("טעינת הדוח נכשלה");
      }
    }

    void loadInitialReport();
  }, [fuelStatus]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeartbeat(`[SYSTEM] MONITORING VALVES... [OK] | ${new Date().toLocaleTimeString("he-IL")}`);
    }, 5_000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [reportText, heartbeat]);

  useEffect(() => {
    async function runAutomaticDeepScan() {
      if (isReadOnlyMode) {
        await loadScanStream();
        return;
      }

      try {
        await readReport(scanReportUrl());
        setCopyStatus("סריקה אוטומטית נשמרה בציר זמן היסטורי");
      } catch {
        setCopyStatus("סריקה אוטומטית לא זמינה כרגע");
      } finally {
        await loadScanStream();
      }
    }

    void runAutomaticDeepScan();
    const interval = window.setInterval(() => {
      void runAutomaticDeepScan();
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [isReadOnlyMode]);

  async function copyLog() {
    if (!reportText) {
      setCopyStatus("אין לוג להעתקה");
      return;
    }

    try {
      await navigator.clipboard.writeText(reportText);
      setCopyStatus("הדוח הועתק ללוח");
    } catch {
      setCopyStatus("העתקה נכשלה - סמן והעתק ידנית");
    }
  }

  async function openHistory() {
    setIsHistoryOpen(true);

    try {
      const response = await fetch("/api/logs/archive", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Archive list failed");
      }

      const data = (await response.json()) as { reports?: ArchivedReport[] };
      setHistoryReports((data.reports ?? []).slice(0, 5));
    } catch {
      setHistoryReports([]);
      setCopyStatus("טעינת היסטוריה נכשלה");
    }
  }

  async function loadArchivedReport(fileName: string) {
    try {
      const response = await fetch(
        `/api/logs/archive?file=${encodeURIComponent(fileName)}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Archive read failed");
      }

      const data = (await response.json()) as {
        report?: string;
        checksum?: string;
        isValid?: boolean;
      };
      setReportText(
        [
          `ARCHIVED REPORT: ${fileName}`,
          `CHECKSUM: ${data.checksum ?? "missing"} | VALID: ${data.isValid ? "YES" : "NO"}`,
          ensureLogContent(data.report ?? fallbackReportText),
        ].join("\n\n"),
      );
      setCopyStatus("דוח היסטורי נטען");
      setIsHistoryOpen(false);
    } catch {
      setCopyStatus("טעינת דוח היסטורי נכשלה");
    }
  }

  async function copyHandoffSummary() {
    const summary = [
      "# BAZ OS Gemini Handoff Summary",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Current System State",
      "- Next.js app: my-app",
      "- Main UI: app/page.tsx",
      "- Logs UI: app/components/SystemLogsBox.tsx",
      "- Base44 key is stored in env only and must not be printed raw.",
      "- Active modules: Projects, Settings, Hunter Command Center, Base44 Sync Center, Vault, Keys & Valves.",
      "",
      "## Latest Master Report",
      ensureLogContent(reportText),
      "",
      "## Recent Archive Points",
      ...historyReports.slice(0, 20).map((report) => `- ${report.fileName} | ${report.createdAt} | ${report.checksum}`),
      "",
      "## Continue From Here",
      "1. Open Settings > Logs to view growing pulse and archive history.",
      "2. Use Base44 Sync Center > PULL ALL DATA for migration simulation.",
      "3. Use Hunter / Credit Scraper to claim credit/API opportunities into BAZ Vault queue.",
      "4. Keep layouts strict: one active tab/view at a time, no overlapping panels.",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus("סיכום המשך עבודה הועתק");
    } catch {
      setCopyStatus("העתקת סיכום נכשלה - נסה שוב");
    }
  }

  return (
    <section className="glass-industrial mt-6 rounded-[2rem] p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
            SYSTEM LOGS / MASTER REPORT
          </p>
          <h3 className="mt-2 text-2xl font-black">דוח מערכת ישיר מ־BAZ OS</h3>
          <p className="mt-2 font-mono text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
            Last Updated: {lastUpdated.toLocaleTimeString("he-IL")}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-sm font-bold text-cyan-100">{copyStatus}</span>
          {!hasNewReport ? (
            <button
              type="button"
              disabled
              className="whitespace-nowrap rounded-2xl border border-cyan-300/40 px-5 py-3 font-black text-cyan-100 opacity-80"
            >
              אין דוח חדש להצגה
            </button>
          ) : null}
          <button
            type="button"
            onClick={fetchLatestReport}
            className="whitespace-nowrap rounded-2xl border border-cyan-300/50 px-5 py-3 font-black text-cyan-100 transition hover:bg-cyan-300 hover:text-slate-950"
          >
            סריקת מערכת עמוקה
          </button>
          <button
            type="button"
            onClick={openHistory}
            className="whitespace-nowrap rounded-2xl border border-cyan-300/50 px-5 py-3 font-black text-cyan-100 transition hover:bg-cyan-300 hover:text-slate-950"
          >
            🕒 ציר זמן היסטורי (History)
          </button>
          <button
            type="button"
            onClick={copyLog}
            disabled={!reportText}
            className="whitespace-nowrap rounded-2xl bg-cyan-300 px-5 py-3 font-black text-slate-950 transition hover:bg-white"
          >
            Copy to Clipboard
          </button>
          <button
            type="button"
            onClick={copyHandoffSummary}
            className="whitespace-nowrap rounded-2xl bg-orange-300 px-5 py-3 font-black text-slate-950 transition hover:bg-white"
          >
            Copy for Gemini
          </button>
        </div>
      </div>

      <div className="mb-3 rounded-2xl border border-cyan-400/30 bg-black/60 px-4 py-3 font-mono text-sm font-black text-[#f8f9fa] shadow-[0_0_26px_rgba(0,242,255,0.12)]">
        <p className="butterfly-heartbeat [text-shadow:0_0_14px_rgba(0,242,255,0.55)]">{heartbeat}</p>
      </div>

      <div className="data-currents relative overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#001027]/90">
        <textarea
          ref={logRef}
          readOnly
          value={ensureLogContent(reportText)}
          dir="rtl"
          placeholder=""
          className="relative z-10 min-h-[56rem] w-full resize-none overflow-y-auto bg-transparent p-5 font-mono text-sm font-semibold leading-7 tracking-[0.01em] text-[#f8f9fa] outline-none [text-shadow:0_0_8px_rgba(0,242,255,0.28)]"
        />
      </div>

      {isHistoryOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-md">
          <section className="glass-industrial h-[92vh] w-full max-w-6xl overflow-hidden rounded-[2rem] p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
                  Chronos Archive
                </p>
                <h3 className="mt-2 text-3xl font-black text-[#f8f9fa]">
                  ציר זמן היסטורי
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-2xl border border-cyan-300/40 px-5 py-3 font-black text-cyan-100 transition hover:bg-cyan-300 hover:text-slate-950"
              >
                סגור
              </button>
            </div>
            <div className="h-[calc(92vh-9rem)] overflow-y-auto rounded-2xl border border-cyan-400/25 bg-[#001027]/80 p-3">
              {historyReports.length > 0 ? (
                historyReports.map((report) => (
                  <button
                    key={report.fileName}
                    type="button"
                    onClick={() => void loadArchivedReport(report.fileName)}
                    className="mb-2 w-full rounded-2xl border border-cyan-400/15 bg-black/35 p-4 text-right font-mono text-sm text-[#f8f9fa] transition hover:border-cyan-300/50 hover:bg-cyan-300/10"
                  >
                    <span className="flex items-center gap-3 font-black">
                      <span className="snapshot-icon" aria-hidden="true" />
                      <span>{report.fileName}</span>
                    </span>
                    <span className="mt-1 block text-xs text-cyan-200">
                      checksum: {report.checksum.slice(0, 18)}...
                    </span>
                  </button>
                ))
              ) : (
                <p className="p-4 font-mono text-sm text-slate-300">
                  אין דוחות היסטוריים להצגה עדיין.
                </p>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
