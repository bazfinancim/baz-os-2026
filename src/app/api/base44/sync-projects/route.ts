import { NextResponse } from "next/server";
import { getBase44ConnectionStatus, getBase44Projects } from "@/src/lib/base44-sync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    status: "ready",
    base44: getBase44ConnectionStatus(),
    projects: getBase44Projects(),
  });
}

export async function POST() {
  const projects = getBase44Projects();

  return NextResponse.json({
    status: "accepted",
    injectedInto: "BAZ OS Projects staging queue",
    total: projects.length,
    projects,
  });
}
