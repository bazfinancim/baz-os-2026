import { NextResponse } from "next/server";
import { ingestBase44TotalData } from "@/src/lib/base44-total-ingestion";
import { uploadBazOsLogToDrive } from "@/src/lib/google-drive-logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const ingestion = await ingestBase44TotalData();

    if (ingestion.ok) {
      await uploadBazOsLogToDrive(
        `base44_total_ingestion_${ingestion.generatedAt}.json`,
        JSON.stringify(ingestion, null, 2),
      );
    }

    return NextResponse.json(ingestion, { status: ingestion.ok ? 200 : 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Base44 total ingestion error";

    return NextResponse.json(
      {
        ok: false,
        status: "failed",
        error: message,
        generatedAt: new Date().toISOString(),
        totalRecords: 0,
        entities: [],
      },
      { status: 500 },
    );
  }
}
