import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

type HookPayload = Record<string, unknown>;

type BridgeEvent = {
  id: string;
  createdAt: string;
  source: "cursor";
  project: string;
  payload: HookPayload;
};

const projectRoot = process.cwd();
const logDir = join(projectRoot, ".cursor", "logs");
const logFile = join(logDir, "cursor-events.jsonl");
const endpoint = process.env.CURSOR_API_BRIDGE_URL;
const apiKey = process.env.CURSOR_API_BRIDGE_KEY;

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  const timeoutMs = 500;

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout);
      process.stdin.off("data", onData);
      process.stdin.off("end", onEnd);
      process.stdin.off("error", onError);
      process.stdin.pause();
    };

    const onData = (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    };

    const onEnd = () => {
      cleanup();
      resolve();
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, timeoutMs);

    process.stdin.on("data", onData);
    process.stdin.once("end", onEnd);
    process.stdin.once("error", onError);
    process.stdin.resume();
  });

  return Buffer.concat(chunks).toString("utf8").trim();
}

function parsePayload(rawInput: string): HookPayload {
  if (!rawInput) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawInput);
    return typeof parsed === "object" && parsed !== null ? parsed : { value: parsed };
  } catch (error) {
    return {
      rawInput,
      parseError: error instanceof Error ? error.message : "Unknown JSON parse error",
    };
  }
}

function createEvent(payload: HookPayload): BridgeEvent {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    source: "cursor",
    project: "BAZ_OS_2026/my-app",
    payload,
  };
}

async function appendLocalLog(event: BridgeEvent): Promise<void> {
  await mkdir(logDir, { recursive: true });
  await appendFile(logFile, `${JSON.stringify(event)}\n`, "utf8");
}

async function sendToEndpoint(event: BridgeEvent): Promise<void> {
  if (!endpoint) {
    return;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Cursor API bridge failed: ${response.status} ${body}`);
  }
}

async function main(): Promise<void> {
  try {
    const rawInput = await readStdin();
    const event = createEvent(parsePayload(rawInput));

    await appendLocalLog(event);
    await sendToEndpoint(event);

    process.stdout.write(
      JSON.stringify({
        additional_context: endpoint
          ? "Cursor event captured and forwarded to the configured API bridge."
          : "Cursor event captured locally. Set CURSOR_API_BRIDGE_URL to forward it to an API.",
      }),
    );
  } catch (error) {
    process.stderr.write(
      error instanceof Error ? error.message : "Unknown Cursor API bridge error",
    );

    process.stdout.write(
      JSON.stringify({
        additional_context: "Cursor API bridge failed open; the agent workflow continued.",
      }),
    );
  }
}

void main();
