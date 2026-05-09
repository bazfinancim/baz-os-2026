import { NextResponse } from "next/server";

const visionServerUrl = process.env.BAZ_EYE_SERVER_URL ?? "http://127.0.0.1:5055";

export async function POST() {
  try {
    const response = await fetch(`${visionServerUrl}/scan`, {
      method: "POST",
      cache: "no-store",
    });

    const data = (await response.json()) as unknown;

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Vision Eye server returned ${response.status}`,
          data,
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Vision Eye server is not reachable",
        nextStep: "Run: python baz_eye.py --server",
      },
      { status: 503 },
    );
  }
}
