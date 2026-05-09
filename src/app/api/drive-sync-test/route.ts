import { NextResponse } from "next/server";
import { getBazOsCurrentStateFileContent } from "@/src/lib/baz-os-current-state";
import { driveSafeTimestamp, uploadBazOsLogToDrive } from "@/src/lib/google-drive-logger";

export async function POST() {
  try {
    const timestamp = new Date().toISOString();
    const n8nStatus = await uploadBazOsLogToDrive(
      `baz_os_full_state_${driveSafeTimestamp(timestamp)}.json`,
      getBazOsCurrentStateFileContent(),
    );

    return NextResponse.json({
      ok: true,
      timestamp,
      n8nStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown drive sync test error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
