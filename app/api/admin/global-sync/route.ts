import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { BazCompany } from "@/src/types/baz-company";
import { getGlobalSyncWebhook } from "@/src/lib/admin-webhook-config";

export const dynamic = "force-dynamic";

function loadCompanies(): BazCompany[] {
  const p = join(process.cwd(), "src", "data", "baz_companies.json");
  if (!existsSync(p)) return [];
  try {
    const raw = JSON.parse(readFileSync(p, "utf8")) as unknown;
    return Array.isArray(raw) ? (raw as BazCompany[]) : [];
  } catch {
    return [];
  }
}

export async function POST() {
  try {
    const url = getGlobalSyncWebhook();
    if (!url) {
      return NextResponse.json(
        { ok: false, error: "N8N_GLOBAL_SYNC_WEBHOOK לא מוגדר בסביבה" },
        { status: 501 },
      );
    }

    const companies = loadCompanies();
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 60_000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "gemini-automation-runner",
        action: "global_sync",
        companyCount: companies.length,
        companies,
        ts: Date.now(),
      }),
      signal: ac.signal,
      cache: "no-store",
    });
    clearTimeout(to);

    const text = await res.text();
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      /* נשאר טקסט */
    }

    return NextResponse.json({
      ok: res.ok,
      upstreamStatus: res.status,
      upstreamBody: body,
      sentCompanies: companies.length,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "sync failed" },
      { status: 500 },
    );
  }
}
