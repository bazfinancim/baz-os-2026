import axios from "axios";

type MetaMessageResponse = {
  messaging_product?: string;
  contacts?: { input?: string; wa_id?: string }[];
  messages?: { id?: string }[];
};

export class MetaWhatsAppClient {
  private readonly accessToken: string;
  private readonly phoneId: string;

  constructor(
    accessToken = process.env.META_ACCESS_TOKEN ?? "",
    phoneId = process.env.META_PHONE_ID ?? "",
  ) {
    this.accessToken = accessToken;
    this.phoneId = phoneId;
  }

  async sendMessage(to: string, template: string): Promise<MetaMessageResponse> {
    if (!this.accessToken) {
      throw new Error("META_ACCESS_TOKEN is missing");
    }

    if (!this.phoneId) {
      throw new Error("META_PHONE_ID is missing");
    }

    if (!to.trim()) {
      throw new Error("WhatsApp recipient is required");
    }

    if (!template.trim()) {
      throw new Error("WhatsApp template name is required");
    }

    try {
      const response = await axios.post<MetaMessageResponse>(
        `https://graph.facebook.com/v20.0/${this.phoneId}/messages`,
        {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: template,
            language: { code: "he" },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "content-type": "application/json",
          },
          timeout: 15_000,
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? "unknown";
        const details = JSON.stringify(error.response?.data ?? error.message);
        throw new Error(`Meta WhatsApp request failed: ${status} ${details}`);
      }

      throw error;
    }
  }
}

export const metaWhatsApp = new MetaWhatsAppClient();
