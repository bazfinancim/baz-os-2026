import type { BazCompany } from "@/src/types/baz-company";

/** אירוע בוט סטנדרטי ל-n8n */
export type BotEventKind = "ping" | "sync" | "notify" | "custom";

export type BotEnvelope = {
  source: "baz-bot-template";
  botId: string;
  event: BotEventKind;
  company: Pick<BazCompany, "id" | "name" | "group" | "status">;
  payload: Record<string, unknown>;
  ts: number;
};
