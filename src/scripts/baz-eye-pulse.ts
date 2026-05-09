import { generateBazEyePulse } from "@/src/lib/baz-eye-pulse";

const intervalMs = 300 * 1000;
const runOnce = process.argv.includes("--once");

async function runPulse() {
  const pulse = await generateBazEyePulse();
  console.log(`[BAZ EYE PULSE] ${pulse.pulseTime} | ${pulse.systemStatus}`);
}

async function main() {
  await runPulse();

  if (!runOnce) {
    setInterval(() => {
      void runPulse().catch((error) => {
        console.error("[BAZ EYE PULSE] failed", error);
      });
    }, intervalMs);
  }
}

void main();
