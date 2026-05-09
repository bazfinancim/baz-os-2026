import { NextResponse } from "next/server";
import {
  getBase44ConnectionStatus,
  getBase44HunterTools,
  getBase44ScrapingLogs,
} from "@/src/lib/base44-sync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    status: "ready",
    base44: getBase44ConnectionStatus(),
    hunterTools: getBase44HunterTools(),
    scrapingLogs: getBase44ScrapingLogs(),
    migrationTarget: "2B+ global tools, software, panels and credits index",
  });
}

export async function POST() {
  const hunterTools = getBase44HunterTools();

  return NextResponse.json({
    status: "accepted",
    injectedInto: "BAZ OS Hunter Arsenal staging queue",
    migrationTarget: "2B+ global tools, software, panels and credits index",
    total: hunterTools.length,
    hunterTools,
    scrapingLogs: getBase44ScrapingLogs(),
  });
}
