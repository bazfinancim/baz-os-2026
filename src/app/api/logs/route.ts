import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const latestReportFile = join(process.cwd(), "public", "latest_report.txt");
const idleMessage = "[SYSTEM] MONITORING VALVES... [OK]";

async function readLatestReport() {
  try {
    const report = await readFile(latestReportFile, "utf8");
    return report.trim() ? report : idleMessage;
  } catch {
    return idleMessage;
  }
}

export async function GET() {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | null = null;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      async function pushReport() {
        const report = await readLatestReport();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ report })}\n\n`));
      }

      await pushReport();
      interval = setInterval(() => {
        void pushReport();
      }, 1_000);
    },
    cancel() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-store, no-transform",
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}
