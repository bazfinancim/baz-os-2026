import { NextResponse } from "next/server";
import { getBase44ConnectionStatus, getBase44Credits } from "@/src/lib/base44-sync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    status: "ready",
    base44: getBase44ConnectionStatus(),
    credits: getBase44Credits(),
  });
}

export async function POST() {
  return NextResponse.json({
    status: "accepted",
    injectedInto: "BAZ OS Fuel Dashboard staging queue",
    credits: getBase44Credits(),
  });
}
