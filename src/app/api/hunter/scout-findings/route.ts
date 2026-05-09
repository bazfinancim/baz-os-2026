import { NextResponse } from "next/server";
import { ingestBase44TotalData } from "@/src/lib/base44-total-ingestion";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const ingestion = await ingestBase44TotalData();
    const scoutEntity =
      ingestion.entities.find((entity) => entity.entityName === "ScoutFinding") ??
      ingestion.entities.find((entity) => /scout|finding|hunter/i.test(entity.entityName));

    return NextResponse.json(
      {
        ok: Boolean(scoutEntity?.ok),
        status: scoutEntity?.ok ? "online" : ingestion.status,
        generatedAt: ingestion.generatedAt,
        totalRecords: scoutEntity?.records.length ?? 0,
        findings: scoutEntity?.records ?? [],
        entity: scoutEntity ?? null,
        error: scoutEntity?.error ?? ingestion.error,
      },
      { status: scoutEntity?.ok ? 200 : 202 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Scout Findings API error";

    return NextResponse.json(
      {
        ok: false,
        status: "failed",
        generatedAt: new Date().toISOString(),
        totalRecords: 0,
        findings: [],
        entity: null,
        error: message,
      },
      { status: 500 },
    );
  }
}
