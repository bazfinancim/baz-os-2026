import { NextResponse } from "next/server";

const defaultSessionPin = "0426";

export function isProtectedModeEnabled() {
  return process.env.PROTECTED_MODE !== "OFF";
}

export function validateWriteAccess(req: Request) {
  if (!isProtectedModeEnabled()) {
    return null;
  }

  const suppliedPin = req.headers.get("x-session-pin");
  const expectedPin = process.env.SESSION_PIN ?? defaultSessionPin;

  if (suppliedPin !== expectedPin) {
    return NextResponse.json(
      {
        error: "PROTECTED_MODE is active. Toggle Safety Switch OFF and provide a valid session PIN.",
      },
      { status: 423 },
    );
  }

  return null;
}
