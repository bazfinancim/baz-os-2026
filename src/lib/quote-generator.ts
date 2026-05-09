import { getBazOsCurrentState } from "@/src/lib/baz-os-current-state";

export type BazQuoteLineItem = {
  title: string;
  description: string;
  quantity: number;
  unitPriceNis: number;
};

export type BazQuote = {
  quoteId: string;
  createdAt: string;
  clientName: string;
  projectName: string;
  currency: "NIS";
  status: "READY_FOR_CLIENT" | "DRAFT";
  validUntil: string;
  lineItems: BazQuoteLineItem[];
  notes: string[];
};

const defaultLineItems: BazQuoteLineItem[] = [
  {
    title: "BAZ OS Command Center Setup",
    description: "הקמת דשבורד ניהול, סטטוס ONLINE, לוגים, Drive sync ו-N8N cockpit.",
    quantity: 1,
    unitPriceNis: 8500,
  },
  {
    title: "Hunter Hub Automation",
    description: "חיבור כלי Hunter, scrapers ו-agents לזרימות N8N עם JSON audit.",
    quantity: 1,
    unitPriceNis: 6200,
  },
  {
    title: "Captain's Log + Drive Knowledge Base",
    description: "הערות, משימות והצעות מחיר בפורמט קריא ל-Gemini בתוך BAZ_OS_LOGS.",
    quantity: 1,
    unitPriceNis: 2800,
  },
];

export function createDefaultBazQuote() {
  const createdAt = new Date();
  const validUntil = new Date(createdAt);
  validUntil.setDate(validUntil.getDate() + 14);

  return {
    quoteId: `BAZ-Q-${createdAt.toISOString().slice(0, 10).replace(/-/g, "")}-001`,
    createdAt: createdAt.toISOString(),
    clientName: "BAZ-F Internal / Ready Client",
    projectName: "BAZ OS + Hunter Automation Deployment",
    currency: "NIS" as const,
    status: "READY_FOR_CLIENT" as const,
    validUntil: validUntil.toISOString(),
    lineItems: defaultLineItems,
    notes: [
      "This quote is intentionally written in plain text and JSON so Gemini can read it from Drive.",
      "Folder target: BAZ_OS_LOGS / 10RUF1EoQtH3W6O0Z0gLl0yktgfgkOePp.",
      "Includes Hunter assets, Drive sync, N8N automation and Captain's Log.",
    ],
  };
}

export function getQuoteTotalNis(quote: BazQuote) {
  return quote.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPriceNis, 0);
}

export function renderQuoteMarkdown(quote: BazQuote) {
  const state = getBazOsCurrentState();
  const total = getQuoteTotalNis(quote);
  const rows = quote.lineItems
    .map((item, index) => (
      `${index + 1}. ${item.title}\n` +
      `   - ${item.description}\n` +
      `   - Quantity: ${item.quantity}\n` +
      `   - Unit Price: ${item.unitPriceNis.toLocaleString("he-IL")} NIS\n` +
      `   - Line Total: ${(item.quantity * item.unitPriceNis).toLocaleString("he-IL")} NIS`
    ))
    .join("\n\n");

  return `# Quote ${quote.quoteId}

Client: ${quote.clientName}
Project: ${quote.projectName}
Status: ${quote.status}
Created At: ${quote.createdAt}
Valid Until: ${quote.validUntil}
Currency: ${quote.currency}

## Line Items
${rows}

## Total
${total.toLocaleString("he-IL")} NIS + VAT if applicable

## Gemini Read Context
- System Status: ${state.systemStatus}
- Empire Companies: ${state.empire.companyCount}
- Hunter Asset Credits: ${state.hunterHub.totalAssetCreditsBillions}B
- Drive Folder ID: ${state.drive.parentId}
- N8N: ${state.omniverse.n8n}

## Notes
${quote.notes.map((note) => `- ${note}`).join("\n")}
`;
}

export function renderQuoteJson(quote: BazQuote) {
  return JSON.stringify({
    ...quote,
    totalNis: getQuoteTotalNis(quote),
    geminiReadContext: getBazOsCurrentState(),
  }, null, 2);
}
