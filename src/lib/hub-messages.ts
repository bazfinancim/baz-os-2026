export type HubLang = "he" | "en";

/** מפתחות i18n — בסיס Heritage מ־152b2f8 + קטגוריית מפקדה ורשתות (דפים פנימיים ב-Hub) */
export type HubMessageKey =
  | "brandSubtitle"
  | "brandTitle"
  | "sectionCommand"
  | "sectionComm"
  | "sectionSocial"
  | "sectionCore"
  | "sectionFuel"
  | "sectionMore"
  | "nav.geminiEyes"
  | "nav.geminiEyesHint"
  | "nav.whatsapp"
  | "nav.whatsappHint"
  | "nav.facebook"
  | "nav.facebookHint"
  | "nav.instagram"
  | "nav.instagramHint"
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
    sectionCommand: "מפקדה",
    sectionComm: "תקשורת",
    sectionSocial: "רשתות חברתיות",
    sectionCore: "ליבה",
    sectionFuel: "כסף ודלק",
    sectionMore: "עוד",
    "nav.geminiEyes": "מפקדת ג׳מיני — Eyes",
    "nav.geminiEyesHint": "ניטור n8n · /admin/status",
    "nav.whatsapp": "WhatsApp Hub",
    "nav.whatsappHint": "n8n · סטטוס",
    "nav.facebook": "פייסבוק",
    "nav.facebookHint": "מסך Hub פנימי",
    "nav.instagram": "אינסטגרם",
    "nav.instagramHint": "מסך Hub פנימי",
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
    sectionCommand: "Command",
    sectionComm: "Communication",
    sectionSocial: "Social",
    sectionCore: "Core",
    sectionFuel: "Fuel & money",
    sectionMore: "More",
    "nav.geminiEyes": "Gemini HQ — Eyes",
    "nav.geminiEyesHint": "n8n health · /admin/status",
    "nav.whatsapp": "WhatsApp Hub",
    "nav.whatsappHint": "n8n · status",
    "nav.facebook": "Facebook",
    "nav.facebookHint": "Internal Hub screen",
    "nav.instagram": "Instagram",
    "nav.instagramHint": "Internal Hub screen",
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
