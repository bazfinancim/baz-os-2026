import { NextResponse } from "next/server";

const STATIC_REPLY_HE = "פקודה התקבלה, המפקד. מעדכן את הסטטוס.";

/**
 * תשתית פקודת קול — כרגע מחזיר תשובה סטטית בלבד.
 * מקבל multipart עם שדה `audio` ו/או JSON עם `transcript`.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const ct = req.headers.get("content-type") ?? "";

    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const audio = form.get("audio");
      const hint = form.get("transcriptHint");
      void audio;
      void hint;
    } else if (ct.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as { transcript?: string };
      void body.transcript;
    } else {
      await req.text().catch(() => "");
    }

    return NextResponse.json({ ok: true, message: STATIC_REPLY_HE });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "שגיאה פנימית";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
