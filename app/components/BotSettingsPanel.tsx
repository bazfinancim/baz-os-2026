"use client";

import { useState } from "react";
import type { WhatsAppBotMode, WhatsAppBotSettings } from "@/lib/whatsapp/bot";

type BotSettingsPanelProps = {
  initialSettings: WhatsAppBotSettings;
  recentEventsCount: number;
};

const botModes: { value: WhatsAppBotMode; label: string }[] = [
  { value: "standby", label: "המתנה" },
  { value: "auto_reply", label: "מענה אוטומטי" },
  { value: "broadcast", label: "שידור הודעות" },
  { value: "human_handoff", label: "העברה לאדם" },
];

export function BotSettingsPanel({
  initialSettings,
  recentEventsCount,
}: BotSettingsPanelProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [status, setStatus] = useState("מוכן לפעולה");

  async function saveSettings(action: "sync_settings" | "test_connection") {
    setStatus("שומר ומסנכרן...");

    try {
      const response = await fetch("/api/whatsapp-bot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          settings,
          action: {
            action,
            message: settings.autoReplyMessage,
            phoneNumber: settings.defaultPhoneNumber,
          },
        }),
      });

      const data = (await response.json()) as { ok: boolean; error?: string };
      setStatus(data.ok ? "הגדרות נשמרו והבוט סונכרן" : data.error ?? "פעולה נכשלה");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "שגיאת תקשורת לא ידועה");
    }
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-emerald-300/20 bg-emerald-400/10 p-6 shadow-2xl shadow-emerald-950/20">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
            WhatsApp Bot Integration
          </p>
          <h2 className="mt-2 text-3xl font-black">Bot Settings</h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
          אירועים אחרונים: {recentEventsCount}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-slate-300">מצב עבודה</span>
          <select
            value={settings.mode}
            onChange={(event) =>
              setSettings({ ...settings, mode: event.target.value as WhatsAppBotMode })
            }
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
          >
            {botModes.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-slate-300">Webhook URL</span>
          <input
            value={settings.webhookUrl}
            onChange={(event) =>
              setSettings({ ...settings, webhookUrl: event.target.value })
            }
            placeholder="https://n8n.baz-f.co.il/webhook/..."
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-left text-white"
            dir="ltr"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-slate-300">מספר ברירת מחדל</span>
          <input
            value={settings.defaultPhoneNumber}
            onChange={(event) =>
              setSettings({ ...settings, defaultPhoneNumber: event.target.value })
            }
            placeholder="+972..."
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-left text-white"
            dir="ltr"
          />
        </label>

        <label className="grid gap-2 md:col-span-2 xl:col-span-3">
          <span className="text-sm font-bold text-slate-300">הודעת מענה אוטומטי</span>
          <textarea
            value={settings.autoReplyMessage}
            onChange={(event) =>
              setSettings({ ...settings, autoReplyMessage: event.target.value })
            }
            rows={3}
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-bold text-emerald-100">{status}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => saveSettings("test_connection")}
            className="rounded-2xl border border-emerald-300/40 px-5 py-3 font-black text-emerald-100 transition hover:bg-emerald-300 hover:text-slate-950"
          >
            בדוק חיבור
          </button>
          <button
            type="button"
            onClick={() => saveSettings("sync_settings")}
            className="rounded-2xl bg-emerald-300 px-5 py-3 font-black text-slate-950 transition hover:bg-white"
          >
            שמור הגדרות
          </button>
        </div>
      </div>
    </section>
  );
}
