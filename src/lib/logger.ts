const loggerWebhookUrl = "https://n8n.baz-f.co.il/webhook/baz-os-logger";

export async function uploadLog(fileName: string, content: string) {
  try {
    const response = await fetch(loggerWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName,
        content,
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: `N8N webhook returned ${response.status}`,
      };
    }

    return {
      ok: true,
      status: response.status,
      message: "N8N webhook 200 OK",
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : "Network Error",
    };
  }
}

export { uploadLog as uploadBazOsLog };
