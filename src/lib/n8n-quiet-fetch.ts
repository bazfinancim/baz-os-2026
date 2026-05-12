/**
 * POST JSON ל-n8n בלי רעש — ללא console, שגיאות נבלעות בצד fetch בלבד.
 */
export async function postJsonQuiet(url: string, body: unknown): Promise<Response | null> {
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    return null;
  }
}
