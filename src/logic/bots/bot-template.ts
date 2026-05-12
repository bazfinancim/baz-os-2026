import type { BazCompany } from "@/src/types/baz-company";
import type { BotEnvelope, BotEventKind } from "@/src/logic/bots/types";

const BOT_ID = "baz-empire-template-v1";

/**
 * תבנית בוט — מכינה מעטפת JSON אחידה לכל אחת מ-60 החברות,
 * לשליחה ל-n8n (webhook אחד שמפצל לפי company.id או תור ל-workflows ייעודיים).
 */
export function buildBotEnvelope(
  company: BazCompany,
  event: BotEventKind,
  payload: Record<string, unknown> = {},
): BotEnvelope {
  return {
    source: "baz-bot-template",
    botId: BOT_ID,
    event,
    company: {
      id: company.id,
      name: company.name,
      group: company.group,
      status: company.status,
    },
    payload,
    ts: Date.now(),
  };
}

/** גוף POST מוכן ל-fetch — ללא קריאת רשת כאן */
export function serializeBotPayload(envelope: BotEnvelope): string {
  return JSON.stringify(envelope);
}
