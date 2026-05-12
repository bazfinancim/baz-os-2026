export type HubLang = "he" | "en";

export type HubMessageKey =
  | "brandSubtitle"
  | "brandTitle"
  | "sectionComm"
  | "sectionCore"
  | "sectionFuel"
  | "sectionMore"
  | "sectionCommand"
  | "nav.geminiEyes"
  | "nav.geminiEyesHint"
  | "nav.whatsapp"
  | "nav.whatsappHint"
  | "nav.projects"
  | "nav.projectsHint"
  | "nav.clients"
  | "nav.clientsHint"
  | "nav.companies"
  | "nav.companiesHint"
  | "nav.hunter"
  | "nav.hunterHint"
  | "nav.finance"
  | "nav.financeHint"
  | "nav.vault"
  | "nav.vaultHint"
  | "nav.wip"
  | "nav.wipHint"
  | "langHe"
  | "langEn"
  | "footer";

const M: Record<HubLang, Record<HubMessageKey, string>> = {
  he: {
    brandSubtitle: "BAZ OS",
    brandTitle: "Master Hub",
    sectionComm: "תקשורת",
    sectionCore: "ליבה",
    sectionFuel: "כסף ודלק",
    sectionMore: "עוד",
    sectionCommand: "מפקדה",
    "nav.geminiEyes": "Gemini · Eyes",
    "nav.geminiEyesHint": "ניטור n8n · 60 חברות",
    "nav.whatsapp": "WhatsApp Hub",
    "nav.whatsappHint": "n8n · סטטוס",
    "nav.projects": "פרויקטים",
    "nav.projectsHint": "CodeX · Base44",
    "nav.clients": "לקוחות",
    "nav.clientsHint": "מסד מקומי",
    "nav.companies": "60 חברות",
    "nav.companiesHint": "baz_companies.json",
    "nav.hunter": "Hunter",
    "nav.hunterHint": "ציד · discovered_tools",
    "nav.finance": "פיננסים",
    "nav.financeHint": "קרדיטים וחיובים",
    "nav.vault": "כספת",
    "nav.vaultHint": "מפתחות בשרת",
    "nav.wip": "WIP",
    "nav.wipHint": "בפיתוח",
    langHe: "עברית",
    langEn: "English",
    footer: "Baz-F Tech · 2026",
  },
  en: {
    brandSubtitle: "BAZ OS",
    brandTitle: "Master Hub",
    sectionComm: "Communication",
    sectionCore: "Core",
    sectionFuel: "Fuel & money",
    sectionMore: "More",
    sectionCommand: "Command",
    "nav.geminiEyes": "Gemini · Eyes",
    "nav.geminiEyesHint": "n8n health · 60 companies",
    "nav.whatsapp": "WhatsApp Hub",
    "nav.whatsappHint": "n8n · status",
    "nav.projects": "Projects",
    "nav.projectsHint": "CodeX · Base44",
    "nav.clients": "Clients",
    "nav.clientsHint": "Local DB",
    "nav.companies": "60 companies",
    "nav.companiesHint": "baz_companies.json",
    "nav.hunter": "Hunter",
    "nav.hunterHint": "Hunt · discovered_tools",
    "nav.finance": "Finance",
    "nav.financeHint": "Credits & billing",
    "nav.vault": "Vault",
    "nav.vaultHint": "Keys on server",
    "nav.wip": "WIP",
    "nav.wipHint": "In development",
    langHe: "עברית",
    langEn: "English",
    footer: "Baz-F Tech · 2026",
  },
};

export function hubT(lang: HubLang, key: HubMessageKey): string {
  return M[lang][key] ?? key;
}
