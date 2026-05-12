import { NextResponse } from "next/server";
import { buildPanelLayoutReport } from "@/src/logic/visual-auditor";

export const dynamic = "force-dynamic";

export async function GET() {
  const body = buildPanelLayoutReport();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
