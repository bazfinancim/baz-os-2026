import { NextResponse } from "next/server";
import { getBazOsCurrentState } from "@/src/lib/baz-os-current-state";
import { driveSafeTimestamp, uploadBazOsLogToDrive } from "@/src/lib/google-drive-logger";

type StatusChangeRequest = {
  source?: string;
  status?: string;
  action?: string;
  details?: Record<string, unknown>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StatusChangeRequest;
    const createdAt = new Date().toISOString();
    const payload = {
      createdAt,
      source: body.source ?? "BAZ_OS",
      status: body.status ?? "ONLINE",
      action: body.action ?? "STATUS_CHANGE",
      driveParentId: "10RUF1EoQtH3W6O0Z0gLl0yktgfgkOePp",
      details: body.details ?? {},
      fullCurrentState: getBazOsCurrentState(),
    };

    const n8nStatus = await uploadBazOsLogToDrive(
      `status_change_${driveSafeTimestamp(createdAt)}.json`,
      JSON.stringify(payload, null, 2),
    );

    return NextResponse.json({
      ok: true,
      n8nStatus,
      payload,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown status change sync error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
