import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { BazCompany } from "@/src/types/baz-company";
import { resolveCompanyWebhookUrl } from "@/src/lib/admin-webhook-config";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

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

async function pingWebhook(
  url: string,
  company: BazCompany,
): Promise<{ ok: boolean; ms: number; error?: string }> {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 8000);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId: company.id,
        name: company.name,
        group: company.group,
        status: company.status,
        check: "pulse",
        source: "baz-admin-eyes",
      }),
      signal: ac.signal,
      cache: "no-store",
    });
    clearTimeout(to);
    return { ok: res.ok, ms: Date.now() - started };
  } catch (e) {
    clearTimeout(to);
    const msg = e instanceof Error ? e.message : "unknown";
    return { ok: false, ms: Date.now() - started, error: msg };
  }
}

/** ריצה בקבוצות קטנות כדי לא להציף את n8n */
async function mapInBatches<T, R>(items: T[], batchSize: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const part = await Promise.all(chunk.map(fn));
    out.push(...part);
  }
  return out;
}

export async function GET() {
  try {
    const companies = loadCompanies();
    const sampleUrl = companies.length ? resolveCompanyWebhookUrl(companies[0]) : null;

    const rows = await mapInBatches(companies, 6, async (c) => {
      const url = resolveCompanyWebhookUrl(c);
      if (!url) {
        return {
          id: c.id,
          name: c.name,
          group: c.group,
          status: c.status,
          health: "unknown" as const,
          ms: 0,
          error: "no_webhook",
        };
      }
      const r = await pingWebhook(url, c);
      return {
        id: c.id,
        name: c.name,
        group: c.group,
        status: c.status,
        health: r.ok ? ("up" as const) : ("down" as const),
        ms: r.ms,
        error: r.ok ? undefined : r.error,
      };
    });

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      total: rows.length,
      usingSharedWebhook: Boolean(sampleUrl),
      rows,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "health failed" },
      { status: 500 },
    );
  }
}
