import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { BazCompany } from "@/src/types/baz-company";

type WebhookConfigFile = {
  defaultWebhook?: string;
  byCompanyId?: Record<string, string>;
};

let cached: WebhookConfigFile | null = null;

function loadConfigFile(): WebhookConfigFile {
  if (cached) return cached;
  const p = join(process.cwd(), "src", "data", "company_n8n_webhooks.json");
  if (!existsSync(p)) {
    cached = {};
    return cached;
  }
  try {
    cached = JSON.parse(readFileSync(p, "utf8")) as WebhookConfigFile;
  } catch {
    cached = {};
  }
  return cached;
}

/** כתובת webhook לבדיקת חברה — סביבה גוברת על ברירת המחדל מהקובץ */
export function resolveCompanyWebhookUrl(company: BazCompany | undefined): string | null {
  if (!company) return null;
  const file = loadConfigFile();
  const fromMap = file.byCompanyId?.[String(company.id)]?.trim();
  if (fromMap) return fromMap;
  const envDefault = process.env.N8N_COMPANY_PING_WEBHOOK?.trim();
  if (envDefault) return envDefault;
  const fileDefault = file.defaultWebhook?.trim();
  if (fileDefault) return fileDefault;
  return null;
}

export function getGlobalSyncWebhook(): string | null {
  return process.env.N8N_GLOBAL_SYNC_WEBHOOK?.trim() || null;
}
