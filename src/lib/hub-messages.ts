export type HubLang = "he" | "en";

export type HubMessageKey =
  | "brandSubtitle"
  | "brandTitle"
  | "sectionGate"
  | "sectionComm"
  | "sectionSocial"
  | "sectionCore"
  | "sectionFuel"
  | "sectionVip"
  | "sectionMore"
  | "sectionCommand"
  | "nav.geminiEyes"
  | "nav.geminiEyesHint"
  | "nav.home"
  | "nav.homeHint"
  | "nav.whatsapp"
  | "nav.whatsappHint"
  | "nav.facebook"
  | "nav.facebookHint"
  | "nav.instagram"
  | "nav.instagramHint"
  | "nav.linkedin"
  | "nav.linkedinHint"
  | "nav.tiktok"
  | "nav.tiktokHint"
  | "nav.youtube"
  | "nav.youtubeHint"
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
  | "nav.vipMaster"
  | "nav.vipMasterHint"
  | "nav.base44"
  | "nav.base44Hint"
  | "nav.cursorLog"
  | "nav.cursorLogHint"
  | "nav.wip"
  | "nav.wipHint"
  | "langHe"
  | "langEn"
  | "footer";

const M: Record<HubLang, Record<HubMessageKey, string>> = {
  he: {
    brandSubtitle: "BAZ OS",
    brandTitle: "Master Hub",
    sectionGate: "שער",
    sectionComm: "תקשורת",
    sectionSocial: "רשתות ושיווק",
    sectionCore: "ליבה",
    sectionFuel: "כסף ודלק",
    sectionVip: "VIP ומסכים",
    sectionMore: "עוד",
    sectionCommand: "מפקדה",
    "nav.geminiEyes": "מפקדת ג׳מיני — Eyes",
    "nav.geminiEyesHint": "/admin/status · ניטור n8n",
    "nav.home": "שער ראשי",
    "nav.homeHint": "דף הבית",
    "nav.whatsapp": "WhatsApp Hub",
    "nav.whatsappHint": "n8n · סטטוס",
    "nav.facebook": "פייסבוק · Meta",
    "nav.facebookHint": "Business Suite",
    "nav.instagram": "אינסטגרם",
    "nav.instagramHint": "ניהול תוכן",
    "nav.linkedin": "לינקדאין",
    "nav.linkedinHint": "B2B · מותג",
    "nav.tiktok": "טיקטוק",
    "nav.tiktokHint": "קמפיינים",
    "nav.youtube": "יוטיוב",
    "nav.youtubeHint": "ערוץ · סטודיו",
    "nav.projects": "פרויקטים",
    "nav.projectsHint": "CodeX · Base44",
    "nav.clients": "לקוחות",
    "nav.clientsHint": "מסד מקומי",
    "nav.companies": "60 חברות",
    "nav.companiesHint": "baz_companies.json",
    "nav.hunter": "Hunter",
    "nav.hunterHint": "discovered_tools.json",
    "nav.finance": "פיננסים",
    "nav.financeHint": "קרדיטים וחיובים",
    "nav.vault": "כספת",
    "nav.vaultHint": "מפתחות בשרת",
    "nav.vipMaster": "Master Hub · VIP",
    "nav.vipMasterHint": "מנוע קלאסי · כלים",
    "nav.base44": "Base44",
    "nav.base44Hint": "ממשק ישיר",
    "nav.cursorLog": "Cursor Log",
    "nav.cursorLogHint": "יומן סוכן",
    "nav.wip": "WIP",
    "nav.wipHint": "בפיתוח",
    langHe: "עברית",
    langEn: "English",
    footer: "Baz-F Tech · 2026",
  },
  en: {
    brandSubtitle: "BAZ OS",
    brandTitle: "Master Hub",
    sectionGate: "Gate",
    sectionComm: "Communication",
    sectionSocial: "Social & ads",
    sectionCore: "Core",
    sectionFuel: "Fuel & money",
    sectionVip: "VIP & screens",
    sectionMore: "More",
    sectionCommand: "Command",
    "nav.geminiEyes": "Gemini HQ — Eyes",
    "nav.geminiEyesHint": "/admin/status · n8n",
    "nav.home": "Home",
    "nav.homeHint": "Landing",
    "nav.whatsapp": "WhatsApp Hub",
    "nav.whatsappHint": "n8n · status",
    "nav.facebook": "Facebook · Meta",
    "nav.facebookHint": "Business Suite",
    "nav.instagram": "Instagram",
    "nav.instagramHint": "Content",
    "nav.linkedin": "LinkedIn",
    "nav.linkedinHint": "B2B · brand",
    "nav.tiktok": "TikTok",
    "nav.tiktokHint": "Campaigns",
    "nav.youtube": "YouTube",
    "nav.youtubeHint": "Studio",
    "nav.projects": "Projects",
    "nav.projectsHint": "CodeX · Base44",
    "nav.clients": "Clients",
    "nav.clientsHint": "Local DB",
    "nav.companies": "60 companies",
    "nav.companiesHint": "baz_companies.json",
    "nav.hunter": "Hunter",
    "nav.hunterHint": "discovered_tools.json",
    "nav.finance": "Finance",
    "nav.financeHint": "Credits & billing",
    "nav.vault": "Vault",
    "nav.vaultHint": "Keys on server",
    "nav.vipMaster": "Master Hub · VIP",
    "nav.vipMasterHint": "Classic tools engine",
    "nav.base44": "Base44",
    "nav.base44Hint": "Direct UI",
    "nav.cursorLog": "Cursor Log",
    "nav.cursorLogHint": "Agent log",
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
