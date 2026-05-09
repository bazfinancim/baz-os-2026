export type WhatsAppBotMode = "standby" | "auto_reply" | "broadcast" | "human_handoff";

export type WhatsAppBotSettings = {
  enabled: boolean;
  mode: WhatsAppBotMode;
  provider: "n8n" | "meta_cloud_api" | "mock";
  webhookUrl: string;
  defaultPhoneNumber: string;
  escalationPhoneNumber: string;
  language: "he" | "en";
  businessName: string;
  autoReplyMessage: string;
};

export type WhatsAppBotAction = {
  action: "send_message" | "test_connection" | "sync_settings";
  phoneNumber?: string;
  message?: string;
  metadata?: Record<string, unknown>;
};

export type WhatsAppBotPayload = {
  id: string;
  createdAt: string;
  source: "baz_os_dashboard";
  settings: WhatsAppBotSettings;
  action: Required<WhatsAppBotAction>;
};

export const defaultWhatsAppBotSettings: WhatsAppBotSettings = {
  enabled: false,
  mode: "standby",
  provider: "n8n",
  webhookUrl: process.env.WHATSAPP_BOT_WEBHOOK_URL ?? "",
  defaultPhoneNumber: process.env.WHATSAPP_DEFAULT_PHONE ?? "",
  escalationPhoneNumber: process.env.WHATSAPP_ESCALATION_PHONE ?? "",
  language: "he",
  businessName: "BAZ OS",
  autoReplyMessage:
    "שלום, הגעת למערכת BAZ OS. הבוט קיבל את הפנייה ומטפל בה אוטומטית.",
};

export function normalizeBotSettings(
  settings: Partial<WhatsAppBotSettings> = {},
): WhatsAppBotSettings {
  return {
    ...defaultWhatsAppBotSettings,
    ...settings,
    webhookUrl:
      settings.webhookUrl ??
      process.env.WHATSAPP_BOT_WEBHOOK_URL ??
      defaultWhatsAppBotSettings.webhookUrl,
  };
}

export function normalizeBotAction(action: WhatsAppBotAction): Required<WhatsAppBotAction> {
  return {
    action: action.action,
    phoneNumber: action.phoneNumber ?? "",
    message: action.message ?? "",
    metadata: action.metadata ?? {},
  };
}

export function validateBotAction(action: WhatsAppBotAction): string[] {
  const errors: string[] = [];

  if (!action.action) {
    errors.push("Missing bot action");
  }

  if (action.action === "send_message" && !action.message) {
    errors.push("Message is required for send_message");
  }

  return errors;
}

export function buildBotPayload(
  action: WhatsAppBotAction,
  settings?: Partial<WhatsAppBotSettings>,
): WhatsAppBotPayload {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    source: "baz_os_dashboard",
    settings: normalizeBotSettings(settings),
    action: normalizeBotAction(action),
  };
}
