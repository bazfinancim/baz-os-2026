/**
 * triggerApiAction – שולח פעולה ישירה ל-N8N BAZ-OS Logger.
 * צד שרת בלבד (API Routes / Server Components).
 * הפורמט המלא: { fileName, content } כפי שמחכה ה-webhook.
 */

const N8N_LOGGER_URL = "https://n8n.baz-f.co.il/webhook/baz-os-logger";

export type ApiActionPayload = Record<string, unknown>;

export type ApiActionResult = {
  ok: boolean;
  status: number;
  message: string;
};

export async function triggerApiAction(
  action: string,
  payload: ApiActionPayload,
): Promise<ApiActionResult> {
  const timestamp = new Date().toISOString();
  const fileName = `baz_action_${action.replace(/\s+/g, "_")}_${Date.now()}.json`;
  const content = JSON.stringify({ action, payload, timestamp }, null, 2);

  try {
    const response = await fetch(N8N_LOGGER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, content }),
    });

    return {
      ok: response.ok,
      status: response.status,
      message: response.ok
        ? `N8N ACCEPTED: ${fileName}`
        : `N8N HTTP ${response.status}: ${fileName}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : "NETWORK_ERROR",
    };
  }
}
