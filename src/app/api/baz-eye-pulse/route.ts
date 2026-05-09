import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { generateBazEyePulse } from "@/src/lib/baz-eye-pulse";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const pulseFile = join(process.cwd(), "public", "baz_eye_pulse.txt");
const intervalMs = 3 * 60 * 1000;

type PulseGlobal = typeof globalThis & {
  bazEyePulseTimer?: ReturnType<typeof setInterval>;
};

function ensurePulseTimer() {
  const globalState = globalThis as PulseGlobal;

  if (globalState.bazEyePulseTimer) {
    return false;
  }

  globalState.bazEyePulseTimer = setInterval(() => {
    void generateBazEyePulse();
  }, intervalMs);

  return true;
}

export async function GET() {
  ensurePulseTimer();

  try {
    const report = await readFile(pulseFile, "utf8");
    return NextResponse.json({ status: "active", interval: "3m", report });
  } catch {
    const pulse = await generateBazEyePulse();
    return NextResponse.json({ status: "active", interval: "3m", report: pulse.report });
  }
}

export async function POST() {
  const started = ensurePulseTimer();
  const pulse = await generateBazEyePulse();

  return NextResponse.json({
    status: "active",
    interval: "3m",
    started,
    report: pulse.report,
  });
}
