const loggerWebhookUrl = "https://n8n.baz-f.co.il/webhook/baz-os-logger";

export function driveSafeTimestamp(timestamp = new Date().toISOString()) {
  return timestamp.replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "_");
}

export async function uploadBazOsLogToDrive(fileName: string, content: string | object) {
  const stringContent = typeof content === "string" ? content : JSON.stringify(content);

  try {
    const response = await fetch(loggerWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName,
        content: stringContent,
      }),
    });

    if (!response.ok) {
      console.warn(`[BAZ OS LOGGER] N8N webhook returned ${response.status}; saved locally.`);
      return `LOCAL_ONLY: N8N webhook returned ${response.status}`;
    }

    console.log(`[BAZ OS LOGGER] N8N webhook 200 OK: ${fileName}`);
    return `QUEUED: ${fileName} via N8N`;
  } catch (error) {
    console.warn("[BAZ OS LOGGER] N8N webhook unavailable; saved locally.", error);
    return "LOCAL_ONLY: N8N webhook unavailable";
  }
}
