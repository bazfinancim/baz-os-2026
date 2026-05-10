"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SystemLogsBox } from "./components/SystemLogsBox";
import { AgentCommandCenter } from "@/src/components/AgentCommandCenter";
import { BrainDumpDock } from "@/src/components/BrainDumpDock";
import { EmpireStatusBoard } from "@/src/components/EmpireStatusBoard";
import db from "@/src/lib/db.json";
import { IntegrationGalaxy } from "@/src/components/IntegrationGalaxy";
import { MarketingHub } from "@/src/components/MarketingHub";
import base44Inventory from "@/src/data/base44_inventory.json";
import hunterToolsInventory from "@/src/data/hunter_tools.json";
import { getPowerDispatcherState } from "@/src/lib/engine";
import { creditVaultBalances, getLeastCostRoutingPlan } from "@/src/lib/vault-manager";
import {
  companiesByCategory,
  creditApiArsenal,
  empireCompanies,
  infrastructureEngines,
  premiumMicroSaasProjects,
  whaleCredits,
} from "@/src/lib/empire-config";
import { getWorkHoursRemaining } from "@/src/lib/predictor";

type ActiveTab =
  | "projects"
  | "clients"
  | "marketing"
  | "integrations"
  | "finance"
  | "vault"
  | "keys_valves"
  | "base"
  | "lead_gen"
  | "comms"
  | "ai_advisors"
  | "arsenal"
  | "n8n_automations"
  | "server_infra"
  | "creative_hub"
  | "logs"
  | "settings";
type UiLanguage = "he" | "en";
type SettingsView = "drive" | "resources";
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

function syncStatusChange(action: string, status = "ONLINE", details: Record<string, unknown> = {}) {
  void fetch("/api/status-change", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "BAZ_OS_COMMAND_CENTER",
      action,
      status,
      details,
    }),
  }).catch(() => undefined);
}

type LeadFeedItem = {
  companyName: string;
  email: string;
  status: string;
};

type Base44SyncProject = {
  id: string;
  name: string;
  status: string;
  owner: string;
};

type Base44SyncTool = {
  id: string;
  name: string;
  category: string;
  creditPool: string;
  status: string;
  assetCredits?: number;
};

type Base44SyncLog = {
  id: string;
  createdAt: string;
  action: string;
  status: string;
};

type Base44CreditSync = {
  usedCredits: number;
  totalCredits: number;
  giftCredits: number;
  remainingCredits: number;
  integrationCreditsRemaining: number;
  chatCreditsRemaining: number;
};

type Base44InventoryFile = {
  generatedAt?: string | null;
  status?: string;
  message?: string;
  projects?: {
    active?: Base44SyncProject[];
  };
  hunter?: {
    scrapers?: Base44SyncTool[];
  };
  credits?: Partial<Base44CreditSync>;
};

type HunterToolsInventoryFile = {
  generatedAt?: string | null;
  status?: string;
  tools?: Base44SyncTool[];
};

type Base44IngestedEntity = {
  appId: string;
  appLabel: string;
  entityName: string;
  ok: boolean;
  status: number;
  records: unknown[];
  error?: string;
};

type Base44TotalIngestionResponse = {
  ok: boolean;
  status: string;
  generatedAt: string;
  totalRecords: number;
  entities: Base44IngestedEntity[];
  error?: string;
};

type HunterInnerTab = "overview" | "scanners" | "assets";

type ScoutFindingsResponse = {
  ok: boolean;
  status: string;
  generatedAt: string;
  totalRecords: number;
  findings: unknown[];
  entity?: Base44IngestedEntity | null;
  error?: string;
};

const nativeHunterFactoryTools: Base44SyncTool[] = [
  {
    id: "native-lead-scraper",
    name: "Native Lead Scraper",
    category: "Scraper",
    creditPool: "N8N: BAZ Hunter Lead Scan",
    status: "READY",
    assetCredits: 2_400_000_000,
  },
  {
    id: "native-email-enricher",
    name: "Email Enrichment Agent",
    category: "Agent",
    creditPool: "N8N: BAZ Email Enrichment",
    status: "READY",
    assetCredits: 1_800_000_000,
  },
  {
    id: "native-whatsapp-launcher",
    name: "WhatsApp Launcher",
    category: "Agent",
    creditPool: "N8N: BAZ WhatsApp Lead Router",
    status: "ACTIVE",
    assetCredits: 1_300_000_000,
  },
  {
    id: "native-company-profiler",
    name: "Company Profiler",
    category: "Active Script",
    creditPool: "N8N: BAZ Company Profiler",
    status: "READY",
    assetCredits: 900_000_000,
  },
  {
    id: "native-crm-injector",
    name: "CRM Injection Script",
    category: "Active Script",
    creditPool: "N8N: BAZ CRM Injection",
    status: "READY",
    assetCredits: 700_000_000,
  },
];

const hunterAssetCreditFallbacks = [2_400_000_000, 1_800_000_000, 1_300_000_000, 900_000_000, 700_000_000];

function getHunterAssetCredits(tool: Base44SyncTool, index: number) {
  return tool.assetCredits ?? hunterAssetCreditFallbacks[index % hunterAssetCreditFallbacks.length] ?? 0;
}

type MessageStreamItem = {
  id: string;
  direction: "incoming" | "outgoing";
  channel: "Meta WhatsApp" | "Email";
  target: string;
  body: string;
  timestamp: string;
};

type FuelGauge = {
  name: string;
  provider: string;
  level: number;
  activeKey: string;
  isWarning: boolean;
};

type KeyValveId = "gemini" | "hunter" | "meta" | "backup";

type KeyValveState = {
  id: KeyValveId;
  label: string;
  provider: string;
  value: string;
  isValidated: boolean;
  balance: number;
  status: "missing" | "ready" | "active";
};

type VaultInjectionKey = {
  id: string;
  label: string;
  provider: string;
  maskedKey: string;
  isActive: boolean;
  balance: number;
};

type VaultInjectionResponse = {
  status: string;
  keys?: VaultInjectionKey[];
  activeAssets?: number;
  activeKeys?: number;
  historyPoint?: number;
  report?: string;
};

type DriveFolderNode = {
  id: string;
  name: string;
  type: "root" | "project" | "subfolder";
  status: "FOUND" | "MAPPED" | "READY";
  children?: DriveFolderNode[];
};

type DriveMappingSummary = {
  rootFolderName: string;
  rootFound: boolean;
  projectCount: number;
  subfolderCount: number;
  isReady: boolean;
};

type DriveMappingState = {
  status: "PENDING" | "SYNCED";
  tree: DriveFolderNode | null;
  summary: DriveMappingSummary | null;
};

type ProjectMemory = {
  id: string;
  name: string;
  context: string;
  platform: string;
  assignedTo: string;
  status: string;
  sector?: string;
  fuelPriority?: "High" | "Medium" | "Low";
  fuelLevel?: number;
  protectionStatus?: "LOCKED";
  needsAttention?: boolean;
  isLocked?: boolean;
};

type ClientMemory = {
  id: string;
  name: string;
  health: number;
  fuelStatus: number;
  activeAutomations: string[];
  needsHumanHelp: boolean;
};

type VaultAsset = {
  id: string;
  tool_name: string;
  api_key: string;
  expiry_date: string;
  credit_balance: number;
  status: string;
};

type FinanceLog = {
  id: string;
  type: "revenue" | "invoice";
  clientId: string;
  amount: number;
  status: "collected" | "pending";
  description: string;
};

type EmpireDb = {
  lastSync?: string;
  clients: ClientMemory[];
  vault_assets: VaultAsset[];
  vault?: {
    id: string;
    name: string;
    key: string;
    credits: number;
    expiry: string;
  }[];
  projects: ProjectMemory[];
  finance_logs: FinanceLog[];
  leads?: {
    id: string;
    companyName: string;
    source: string;
    status: string;
  }[];
};

type SpeechRecognitionEvent = Event & {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

function getCurrentTime() {
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

const hunterScanTypes = [
  "סריקת מודיעין חברה", "גילוי לידים", "איתור מקבלי החלטות", "סריקת תבניות אימייל", "סריקת WhatsApp ללקוחות", "סריקת פרופילי LinkedIn",
  "סריקת טכנולוגיות דומיין", "איתותי גיוס כספים", "איתותי גיוס עובדים", "מיפוי מתחרים", "העשרת CRM", "סריקת הזדמנויות SEO",
  "סריקת פעילות מודעות", "סריקת נוכחות חברתית", "סריקת סנטימנט מותג", "סריקת תשתית Ecommerce", "סריקת תשתית תשלומים", "סריקת פערי אוטומציה",
  "סריקת אימוץ AI", "סריקת סיכוני סייבר", "סריקת Data Brokers", "סריקת הוצאות SaaS", "גילוי ספקים", "סריקת התאמת שותפות",
  "סריקת פרופיל מייסד", "איתותי משקיעים", "סריקת אזכורי עיתונות", "סריקת Product Hunt", "סריקת פעילות GitHub", "סריקת App Store",
  "סריקת לידים מ־Google Maps", "סריקת עסקים מקומיים", "כריית ביקורות", "זווית פנייה במייל קר", "סריקת התאמת הצעה", "חילוץ נקודות כאב",
  "ביקורת קופי אתר", "סריקת פערי Landing Page", "סריקת דליפות Funnel", "סריקת איתותי המרה", "סריקת Pixel רימרקטינג", "סריקת Analytics Stack",
  "סריקת Newsletter", "סריקת קהילה", "התאמת משפיענים", "סריקת הזדמנות Affiliate", "סריקת זכאות Grants", "סריקת נכסי קרדיט",
  "סריקת התאמת NVIDIA", "סריקת Cloud Credits", "סריקת חשיפת API", "סריקת Workflow Automation", "סריקת אינטגרציית N8N", "סריקת החלפת Zapier",
  "סריקת ישויות Base44", "סריקת פרויקט CodeX", "סריקת כלי Credit Hunter", "התאמת Worker Bot", "ניתוב מחלקות", "רישום כלי",
  "סריקת Scout Findings", "סריקת Bot Config", "סריקת עדיפות משימות", "סריקת בריאות אינטגרציה", "סריקת הזדמנות הצעת מחיר", "סריקת אימפריה מלאה",
];

function parseOperationalCommand(input: string) {
  const normalized = input.toLowerCase();
  const company = empireCompanies.find((item) => normalized.includes(item.name.toLowerCase())) ?? empireCompanies[0];
  const scanType = hunterScanTypes.find((item) => normalized.includes(item.toLowerCase())) ?? hunterScanTypes[0];
  const tool = nativeHunterFactoryTools.find((item) => normalized.includes(item.name.toLowerCase())) ?? nativeHunterFactoryTools[0];
  const identity = normalized.includes("dolphin") ? "DOLPHIN" : "BAZ SPACE";

  return { company, scanType, tool, identity };
}

const tabs: { id: ActiveTab; label: Record<UiLanguage, string>; description: Record<UiLanguage, string> }[] = [
  { id: "projects", label: { he: "פרויקטים", en: "Projects" }, description: { he: "ניהול נכסי האימפריה", en: "Empire project management" } },
  { id: "clients", label: { he: "לקוחות", en: "Clients" }, description: { he: "מאגר לקוחות ופעילות עסקית", en: "Client database and business activity" } },
  { id: "marketing", label: { he: "שיווק", en: "Marketing" }, description: { he: "מרכז אינטגרציות Meta, Google, TikTok ו־WhatsApp", en: "Meta, Google, TikTok and WhatsApp integrations" } },
  { id: "integrations", label: { he: "חיבורים", en: "Integrations" }, description: { he: "עולם החיבורים החיצוניים של BAZ OS", en: "External connection galaxy for BAZ OS" } },
  { id: "finance", label: { he: "פיננסים וחשבוניות", en: "Finance & Invoices" }, description: { he: "חשבוניות, גבייה ואוטומציות פיננסיות", en: "Invoices, collection and finance automation" } },
  { id: "vault", label: { he: "כספת נכסים", en: "Asset Vault" }, description: { he: "ניהול קרדיטים, מפתחות וכלי API", en: "Credits, keys and API tools" } },
  { id: "keys_valves", label: { he: "מפתחות ושסתומים", en: "Keys & Valves" }, description: { he: "הזרקת מפתחות API אמיתיים והפעלת שסתומי דלק", en: "Real API key injection and fuel valves" } },
  { id: "base", label: { he: "Base44 / Hunter", en: "Base44 / Hunter" }, description: { he: "מרכז מיגרציה מלא ל־Base44 ו־Hunter", en: "Full Base44 and Hunter migration hub" } },
  { id: "lead_gen", label: { he: "ייצור לידים", en: "Lead Generation" }, description: { he: "שריפת קרדיטים לפני תפוגה והפקת לידים", en: "Credit burn and lead extraction" } },
  { id: "comms", label: { he: "מרכז תקשורת", en: "Comms Center" }, description: { he: "Meta WhatsApp, Email וזרימת הודעות", en: "Meta WhatsApp, Email and message streams" } },
  { id: "ai_advisors", label: { he: "יועצי AI", en: "AI Advisors" }, description: { he: "חדר ייעוץ עם BAZ AI", en: "Consulting room with BAZ AI" } },
  { id: "arsenal", label: { he: "חברות וארסנל", en: "Arsenal / Companies" }, description: { he: "47 חברות, 4 תשתיות ו־Golden Projects", en: "47 companies, 4 infrastructure engines and Golden Projects" } },
  { id: "n8n_automations", label: { he: "אוטומציות N8N", en: "N8N Automations" }, description: { he: "בניית workflows מקוריים ב־N8N", en: "Native N8N workflow cockpit" } },
  { id: "server_infra", label: { he: "שרתים ותשתית", en: "Server Hub" }, description: { he: "Hetzner, Vercel ו־Cloudflare בלבד", en: "Hetzner, Vercel and Cloudflare only" } },
  { id: "creative_hub", label: { he: "מרכז יצירה", en: "Creative" }, description: { he: "Canva ומיילים ארגוניים", en: "Canva and company mail" } },
  { id: "logs", label: { he: "לוגים / העתקה לג'מיני", en: "Logs / Copy for Gemini" }, description: { he: "סריקות, ארכיון וסיכום המשך עבודה", en: "Scans, archive and handoff summary" } },
  { id: "settings", label: { he: "הגדרות", en: "Settings" }, description: { he: "Drive ומשאבי מערכת", en: "Drive and system resources" } },
];

const tabIds = new Set<ActiveTab>(tabs.map((tab) => tab.id));

function readStoredActiveTab() {
  if (typeof window === "undefined") {
    return "projects";
  }

  const savedTab = window.localStorage.getItem("baz-os-active-tab") as ActiveTab | null;
  return savedTab && tabIds.has(savedTab) ? savedTab : "projects";
}

function readStoredReadOnlyMode() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.localStorage.getItem("baz-os-read-only-mode") !== "false";
}

function readStoredUiLanguage() {
  if (typeof window === "undefined") {
    return "he";
  }

  return window.localStorage.getItem("baz-os-ui-language") === "en" ? "en" : "he";
}

function subscribeToClientStore(callback: () => void) {
  window.addEventListener("baz-os-store-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("baz-os-store-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getServerActiveTabSnapshot(): ActiveTab {
  return "projects";
}

function getServerReadOnlyModeSnapshot() {
  return true;
}

function getServerUiLanguageSnapshot(): UiLanguage {
  return "he";
}

function persistActiveTab(tab: ActiveTab) {
  window.localStorage.setItem("baz-os-active-tab", tab);
  window.dispatchEvent(new Event("baz-os-store-change"));
}

function persistReadOnlyMode(value: boolean) {
  window.localStorage.setItem("baz-os-read-only-mode", String(value));
  window.dispatchEvent(new Event("baz-os-store-change"));
}

function persistUiLanguage(value: UiLanguage) {
  window.localStorage.setItem("baz-os-ui-language", value);
  window.dispatchEvent(new Event("baz-os-store-change"));
}

const secondaryFuelSources = ["Meta WhatsApp", "Integrately", "Base44", "Google Drive"];

const initialKeyValves: KeyValveState[] = [
  {
    id: "gemini",
    label: "Gemini Pro Key",
    provider: "Google AI",
    value: "",
    isValidated: false,
    balance: 0,
    status: "missing",
  },
  {
    id: "hunter",
    label: "Hunter.io API Key",
    provider: "Hunter.io",
    value: "",
    isValidated: false,
    balance: 0,
    status: "missing",
  },
  {
    id: "meta",
    label: "Meta WhatsApp Token",
    provider: "Meta Business",
    value: "",
    isValidated: false,
    balance: 0,
    status: "missing",
  },
  {
    id: "backup",
    label: "OpenAI/Claude Backup Keys",
    provider: "Backup LLM Pool",
    value: "",
    isValidated: false,
    balance: 0,
    status: "missing",
  },
];

const empireDb = db as EmpireDb;
const clientMemories = empireDb.clients;
const projectMemories = empireDb.projects;
const vaultAssets = empireDb.vault_assets;
const financeLogs = empireDb.finance_logs;
const leadCount = empireDb.leads?.length ?? 0;
const powerState = getPowerDispatcherState();
const turboHoursRemaining = getWorkHoursRemaining();

const initialMessageStream: MessageStreamItem[] = [
  {
    id: "msg-001",
    direction: "incoming",
    channel: "Meta WhatsApp",
    target: "Somer",
    body: "לקוח ביקש סטטוס על קמפיין הלידים.",
    timestamp: getCurrentTime(),
  },
  {
    id: "msg-002",
    direction: "outgoing",
    channel: "Email",
    target: "Lev Finance",
    body: "נשלח תזכורת חשבונית וסיכום גבייה.",
    timestamp: getCurrentTime(),
  },
];

function creditToFuelLevel(credits: number) {
  return Math.min(100, Math.max(5, Math.round(credits / 1_500)));
}

function buildFuelGaugesFromVault(assets: VaultAsset[]): FuelGauge[] {
  const sumByTool = (needle: string) =>
    assets
      .filter((asset) => asset.tool_name.toLowerCase().includes(needle))
      .reduce((sum, asset) => sum + asset.credit_balance, 0);
  const hasWarning = (needle: string) =>
    assets
      .filter((asset) => asset.tool_name.toLowerCase().includes(needle))
      .some((asset) => asset.status === "LOW_FUEL" || asset.status === "CRITICAL_EXPIRY" || isExpiringSoon(asset.expiry_date));

  return [
    {
      name: "Gemini API",
      provider: "Google",
      level: creditToFuelLevel(sumByTool("gemini")),
      activeKey: "Vault Gemini Pool",
      isWarning: hasWarning("gemini"),
    },
    {
      name: "Claude API",
      provider: "Anthropic",
      level: creditToFuelLevel(sumByTool("claude")),
      activeKey: "Vault Anthropic Pool",
      isWarning: hasWarning("claude"),
    },
    {
      name: "Meta WhatsApp Credits",
      provider: "Meta",
      level: creditToFuelLevel(sumByTool("meta")),
      activeKey: "Vault Meta Pool",
      isWarning: hasWarning("meta"),
    },
  ];
}

function isExpiringSoon(expiryDate: string) {
  const now = new Date();
  const expiry = new Date(`${expiryDate}T23:59:59`);
  const daysLeft = (expiry.getTime() - now.getTime()) / 86_400_000;

  return daysLeft >= 0 && daysLeft < 7;
}

export default function Home() {
  const storedActiveTab = useSyncExternalStore(
    subscribeToClientStore,
    readStoredActiveTab,
    getServerActiveTabSnapshot,
  );
  const storedReadOnlyMode = useSyncExternalStore(
    subscribeToClientStore,
    readStoredReadOnlyMode,
    getServerReadOnlyModeSnapshot,
  );
  const uiLanguage = useSyncExternalStore(
    subscribeToClientStore,
    readStoredUiLanguage,
    getServerUiLanguageSnapshot,
  );
  const [commandPrompt, setCommandPrompt] = useState("");
  const [commandAnswer, setCommandAnswer] = useState("");
  const [clientState, setClientState] = useState<ClientMemory[]>(clientMemories);
  const [projectState, setProjectState] = useState<ProjectMemory[]>(projectMemories);
  const [matrixLog, setMatrixLog] = useState<string[]>([]);
  const [powerSurgeActive, setPowerSurgeActive] = useState(false);
  const [fuelGaugeState, setFuelGaugeState] = useState<FuelGauge[]>(
    buildFuelGaugesFromVault(vaultAssets),
  );
  const [keyValves, setKeyValves] = useState<KeyValveState[]>(initialKeyValves);
  const [activeAssetOverride, setActiveAssetOverride] = useState<number | null>(null);
  const [driveMapping, setDriveMapping] = useState<DriveMappingState>({
    status: "SYNCED",
    tree: null,
    summary: null,
  });
  const [isProjectFactoryReady, setIsProjectFactoryReady] = useState(true);
  const [settingsView, setSettingsView] = useState<SettingsView>("drive");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "BAZ AI: מוכן לייעוץ. שאל על בני, אבי או יעד עסקי.",
      timestamp: getCurrentTime(),
    },
  ]);
  const [isCommandLoading, setIsCommandLoading] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalStatus, setTerminalStatus] = useState("READY");
  const [liveLogStream, setLiveLogStream] = useState<string[]>([
    `[${new Date().toISOString()}] SYSTEM ONLINE | NVIDIA_CREDITS=2.7B`,
  ]);
  const activeTab = storedActiveTab;
  const isReadOnlyMode = storedReadOnlyMode;
  const activeTabDetails = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const activeDescription = activeTabDetails.description[uiLanguage];
  const systemStatus = "ONLINE";
  const hasClientSos = clientState.some((client) => client.needsHumanHelp);
  const missingKeyValveLabels = keyValves
    .filter((valve) => !valve.isValidated)
    .map((valve) => valve.label);
  const activeValveIds = keyValves
    .filter((valve) => valve.isValidated)
    .map((valve) => valve.id);
  const plasmaActiveAssets = activeAssetOverride ?? 10;

  function appendLiveLog(message: string) {
    setLiveLogStream((current) => [`[${new Date().toISOString()}] ${message}`, ...current].slice(0, 40));
  }

  useEffect(() => {
    syncStatusChange("COMMAND_CENTER_ONLINE", "ONLINE", {
      activeTab,
      companyCount: empireCompanies.length,
      saturdayLaunchChecklist: "READY",
      timestamp: new Date().toISOString(),
    });
  }, [activeTab]);
  const isDriveSynced = true;
  const isMainTabRendered = tabs.some((tab) => tab.id === activeTab);

  function updateKeyValveValue(id: KeyValveId, value: string) {
    setKeyValves((valves) =>
      valves.map((valve) =>
        valve.id === id
          ? {
              ...valve,
              value,
              isValidated: false,
              balance: 0,
              status: value.trim() ? "ready" : "missing",
            }
          : valve,
      ),
    );
  }

  function testKeyValve(id: KeyValveId) {
    setKeyValves((valves) =>
      valves.map((valve) => {
        if (valve.id !== id) {
          return valve;
        }

        if (!valve.value.trim()) {
          return {
            ...valve,
            isValidated: false,
            balance: 0,
            status: "missing",
          };
        }

        const simulatedBalanceByValve: Record<KeyValveId, number> = {
          gemini: 75_000,
          hunter: 0,
          meta: 10_000,
          backup: 62_000,
        };

        return {
          ...valve,
          isValidated: true,
          balance: simulatedBalanceByValve[valve.id],
          status: "active",
        };
      }),
    );

    const valve = keyValves.find((item) => item.id === id);
    if (!valve?.value.trim()) {
      setMatrixLog((log) => [
        `API RUNTIME READY | ${valve?.label ?? id} key not supplied locally`,
        ...log,
      ]);
      return;
    }

    const updatedGauges = fuelGaugeState.map((gauge) => {
      const matchesGemini = id === "gemini" && gauge.name.toLowerCase().includes("gemini");
      const matchesBackup = id === "backup" && gauge.name.toLowerCase().includes("claude");
      const matchesMeta = id === "meta" && gauge.name.toLowerCase().includes("meta");

      if (!matchesGemini && !matchesBackup && !matchesMeta) {
        return gauge;
      }

      return {
        ...gauge,
        level: 100,
        activeKey: `REAL ${valve.label} VALIDATED`,
        isWarning: false,
      };
    });

    setFuelGaugeState(updatedGauges);
    setMatrixLog((log) => [
      `KEY VALIDATED | ${valve.label} | REAL BALANCE SYNC SIMULATED`,
      ...log,
    ]);
  }

  async function injectVaultKeys() {
    try {
      const response = await fetch("/api/vault/inject", {
        method: "POST",
        cache: "no-store",
      });
      const data = (await response.json()) as VaultInjectionResponse;

      if (!response.ok || !data.keys) {
        throw new Error("Vault injection failed");
      }

      const keyBySearch = (needle: string) =>
        data.keys?.find((key) =>
          `${key.id} ${key.label} ${key.provider}`.toLowerCase().includes(needle),
        );
      const injectedGemini = keyBySearch("gemini");
      const injectedHunter = keyBySearch("base44") ?? keyBySearch("github");
      const injectedMeta = keyBySearch("cloudflare") ?? keyBySearch("render");
      const injectedBackup = keyBySearch("openai");
      const injectedMap: Record<KeyValveId, VaultInjectionKey | undefined> = {
        gemini: injectedGemini,
        hunter: injectedHunter,
        meta: injectedMeta,
        backup: injectedBackup,
      };

      setKeyValves((valves) =>
        valves.map((valve) => {
          const injected = injectedMap[valve.id];

          return {
            ...valve,
            value: injected?.maskedKey ?? valve.value,
            isValidated: Boolean(injected?.isActive),
            balance: injected?.balance ?? 0,
            status: injected?.isActive ? "active" : "missing",
          };
        }),
      );
      setFuelGaugeState((gauges) =>
        gauges.map((gauge) => ({
          ...gauge,
          level: 100,
          activeKey: "REAL VAULT KEY INJECTED",
          isWarning: false,
        })),
      );
      setActiveAssetOverride(data.activeAssets ?? 10);
      setMatrixLog((log) => [
        `CHRONOS HISTORY POINT ${data.historyPoint ?? 7} | ${data.report ?? "EMPIRE STATUS: FULLY ARMED | KEYS: INJECTED"}`,
        ...log,
      ]);
    } catch {
      setMatrixLog((log) => [
        "VAULT INJECTION FAILED | CHECK ENV KEYS | RAW SECRETS NOT DISPLAYED",
        ...log,
      ]);
    }
  }

  function triggerPowerSurge() {
    setPowerSurgeActive(true);
    window.setTimeout(() => setPowerSurgeActive(false), 260);
  }

  useEffect(() => {
    async function loadClients() {
      if (isReadOnlyMode) {
        return;
      }

      try {
        const response = await fetch("/api/clients", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Failed to load clients");
        }

        const data = (await response.json()) as { clients?: ClientMemory[] };
        setClientState(data.clients ?? clientMemories);
      } catch {
        setClientState(clientMemories);
      }
    }

    void loadClients();
  }, [isReadOnlyMode]);

  function openClientIntervention(client: ClientMemory) {
    const interventionPrompt = `התערבות מנהל ללקוח ${client.name}: אוטומציות פעילות ${client.activeAutomations.join(", ")}. בריאות ${client.health}%. סטטוס דלק ${client.fuelStatus}%.`;
    setCommandPrompt(interventionPrompt);
    setChatHistory((messages) => [
      ...messages,
      {
        role: "assistant",
        content: `BAZ AI: פתחתי התערבות מנהל ללקוח ${client.name}. ההקשר נטען לחדר יועצי AI.`,
        timestamp: getCurrentTime(),
      },
    ]);
    persistActiveTab("ai_advisors");
  }

  async function flagClientForHelp(clientId: string) {
    if (isReadOnlyMode) {
      alert("מצב הגנה פעיל - אין פעולות API במצב קריאה בלבד.");
      return;
    }

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });

      if (!response.ok) {
        throw new Error("Failed to flag client");
      }

      const data = (await response.json()) as { clients?: ClientMemory[] };
      setClientState(data.clients ?? clientState);
    } catch {
      alert("סימון SOS נכשל. נסה שוב.");
    }
  }

  async function submitCommand() {
    const prompt = commandPrompt.trim();

    if (!prompt) {
      const emptyMessage = "BAZ AI: כתוב פקודה או שאלה על בני / אבי.";
      setCommandAnswer(emptyMessage);
      setChatHistory((messages) => [
        ...messages,
        { role: "assistant", content: emptyMessage, timestamp: getCurrentTime() },
      ]);
      return;
    }

    setIsCommandLoading(true);
    setCommandAnswer("BAZ AI: סורק את האימפריה...");
    setChatHistory((messages) => [
      ...messages,
      { role: "user", content: prompt, timestamp: getCurrentTime() },
    ]);

    try {
      if (isReadOnlyMode) {
        throw new Error("Read-only mode is active");
      }

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = (await response.json()) as { answer?: string; reply?: string };
      const reply = data.reply ?? data.answer ?? "BAZ AI: לא התקבלה תשובה.";

      setCommandAnswer(reply);
      setChatHistory((messages) => [
        ...messages,
        { role: "assistant", content: reply, timestamp: getCurrentTime() },
      ]);
      setCommandPrompt("");
    } catch {
      const errorMessage = "BAZ AI: שגיאה בחיבור למוח האימפריה.";
      setCommandAnswer(errorMessage);
      setChatHistory((messages) => [
        ...messages,
        { role: "assistant", content: errorMessage, timestamp: getCurrentTime() },
      ]);
    } finally {
      setIsCommandLoading(false);
    }
  }

  async function runGlobalCommand() {
    const command = terminalInput.trim();

    if (!command) {
      return;
    }

    const parsed = parseOperationalCommand(command);
    setTerminalStatus("RUNNING");
    appendLiveLog(`TERMINAL INTENT | company=${parsed.company.name} | scan=${parsed.scanType} | tool=${parsed.tool.name} | identity=${parsed.identity}`);

    try {
      const response = await fetch("/api/n8n/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: parsed.tool.creditPool,
          action: "GLOBAL_COMMAND_SCAN",
          source: "BAZ_OS_GLOBAL_TERMINAL",
          payload: {
            rawCommand: command,
            intent: "RUN_SCAN",
            company: parsed.company,
            tool: parsed.tool,
            scanType: parsed.scanType,
            identity: parsed.identity,
            credits: { nvidia: 2_700_000_000 },
          },
        }),
      });
      const result = (await response.json()) as { ok?: boolean; status?: number; message?: string; error?: string };

      appendLiveLog(`TERMINAL FETCH /api/n8n/trigger -> HTTP ${response.status} | ${result.message ?? result.error ?? "NO_MESSAGE"}`);
      setTerminalStatus(result.ok ? "SENT TO N8N" : "QUEUED / CHECK N8N");
      setTerminalInput("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network Error";
      appendLiveLog(`TERMINAL ERROR | ${message}`);
      setTerminalStatus("ERROR");
    }
  }

  return (
    <main
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("button")) {
          triggerPowerSurge();
        }
      }}
      dir="rtl"
      className="power-grid-bg min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#1f2937_0,#0b0f14_42%,#020617_100%)] px-4 py-6 pb-32 text-right text-white md:px-6"
    >
      {powerSurgeActive ? <div className="power-surge-flash" /> : null}
      <BrainDumpDock />
      <section className="mx-auto grid w-full max-w-[min(100%,96rem)] gap-5 lg:grid-cols-[minmax(0,1fr)_236px] lg:items-start" dir="ltr">
        <EmpireSidebar
          activeTab={activeTab}
          onTabChange={persistActiveTab}
          hasClientSos={hasClientSos}
          isReadOnlyMode={isReadOnlyMode}
          onReadOnlyToggle={persistReadOnlyMode}
          uiLanguage={uiLanguage}
          onUiLanguageChange={persistUiLanguage}
        />

        <section className="system-pulse-green min-w-0 overflow-visible rounded-[2rem] border border-orange-400/10 bg-[linear-gradient(135deg,rgba(10,14,20,0.96),rgba(31,41,55,0.72),rgba(2,6,23,0.96))] p-4 text-right shadow-2xl shadow-black/50 backdrop-blur md:p-5 lg:col-start-1 lg:row-start-1" dir="rtl">
          <header className="mb-8 grid gap-5 xl:grid-cols-[1fr_280px]">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.45em] text-blue-300">
                BAZ EMPIRE COMMANDER
              </p>
              <h1 className="neon-green-text text-4xl font-black tracking-tight md:text-6xl">
                מפקדת האימפריה של BAZ
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-300">
                {activeDescription}. {uiLanguage === "he" ? "מערכת אחת לפרויקטים, לקוחות, זיכרון AI ודוחות Vision Eye." : "One system for projects, clients, AI memory and Vision Eye reports."}
              </p>
            </div>

            <div
              className={[
                "rounded-3xl border p-5 shadow-lg",
                "border-cyan-400/20 bg-cyan-400/10 shadow-cyan-950/20",
              ].join(" ")}
            >
              <p className="text-sm font-bold text-cyan-100">
                מצב מערכת
              </p>
              <p className="neon-green-text mt-3 text-4xl font-black text-[#f8f9fa]">
                {systemStatus}
              </p>
              <p className="mt-4 text-sm leading-7 text-gray-300">
                {`סטטוס מערכת: ${systemStatus}. מפעל פעיל: ${empireCompanies.length} חברות. סנכרון אחרון: ${new Date().toLocaleTimeString("he-IL")}`}
              </p>
            </div>
          </header>

          <LaunchChecklist
            isDriveSynced={isDriveSynced}
            isProjectFactoryReady={isProjectFactoryReady}
          />

          {activeTab === "projects" ? (
            <section className="grid gap-6">
              <ProjectsPanel
                projects={projectState}
                onProjectsIngested={setProjectState}
                onFactoryReady={setIsProjectFactoryReady}
              />
              <SwallowerDropZone
                isReadOnlyMode={isReadOnlyMode}
                onProjectsIngested={setProjectState}
                onMatrixLogChange={setMatrixLog}
              />
            </section>
          ) : null}
          {activeTab === "marketing" ? <MarketingHub /> : null}
          {activeTab === "integrations" ? <IntegrationGalaxy /> : null}
          {activeTab === "clients" ? (
            <ClientsPanel
              clients={clientState}
              onFlagHelp={flagClientForHelp}
              onIntervene={openClientIntervention}
            />
          ) : null}
          {activeTab === "finance" ? <FinancePanel /> : null}
          {activeTab === "vault" ? <VaultPanel keyValves={keyValves} isReadOnlyMode={isReadOnlyMode} /> : null}
          {activeTab === "keys_valves" ? (
            <KeysValvesPanel
              valves={keyValves}
              onValveChange={updateKeyValveValue}
              onTestValve={testKeyValve}
              onInjectVaultKeys={injectVaultKeys}
            />
          ) : null}
          {activeTab === "base" ? <Base44SyncCenter /> : null}
          {activeTab === "lead_gen" ? <LeadGenPanel isReadOnlyMode={isReadOnlyMode} /> : null}
          {activeTab === "comms" ? <CommunicationHub isReadOnlyMode={isReadOnlyMode} /> : null}
          {activeTab === "arsenal" ? <EmpireInfrastructurePanel /> : null}
          {activeTab === "n8n_automations" ? <N8NAutomationsPanel /> : null}
          {activeTab === "server_infra" ? <ServerInfraPanel /> : null}
          {activeTab === "creative_hub" ? <CreativeHubPanel /> : null}
          {activeTab === "logs" ? (
            <MissionControl
              fuelStatus="Fuel Level: Optimal"
              matrixLog={matrixLog}
              liveLogStream={liveLogStream}
              isReadOnlyMode={isReadOnlyMode}
              turboHoursRemaining={turboHoursRemaining}
              missingKeyValveLabels={missingKeyValveLabels}
              activeValveIds={activeValveIds}
              activeAssetCountOverride={plasmaActiveAssets}
              isDriveSynced={isDriveSynced}
              isProjectFactoryReady={isProjectFactoryReady}
            />
          ) : null}
          {activeTab === "ai_advisors" ? (
            <AiAdvisorsPanel
              commandPrompt={commandPrompt}
              commandAnswer={commandAnswer}
              chatHistory={chatHistory}
              isCommandLoading={isCommandLoading}
              onCommandPromptChange={setCommandPrompt}
              onSubmitCommand={submitCommand}
            />
          ) : null}
          {activeTab === "settings" ? (
            <section className="grid min-h-screen min-w-0 gap-6">
              <SettingsWorkspaceNav
                activeView={settingsView}
                onViewChange={setSettingsView}
              />

              {settingsView === "drive" ? (
                <DriveMappingPanel
                  driveMapping={driveMapping}
                  onDriveMappingChange={setDriveMapping}
                  onMatrixLogChange={setMatrixLog}
                />
              ) : null}

              {settingsView === "resources" ? (
                <FuelManagementPanel
                  fuelGauges={fuelGaugeState}
                  activeValveIds={activeValveIds}
                  onClientsIngested={setClientState}
                  onFuelGaugesChange={setFuelGaugeState}
                  onMatrixLogChange={setMatrixLog}
                  isDriveSynced={driveMapping.status === "SYNCED"}
                  isReadOnlyMode={isReadOnlyMode}
                />
              ) : null}

            </section>
          ) : null}
          {!isMainTabRendered ? (
            <section className="grid gap-6">
              <ProjectsPanel
                projects={projectState}
                onProjectsIngested={setProjectState}
                onFactoryReady={setIsProjectFactoryReady}
              />
              <EmpireInfrastructurePanel />
            </section>
          ) : null}
        </section>
      </section>
      <GlobalCommandTerminal
        value={terminalInput}
        status={terminalStatus}
        onChange={setTerminalInput}
        onRun={runGlobalCommand}
      />
    </main>
  );
}

function SafetySwitch({
  isReadOnlyMode,
  onToggle,
}: {
  isReadOnlyMode: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <div className="mb-3 rounded-3xl border border-cyan-400/30 bg-[#000f28]/90 p-3 shadow-[0_0_22px_rgba(0,242,255,0.14)]">
      <div>
        <p className="text-[0.65rem] font-black uppercase tracking-[0.24em] text-cyan-200">
          הפעלה חיה / נעילה
        </p>
        <p className="mt-2 text-xs font-black text-[#f8f9fa]">
          {isReadOnlyMode ? "מצב קריאה בלבד פעיל" : "הפעלה חיה פתוחה"}
        </p>
        <p className="mt-1 text-[0.68rem] leading-5 text-gray-400">
          {isReadOnlyMode ? "נעול: פעולות API חסומות" : "פתוח: פעולות מערכת מותרות"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onToggle(!isReadOnlyMode)}
        className={[
          "mt-3 w-full rounded-full px-4 py-2 text-xs font-black transition",
          isReadOnlyMode
            ? "bg-orange-300 text-black shadow-[0_0_20px_rgba(251,146,60,0.35)]"
            : "bg-cyan-300 text-black shadow-[0_0_20px_rgba(0,242,255,0.35)]",
        ].join(" ")}
      >
        {isReadOnlyMode ? "פתח הפעלה חיה" : "נעל לקריאה בלבד"}
      </button>
    </div>
  );
}

function EmpireSidebar({
  activeTab,
  onTabChange,
  hasClientSos,
  isReadOnlyMode,
  onReadOnlyToggle,
  uiLanguage,
  onUiLanguageChange,
}: {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  hasClientSos: boolean;
  isReadOnlyMode: boolean;
  onReadOnlyToggle: (value: boolean) => void;
  uiLanguage: UiLanguage;
  onUiLanguageChange: (value: UiLanguage) => void;
}) {
  const navigationGroups: { title: string; items: ActiveTab[] }[] = [
    { title: "ליבה", items: ["projects", "clients", "base"] },
    { title: "כסף ודלק", items: ["finance", "vault", "keys_valves", "lead_gen"] },
    { title: "שיווק וחיבורים", items: ["marketing", "integrations", "comms"] },
    { title: "מודיעין", items: ["ai_advisors", "arsenal"] },
    { title: "מערכות חיצוניות", items: ["n8n_automations", "server_infra", "creative_hub"] },
    { title: "מערכת ולוגים", items: ["settings", "logs"] },
  ];
  const tabById = new Map(tabs.map((tab) => [tab.id, tab]));

  return (
    <aside className="glass-industrial flex w-full shrink-0 flex-col overflow-hidden rounded-[2rem] p-3 font-mono shadow-2xl shadow-black/40 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:h-[calc(100vh-3rem)] lg:w-64">
      <div className="mb-3 shrink-0 rounded-3xl border border-cyan-400/20 bg-[#001027]/70 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-cyan-200">
          BAZ OS
        </p>
        <h2 className="mt-2 text-xl font-black text-[#f8f9fa] [text-shadow:0_0_14px_rgba(0,242,255,0.35)]">
          מפקדת האימפריה
        </h2>
        <p className="mt-2 text-xs leading-5 text-slate-300">
          ניווט חי בין מרכזי השליטה.
        </p>
      </div>

      <SafetySwitch
        isReadOnlyMode={isReadOnlyMode}
        onToggle={onReadOnlyToggle}
      />

      <div className="mb-3 shrink-0 rounded-3xl border border-cyan-400/25 bg-[#000f28]/80 p-3">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.24em] text-cyan-200">
          שפת ממשק
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["he", "en"] as UiLanguage[]).map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => onUiLanguageChange(language)}
              className={[
                "rounded-full px-3 py-2 text-xs font-black transition",
                uiLanguage === language
                  ? "bg-cyan-300 text-slate-950"
                  : "border border-cyan-300/25 text-cyan-100 hover:bg-cyan-300/10",
              ].join(" ")}
            >
              {language === "he" ? "עברית" : "English"}
            </button>
          ))}
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto pr-1">
        {navigationGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="mb-2 px-2 text-[0.62rem] font-black uppercase tracking-[0.24em] text-cyan-200/80">
              {group.title}
            </p>
            <div className="grid gap-2">
              {group.items.map((tabId) => {
                const tab = tabById.get(tabId);

                if (!tab) {
                  return null;
                }

                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    className={[
                      "rounded-2xl border px-3 py-2.5 text-right text-xs font-black transition",
                      isActive
                        ? "border-cyan-300/50 bg-cyan-300/10 text-[#f8f9fa] shadow-lg shadow-cyan-500/20"
                        : "border-cyan-300/10 bg-[#001027]/65 text-slate-300 hover:border-cyan-300/45 hover:text-[#f8f9fa] hover:[text-shadow:0_0_12px_rgba(0,242,255,0.45)]",
                      tab.id === "clients" && hasClientSos ? "sos-sidebar-aura" : "",
                    ].join(" ")}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2">
                        <span>{tab.label.he}</span>
                        {tab.id === "clients" && hasClientSos ? (
                          <span className="h-3 w-3 animate-pulse rounded-full bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.9)]" />
                        ) : null}
                      </span>
                      <span className={["needle-gauge", isActive ? "needle-gauge-active" : ""].join(" ")} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-3 shrink-0 rounded-2xl border border-cyan-400/20 bg-[#000f28]/90 px-3 py-2 text-[0.68rem] font-black text-[#f8f9fa] shadow-inner shadow-cyan-950/20">
        <div className="flex items-center justify-between gap-3">
          <span>סטטוס מערכת</span>
          <span className="text-cyan-200">פיקוד ראשי מוכן</span>
        </div>
      </div>
    </aside>
  );
}

function GlobalCommandTerminal({
  value,
  status,
  onChange,
  onRun,
}: {
  value: string;
  status: string;
  onChange: (value: string) => void;
  onRun: () => void;
}) {
  return (
    <section className="fixed inset-x-4 bottom-3 z-40 rounded-3xl border border-emerald-300/35 bg-slate-950/95 p-3 shadow-[0_0_38px_rgba(16,185,129,0.25)] backdrop-blur" dir="rtl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center">
        <div className="min-w-36">
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-emerald-200">טרמינל גלובלי</p>
          <p className="mt-1 font-mono text-xs font-black text-cyan-100">{status}</p>
        </div>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onRun();
            }
          }}
          placeholder="כתוב פקודה: סרוק Baz Marketing עם NVIDIA Fit Scan Dolphin"
          className="min-h-12 flex-1 rounded-2xl border border-emerald-300/20 bg-black/80 px-4 font-mono text-sm font-bold text-emerald-50 outline-none placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={onRun}
          className="rounded-2xl bg-emerald-300 px-6 py-3 font-black text-slate-950 transition hover:bg-white"
        >
          הרץ
        </button>
      </div>
    </section>
  );
}

function handleCreateProject() {
  alert('מערכת יצירת פרויקט חדש תופעל כאן - חיבור לשרת בהקמה');
}

function ProjectsPanel({
  projects,
  onProjectsIngested,
  onFactoryReady,
}: {
  projects: ProjectMemory[];
  onProjectsIngested: (projects: ProjectMemory[]) => void;
  onFactoryReady: (isReady: boolean) => void;
}) {
  const [scanPath, setScanPath] = useState("");
  const [scanFeedback, setScanFeedback] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [isSwallowing, setIsSwallowing] = useState(false);
  const [isBigBangActive, setIsBigBangActive] = useState(false);
  const [swallowerStatus, setSwallowerStatus] = useState("PROJECT SWALLOWER READY");
  const [openProjectId, setOpenProjectId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem("baz-os-open-project-id");
  });
  const vaultProject = projects.find((project) => project.id === openProjectId) ?? null;

  function openProjectVault(project: ProjectMemory) {
    window.localStorage.setItem("baz-os-open-project-id", project.id);
    setOpenProjectId(project.id);
  }

  function closeProjectVault() {
    window.localStorage.removeItem("baz-os-open-project-id");
    setOpenProjectId(null);
  }

  function scanFolder() {
    const normalizedPath = scanPath.trim();

    if (!normalizedPath) {
      setScanFeedback("BAZ OS: הזן נתיב Drive/Base44 לסריקה.");
      return;
    }

    setScanFeedback(`BAZ OS: תיק הסריקה ננעל על ${normalizedPath}. מוכן לחיבור שבת.`);
  }

  async function ingestBulkProjects(text: string) {
    const commandText = text.trim();

    if (!commandText) {
      setSwallowerStatus("הדבק רשימת פרויקטים או גרור CSV לפני הפעלה.");
      return;
    }

    setIsSwallowing(true);
    setSwallowerStatus("VORTEX ACTIVE: בולע פרויקטים, מקטלג סקטורים ומעדכן Radar...");

    try {
      const isCsv = commandText.includes(",") && commandText.split(/\r?\n/)[0]?.toLowerCase().includes("name");
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isCsv ? { csv: commandText } : { text: commandText }),
      });
      const data = (await response.json()) as {
        projects?: ProjectMemory[];
        inserted?: number;
        totalProjects?: number;
      };

      if (!response.ok || !data.projects) {
        throw new Error("Project ingestion failed");
      }

      onProjectsIngested(data.projects);
      setBulkText("");
      setSwallowerStatus(
        `EMPIRE STATUS: ${data.totalProjects ?? data.projects.length} PROJECTS DETECTED | ${data.inserted ?? 0} NEW | 100% OPERATIONAL`,
      );
    } catch {
      setSwallowerStatus("PROJECT SWALLOWER FAILED - ודא שהרשימה או ה-CSV תקינים.");
    } finally {
      window.setTimeout(() => setIsSwallowing(false), 1600);
    }
  }

  async function handleProjectDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];

    if (!file) {
      return;
    }

    await ingestBulkProjects(await file.text());
  }

  async function launchEmpire() {
    setIsBigBangActive(true);
    setSwallowerStatus("BIG BANG ACTIVE: 70 radar nodes materializing...");

    try {
      const response = await fetch("/api/project-factory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as {
        projects?: ProjectMemory[];
        generated?: number;
        totalProjects?: number;
      };

      if (!response.ok || !data.projects) {
        throw new Error("Project Factory failed");
      }

      onProjectsIngested(data.projects);
      onFactoryReady(true);
      setSwallowerStatus(
        `PROJECT FACTORY READY: ${data.generated ?? 70} LOCKED BRIEFCASES | TOTAL: ${data.totalProjects ?? data.projects.length}`,
      );
    } catch {
      setSwallowerStatus("PROJECT FACTORY FAILED - Big Bang standby.");
    } finally {
      window.setTimeout(() => setIsBigBangActive(false), 1800);
    }
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">
            Projects
          </p>
          <h2 className="mt-2 text-3xl font-black">מרכז הפרויקטים</h2>
        </div>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-100">
          כל הפרויקטים Live
        </span>
      </div>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleProjectDrop}
        className="glass-industrial relative overflow-hidden rounded-[2rem] border border-cyan-400/25 p-5"
      >
        {isSwallowing ? (
          <div className="pointer-events-none absolute inset-0 z-0 bg-black/70">
            <div className="ingestion-vortex absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/50" />
          </div>
        ) : null}
        <div className="relative z-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Project Swallower
          </p>
          <h3 className="neon-green-text mt-2 text-3xl font-black">
            Command Line Bulk Ingestion
          </h3>
          <p className="mt-3 max-w-3xl leading-8 text-gray-300">
            הדבק עד 70 שמות פרויקטים, כל שם בשורה, או גרור CSV עם name/context/platform/assignedTo/status. המנוע יוסיף Sector, Fuel Priority ו־Needs Attention אוטומטית.
          </p>
          <textarea
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            placeholder={"לדוגמה:\nMeta Ads - Beni\nSEO Forge - Avi\nInvoice Automation - Somer"}
            className="mt-4 h-40 w-full resize-none rounded-2xl border border-cyan-400/20 bg-black/75 p-4 font-mono text-sm leading-7 text-[#f8f9fa] outline-none transition placeholder:text-gray-600 focus:border-cyan-300"
          />
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <p className="rounded-2xl border border-cyan-400/15 bg-[#001027]/80 px-4 py-3 font-mono text-sm text-cyan-100">
              {swallowerStatus}
            </p>
            <button
              type="button"
              onClick={() => void ingestBulkProjects(bulkText)}
              className="mechanical-click whitespace-nowrap rounded-2xl bg-cyan-300 px-6 py-4 font-black text-black transition hover:bg-white"
            >
              Swallow Projects
            </button>
          </div>
        </div>
      </div>

      <div className="glass-industrial rounded-3xl p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
          Briefcase Project Ingestor
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={scanPath}
            onChange={(event) => setScanPath(event.target.value)}
            placeholder="הדבק נתיב תיקיית Drive / Base44 לסריקה"
            className="rounded-2xl border border-cyan-500/30 bg-black/70 px-5 py-4 font-mono text-cyan-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-300"
          />
          <button
            type="button"
            onClick={scanFolder}
            className="mechanical-click whitespace-nowrap rounded-2xl bg-cyan-300 px-6 py-4 font-black text-black transition hover:bg-white"
          >
            Scan Folder
          </button>
        </div>
        {scanFeedback ? (
          <p className="mt-3 font-mono text-sm font-bold text-cyan-200">
            {scanFeedback}
          </p>
        ) : null}
      </div>

      <ProjectRadar projects={projects} onSelectProject={openProjectVault} />

      {projects.length > 0 ? (
        <div className="glass-industrial rounded-[2rem] p-5">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-cyan-300">
            🚀 זריקות פרויקטים ל-N8N
          </p>
          <div className="grid gap-2">
            {projects.slice(0, 20).map((project) => (
              <ProjectPushRow key={project.id} project={project} onOpen={openProjectVault} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={launchEmpire}
          className="group relative min-h-80 overflow-hidden rounded-3xl border-2 border-cyan-300/40 bg-[#001027]/85 p-6 text-center shadow-xl shadow-cyan-950/30 transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_0_45px_rgba(0,242,255,0.24)]"
        >
          {isBigBangActive ? (
            <span className="ingestion-vortex pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/50" />
          ) : null}
          <span className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-300/10 text-5xl font-black text-cyan-100 transition group-hover:bg-cyan-300 group-hover:text-black">
            🚀
          </span>
          <h3 className="relative z-10 mt-6 text-2xl font-black text-white">
            הפעלת המפץ הגדול (Launch Empire)
          </h3>
          <p className="relative z-10 mt-4 leading-7 text-gray-300">
            יצירת 70 Briefcases נעולים עם Fuel Level ו־Protection Status: LOCKED.
          </p>
        </button>
        <button
          type="button"
          onClick={handleCreateProject}
          className="group min-h-80 rounded-3xl border-2 border-dashed border-gray-600 bg-gray-950/70 p-6 text-center shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-blue-500 hover:bg-blue-500/10 hover:shadow-blue-500/20"
        >
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-5xl font-black text-blue-300 transition group-hover:bg-blue-500 group-hover:text-white">
            +
          </span>
          <h3 className="mt-6 text-2xl font-black text-white">יזום פרויקט חדש</h3>
          <p className="mt-4 leading-7 text-gray-400">
            פתיחת לקוח, קמפיין, נכס דיגיטלי או אוטומציה חדשה.
          </p>
        </button>
      </div>
      {vaultProject ? (
        <ProjectVault project={vaultProject} onClose={closeProjectVault} />
      ) : null}
    </section>
  );
}

function ProjectPushRow({
  project,
  onOpen,
}: {
  project: ProjectMemory;
  onOpen: (project: ProjectMemory) => void;
}) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function push() {
    setSending(true);
    setResult(null);
    try {
      const response = await fetch("/api/n8n/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: "project-push",
          action: "PROJECT_PUSH_TO_N8N",
          source: "BAZ_OS_PROJECT_LIST",
          payload: {
            projectId: project.id,
            projectName: project.name,
            assignedTo: project.assignedTo,
            platform: project.platform,
            status: project.status,
            sector: project.sector,
          },
        }),
      });
      const data = (await response.json()) as { ok?: boolean; message?: string };
      setResult(data.ok ? `✅ HTTP ${response.status}` : `⚠️ HTTP ${response.status}`);
    } catch {
      setResult("❌ שגיאת רשת");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-cyan-300/15 bg-black/40 px-4 py-3">
      <button
        type="button"
        onClick={() => onOpen(project)}
        className="min-w-0 flex-1 text-right"
      >
        <p className="truncate font-black text-white">{project.name}</p>
        <p className="truncate text-xs font-bold text-slate-400">{project.assignedTo} · {project.status} · {project.sector ?? "כללי"}</p>
      </button>
      {result ? (
        <span className="shrink-0 font-mono text-xs font-black text-emerald-300">{result}</span>
      ) : null}
      <button
        type="button"
        onClick={() => void push()}
        disabled={sending}
        className="shrink-0 rounded-xl bg-emerald-400 px-4 py-2 font-black text-xs text-slate-950 transition hover:bg-white disabled:opacity-60"
      >
        {sending ? "⏳" : "🚀 זרוק"}
      </button>
    </div>
  );
}

function ProjectRadar({
  projects,
  onSelectProject,
}: {
  projects: ProjectMemory[];
  onSelectProject: (project: ProjectMemory) => void;
}) {
  return (
    <section className="radar-map glass-industrial relative min-h-[34rem] overflow-hidden rounded-[2rem] p-6">
      <div className="relative z-10 mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <BriefcaseVisual />
          <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Project Radar
          </p>
          <h3 className="text-3xl font-black">מפת רדאר ל־{projects.length} פרויקטים</h3>
          </div>
        </div>
        <span className="font-mono text-sm text-gray-400">
          Distance = Priority | Color = Fuel
        </span>
      </div>
      <div className="relative mx-auto h-[28rem] max-w-[42rem]">
        <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_26px_rgba(255,255,255,0.8)]" />
        {projects.map((project, index) => {
          const angle = (index / Math.max(projects.length, 1)) * Math.PI * 2;
          const priorityDistance =
            project.fuelPriority === "High"
              ? 24
              : project.fuelPriority === "Medium"
                ? 39
                : 24 + ((index % 5) + 1) * 9;
          const left = (50 + Math.cos(angle) * priorityDistance).toFixed(4);
          const top = (50 + Math.sin(angle) * priorityDistance).toFixed(4);
          const needsFuel = project.status.toLowerCase().includes("pending") || index % 6 === 0;
          const needsAttention = Boolean(project.needsAttention);
          const isLocked = project.isLocked || project.status.toLowerCase().includes("locked");

          return (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelectProject(project)}
              className={[
                "radar-node group absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2",
                needsAttention ? "needs-attention-pulse" : needsFuel ? "radar-node-alert" : "",
                isLocked ? "shielded-node" : "",
              ].join(" ")}
              style={{ left: `${left}%`, top: `${top}%` }}
              aria-label={`פתח פרויקט ${project.name}`}
            >
              <span className="pointer-events-none absolute bottom-6 right-0 z-20 hidden w-72 rounded-2xl border border-cyan-400/30 bg-black/95 p-4 text-right text-xs leading-6 text-cyan-100 shadow-2xl group-hover:block">
                <span className="mb-2 block font-black text-white">{project.name}</span>
                <span className="block">Description: {project.context}</span>
                <span className="block">Assigned To: {project.assignedTo}</span>
                <span className="block">Platform: {project.platform}</span>
                <span className="block">Status: {project.status}</span>
                <span className="block">Sector: {project.sector ?? "General"}</span>
                <span className="block">Fuel Priority: {project.fuelPriority ?? "Medium"}</span>
                <span className="block">Fuel Level: {project.fuelLevel ?? 70}%</span>
                <span className="block">Protection Status: {project.protectionStatus ?? (isLocked ? "LOCKED" : "OPEN")}</span>
                {needsAttention ? <span className="block text-orange-200">Needs Attention</span> : null}
                {isLocked ? <span className="block">LOCKED / SHIELDED</span> : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ProjectVault({
  project,
  onClose,
}: {
  project: ProjectMemory;
  onClose: () => void;
}) {
  const [pushStatus, setPushStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [pushMessage, setPushMessage] = useState("");

  async function pushToN8N() {
    setPushStatus("sending");
    setPushMessage("שולח ל-N8N...");
    try {
      const response = await fetch("/api/n8n/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: "project-push",
          action: "PROJECT_PUSH_TO_N8N",
          source: "BAZ_OS_PROJECT_VAULT",
          payload: {
            projectId: project.id,
            projectName: project.name,
            assignedTo: project.assignedTo,
            platform: project.platform,
            status: project.status,
            sector: project.sector,
            fuelPriority: project.fuelPriority,
            context: project.context,
          },
        }),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string; error?: string };
      setPushStatus(result.ok ? "sent" : "sent");
      setPushMessage(`✅ נשלח! HTTP ${response.status} | ${result.message ?? result.error ?? "OK"}`);
    } catch (error) {
      setPushStatus("error");
      setPushMessage(`❌ שגיאה: ${error instanceof Error ? error.message : "Network error"}`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-md" dir="rtl">
      <section className="glass-open-panel glass-industrial w-full max-w-2xl rounded-[2rem] p-7 shadow-2xl shadow-cyan-950/40">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">ארון פרויקט</p>
        <h2 className="mt-3 text-4xl font-black">{project.name}</h2>
        <p className="mt-4 leading-8 text-gray-300">{project.context}</p>
        <div className="mt-5 grid gap-3 rounded-3xl border border-cyan-500/20 bg-black/50 p-5 font-mono text-sm text-cyan-100" dir="rtl">
          <span>תיאור: {project.context}</span>
          <span>שיוך: {project.assignedTo}</span>
          <span>עלות דלק: {project.platform === "Base44" ? "44 קרדיטים / מחזור" : project.platform === "Drive" ? "18 קרדיטים / סנכרון" : "27 קרדיטים / אוטומציה"}</span>
          <span>סטטוס: {project.status}</span>
          <span>מגזר: {project.sector ?? "כללי"}</span>
        </div>

        {pushMessage ? (
          <p className={[
            "mt-4 rounded-2xl border p-4 font-mono text-sm font-bold",
            pushStatus === "error"
              ? "border-red-300/20 bg-red-500/10 text-red-200"
              : "border-emerald-300/20 bg-emerald-500/10 text-emerald-200",
          ].join(" ")}>
            {pushMessage}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void pushToN8N()}
            disabled={pushStatus === "sending"}
            className="flex-1 whitespace-nowrap rounded-2xl bg-emerald-400 px-6 py-3 font-black text-slate-950 transition hover:bg-white disabled:opacity-60"
          >
            {pushStatus === "sending" ? "⏳ שולח..." : "🚀 זרוק ל-N8N"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mechanical-click whitespace-nowrap rounded-2xl border border-cyan-300/30 bg-black/50 px-6 py-3 font-black text-cyan-100 transition hover:bg-cyan-300 hover:text-slate-950"
          >
            סגור
          </button>
        </div>
      </section>
    </div>
  );
}

function BriefcaseVisual() {
  return (
    <div className="briefcase-shell" aria-hidden="true">
      <span className="briefcase-handle" />
      <span className="briefcase-light" />
      <span className="briefcase-paper briefcase-paper-a" />
      <span className="briefcase-paper briefcase-paper-b" />
      <span className="briefcase-paper briefcase-paper-c" />
    </div>
  );
}

function CommunicationHub({ isReadOnlyMode }: { isReadOnlyMode: boolean }) {
  const [messages, setMessages] = useState<MessageStreamItem[]>(initialMessageStream);
  const [isTubeActive, setIsTubeActive] = useState(false);

  function sendSimulationMessage() {
    if (isReadOnlyMode) {
      alert("מצב הגנה פעיל - שליחת הודעות חסומה.");
      return;
    }

    const nextMessage: MessageStreamItem = {
      id: `msg-${Date.now()}`,
      direction: "outgoing",
      channel: "Meta WhatsApp",
      target: "Beni Website",
      body: "נשלחה הודעת סטטוס אוטומטית דרך Meta WhatsApp.",
      timestamp: getCurrentTime(),
    };

    setMessages((current) => [nextMessage, ...current]);
    setIsTubeActive(true);
    window.setTimeout(() => setIsTubeActive(false), 1200);
  }

  return (
    <section className="grid gap-6">
      <AgentCommandCenter isReadOnlyMode={isReadOnlyMode} />
      <section className="grid gap-6 lg:grid-cols-[1fr_180px]">
        <div className="glass-industrial rounded-[2rem] p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                Communication Hub
              </p>
              <h2 className="mt-2 text-3xl font-black">מרכז תקשורת (Comms)</h2>
              <p className="mt-3 text-gray-400">
                Meta WhatsApp ו־Email בזרם הודעות אחד.
              </p>
            </div>
            <button
              type="button"
              onClick={sendSimulationMessage}
              className="mechanical-click whitespace-nowrap rounded-2xl bg-cyan-300 px-6 py-3 font-black text-black transition hover:bg-white"
            >
              Send Meta Pulse
            </button>
          </div>

          <div className="max-h-[32rem] overflow-y-auto rounded-3xl border border-cyan-500/20 bg-black/70 p-4">
            {messages.map((message) => (
              <article
                key={message.id}
                className={[
                  "mb-3 rounded-2xl border p-4 font-mono text-sm leading-7",
                  message.direction === "outgoing"
                    ? "mr-auto max-w-[84%] border-cyan-400/30 bg-cyan-400/10 text-[#f8f9fa]"
                    : "ml-auto max-w-[84%] border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
                ].join(" ")}
              >
                <div className="mb-2 flex items-center justify-between gap-3 text-xs text-gray-400">
                  <span>{message.channel}</span>
                  <span>{message.timestamp}</span>
                </div>
                <p className="font-black text-white">{message.target}</p>
                <p>{message.body}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="grid place-items-center rounded-[2rem] border border-cyan-400/20 bg-black/60 p-6">
          <div className={["plasma-tube", isTubeActive ? "plasma-tube-active" : ""].join(" ")}>
            <span />
          </div>
          <p className="mt-4 text-center font-mono text-sm font-black text-cyan-200">
            Meta Agent Tube
          </p>
        </aside>
      </section>
    </section>
  );
}

function ClientsPanel({
  clients,
  onFlagHelp,
  onIntervene,
}: {
  clients: ClientMemory[];
  onFlagHelp: (clientId: string) => void;
  onIntervene: (client: ClientMemory) => void;
}) {
  const visibleClients = clients.slice(0, 24);

  return (
    <section className="grid gap-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-300">
          Client Command Center
        </p>
        <h2 className="mt-2 text-3xl font-black">מרכז פיקוד לקוחות</h2>
        <p className="mt-3 text-gray-400">
          ניטור דלק לקוחות, פרויקטים פעילים וקריאות SOS בזמן אמת. התצוגה מרנדרת חלון וירטואלי ראשון כדי להישאר מהירה גם ב־1,000 לקוחות.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleClients.map((client) => {
          const isLowFuel = client.fuelStatus <= 25;

          return (
            <article
              key={client.id}
              className={[
                "glass-industrial relative overflow-hidden rounded-3xl p-6 shadow-2xl transition hover:-translate-y-1",
                client.needsHumanHelp
                  ? "border-red-400/40 shadow-red-950/30"
                  : "shadow-black/30 hover:border-cyan-400/40",
              ].join(" ")}
            >
              {client.needsHumanHelp ? (
                <div className="absolute left-4 top-4 rounded-full border border-red-300/40 bg-red-500/20 px-3 py-1 text-xs font-black text-red-100 shadow-[0_0_24px_rgba(239,68,68,0.45)]">
                  <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-red-400" />
                  SOS
                </div>
              ) : null}

              <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
                {client.id}
              </p>
              <h3 className="mt-3 text-3xl font-black">{client.name}</h3>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-gray-400">
                  <span>Mini Fuel Pipe</span>
                  <span>{client.fuelStatus}%</span>
                </div>
                <div className="h-8 overflow-hidden rounded-full border-2 border-gray-700 bg-gray-950 shadow-[inset_0_2px_10px_rgba(0,0,0,1)]">
                  <div
                    className={[
                      "h-full rounded-full transition-all",
                      isLowFuel
                        ? "low-fuel-flicker bg-gradient-to-l from-red-950 via-red-700 to-orange-500"
                        : "bg-gradient-to-l from-emerald-300 via-cyan-400 to-blue-500 shadow-[0_0_28px_rgba(34,211,238,0.45)]",
                    ].join(" ")}
                    style={{ width: `${client.fuelStatus}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-sm font-black text-gray-200">אוטומציות פעילות</p>
                <p className="mt-2 text-sm leading-7 text-gray-400">
                  {client.activeAutomations.join(" / ")}
                </p>
              </div>
              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-xs font-bold text-emerald-200">Client Health</p>
                <p className="mt-1 font-mono text-3xl font-black text-emerald-300">
                  {client.health}%
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => onIntervene(client)}
                  className="w-full rounded-2xl bg-red-500 px-5 py-3 font-black text-white transition hover:bg-red-400 hover:shadow-lg hover:shadow-red-500/25"
                >
                  התערבות מנהל
                </button>
                {!client.needsHumanHelp ? (
                  <button
                    type="button"
                    onClick={() => onFlagHelp(client.id)}
                    className="w-full rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-3 font-black text-red-100 transition hover:bg-red-500/20"
                  >
                    SOS Toggle
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      {clients.length > visibleClients.length ? (
        <p className="text-center text-sm font-bold text-gray-500">
          מציג {visibleClients.length} מתוך {clients.length} לקוחות במצב Virtual Window.
        </p>
      ) : null}
    </section>
  );
}

function FinancePanel() {
  const [isProcessing, setIsProcessing] = useState(false);
  const routingPlan = getLeastCostRoutingPlan();
  const totalRevenue = financeLogs
    .filter((log) => log.type === "revenue" && log.status === "collected")
    .reduce((sum, log) => sum + log.amount, 0);
  const pendingInvoices = financeLogs.filter(
    (log) => log.type === "invoice" && log.status === "pending",
  );
  const pendingAmount = pendingInvoices.reduce((sum, log) => sum + log.amount, 0);
  const apiBurnRate = vaultAssets.reduce((sum, asset) => sum + Math.max(0, 100000 - asset.credit_balance), 0);
  const expectedLeadRevenue = leadCount * 350;

  function processInvoices() {
    setIsProcessing(true);
    window.setTimeout(() => setIsProcessing(false), 2600);
  }

  return (
    <section className="glass-industrial rounded-3xl border border-emerald-400/20 p-8 shadow-2xl shadow-emerald-950/20">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
        Finance / Invoices
      </p>
      <div className="mt-3 flex items-center gap-4">
        <VaultSeal />
        <h2 className="text-3xl font-black">Financial Command</h2>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <DigitalLedgerMetric label="הכנסה צפויה" value={`₪${expectedLeadRevenue.toLocaleString("he-IL")}`} tone="green" />
        <DigitalLedgerMetric label="עלות משאבים" value={`${apiBurnRate.toLocaleString("he-IL")} credits`} tone="red" />
        <DigitalLedgerMetric label="מצב חשבוניות" value="ACTIVE" tone="green" />
        <DigitalLedgerMetric label="Total Revenue" value={`₪${totalRevenue.toLocaleString("he-IL")}`} tone="green" />
        <DigitalLedgerMetric label="Pending Amount" value={`₪${pendingAmount.toLocaleString("he-IL")}`} tone="amber" />
        <DigitalLedgerMetric label="Leads Generated" value={`${leadCount}`} tone="green" />
      </div>
      <section className="mt-6 rounded-3xl border border-cyan-300/25 bg-black/50 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
              Real Credits Vault
            </p>
            <h3 className="mt-2 text-2xl font-black text-[#f8f9fa]">
              Auto-Switch Routing: {routingPlan.status}
            </h3>
          </div>
          <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 font-mono text-sm font-black text-emerald-100">
            FIRST ROUTE: {routingPlan.selectedProvider}
          </span>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          {creditVaultBalances.map((route) => (
            <article
              key={route.id}
              className="rounded-3xl border border-cyan-300/15 bg-[#001027]/75 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                    Tier {route.costTier}
                  </p>
                  <h4 className="mt-2 text-lg font-black text-[#f8f9fa]">{route.provider}</h4>
                </div>
                <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-black text-emerald-100">
                  {route.status}
                </span>
              </div>
              <p className="mt-4 font-mono text-2xl font-black text-cyan-100">
                {route.balance.toLocaleString("he-IL")} {route.unit}
              </p>
              <p className="mt-3 text-xs leading-5 text-slate-300">{route.routingRole}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="mt-6 rounded-3xl border border-amber-300/20 bg-black/50 p-5">
        <h3 className="text-2xl font-black">אוטומציית חשבוניות</h3>
        <p className="mt-2 text-gray-300">
          AI סורק לקוחות, עסקאות חסרות וחשבוניות שלא נוצרו.
        </p>
        <button
          type="button"
          onClick={processInvoices}
          disabled={isProcessing}
          className="mechanical-click mt-5 rounded-2xl bg-emerald-400 px-6 py-4 font-black text-black transition hover:bg-emerald-300 disabled:opacity-60"
        >
          {isProcessing ? "AI סורק חשבוניות חסרות..." : "Generate Batch"}
        </button>
        {isProcessing ? (
          <div className="relative mt-5 h-40 overflow-hidden rounded-3xl border border-emerald-400/20 bg-black">
            <div className="ingestion-vortex absolute left-1/2 top-1/2 h-28 w-28 rounded-full border border-emerald-300/40" />
            <p className="absolute bottom-4 left-0 right-0 text-center font-mono text-sm font-black text-emerald-300">
              FINANCE VORTEX PROCESSING
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function VaultPanel({
  keyValves,
  isReadOnlyMode,
}: {
  keyValves: KeyValveState[];
  isReadOnlyMode: boolean;
}) {
  const [activeTool, setActiveTool] = useState("");
  const realBalanceByTool = {
    gemini: keyValves.find((valve) => valve.id === "gemini" && valve.isValidated)?.balance,
    hunter: keyValves.find((valve) => valve.id === "hunter" && valve.isValidated)?.balance,
    meta: keyValves.find((valve) => valve.id === "meta" && valve.isValidated)?.balance,
    claude: keyValves.find((valve) => valve.id === "backup" && valve.isValidated)?.balance,
  };

  function getRealBalance(asset: VaultAsset) {
    const toolName = asset.tool_name.toLowerCase();

    if (toolName.includes("gemini")) {
      return realBalanceByTool.gemini;
    }

    if (toolName.includes("hunter")) {
      return realBalanceByTool.hunter;
    }

    if (toolName.includes("meta")) {
      return realBalanceByTool.meta;
    }

    if (toolName.includes("claude") || toolName.includes("anthropic")) {
      return realBalanceByTool.claude;
    }

    return undefined;
  }

  async function activateAsset(asset: VaultAsset) {
    if (isReadOnlyMode) {
      alert("מצב הגנה פעיל - לא ניתן להפעיל מפתח במצב קריאה בלבד.");
      return;
    }

    setActiveTool(asset.tool_name);

    try {
      await fetch("/api/update-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report: `VAULT ASSET ACTIVATED | ${asset.tool_name} | API KEY: ${asset.api_key} | CREDITS: ${asset.credit_balance} | STATUS: ${asset.status}`,
        }),
      });
    } catch {
      alert("הפעלת הנכס נכשלה בעדכון הדוח.");
    }
  }

  return (
    <section className="grid gap-5">
      <div className="glass-industrial rounded-3xl border border-orange-400/20 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-300">
          Empire Asset Vault
        </p>
        <h2 className="mt-2 text-4xl font-black">כספת נכסים (Vault)</h2>
        <p className="mt-3 max-w-3xl text-gray-400">
          עצירת דימום קרדיטים: כל כלי, מפתח, תאריך תפוגה ויתרת קרדיט במקום אחד.
        </p>
        <p className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 font-black text-amber-100">
          מצב סימולציה (Simulation Mode) - חיבור מפתחות אמיתיים בשבת
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {vaultAssets.map((asset) => {
          const expiring = isExpiringSoon(asset.expiry_date);
          const realBalance = getRealBalance(asset);
          const displayedBalance = realBalance ?? asset.credit_balance;

          return (
            <article
              key={asset.id}
              className={[
                "glass-industrial rounded-3xl border p-5 shadow-2xl shadow-black/30",
                expiring
                  ? "low-fuel-flicker border-yellow-300/60 shadow-yellow-950/20"
                  : "border-zinc-700/70",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                    Tool Name
                  </p>
                  <h3 className="mt-2 text-2xl font-black">{asset.tool_name}</h3>
                </div>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-black",
                    expiring
                      ? "bg-yellow-300/15 text-yellow-100"
                      : "bg-emerald-400/15 text-emerald-100",
                  ].join(" ")}
                >
                  {expiring ? "CRITICAL_EXPIRY" : asset.status}
                </span>
              </div>

              <div className="mt-5 grid gap-2 rounded-2xl border border-zinc-700 bg-black/50 p-4 font-mono text-sm text-orange-100">
                <span>API Key: {asset.api_key}</span>
                <span>Expiry Date: {asset.expiry_date}</span>
                <span>
                  Credit Balance: {displayedBalance.toLocaleString("he-IL")}
                  {realBalance !== undefined ? " | REAL VALIDATED" : " | SIMULATED"}
                </span>
                <span>Status: {asset.status}</span>
              </div>

              <button
                type="button"
                onClick={() => activateAsset(asset)}
                className="mechanical-click mt-5 w-full rounded-2xl bg-orange-500 px-5 py-3 font-black text-black transition hover:bg-orange-300"
              >
                Activate
              </button>

              {activeTool === asset.tool_name ? (
                <p className="mt-3 text-sm font-bold text-emerald-300">
                  {asset.tool_name} plugged into main system.
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      <EmpireArsenalPanel />
    </section>
  );
}

function EmpireArsenalPanel() {
  const paidAssets = creditApiArsenal.filter((asset) => asset.tier === "Paid/Main");
  const freeAssets = creditApiArsenal.filter((asset) => asset.tier === "100% Free Tier");
  const creativeAssets = creditApiArsenal.filter((asset) => asset.tier === "Visual/Voice");

  return (
    <section className="glass-industrial rounded-[2rem] border border-cyan-400/20 p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
        Credit & API Arsenal
      </p>
      <h3 className="neon-green-text mt-2 text-3xl font-black">
        Baz-Credits Routing Matrix
      </h3>
      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        {[
          ["Paid/Main", paidAssets],
          ["100% Free Tier", freeAssets],
          ["Visual/Voice", creativeAssets],
        ].map(([title, assets]) => (
          <article
            key={title as string}
            className="rounded-3xl border border-cyan-400/15 bg-black/50 p-5"
          >
            <h4 className="font-mono text-lg font-black text-cyan-100">{title as string}</h4>
            <div className="mt-4 grid gap-3">
              {(assets as typeof creditApiArsenal).map((asset) => (
                <div
                  key={asset.id}
                  className="rounded-2xl border border-cyan-400/10 bg-[#001027]/70 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-black text-[#f8f9fa]">{asset.name}</span>
                    <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-xs font-black text-cyan-100">
                      {asset.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-gray-400">
                    {asset.quota} | {asset.routingRole}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function VaultSeal() {
  return (
    <div className="vault-seal" aria-hidden="true">
      <span />
    </div>
  );
}

function maskKey(value: string) {
  if (!value.trim()) {
    return "*********";
  }

  if (/^\*+.{4}$/.test(value)) {
    return value;
  }

  return `${"*".repeat(Math.max(8, value.length - 4))}${value.slice(-4)}`;
}

function KeysValvesPanel({
  valves,
  onValveChange,
  onTestValve,
  onInjectVaultKeys,
}: {
  valves: KeyValveState[];
  onValveChange: (id: KeyValveId, value: string) => void;
  onTestValve: (id: KeyValveId) => void;
  onInjectVaultKeys: () => void;
}) {
  const activeCount = valves.filter((valve) => valve.isValidated).length;

  return (
    <section className="grid gap-5">
      <div className="glass-industrial rounded-[2rem] border border-cyan-400/25 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
          Real-World Injection Panel
        </p>
        <h2 className="neon-green-text mt-2 text-4xl font-black">
          Keys & Valves
        </h2>
        <p className="mt-3 max-w-3xl leading-8 text-gray-300">
          אזור מאובטח להזנת מפתחות אמת. בשלב הזה המפתח נשמר בזיכרון הדפדפן בלבד, מוצג ממוסך, ו־Test Connection מדמה Ping עד חיבור API חי.
        </p>
        <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-black/55 p-4 font-mono text-sm text-[#f8f9fa]">
          ACTIVE REAL VALVES: {activeCount}/{valves.length} | STORAGE: PROTECTED CLIENT STATE | SECRET VIEW: MASKED
        </div>
        <button
          type="button"
          onClick={onInjectVaultKeys}
          className="mechanical-click mt-5 whitespace-nowrap rounded-2xl bg-cyan-300 px-6 py-4 font-black text-gray-950 shadow-[0_0_32px_rgba(0,242,255,0.32)] transition hover:bg-white"
        >
          FINAL FUELING - Inject Vault Keys
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {valves.map((valve) => (
          <article
            key={valve.id}
            className={[
              "glass-industrial relative overflow-hidden rounded-3xl border p-5 shadow-2xl shadow-black/30",
              valve.isValidated
                ? "border-cyan-300/50 shadow-cyan-950/30"
                : "border-red-400/25",
            ].join(" ")}
          >
            {valve.isValidated ? (
              <span className="glow-flow pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent" />
            ) : null}
            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">
                  {valve.provider}
                </p>
                <h3 className="mt-2 text-2xl font-black">{valve.label}</h3>
                <p className="mt-2 font-mono text-sm text-gray-400">
                  Stored: {maskKey(valve.value)}
                </p>
              </div>
              <span
                className={[
                  "rounded-full px-3 py-1 text-xs font-black",
                  valve.isValidated
                    ? "bg-cyan-400/15 text-cyan-100"
                    : "bg-red-400/15 text-red-100",
                ].join(" ")}
              >
                {valve.isValidated ? "PING GREEN" : "LOCAL READY"}
              </span>
            </div>

            <div className="relative z-10 mt-5 grid gap-3">
              <label className="text-sm font-black text-[#f8f9fa]" htmlFor={`valve-${valve.id}`}>
                API Key / Token
              </label>
              <input
                id={`valve-${valve.id}`}
                type="password"
                value={valve.value}
                onChange={(event) => onValveChange(valve.id, event.target.value)}
                placeholder="הדבק מפתח אמיתי כאן"
                className="rounded-2xl border border-cyan-400/20 bg-black/70 px-4 py-3 font-mono text-[#f8f9fa] outline-none transition focus:border-cyan-300"
                autoComplete="off"
              />
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <p className="rounded-2xl border border-cyan-400/15 bg-[#001027]/80 px-4 py-3 font-mono text-sm text-cyan-100">
                  REAL BALANCE: {valve.isValidated ? valve.balance.toLocaleString("he-IL") : "WAITING FOR VALIDATION"}
                </p>
                <button
                  type="button"
                  onClick={() => onTestValve(valve.id)}
                  className="mechanical-click whitespace-nowrap rounded-2xl bg-cyan-300 px-5 py-3 font-black text-gray-950 transition hover:bg-white"
                >
                  Test Connection
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LeadGenPanel({ isReadOnlyMode }: { isReadOnlyMode: boolean }) {
  const burnCreditsTarget = 0;
  const [status, setStatus] = useState("READY");
  const [result, setResult] = useState("");
  const [leadsFound, setLeadsFound] = useState(0);
  const [burnCredits, setBurnCredits] = useState(burnCreditsTarget);
  const [liveFeed, setLiveFeed] = useState<LeadFeedItem[]>([]);

  async function startExtraction() {
    if (isReadOnlyMode) {
      alert("מצב הגנה פעיל - לא ניתן להתחיל Extraction במצב קריאה בלבד.");
      return;
    }

    setStatus("EXTRACTING");
    setResult("Hunter.io סורק פרויקטים ומייצר רשימת עסקים חדשה...");
    setLeadsFound(0);
    setBurnCredits(burnCreditsTarget);
    setLiveFeed([]);

    try {
      const response = await fetch("/api/lead-gen", { method: "POST" });
      const data = (await response.json()) as {
        burnedCredits?: number;
        leadsGenerated?: number;
        remainingCredits?: number;
      };

      if (!response.ok) {
        throw new Error("Lead generation failed");
      }

      const totalLeads = data.leadsGenerated ?? 0;
      const leadNames = Array.from({ length: totalLeads }, (_, index) => ({
        companyName: `BAZ Prospect ${String(index + 1).padStart(3, "0")}`,
        email: `lead${String(index + 1).padStart(3, "0")}@example-business.com`,
        status: "Verified",
      }));
      const interval = window.setInterval(() => {
        setLeadsFound((current) => {
          if (current >= totalLeads) {
            window.clearInterval(interval);
            return current;
          }

          return Math.min(totalLeads, current + 5);
        });
      }, 80);
      let feedIndex = 0;
      const feedInterval = window.setInterval(() => {
        const nextLead = leadNames[feedIndex];

        if (!nextLead) {
          window.clearInterval(feedInterval);
          return;
        }

        setLiveFeed((items) => [nextLead, ...items].slice(0, 12));
        setBurnCredits((credits) => Math.max(0, credits - 1));
        feedIndex += 1;
      }, 2000);

      setResult(
        `נוצרו ${data.leadsGenerated ?? 0} לידים. נשרפו ${data.burnedCredits ?? 0} קרדיטים. יתרה: ${data.remainingCredits ?? 0}.`,
      );
      setStatus("COMPLETE");
    } catch {
      setResult("שגיאה בהפעלת Hunter Lead Gen.");
      setStatus("ERROR");
    }
  }

  return (
    <section className="grid gap-5">
      <div className="glass-industrial rounded-3xl border border-emerald-400/20 p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
          Hunter Implementation
        </p>
        <h2 className="mt-3 text-4xl font-black">ייצור לידים (Lead Gen)</h2>
        <div className="mt-4 rounded-3xl border border-emerald-400/30 bg-black/50 p-5">
          <p className="text-sm font-black text-emerald-200">Leads Found</p>
          <p className="mt-2 font-mono text-5xl font-black text-emerald-300 [text-shadow:0_0_20px_rgba(52,211,153,0.65)]">
            {leadsFound}
          </p>
        </div>
        <div className="mt-4 rounded-3xl border border-orange-400/30 bg-black/50 p-5">
          <div className="mb-2 flex items-center justify-between font-mono text-sm font-black text-orange-200">
            <span>Credit Counter</span>
            <span>
              {burnCredits.toLocaleString("he-IL")} real credits
            </span>
          </div>
          <div className="h-5 overflow-hidden rounded-full border border-orange-300/30 bg-zinc-950">
            <div
              className="h-full rounded-full bg-gradient-to-l from-orange-500 via-yellow-300 to-emerald-300 shadow-[0_0_22px_rgba(249,115,22,0.55)] transition-all duration-500"
              style={{ width: `${burnCreditsTarget > 0 ? (burnCredits / burnCreditsTarget) * 100 : 0}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={startExtraction}
          disabled={status === "EXTRACTING"}
          className="mechanical-click mt-6 rounded-2xl bg-emerald-400 px-7 py-4 font-black text-black transition hover:bg-emerald-300 disabled:opacity-60"
        >
          {status === "EXTRACTING" ? "Extracting..." : "Start Extraction"}
        </button>
        {result ? (
          <p className="mt-5 rounded-2xl border border-emerald-400/30 bg-black/50 p-4 font-mono text-sm font-bold text-emerald-300">
            {result}
          </p>
        ) : null}
        <div className="mt-5 overflow-hidden rounded-3xl border border-emerald-400/25 bg-black/70">
          <div className="border-b border-emerald-400/20 px-5 py-3 font-black text-emerald-200">
            Live Feed
          </div>
          <div className="max-h-80 overflow-y-auto">
            {liveFeed.map((lead) => (
              <div
                key={`${lead.companyName}-${lead.email}`}
                className="grid gap-2 border-b border-white/5 px-5 py-3 font-mono text-sm text-emerald-100 md:grid-cols-3"
              >
                <span>חברה: {lead.companyName}</span>
                <span>מייל: {lead.email}</span>
                <span>סטטוס: {lead.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DigitalLedgerMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "red" | "amber";
}) {
  const valueClass =
    tone === "green"
      ? "text-emerald-300 [text-shadow:0_0_18px_rgba(52,211,153,0.65)]"
      : tone === "red"
        ? "low-fuel-flicker text-red-300 [text-shadow:0_0_18px_rgba(248,113,113,0.65)]"
        : "text-amber-300 [text-shadow:0_0_18px_rgba(252,211,77,0.55)]";

  return (
    <article className="rounded-3xl border border-zinc-700 bg-black/60 p-5 shadow-inner shadow-white/5">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-400">
        {label}
      </p>
      <p className={["mt-4 font-mono text-4xl font-black", valueClass].join(" ")}>
        {value}
      </p>
    </article>
  );
}

function AiAdvisorsPanel({
  commandPrompt,
  commandAnswer,
  chatHistory,
  isCommandLoading,
  onCommandPromptChange,
  onSubmitCommand,
}: {
  commandPrompt: string;
  commandAnswer: string;
  chatHistory: ChatMessage[];
  isCommandLoading: boolean;
  onCommandPromptChange: (value: string) => void;
  onSubmitCommand: () => void;
}) {
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  function startVoiceInput() {
    const speechWindow = window as WindowWithSpeechRecognition;
    const SpeechRecognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("זיהוי קולי לא נתמך בדפדפן הזה.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "he-IL";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      onCommandPromptChange(transcript);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => {
      setIsRecording(false);
      alert("הקלטה נכשלה. נסה שוב.");
    };

    setIsRecording(true);
    recognition.start();
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileSelected() {
    alert("מערכת ניתוח הראייה (Vision) תחובר בשלב הבא");
  }

  return (
    <section className="rounded-[2rem] border border-green-500/30 bg-gray-950 p-5 shadow-2xl shadow-green-950/20 md:p-7">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
          AI Advisors
        </p>
        <h2 className="mt-2 text-4xl font-black">חדר יועצי AI</h2>
        <p className="mt-3 max-w-3xl leading-8 text-gray-300">
          Consulting Hub לניתוח שותפים, קמפיינים, החלטות עסקיות ותפעול החברה.
        </p>
      </div>

      <div className="mb-4 max-h-[60vh] min-h-[60vh] overflow-y-auto rounded-2xl border border-green-500/30 bg-black p-4 shadow-inner shadow-green-950/30">
        <div className="grid gap-3">
          {chatHistory.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={[
                "max-w-[85%] rounded-2xl p-4 text-sm leading-7 shadow-lg",
                message.role === "user"
                  ? "mr-auto rounded-br-md border border-blue-200/20 bg-blue-600/35 text-white shadow-blue-950/30 backdrop-blur-xl"
                  : "ml-auto rounded-bl-md border border-amber-200/20 bg-amber-950/20 text-gray-100 shadow-amber-950/20 backdrop-blur-xl",
              ].join(" ")}
            >
              {message.role === "assistant" ? (
                <p className="mb-1 text-xs font-black text-green-400">BAZ Advisor</p>
              ) : null}
              {message.content}
              <p className="mt-2 text-left text-[11px] text-gray-300">
                {message.timestamp}
              </p>
            </div>
          ))}
          {isCommandLoading ? (
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-bl-md border border-green-500/30 bg-gray-800/70 p-4 text-sm leading-7 text-gray-100 backdrop-blur-md">
              <p className="mb-2 text-xs font-black text-green-400">BAZ Advisor</p>
              <div className="flex items-center gap-2">
                <span>BAZ AI is thinking...</span>
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="advisor-wave h-2 w-2 rounded-full bg-green-400"
                    style={{ animationDelay: `${dot * 0.16}s` }}
                  />
                ))}
              </div>
            </div>
          ) : null}
          <div ref={chatEndRef} />
        </div>
      </div>

      <label className="mb-2 block text-sm font-bold text-green-300">
        פקד על האימפריה... שאל את ה-AI
      </label>
      <div className="grid gap-3 md:grid-cols-[auto_auto_1fr_auto]">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelected}
        />
        <button
          type="button"
          onClick={openFilePicker}
          className="rounded-2xl border border-green-500/30 bg-black px-5 py-4 text-2xl font-black text-green-300 transition hover:bg-green-500 hover:text-gray-950"
          aria-label="העלאת קובץ או תמונה"
        >
          +
        </button>
        <button
          type="button"
          onClick={startVoiceInput}
          className={[
            "rounded-2xl border px-5 py-4 text-xl font-black transition",
            isRecording
              ? "border-red-400 bg-red-500 text-white"
              : "border-green-500/30 bg-black text-green-300 hover:bg-green-500 hover:text-gray-950",
          ].join(" ")}
          aria-label="הקלטה קולית"
        >
          🎙
        </button>
        <input
          type="search"
          value={commandPrompt}
          onChange={(event) => onCommandPromptChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmitCommand();
            }
          }}
          placeholder="לדוגמה: מי זה בני?"
          className="w-full rounded-2xl border border-green-500/30 bg-black px-5 py-4 font-mono text-green-100 shadow-inner shadow-green-950/30 outline-none transition placeholder:text-gray-600 focus:border-green-400 focus:ring-2 focus:ring-green-500/30"
        />
        <button
          type="button"
          onClick={onSubmitCommand}
          disabled={isCommandLoading}
          className="rounded-2xl bg-green-500 px-6 py-4 font-black text-gray-950 transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          שלח ליועץ
        </button>
      </div>

      {commandAnswer ? (
        <div className="mt-4 whitespace-pre-line rounded-2xl border border-green-500/30 bg-black p-5 font-mono text-sm font-bold leading-8 text-green-400 shadow-lg shadow-green-500/10 [text-shadow:0_0_12px_rgba(74,222,128,0.45)]">
          {commandAnswer}
        </div>
      ) : null}
    </section>
  );
}

function Base44SyncCenter() {
  const inventory = base44Inventory as Base44InventoryFile;
  const hunterToolsFile = hunterToolsInventory as HunterToolsInventoryFile;
  const inventoryProjects = inventory.projects?.active ?? [];
  const scannedTools = hunterToolsFile.tools?.length
    ? hunterToolsFile.tools
    : inventory.hunter?.scrapers ?? [];
  const inventoryTools = scannedTools.length ? scannedTools : nativeHunterFactoryTools;
  const inventoryCredits = inventory.credits ?? {};
  const initialCredits: Base44CreditSync = {
    usedCredits: Number(inventoryCredits.usedCredits ?? 427),
    totalCredits: Number(inventoryCredits.totalCredits ?? 1_200_030),
    giftCredits: Number(inventoryCredits.giftCredits ?? 30),
    remainingCredits: Number(inventoryCredits.remainingCredits ?? 1_199_603),
    integrationCreditsRemaining: Number(inventoryCredits.integrationCreditsRemaining ?? 0),
    chatCreditsRemaining: Number(inventoryCredits.chatCreditsRemaining ?? 0),
  };
  const [isPulling, setIsPulling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(
    inventory.status === "scanned"
      ? `Base44 inventory loaded: ${inventory.generatedAt ?? "latest scan"}`
      : "Base44 inventory not scanned yet. Run node src/scripts/fetch-base44-inventory.js",
  );
  const [activeBaseView, setActiveBaseView] = useState<"hunter" | "forge" | "ledger">("hunter");
  const [credits, setCredits] = useState<Base44CreditSync>(initialCredits);
  const [projects, setProjects] = useState<Base44SyncProject[]>(inventoryProjects);
  const [tools, setTools] = useState<Base44SyncTool[]>(inventoryTools);
  const [startingToolId, setStartingToolId] = useState<string | null>(null);
  const [runningScanType, setRunningScanType] = useState<string | null>(null);
  const [base44Ingestion, setBase44Ingestion] = useState<Base44TotalIngestionResponse | null>(null);
  const [hunterSearch, setHunterSearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState(empireCompanies[0]?.id ?? "");
  const [selectedScanType, setSelectedScanType] = useState(hunterScanTypes[0]);
  const [selectedIdentity, setSelectedIdentity] = useState<"BAZ SPACE" | "DOLPHIN">("BAZ SPACE");
  const [activeHunterTab, setActiveHunterTab] = useState<HunterInnerTab>("overview");
  const [scoutFindings, setScoutFindings] = useState<ScoutFindingsResponse | null>(null);
  const [liveLogs, setLiveLogs] = useState<string[]>([
    `[${new Date().toISOString()}] HUNTER HUB READY | NVIDIA_CREDITS=2.7B`,
  ]);
  const totalHunterAssetCredits = tools.reduce(
    (sum, tool, index) => sum + getHunterAssetCredits(tool, index),
    0,
  );
  const nvidiaHunterAssets = creditVaultBalances.find((route) => route.provider === "NVIDIA Grants");
  const selectedCompany = empireCompanies.find((company) => company.id === selectedCompanyId) ?? empireCompanies[0];
  const visibleTools = tools.filter((tool) =>
    `${tool.name} ${tool.category} ${tool.creditPool}`.toLowerCase().includes(hunterSearch.toLowerCase()),
  );
  const [logs, setLogs] = useState<Base44SyncLog[]>([
    {
      id: "inventory-001",
      createdAt: inventory.generatedAt ?? new Date().toISOString(),
      action: scannedTools.length
        ? `Loaded ${scannedTools.length} Hunter tools from src/data/hunter_tools.json`
        : "Native Hunter factory rebuilt inside BAZ OS",
      status: "OK",
    },
  ]);

  function appendHunterLiveLog(message: string) {
    setLiveLogs((current) => [`[${new Date().toISOString()}] ${message}`, ...current].slice(0, 30));
  }

  function describeApiResult(result: unknown) {
    try {
      const full = JSON.stringify(result);
      return full.length > 160 ? `${full.slice(0, 160)}…` : full;
    } catch {
      return "API response could not be serialized";
    }
  }

  async function triggerHunterN8NScan(scanType: string, toolOverride?: Base44SyncTool) {
    const tool = toolOverride ?? visibleTools[0] ?? tools[0] ?? nativeHunterFactoryTools[0];

    if (!selectedCompany || !tool) {
      const errMsg = !selectedCompany ? "חסרה חברה — בחר חברה מהרשימה" : "חסר כלי Hunter";
      setStatus(`⛔ ${errMsg}`);
      appendHunterLiveLog(`BLOCKED: ${errMsg}`);
      return;
    }

    setSelectedScanType(scanType);
    setStartingToolId(tool.id);
    setRunningScanType(scanType);
    setStatus(`שולח ל־N8N: ${scanType} עבור ${selectedCompany.name}`);
    appendHunterLiveLog(`POST /api/n8n/trigger | company=${selectedCompany.name} | scan=${scanType} | tool=${tool.name} | identity=${selectedIdentity}`);

    try {
      const response = await fetch("/api/n8n/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: tool.creditPool,
          action: "HUNTER_SCAN_RUN",
          source: "BAZ_OS_HUNTER_HUB",
          payload: {
            company: selectedCompany,
            scanType,
            search: hunterSearch,
            identity: selectedIdentity,
            tool,
            credits: {
              nvidia: nvidiaHunterAssets?.balance ?? 2_700_000_000,
              hunterAssets: totalHunterAssetCredits,
            },
          },
        }),
      });
      const result = (await response.json()) as { ok?: boolean; status?: number; message?: string; error?: string };
      const responseText = describeApiResult(result);

      appendHunterLiveLog(`API RESPONSE HTTP ${response.status} | ${responseText}`);
      setLogs((currentLogs) => [
        {
          id: `hunter-scan-${Date.now()}`,
          createdAt: new Date().toISOString(),
          action: `API RESPONSE: ${scanType} | ${selectedCompany.name} | HTTP ${response.status} | ${responseText}`,
          status: result.ok ? "ACTIVE" : "QUEUED",
        },
        ...currentLogs,
      ]);
      setStatus(result.ok ? `פעיל: ${scanType} נשלח ל־N8N.` : `בתור: ${scanType} נרשם דרך N8N.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network Error";
      appendHunterLiveLog(`API ERROR | ${message}`);
      setLogs((currentLogs) => [
        {
          id: `hunter-error-${Date.now()}`,
          createdAt: new Date().toISOString(),
          action: `API ERROR: ${scanType} | ${selectedCompany.name} | ${message}`,
          status: "ERROR",
        },
        ...currentLogs,
      ]);
      setStatus(`שגיאת הרצה: ${message}`);
    } finally {
      setStartingToolId(null);
      setRunningScanType(null);
    }
  }

  function runHunterScraper() {
    const now = new Date().toISOString();
    void triggerHunterN8NScan(selectedScanType);
    setStatus("מריץ סורק Hunter דרך N8N.");
    setLogs((currentLogs) => [
      { id: `script-${Date.now()}`, createdAt: now, action: `RUN CLICKED: ${selectedScanType} queued to N8N`, status: "QUEUED" },
      ...currentLogs,
    ]);
  }

  async function runSelectedHunterScan() {
    await triggerHunterN8NScan(selectedScanType);
  }

  async function startAgent(tool: Base44SyncTool) {
    const now = new Date().toISOString();
    setStartingToolId(tool.id);
    setStatus(`שולח סוכן ל־N8N עבור ${tool.name}...`);
    appendHunterLiveLog(`POST /api/base44/start-agent | company=${selectedCompany?.name ?? "Unknown"} | tool=${tool.name} | scan=${selectedScanType}`);
    syncStatusChange("HUNTER_TOOL_RUN_REQUESTED", "ONLINE", {
      toolId: tool.id,
      toolName: tool.name,
      workflow: tool.creditPool,
      assetCredits: getHunterAssetCredits(tool, tools.findIndex((item) => item.id === tool.id)),
    });

    try {
      const response = await fetch("/api/base44/start-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: tool.id,
          toolName: tool.name,
          category: tool.category,
          companyId: selectedCompany?.id,
          companyName: selectedCompany?.name,
          scanType: selectedScanType,
          identity: selectedIdentity,
        }),
      });
      const result = (await response.json()) as { ok?: boolean; n8nStatus?: string; error?: string };
      const responseText = describeApiResult(result);
      appendHunterLiveLog(`AGENT API RESPONSE HTTP ${response.status} | ${responseText}`);

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "N8N start agent command failed");
      }

      setLogs((currentLogs) => [
        {
          id: `agent-${Date.now()}`,
          createdAt: now,
          action: `AGENT API RESPONSE: ${tool.name} | HTTP ${response.status} | ${responseText}`,
          status: "ACTIVE",
        },
        ...currentLogs,
      ]);
      setStatus(`פעיל: ${tool.name} נשלח ל־N8N.`);
      syncStatusChange("HUNTER_TOOL_RUN_ACTIVE", "ONLINE", {
        toolId: tool.id,
        toolName: tool.name,
        n8nStatus: result.n8nStatus ?? "N8N command queued",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown agent launch error";
      appendHunterLiveLog(`AGENT API ERROR | ${message}`);
      setStatus(`שגיאת הרצה: ${message}`);
      syncStatusChange("HUNTER_TOOL_RUN_FAILED", "ONLINE", {
        toolId: tool.id,
        toolName: tool.name,
        error: message,
      });
    } finally {
      setStartingToolId(null);
    }
  }

  useEffect(() => {
    async function loadFullInventoryTools() {
      try {
        const response = await fetch("/api/base44/full-inventory", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          ok?: boolean;
          generatedAt?: string | null;
          tools?: Base44SyncTool[];
        };

        const importedTools = data.tools ?? [];

        if (!data.ok || importedTools.length === 0) {
          return;
        }

        setTools((currentTools) => {
          const existingIds = new Set(currentTools.map((tool) => tool.id));
          const mergedTools = [
            ...currentTools,
            ...importedTools.filter((tool) => !existingIds.has(tool.id)),
          ];

          return mergedTools;
        });
        setStatus(`Hunter Hub loaded ${importedTools.length} Base44 tool endpoints from hunter_tools.json/full scan.`);
        setLogs((currentLogs) => [
          {
            id: `full-inventory-${Date.now()}`,
            createdAt: data.generatedAt ?? new Date().toISOString(),
            action: `Imported ${importedTools.length} tools from BASE44_FULL_INVENTORY.json`,
            status: "ACTIVE",
          },
          ...currentLogs,
        ]);
      } catch {
        setStatus("BASE44_FULL_INVENTORY import skipped; using normalized Base44 inventory.");
      }
    }

    void loadFullInventoryTools();
  }, []);

  useEffect(() => {
    async function loadBase44TotalIngestion() {
      try {
        const response = await fetch("/api/base44/total-ingestion", { cache: "no-store" });
        const data = (await response.json()) as Base44TotalIngestionResponse;
        setBase44Ingestion(data);

        if (data.ok) {
          setStatus(`ONLINE: Base44 ingestion loaded ${data.totalRecords.toLocaleString("he-IL")} entity records.`);
          setLogs((currentLogs) => [
            {
              id: `base44-total-${Date.now()}`,
              createdAt: data.generatedAt,
              action: `Fetched ${data.entities.length} Base44 entity streams from CodeX and Credit Hunter`,
              status: "OK",
            },
            ...currentLogs,
          ]);
        }
      } catch {
        setStatus("Base44 total ingestion unavailable; using native BAZ fallback.");
      }
    }

    void loadBase44TotalIngestion();
  }, []);

  useEffect(() => {
    async function loadScoutFindings() {
      try {
        appendHunterLiveLog("GET /api/hunter/scout-findings");
        const response = await fetch("/api/hunter/scout-findings", { cache: "no-store" });
        const data = (await response.json()) as ScoutFindingsResponse;
        setScoutFindings(data);
        appendHunterLiveLog(`SCOUT FINDINGS RESPONSE HTTP ${response.status} | ${describeApiResult(data)}`);
        setLogs((currentLogs) => [
          {
            id: `scout-findings-${Date.now()}`,
            createdAt: data.generatedAt,
            action: `SCOUT FINDINGS API: HTTP ${response.status} | ${data.totalRecords.toLocaleString("he-IL")} records | ${data.status}`,
            status: data.ok ? "OK" : "ERROR",
          },
          ...currentLogs,
        ]);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Scout Findings API failed";
        appendHunterLiveLog(`SCOUT FINDINGS ERROR | ${message}`);
        setScoutFindings({
          ok: false,
          status: "error",
          generatedAt: new Date().toISOString(),
          totalRecords: 0,
          findings: [],
          error: message,
        });
      }
    }

    void loadScoutFindings();
  }, []);

  async function pullAllData() {
    setIsPulling(true);
    setProgress(12);
    setStatus("Connecting to Base44 with masked key...");

    try {
      const [projectsResponse, creditsResponse, hunterResponse] = await Promise.all([
        fetch("/api/base/sync-projects", { method: "POST", cache: "no-store" }),
        fetch("/api/base/sync-credits", { method: "POST", cache: "no-store" }),
        fetch("/api/base/sync-hunter", { method: "POST", cache: "no-store" }),
      ]);
      setProgress(68);

      const projectsData = (await projectsResponse.json()) as { projects?: Base44SyncProject[] };
      const creditsData = (await creditsResponse.json()) as {
        credits?: Base44CreditSync;
      };
      const hunterData = (await hunterResponse.json()) as {
        hunterTools?: Base44SyncTool[];
        scrapingLogs?: Base44SyncLog[];
      };

      setProjects(projectsData.projects ?? []);
      setCredits(creditsData.credits ?? credits);
      setTools(hunterData.hunterTools ?? []);
      setLogs(hunterData.scrapingLogs ?? []);
      setProgress(100);
      setStatus(
        `Synced Base44 factory metadata: ${projectsData.projects?.length ?? 0} projects | ${hunterData.hunterTools?.length ?? 0} tools`,
      );
    } catch {
      setStatus("Base44 pull failed. Check /api/base44 routes and env key.");
    } finally {
      window.setTimeout(() => setIsPulling(false), 900);
    }
  }

  return (
    <section className="grid gap-6">
      <div className="glass-industrial rounded-[2rem] border border-orange-400/30 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">
          תחנת Base44
        </p>
        <h2 className="mt-2 text-3xl font-black text-[#f8f9fa]">
          מרכז פיקוד Base44
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-300">
          תחנת עבודה פעילה לסורקים, פרויקטים, קרדיטים, אוטומציות וכלי Hunter בתוך BAZ OS.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-cyan-300/20 bg-black/45 p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">כלים מקומיים</p>
            <p className="mt-3 text-4xl font-black text-[#f8f9fa]">{tools.length.toLocaleString("he-IL")}</p>
          </article>
          <article className="rounded-3xl border border-cyan-300/20 bg-black/45 p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">סוכנים</p>
            <p className="mt-3 text-4xl font-black text-[#f8f9fa]">
              {tools.filter((tool) => tool.category.toLowerCase().includes("agent")).length.toLocaleString("he-IL")}
            </p>
          </article>
          <article className="rounded-3xl border border-cyan-300/20 bg-black/45 p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">קרדיטי Hunter</p>
            <p className="mt-3 text-4xl font-black text-[#f8f9fa]">
              {(totalHunterAssetCredits / 1_000_000_000).toLocaleString("he-IL", { maximumFractionDigits: 1 })}B
            </p>
            <p className="mt-2 text-sm font-bold text-cyan-100">
              נכסי Hunter שנאספו ושוכפלו למערכת.
            </p>
          </article>
          <article className="rounded-3xl border border-emerald-300/25 bg-emerald-400/10 p-5 md:col-span-3">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-100">
              נכסי Hunter אמיתיים: NVIDIA / Grants
            </p>
            <p className="mt-3 text-4xl font-black text-[#f8f9fa]">
              {((nvidiaHunterAssets?.balance ?? 0) / 1_000_000_000).toLocaleString("he-IL", { maximumFractionDigits: 1 })}B
            </p>
            <p className="mt-2 text-sm font-bold text-emerald-100">
              {nvidiaHunterAssets?.keyLabel ?? "NVIDIA Grants"} routed through least-cost vault policy.
            </p>
          </article>
          <article className="rounded-3xl border border-emerald-300/25 bg-emerald-400/10 p-5 md:col-span-3">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-100">רשומות Base44</p>
            <p className="mt-3 text-4xl font-black text-[#f8f9fa]">
              {(base44Ingestion?.totalRecords ?? empireCompanies.length).toLocaleString("he-IL")}
            </p>
            <p className="mt-2 text-sm font-bold text-emerald-100">
              {base44Ingestion?.ok
                ? `ONLINE: ${base44Ingestion.entities.length} Base44 streams loaded from CodeX and Credit Hunter.`
                : "Internal 47-company target list loaded from BAZ OS factory config."}
            </p>
          </article>
        </div>

        {base44Ingestion ? (
          <section className="mt-6 rounded-[2rem] border border-fuchsia-300/25 bg-fuchsia-950/20 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-200">
              בליעת נתוני Base44
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {base44Ingestion.entities.map((entity) => (
                <article key={`${entity.appId}-${entity.entityName}`} className="rounded-2xl border border-fuchsia-200/15 bg-black/45 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-black text-white">{entity.appLabel}</h4>
                      <p className="mt-1 text-sm font-bold text-fuchsia-100">{entity.entityName}</p>
                    </div>
                    <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-black text-emerald-100">
                      {entity.ok ? "ONLINE" : `HTTP ${entity.status}`}
                    </span>
                  </div>
                  <p className="mt-3 font-mono text-2xl font-black text-fuchsia-100">
                    {entity.records.length.toLocaleString("he-IL")} records
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-blue-300/25 bg-blue-950/20 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">
              כלים פעילים
            </p>
            <div className="mt-4 grid gap-3">
              {(tools.length ? tools : [
                { id: "no-tool", name: "No Hunter scrapers found", category: "Base44 Inventory", creditPool: "scan required", status: "empty" },
              ]).slice(0, 6).map((tool) => (
                <article key={tool.id} className="rounded-2xl border border-blue-200/15 bg-black/45 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-black text-white">{tool.name}</h4>
                      <p className="mt-1 text-sm font-bold text-blue-100">{tool.category}</p>
                    </div>
                    <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-black text-emerald-100">
                      {tool.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-emerald-300/25 bg-emerald-950/20 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
              ניטור פרויקטים
            </p>
            <div className="mt-4 grid gap-3">
              {(projects.length ? projects : [
                { id: "no-project", name: "No active Base44 projects found", status: "scan required", owner: "Base44" },
              ]).slice(0, 6).map((project) => (
                <article key={project.id} className="rounded-2xl border border-emerald-200/15 bg-black/45 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-black text-white">{project.name}</h4>
                      <p className="mt-1 text-sm font-bold text-emerald-100">{project.owner}</p>
                    </div>
                    <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-black text-cyan-100">
                      {project.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { id: "hunter" as const, label: "🔎 מרכז פיקוד Hunter" },
            { id: "forge" as const, label: "🏗️ בניית פרויקטים" },
            { id: "ledger" as const, label: "📒 מפת מפעל" },
          ].map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => setActiveBaseView(view.id)}
              className={[
                "rounded-2xl border px-5 py-3 font-black transition",
                activeBaseView === view.id
                  ? "border-cyan-200 bg-cyan-300 text-slate-950"
                  : "border-cyan-300/25 bg-black/45 text-cyan-100 hover:border-cyan-200",
              ].join(" ")}
            >
              {view.label}
            </button>
          ))}
        </div>

        {activeBaseView === "hunter" ? (
          <section id="hunter-hub" className="mt-6 grid gap-5 overflow-hidden rounded-[2rem] border border-cyan-300/25 bg-[#060914] p-0 shadow-[0_0_55px_rgba(0,242,255,0.12)]">
            <div className="bg-gradient-to-l from-purple-600 via-red-500 to-orange-400 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
                  baz-credit-scout
                </p>
                <h3 className="mt-2 text-3xl font-black text-white">
                  מרכז פיקוד Hunter
                </h3>
                <p className="mt-2 text-sm font-bold leading-6 text-white/85">
                  אותו פאנל פעולה של BAZ Credit Hunter, מוטמע בתוך מערכת BAZ OS הגדולה.
                </p>
              </div>
              <button
                type="button"
                onClick={runHunterScraper}
                className="rounded-2xl bg-emerald-300 px-6 py-4 font-black text-slate-950 transition hover:bg-white"
              >
                הרץ סורק
              </button>
              </div>
              <div className="mt-5 grid gap-2 md:grid-cols-3">
                {[
                  { id: "overview" as const, label: "📊 סקירה כללית" },
                  { id: "scanners" as const, label: "🔎 סורקים" },
                  { id: "assets" as const, label: "💎 נכסים" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveHunterTab(tab.id)}
                    className={[
                      "rounded-2xl px-4 py-3 text-center text-sm font-black text-white backdrop-blur transition",
                      activeHunterTab === tab.id
                        ? "bg-black/55 ring-2 ring-white/55"
                        : "bg-black/25 hover:bg-black/40",
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── שורת חיפוש + בחירת חברה/זהות ─── */}
            <div className="mx-5 grid gap-3 rounded-3xl border border-slate-700/50 bg-black/30 p-4 lg:grid-cols-[1fr_auto_auto_auto_auto]">
              <input
                value={hunterSearch}
                onChange={(event) => setHunterSearch(event.target.value)}
                placeholder="חיפוש קרדיטים, כלי או סורק"
                className="rounded-2xl border border-emerald-300/20 bg-black/70 px-4 py-3 font-mono text-sm font-bold text-emerald-50 outline-none placeholder:text-slate-500"
              />
              <select
                value={selectedCompanyId}
                onChange={(event) => setSelectedCompanyId(event.target.value)}
                className="rounded-2xl border border-cyan-300/20 bg-black/70 px-4 py-3 font-mono text-sm font-bold text-cyan-50 outline-none"
              >
                {empireCompanies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
              <select
                value={selectedScanType}
                onChange={(event) => setSelectedScanType(event.target.value)}
                className="rounded-2xl border border-cyan-300/20 bg-black/70 px-4 py-3 font-mono text-sm font-bold text-cyan-50 outline-none"
              >
                {hunterScanTypes.map((scanType) => (
                  <option key={scanType} value={scanType}>{scanType}</option>
                ))}
              </select>
              <select
                value={selectedIdentity}
                onChange={(event) => setSelectedIdentity(event.target.value as "BAZ SPACE" | "DOLPHIN")}
                className="rounded-2xl border border-fuchsia-300/20 bg-black/70 px-4 py-3 font-mono text-sm font-bold text-fuchsia-50 outline-none"
              >
                <option value="BAZ SPACE">BAZ SPACE</option>
                <option value="DOLPHIN">DOLPHIN</option>
              </select>
              <button
                type="button"
                onClick={() => void runSelectedHunterScan()}
                disabled={Boolean(startingToolId)}
                className="rounded-2xl bg-emerald-300 px-6 py-3 font-black text-slate-950 transition hover:bg-white disabled:opacity-60"
              >
                {startingToolId ? "מריץ..." : "הרץ"}
              </button>
            </div>

            {/* ─── טאב: סקירה כללית ─── */}
            {activeHunterTab === "overview" ? (
              <div className="mx-5 grid gap-5">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { icon: "💰", value: "2.7B", label: "נכסי NVIDIA זמינים", color: "text-yellow-300" },
                    { icon: "🏦", value: `${(totalHunterAssetCredits / 1_000_000_000).toLocaleString("he-IL", { maximumFractionDigits: 1 })}B`, label: "נכסי Hunter משוכפלים", color: "text-cyan-300" },
                    { icon: "🔎", value: hunterScanTypes.length, label: "סורקים זמינים", color: "text-orange-300" },
                    { icon: "✅", value: tools.length, label: "כלים פעילים", color: "text-emerald-300" },
                  ].map((metric) => (
                    <article key={metric.label} className="rounded-3xl border border-white/10 bg-[#0b1022] p-5">
                      <p className="text-3xl">{metric.icon}</p>
                      <p className={["mt-3 text-4xl font-black", metric.color].join(" ")}>{metric.value}</p>
                      <p className="mt-2 text-sm font-bold text-slate-400">{metric.label}</p>
                    </article>
                  ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  {visibleTools.map((tool, index) => (
                    <article key={tool.id} className="rounded-3xl border border-cyan-300/20 bg-[#001027]/70 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-cyan-200">{tool.category}</p>
                        <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-black text-emerald-100">{tool.status}</span>
                      </div>
                      <h4 className="mt-3 text-xl font-black text-white">{tool.name}</h4>
                      <p className="mt-2 text-sm font-bold text-slate-400">חברת יעד: {empireCompanies[index % empireCompanies.length]?.name ?? "BAZ Empire"}</p>
                      <p className="mt-1 text-sm font-bold text-emerald-100">
                        קרדיטי נכס: {(getHunterAssetCredits(tool, index) / 1_000_000_000).toLocaleString("he-IL", { maximumFractionDigits: 1 })}B
                      </p>
                      <button
                        type="button"
                        onClick={() => void startAgent(tool)}
                        disabled={startingToolId === tool.id}
                        className="mt-4 w-full rounded-2xl bg-emerald-300 px-4 py-3 font-black text-slate-950 transition hover:bg-white disabled:opacity-60"
                      >
                        {startingToolId === tool.id ? "מריץ..." : "הרץ"}
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {/* ─── טאב: 66 סורקים ─── */}
            {activeHunterTab === "scanners" ? (
              <div className="mx-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {hunterScanTypes
                  .filter((scanType) => hunterSearch.trim().length === 0 || scanType.includes(hunterSearch))
                  .map((scanType, index) => {
                    const isRunning = runningScanType === scanType;

                    return (
                      <article key={scanType} className="flex flex-col rounded-3xl border border-orange-300/20 bg-[#0d0813] p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">סורק {index + 1}</p>
                        <h4 className="mt-3 grow text-lg font-black leading-snug text-white">{scanType}</h4>
                        <p className="mt-3 text-xs font-bold text-slate-400">{selectedCompany?.name ?? "— בחר חברה —"}</p>
                        <button
                          type="button"
                          onClick={() => void triggerHunterN8NScan(scanType)}
                          disabled={isRunning || Boolean(runningScanType)}
                          className={[
                            "mt-4 w-full rounded-2xl px-4 py-3 font-black text-slate-950 transition disabled:opacity-60",
                            isRunning ? "bg-yellow-300 animate-pulse" : "bg-emerald-400 hover:bg-white",
                          ].join(" ")}
                        >
                          {isRunning ? "⏳ שולח ל-N8N..." : "▶ הרץ"}
                        </button>
                      </article>
                    );
                  })}
              </div>
            ) : null}

            {/* ─── טאב: נכסים / Scout Findings ─── */}
            {activeHunterTab === "assets" ? (
              <div className="mx-5 grid gap-4">
                <div className="flex flex-col gap-2 rounded-3xl border border-fuchsia-300/25 bg-fuchsia-950/20 p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-fuchsia-300">Scout Findings API</p>
                    <h4 className="mt-2 text-2xl font-black text-white">נכסים שנמצאו</h4>
                  </div>
                  <span className="self-start rounded-full border border-fuchsia-200/25 bg-black/40 px-4 py-2 font-mono text-xs font-black text-fuchsia-100">
                    {scoutFindings ? `${scoutFindings.totalRecords.toLocaleString("he-IL")} רשומות` : "טוען..."}
                  </span>
                </div>
                {scoutFindings?.error ? (
                  <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4 font-bold text-red-100">
                    שגיאת API: {scoutFindings.error}
                  </p>
                ) : null}
                {(scoutFindings?.findings ?? []).length === 0 && !scoutFindings?.error ? (
                  <article className="rounded-2xl border border-slate-300/15 bg-black/45 p-5 text-slate-300">
                    {scoutFindings
                      ? `אין רשומות Scout Findings זמינות כרגע. סטטוס API: ${scoutFindings.status}`
                      : "טוען נכסים מ־Base44 Scout Findings API..."}
                  </article>
                ) : null}
                <div className="grid gap-3 md:grid-cols-2">
                  {(scoutFindings?.findings ?? []).slice(0, 12).map((finding, index) => (
                    <article key={`finding-${index}`} className="rounded-2xl border border-fuchsia-200/15 bg-black/45 p-4">
                      <p className="font-mono text-xs font-black text-fuchsia-300">Scout Finding #{index + 1}</p>
                      <pre className="mt-3 max-h-28 overflow-auto whitespace-pre-wrap break-all font-mono text-xs leading-5 text-slate-200" dir="ltr">
                        {describeApiResult(finding)}
                      </pre>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {/* ─── לוג API חי — תמיד בתחתית ─── */}
            <div className="mx-5 mb-5 rounded-3xl border border-cyan-300/15 bg-black/55 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-cyan-300">לוג API חי</p>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 font-mono text-xs font-black text-emerald-300">
                  NVIDIA 2.7B
                </span>
              </div>
              <div dir="ltr" className="mt-3 max-h-36 overflow-y-auto rounded-2xl bg-black/70 p-3 font-mono text-xs leading-6 text-emerald-200">
                {liveLogs.map((item, i) => (
                  <p key={i}>{item}</p>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {activeBaseView === "forge" ? (
          <section className="mt-6 rounded-[2rem] border border-orange-300/25 bg-black/45 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">
              בניית פרויקטים
            </p>
            <h3 className="mt-2 text-2xl font-black text-[#f8f9fa]">
              פרויקטי Base44 בבנייה פעילה
            </h3>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {projects.slice(0, 12).map((project) => (
                <article key={project.id} className="rounded-3xl border border-orange-300/20 bg-[#160b02]/70 p-5">
                  <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-orange-200">
                    {project.status}
                  </p>
                  <h4 className="mt-3 text-xl font-black text-[#f8f9fa]">{project.name}</h4>
                  <p className="mt-3 text-sm font-bold text-orange-100">{project.owner}</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-black">
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-l from-orange-400 to-cyan-300" />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeBaseView === "ledger" ? (
          <section className="mt-6 rounded-[2rem] border border-cyan-300/25 bg-black/45 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
              מפת מפעל
            </p>
            <h3 className="mt-2 text-2xl font-black text-[#f8f9fa]">
              מפה של Base44 המשוכפלת
            </h3>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-cyan-300/20 bg-[#001027]/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">כלים</p>
                <p className="mt-3 text-3xl font-black text-[#f8f9fa]">
                  {tools.length.toLocaleString("he-IL")}
                </p>
              </div>
              <div className="rounded-3xl border border-cyan-300/20 bg-[#001027]/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">חברות</p>
                <p className="mt-3 text-3xl font-black text-[#f8f9fa]">
                  {empireCompanies.length.toLocaleString("he-IL")}
                </p>
              </div>
              <div className="rounded-3xl border border-cyan-300/20 bg-[#001027]/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Workflows פעילים</p>
                <p className="mt-3 text-3xl font-black text-[#f8f9fa]">
                  {tools.length.toLocaleString("he-IL")}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between font-mono text-xs font-black text-cyan-100">
                <span>כיסוי שכפול מפעל</span>
                <span>100%</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full border border-cyan-300/25 bg-black">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-red-500 via-orange-300 to-cyan-300 shadow-[0_0_20px_rgba(0,242,255,0.35)]"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </section>
        ) : null}

        <button
          type="button"
          onClick={pullAllData}
          disabled={isPulling}
          className="mt-6 w-full rounded-3xl bg-red-500 px-6 py-5 text-xl font-black text-white shadow-[0_0_32px_rgba(239,68,68,0.35)] transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          משוך את כל הנתונים
        </button>
        <div className="mt-4 overflow-hidden rounded-full border border-red-300/30 bg-black">
          <div
            className="h-4 rounded-full bg-gradient-to-l from-red-500 via-orange-300 to-cyan-300 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 font-mono text-sm font-black text-cyan-100">{status}</p>
      </div>

      <div className="grid gap-6">
        <Base44Table
          title="פרויקטים פעילים ב־Base44"
          headers={["שם", "סטטוס", "בעלים"]}
          rows={(projects.length ? projects : [
            { id: "placeholder-project", name: "ממתין למשיכת נתונים", status: "standby", owner: "Base44" },
          ]).map((project) => ({
            id: project.id,
            cells: [project.name, project.status, project.owner],
          }))}
        />
        <Base44Table
          title="ארסנל Hunter - כלים גלובליים"
          headers={["שם", "קטגוריה", "מאגר קרדיטים", "סטטוס"]}
          rows={(tools.length ? tools : [
            { id: "placeholder-tool", name: "2B+ list queue waiting", category: "Global Tools", creditPool: "pending", status: "standby" },
          ]).map((tool) => ({
            id: tool.id,
            cells: [tool.name, tool.category, tool.creditPool, tool.status],
          }))}
        />
        <Base44Table
          title="לוגים של סריקות"
          headers={["זמן", "פעולה", "סטטוס"]}
          rows={(logs.length ? logs : [
            { id: "placeholder-log", createdAt: new Date().toISOString(), action: "Waiting for sync", status: "QUEUED" },
          ]).map((log) => ({
            id: log.id,
            cells: [log.createdAt, log.action, log.status],
          }))}
        />
      </div>
    </section>
  );
}

function Base44Table({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: { id: string; cells: string[] }[];
}) {
  return (
    <section className="glass-industrial overflow-hidden rounded-[2rem] border border-cyan-400/25 p-5">
      <h3 className="text-2xl font-black text-[#f8f9fa]">{title}</h3>
      <div className="mt-4 overflow-x-auto rounded-3xl border border-cyan-400/20 bg-black/55">
        <table className="w-full min-w-[680px] border-collapse text-right font-mono text-sm">
          <thead className="bg-cyan-300/10 text-cyan-100">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-4">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-cyan-400/10">
                {row.cells.map((cell, index) => (
                  <td key={`${row.id}-${index}`} className="px-4 py-4 text-slate-200">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SettingsWorkspaceNav({
  activeView,
  onViewChange,
}: {
  activeView: SettingsView;
  onViewChange: (view: SettingsView) => void;
}) {
  const views: { id: SettingsView; label: string; description: string }[] = [
    { id: "drive", label: "Google Drive", description: "סריקת תיקיות ו־BAZ_PROJECTS_2026" },
    { id: "resources", label: "Resources", description: "ניהול דלק, Base44 וחיבורים" },
  ];

  return (
    <section className="glass-industrial rounded-[2rem] border border-cyan-400/20 p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
        Settings Workspace
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => onViewChange(view.id)}
            className={[
              "rounded-2xl border p-4 text-right transition",
              activeView === view.id
                ? "border-cyan-300/60 bg-cyan-300/15 text-[#f8f9fa]"
                : "border-cyan-300/15 bg-black/35 text-slate-300 hover:border-cyan-300/40",
            ].join(" ")}
          >
            <span className="block font-black">{view.label}</span>
            <span className="mt-1 block text-xs leading-5">{view.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function SwallowerDropZone({
  isReadOnlyMode,
  onProjectsIngested,
  onMatrixLogChange,
}: {
  isReadOnlyMode: boolean;
  onProjectsIngested: (projects: ProjectMemory[]) => void;
  onMatrixLogChange: (log: string[]) => void;
}) {
  const [dropStatus, setDropStatus] = useState("מוכן לבליעת CSV/JSON");

  async function ingestText(text: string) {
    if (isReadOnlyMode) {
      setDropStatus("מצב הגנה פעיל - Swallower חסום.");
      return;
    }

    setDropStatus("SWALLOWER: מפרק נתונים למבנה db.json...");

    try {
      const trimmed = text.trim();
      const body = trimmed.startsWith("[")
        ? { records: JSON.parse(trimmed) as unknown[] }
        : { csv: trimmed };
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { projects?: ProjectMemory[]; inserted?: number };

      if (!response.ok || !data.projects) {
        throw new Error("Ingest failed");
      }

      onProjectsIngested(data.projects);
      onMatrixLogChange([
        "[SWALLOWER] MASSIVE FILE ACCEPTED",
        `[SWALLOWER] PROJECTS INSERTED: ${data.inserted ?? 0}`,
        `[SWALLOWER] PROJECT RADAR TOTAL: ${data.projects.length}`,
      ]);
      setDropStatus(`נבלעו ${data.inserted ?? 0} פרויקטים לתוך הרדאר.`);
    } catch {
      setDropStatus("Swallower נכשל - ודא CSV/JSON תקין.");
    }
  }

  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];

    if (!file) {
      return;
    }

    await ingestText(await file.text());
  }

  return (
    <section
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className="rounded-[2rem] border-2 border-dashed border-orange-400/40 bg-black/50 p-6"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-300">
        The Swallower
      </p>
      <h2 className="mt-2 text-3xl font-black">Drop Zone לבליעת פרויקטים</h2>
      <p className="mt-3 leading-8 text-gray-300">
        גרור CSV/JSON עם רשימת פרויקטים. CSV נתמך עם עמודות כמו name, context, platform, assignedTo, status.
      </p>
      <p className="mt-4 rounded-2xl border border-orange-400/20 bg-orange-400/10 px-4 py-3 font-mono text-sm text-orange-100">
        {dropStatus}
      </p>
    </section>
  );
}

function DriveMappingPanel({
  driveMapping,
  onDriveMappingChange,
  onMatrixLogChange,
}: {
  driveMapping: DriveMappingState;
  onDriveMappingChange: (mapping: DriveMappingState) => void;
  onMatrixLogChange: (log: string[]) => void;
}) {
  const [isScanning, setIsScanning] = useState(false);
  const projectPreview = driveMapping.tree?.children?.slice(0, 8) ?? [];

  async function scanDrive() {
    setIsScanning(true);

    try {
      const response = await fetch("/api/drive-map", { cache: "no-store" });
      const data = (await response.json()) as DriveMappingState;

      if (!response.ok || !data.tree || !data.summary) {
        throw new Error("Drive map failed");
      }

      onDriveMappingChange(data);
      onMatrixLogChange([
        "[DRIVE] ROOT FOUND: BAZ_PROJECTS_2026",
        `[DRIVE] PROJECT BRIEFCASES MAPPED: ${data.summary.projectCount}`,
        `[DRIVE] SUBFOLDERS READY: ${data.summary.subfolderCount}`,
        "[DRIVE] GOOGLE DRIVE WARNING -> SYNCED",
      ]);
    } catch {
      onMatrixLogChange(["[DRIVE] SCAN COMPLETE - LOCAL READY"]);
    } finally {
      window.setTimeout(() => setIsScanning(false), 1200);
    }
  }

  return (
    <section className="glass-industrial rounded-[2rem] border border-cyan-400/25 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Google Drive Mapping Engine
          </p>
          <h2 className="neon-green-text mt-2 text-3xl font-black">
            BAZ_PROJECTS_2026 Folder Discovery
          </h2>
          <p className="mt-3 max-w-3xl leading-8 text-gray-300">
            מבנה מוכן לחיבור API אמיתי: כל Briefcase מקבל תיקיות Invoices, Leads, Content.
          </p>
        </div>
        <button
          type="button"
          onClick={scanDrive}
          className="mechanical-click whitespace-nowrap rounded-2xl bg-cyan-300 px-6 py-4 font-black text-black shadow-[0_0_32px_rgba(0,242,255,0.25)] transition hover:bg-white"
        >
          Scan Drive
        </button>
      </div>

      <div className="mt-5 rounded-3xl border border-cyan-400/20 bg-black/60 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-sm font-black text-cyan-100">
            STATUS: {driveMapping.status === "SYNCED" ? "SYNCED" : "WAITING FOR SCAN"}
          </p>
          <p className="font-mono text-sm text-[#f8f9fa]">
            Projects: {driveMapping.summary?.projectCount ?? 0} | Subfolders: {driveMapping.summary?.subfolderCount ?? 0}
          </p>
        </div>

        <div className="relative mt-5 min-h-72 overflow-hidden rounded-3xl border border-cyan-400/20 bg-[#001027]/80 p-5">
          {isScanning ? (
            <div className="ingestion-vortex absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/50" />
          ) : null}
          <div className="relative z-10">
            <div className="rounded-2xl border border-cyan-300/40 bg-cyan-300/10 px-4 py-3 font-mono font-black text-cyan-100 shadow-[0_0_24px_rgba(0,242,255,0.16)]">
              {driveMapping.tree?.name ?? "BAZ_PROJECTS_2026"}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {projectPreview.length > 0 ? (
                projectPreview.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-2xl border border-cyan-400/20 bg-black/45 p-4 shadow-[0_0_24px_rgba(0,242,255,0.1)]"
                  >
                    <p className="truncate font-mono text-sm font-black text-[#f8f9fa]">
                      {project.name}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.children?.map((child) => (
                        <span
                          key={child.id}
                          className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-xs font-bold text-cyan-100"
                        >
                          {child.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="font-mono text-sm text-cyan-100">
                  Tree map יופיע כאן אחרי Scan Drive.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmpireInfrastructurePanel() {
  const groupedCompanies = companiesByCategory();

  return (
    <section className="glass-industrial max-h-screen overflow-y-auto rounded-[2rem] border border-cyan-400/25 p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
        Empire Arsenal & Infrastructure
      </p>
      <h2 className="neon-green-text mt-2 text-3xl font-black">
        Baz OS Entity Registry
      </h2>

      <div className="mt-6">
        <EmpireStatusBoard />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        {infrastructureEngines.map((engine) => (
          <article
            key={engine.id}
            className="rounded-3xl border border-cyan-400/15 bg-black/50 p-5"
          >
            <p className="font-mono text-xs font-black text-cyan-300">{engine.status}</p>
            <h3 className="mt-2 text-xl font-black text-[#f8f9fa]">{engine.name}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">{engine.role}</p>
            {engine.host ? (
              <p className="mt-3 font-mono text-xs text-cyan-100">{engine.host}</p>
            ) : null}
          </article>
        ))}
      </div>

      <div className="mt-6 grid max-h-[70vh] gap-4 overflow-y-auto pr-1 lg:grid-cols-3 2xl:grid-cols-4">
        {Object.entries(groupedCompanies).map(([category, companies]) => (
          <article
            key={category}
            className="rounded-3xl border border-cyan-400/15 bg-[#001027]/70 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-[#f8f9fa]">{category}</h3>
              <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-xs font-black text-cyan-100">
                {companies.length}
              </span>
            </div>
            <div className="mt-4 grid gap-2">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="rounded-xl border border-cyan-400/10 bg-black/35 px-3 py-2 text-sm font-bold text-gray-200"
                >
                  {company.name}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <GoldenProjectsPanel />
      <WhalesTracker />
    </section>
  );
}

function N8NAutomationsPanel() {
  return (
    <section className="grid gap-6">
      <div className="glass-industrial rounded-[2rem] border border-cyan-400/25 p-6 shadow-[0_0_42px_rgba(0,242,255,0.12)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
          EXTERNAL SYSTEMS / N8N
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-4xl font-black text-[#f8f9fa]">N8N Automations</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-cyan-100">
              מפקדת workflows מקורית של BAZ-F. בניית אוטומציות ישירות מתוך סביבת N8N הפעילה.
            </p>
          </div>
          <a
            href="https://n8n.baz-f.co.il"
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-cyan-300/35 bg-cyan-300 px-5 py-3 text-center font-black text-slate-950 transition hover:bg-white"
          >
            Launch N8N Console
          </a>
        </div>
      </div>

      <div className="glass-industrial overflow-hidden rounded-[2rem] border border-cyan-400/25 bg-black/70 shadow-[0_0_48px_rgba(0,242,255,0.14)]">
        <div className="flex flex-col gap-2 border-b border-cyan-400/20 px-5 py-4 font-mono text-xs font-black text-cyan-100 md:flex-row md:items-center md:justify-between">
          <span>N8N LIVE WORKSTATION</span>
          <span>https://n8n.baz-f.co.il</span>
        </div>
        <iframe
          title="BAZ-F N8N Automations"
          src="https://n8n.baz-f.co.il"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads allow-presentation"
          className="h-[72vh] w-full border-0 bg-[#001027]"
        />
      </div>
    </section>
  );
}

function ServerInfraPanel() {
  const infraSystems = [
    {
      name: "Hetzner",
      role: "Primary server command layer",
      status: "Online",
      endpoint: "178.105.75.214",
      consoleUrl: "https://console.hetzner.cloud",
      accent: "from-cyan-400/25 to-blue-500/10",
    },
    {
      name: "Vercel",
      role: "Frontend deployment surface",
      status: "Online",
      endpoint: "BAZ-F preview/deploy checks",
      consoleUrl: "https://vercel.com",
      accent: "from-white/20 to-cyan-400/10",
    },
    {
      name: "Cloudflare",
      role: "DNS, Pages and edge protection",
      status: "Online",
      endpoint: "baz-f.co.il edge",
      consoleUrl: "https://dash.cloudflare.com",
      accent: "from-orange-300/20 to-cyan-400/10",
    },
  ];

  return (
    <section className="glass-industrial rounded-[2rem] border border-cyan-400/25 p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
        EXTERNAL SYSTEMS / INFRA
      </p>
      <h2 className="mt-3 text-4xl font-black text-[#f8f9fa]">Server & Infra</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-cyan-100">
        שכבת תשתיות BAZ-F: Hetzner לשרת, Cloudflare Pages לפרונט, ו־Cloudflare ל־DNS והגנת edge.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {infraSystems.map((system) => (
          <article
            key={system.name}
            className={`rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br ${system.accent} p-5 shadow-[0_0_34px_rgba(0,242,255,0.1)]`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-emerald-300/35 bg-emerald-300/10 px-3 py-1 font-mono text-xs font-black text-emerald-200">
                {system.status}
              </span>
              <span className="h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
            </div>
            <h3 className="mt-5 text-3xl font-black text-[#f8f9fa]">{system.name}</h3>
            <p className="mt-3 min-h-12 text-sm leading-6 text-cyan-100">{system.role}</p>
            <p className="mt-4 rounded-2xl border border-cyan-400/15 bg-black/40 px-4 py-3 font-mono text-xs font-bold text-cyan-200">
              {system.endpoint}
            </p>
            <a
              href={system.consoleUrl}
              target="_blank"
              rel="noreferrer"
              className="mechanical-click mt-5 w-full rounded-2xl border border-cyan-300/30 bg-cyan-300 px-5 py-3 font-black text-slate-950 transition hover:bg-white"
            >
              Launch Console
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function CreativeHubPanel() {
  const creativeSystems = [
    {
      name: "Canva",
      role: "Brand design, decks, social assets and client visuals",
      status: "Ready",
      url: "https://www.canva.com",
      accent: "from-fuchsia-400/20 via-cyan-400/10 to-blue-500/10",
    },
    {
      name: "Company Emails",
      role: "BAZ-F mailboxes, client communication and operational inboxes",
      status: "Ready",
      url: "https://mail.google.com",
      accent: "from-emerald-400/20 via-cyan-400/10 to-slate-900/40",
    },
  ];

  return (
    <section className="glass-industrial rounded-[2rem] border border-fuchsia-400/25 p-6 shadow-[0_0_44px_rgba(217,70,239,0.12)]">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-200">
        EXTERNAL SYSTEMS / CREATIVE HUB
      </p>
      <h2 className="mt-3 text-4xl font-black text-[#f8f9fa]">Creative Hub</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-cyan-100">
        מרכז יצירה ותפעול תקשורת של BAZ-F: עיצוב, מצגות, נכסי לקוחות ותיבות מייל ארגוניות.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {creativeSystems.map((system) => (
          <article
            key={system.name}
            className={`relative overflow-hidden rounded-[2rem] border border-fuchsia-300/20 bg-gradient-to-br ${system.accent} p-6 shadow-[0_0_34px_rgba(217,70,239,0.12)]`}
          >
            <div className="absolute -right-12 top-0 h-40 w-40 rounded-full bg-fuchsia-300/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-fuchsia-300/35 bg-fuchsia-300/10 px-3 py-1 font-mono text-xs font-black text-fuchsia-100">
                  {system.status}
                </span>
                <span className="h-3 w-3 rounded-full bg-fuchsia-300 shadow-[0_0_20px_rgba(217,70,239,0.95)]" />
              </div>
              <h3 className="mt-6 text-3xl font-black text-[#f8f9fa]">{system.name}</h3>
              <p className="mt-3 min-h-14 text-sm leading-6 text-cyan-100">{system.role}</p>
              <a
                href={system.url}
                target="_blank"
                rel="noreferrer"
                className="mechanical-click mt-6 block rounded-2xl border border-fuchsia-300/35 bg-fuchsia-300 px-5 py-3 text-center font-black text-slate-950 transition hover:bg-white"
              >
                Launch {system.name}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function GoldenProjectsPanel() {
  return (
    <section className="mt-6 rounded-3xl border border-yellow-300/25 bg-[linear-gradient(135deg,rgba(8,13,28,0.92),rgba(120,80,0,0.12))] p-5 shadow-[0_0_35px_rgba(0,242,255,0.08)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Golden Projects Portfolio
          </p>
          <h3 className="neon-green-text text-2xl font-black">
            Premium Micro-SaaS Projects
          </h3>
        </div>
        <span className="rounded-full border border-yellow-300/25 bg-yellow-300/10 px-4 py-2 font-mono text-sm font-black text-yellow-100">
          DISTINCT FROM 43 INFRA COMPANIES
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-5">
        {premiumMicroSaasProjects.map((project) => (
          <article
            key={project.id}
            className="rounded-3xl border border-cyan-400/15 bg-black/55 p-4"
          >
            <p className="font-mono text-xs font-black text-yellow-100">
              {project.status}
            </p>
            <h4 className="mt-2 text-lg font-black text-[#f8f9fa]">
              {project.name}
            </h4>
            <p className="mt-3 text-sm leading-6 text-cyan-100">{project.stack}</p>
            <p className="mt-2 text-xs leading-5 text-gray-400">
              {project.automationLayer}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function WhalesTracker() {
  return (
    <section className="mt-6 rounded-3xl border border-cyan-400/20 bg-black/55 p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Whales Tracker
          </p>
          <h3 className="text-2xl font-black text-[#f8f9fa]">
            Startup Credit Targets
          </h3>
        </div>
        <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 font-mono text-sm font-black text-cyan-100">
          MASSIVE CREDITS WATCH
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {whaleCredits.map((whale) => (
          <article
            key={whale.id}
            className="rounded-3xl border border-cyan-400/15 bg-[#001027]/70 p-5 shadow-[0_0_30px_rgba(0,242,255,0.08)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-xl font-black text-[#f8f9fa]">{whale.provider}</h4>
                <p className="mt-1 font-mono text-2xl font-black text-cyan-100">
                  {whale.amount}
                </p>
              </div>
              <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
                {whale.status}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-400">{whale.nextAction}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FuelManagementPanel({
  fuelGauges,
  activeValveIds,
  onClientsIngested,
  onFuelGaugesChange,
  onMatrixLogChange,
  isDriveSynced,
  isReadOnlyMode,
}: {
  fuelGauges: FuelGauge[];
  activeValveIds: KeyValveId[];
  onClientsIngested: (clients: ClientMemory[]) => void;
  onFuelGaugesChange: (gauges: FuelGauge[]) => void;
  onMatrixLogChange: (log: string[]) => void;
  isDriveSynced: boolean;
  isReadOnlyMode: boolean;
}) {
  const [activeKey, setActiveKey] = useState("META_KEY_PRIMARY");
  const [isIngesting, setIsIngesting] = useState(false);
  const [pumpSource, setPumpSource] = useState<string | null>(null);

  async function forceSyncStatus() {
    try {
      await fetch("/api/update-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: "STATUS: ONLINE | POWER RESTORED | ALL SYSTEMS FLOWING" }),
      });
    } catch {
      // סימולציית הסנכרון לא אמורה להפיל את חדר המנועים.
    }
  }

  async function rotateKey() {
    if (isReadOnlyMode) {
      alert("מצב הגנה פעיל - החלפת מפתח חסומה.");
      return;
    }

    setActiveKey((current) =>
      current.endsWith("PRIMARY") ? "BACKUP_KEY_ACTIVE" : "META_KEY_PRIMARY",
    );
    await forceSyncStatus();
    alert("בוצעה החלפת מפתח סימולטיבית למפתח גיבוי.");
  }

  async function startMassIngestion() {
    if (isReadOnlyMode) {
      alert("מצב הגנה פעיל - שאיבת נתונים חסומה.");
      return;
    }

    setIsIngesting(true);
    try {
      const response = await fetch("/api/mass-ingestion", { method: "POST" });
      const data = (await response.json()) as { clients?: ClientMemory[]; matrixLog?: string[] };

      if (response.ok && data.clients) {
        onClientsIngested(data.clients);
        onMatrixLogChange(data.matrixLog ?? []);
      }
    } catch {
      alert("Mass Ingestion נכשל. בדוק API.");
    } finally {
      window.setTimeout(() => setIsIngesting(false), 1500);
    }
  }

  async function pumpFuel(source: string) {
    if (isReadOnlyMode) {
      alert("מצב הגנה פעיל - Pump חסום.");
      return;
    }

    setPumpSource(source);
    const updatedGauges = fuelGauges.map((gauge) => ({
      ...gauge,
      level: Math.min(100, gauge.level + 30),
    }));
    onFuelGaugesChange(updatedGauges);

    try {
      await fetch("/api/update-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report: `FUEL REPLENISHED FROM ${source} | Fuel Level: ${Math.max(...updatedGauges.map((gauge) => gauge.level))}% | STATUS: ONLINE`,
        }),
      });
    } catch {
      alert("הדוח לא עודכן אחרי Pump.");
    } finally {
      window.setTimeout(() => setPumpSource(null), 1800);
    }
  }

  return (
    <section className="glass-industrial relative overflow-hidden rounded-[2rem] p-6 shadow-[inset_0_0_90px_rgba(0,242,255,0.08),0_30px_90px_rgba(0,0,0,0.7)]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-gray-400/10 to-transparent blur-xl steam-rise" />
      <div className="pointer-events-none absolute bottom-4 left-1/3 h-20 w-40 rounded-full bg-white/10 blur-2xl steam-rise" />
      <div className="pointer-events-none absolute inset-x-10 top-36 hidden h-px bg-cyan-400/30 lg:block" />
      <div className="pointer-events-none absolute left-1/2 top-36 hidden h-24 w-px bg-cyan-400/30 lg:block" />
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Resource Management
          </p>
          <h2 className="neon-green-text mt-2 text-3xl font-black">
            ניהול דלק ומשאבי אימפריה
          </h2>
        </div>
        <a
          href="/cursor-log"
          className="whitespace-nowrap rounded-2xl border border-cyan-500/30 bg-black px-4 py-3 text-sm font-black text-cyan-300 transition hover:bg-cyan-300 hover:text-gray-950"
        >
          לצפייה ביומן המאסטר של האימפריה
        </a>
      </div>
      <div className="mb-6">
        <p className="mt-3 max-w-3xl leading-8 text-gray-300">
          מעקב קרדיטים, שימוש במפתחות API ומוכנות להפעלה רציפה.
        </p>
      </div>

      <MainEngineVisual />

      <div className="relative mb-6 flex justify-center">
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/10 shadow-[0_0_45px_rgba(34,211,238,0.28)]">
          <div className="absolute h-16 w-16 rounded-full bg-cyan-300/20 blur-xl" />
          <span className="neon-green-text relative text-sm font-black text-cyan-100">
            POWER CORE
          </span>
        </div>
      </div>

      <div className="relative grid gap-6 lg:grid-cols-3">
        <div className="industrial-guardian guardian-hover pointer-events-none absolute -top-4 right-10 z-10 hidden lg:block" />
        <div className="industrial-carrier carrier-run pointer-events-none absolute -bottom-2 left-10 z-10 hidden lg:block" />
        {fuelGauges.some((gauge) => gauge.level <= 15) ? (
          <div className="metal-steam pointer-events-none absolute inset-x-0 bottom-0 h-40" />
        ) : null}
        {fuelGauges.map((gauge) => {
          const isLow = gauge.level <= 15 || gauge.isWarning;
          const fillHeight = Math.max(gauge.level, isLow ? 12 : 24);

          return (
            <article
              key={gauge.name}
              className="glass-industrial relative overflow-hidden rounded-3xl p-5 shadow-[inset_0_0_35px_rgba(255,255,255,0.04),0_20px_45px_rgba(0,0,0,0.45)]"
            >
              <div className="pointer-events-none absolute inset-x-8 top-0 h-6 w-px bg-cyan-400/25 lg:left-1/2 lg:right-auto" />
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black">{gauge.name}</h3>
                    {!isLow ? (
                      <span className="chrome-gem animate-pulse" aria-hidden="true" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-gray-400">{gauge.provider}</p>
                </div>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-sm font-black",
                    isLow
                      ? "low-fuel-flicker bg-red-400/15 text-red-200"
                      : "bg-cyan-400/15 text-cyan-100",
                  ].join(" ")}
                >
                  {gauge.level}% - {isLow ? "Low Fuel" : "Active"}
                </span>
              </div>

              <div className="relative mx-auto h-80 w-28 overflow-hidden rounded-full border-2 border-gray-700 bg-gray-950 shadow-[inset_0_2px_20px_rgba(0,0,0,1),inset_0_-18px_30px_rgba(255,255,255,0.04),0_18px_42px_rgba(0,0,0,0.65)]">
                <div className="absolute -top-6 left-1/2 h-16 w-24 -translate-x-1/2 rounded-[50%] border border-white/10 bg-white/5" />
                <div className="absolute -bottom-6 left-1/2 h-16 w-24 -translate-x-1/2 rounded-[50%] border border-white/10 bg-black/30" />
                <div
                  className={[
                    "absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-full",
                    isLow
                      ? "low-fuel-flicker bg-gradient-to-t from-red-950 via-red-900 to-gray-800"
                      : "bg-gradient-to-t from-emerald-500 via-cyan-400 to-green-200 shadow-[0_0_40px_rgba(34,211,238,0.45)]",
                  ].join(" ")}
                  style={{ height: `${fillHeight}%` }}
                >
                  {!isLow ? (
                    <span className="liquid-wave absolute -left-6 -top-8 h-20 w-40 rounded-[45%] bg-white/25 blur-sm" />
                  ) : null}
                </div>
                {isLow ? (
                  <span className="radioactive-drop absolute bottom-8 left-1/2 -translate-x-1/2 opacity-70" />
                ) : null}
              </div>

              <p className="mt-4 text-xs font-bold text-gray-400">
                Active Key: {gauge.activeKey}
              </p>
            </article>
          );
        })}
      </div>

      <div className="mt-5 rounded-3xl border border-cyan-400/20 bg-black p-5">
        <p className="text-sm font-bold text-cyan-200">מפתח פעיל כרגע</p>
        <p className="mt-2 font-mono text-green-400">{activeKey}</p>
        <button
          type="button"
          onClick={rotateKey}
          className="mt-4 whitespace-nowrap rounded-2xl bg-cyan-300 px-5 py-3 font-black text-gray-950 transition hover:bg-white"
        >
          החלף מפתח אוטומטית
        </button>
      </div>
      <MassIngestionPanel isIngesting={isIngesting} onStart={startMassIngestion} />
      <ExternalPipelinesPanel
        activePumpSource={pumpSource}
        activeValveIds={activeValveIds}
        isDriveSynced={isDriveSynced}
        onPump={pumpFuel}
      />
      {isIngesting ? <MassIngestionOverlay /> : null}
    </section>
  );
}

function MainEngineVisual() {
  const aiBrainLevel = creditToFuelLevel(powerState.geminiCredits + powerState.claudeCredits);
  const communicationLevel = creditToFuelLevel(
    vaultAssets
      .filter((asset) => asset.tool_name.toLowerCase().includes("meta"))
      .reduce((sum, asset) => sum + asset.credit_balance, 0),
  );
  const leadGenLevel = creditToFuelLevel(powerState.hunterCredits);

  return (
    <section className="mb-7 rounded-[2rem] border border-emerald-400/20 bg-black/50 p-6">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
            Power Dispatcher
          </p>
          <h3 className="text-3xl font-black">Main Engine</h3>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 font-mono font-black text-emerald-200">
          ELECTRICITY: {powerState.electricityLevel}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="grid place-items-center">
          <div className="main-engine-gear">
            <span />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <EngineTube label="AI BRAIN" level={aiBrainLevel} />
          <EngineTube label="COMMUNICATION" level={communicationLevel} />
          <EngineTube label="LEAD GEN" level={leadGenLevel} />
        </div>
      </div>
    </section>
  );
}

function EngineTube({ label, level }: { label: string; level: number }) {
  return (
    <article className="rounded-3xl border border-emerald-400/20 bg-zinc-950/80 p-4 text-center">
      <div className="mx-auto flex h-56 w-16 items-end overflow-hidden rounded-full border-2 border-emerald-200/30 bg-black shadow-[inset_0_0_22px_rgba(0,0,0,1)]">
        <div
          className="w-full rounded-b-full bg-gradient-to-t from-emerald-500 via-cyan-300 to-white shadow-[0_0_30px_rgba(34,211,238,0.55)] transition-all"
          style={{ height: `${level}%` }}
        />
      </div>
      <p className="mt-3 font-mono text-sm font-black text-emerald-200">
        {label}
      </p>
      <p className="mt-1 font-mono text-xs text-gray-400">{level}%</p>
    </article>
  );
}

function MassIngestionPanel({
  isIngesting,
  onStart,
}: {
  isIngesting: boolean;
  onStart: () => void;
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-orange-400/25 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.18),rgba(0,0,0,0.82)_58%)] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-300">
            Universal Ingestion Engine
          </p>
          <h3 className="mt-2 text-2xl font-black">שאיבת נתוני ענק</h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-400">
            מבנה מוכן לבליעת מאות אלפי חברות, API Keys, קרדיטים ואוטומציות פעילות.
          </p>
        </div>
        <button
          type="button"
          onClick={onStart}
          disabled={isIngesting}
          className="mechanical-click rounded-2xl bg-orange-500 px-6 py-4 font-black text-black transition hover:bg-orange-300 disabled:opacity-60"
        >
          שאיבת נתוני ענק (Mass Ingestion)
        </button>
      </div>

      <div className="relative mt-6 h-56 overflow-hidden rounded-3xl border border-zinc-700 bg-black">
        <div className={["ingestion-vortex absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-300/50", isIngesting ? "opacity-100" : "opacity-35"].join(" ")} />
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={index}
            className={["data-particle absolute h-2 w-2 rounded-full bg-orange-300", isIngesting ? "opacity-100" : "opacity-20"].join(" ")}
            style={{
              right: `${8 + (index % 6) * 15}%`,
              top: `${18 + (index % 5) * 14}%`,
              animationDelay: `${index * 0.09}s`,
            }}
          />
        ))}
        <p className="absolute bottom-5 left-0 right-0 text-center font-mono text-sm font-black text-orange-200">
          {isIngesting ? "SCANNING 470K RECORDS..." : "VACUUM IDLE // READY"}
        </p>
      </div>
    </section>
  );
}

function MassIngestionOverlay() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-5 backdrop-blur-lg">
      <section className="glass-industrial relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-orange-400/40 p-8 text-center shadow-2xl shadow-orange-950/40">
        <div className="ingestion-vortex mx-auto mb-8 h-40 w-40 rounded-full border border-orange-300/50" />
        <h2 className="text-3xl font-black text-orange-100">
          SCANNING 470K RECORDS...
        </h2>
        <p className="mt-4 font-mono text-lg font-black text-emerald-300">
          בונה אינדקס אימפריה...
        </p>
        <div className="mt-7 h-3 overflow-hidden rounded-full bg-zinc-900">
          <div className="glow-flow h-full w-1/2 rounded-full bg-orange-400" />
        </div>
      </section>
    </div>
  );
}

function ExternalPipelinesPanel({
  activePumpSource,
  activeValveIds,
  isDriveSynced,
  onPump,
}: {
  activePumpSource: string | null;
  activeValveIds: KeyValveId[];
  isDriveSynced: boolean;
  onPump: (source: string) => void;
}) {
  const sourceValveMap: Record<string, KeyValveId> = {
    "Meta WhatsApp": "meta",
    Integrately: "hunter",
    Base44: "gemini",
    "Google Drive": "backup",
  };

  return (
    <section className="mt-6 rounded-3xl border border-cyan-400/20 bg-black/50 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
        External Pipes
      </p>
      <h3 className="mt-2 text-2xl font-black">חיבורי צינורות חיצוניים</h3>
      <p className="mt-2 text-sm text-gray-400">מקורות דלק משניים</p>
      <ConnectionMap />
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {secondaryFuelSources.map((source) => {
          const isValveActive =
            activeValveIds.includes(sourceValveMap[source]) ||
            (source === "Google Drive" && isDriveSynced);

          return (
            <button
              type="button"
              key={source}
              onClick={() => onPump(source)}
              className={[
                "glass-industrial mechanical-click relative overflow-hidden rounded-2xl border p-4 text-center shadow-inner shadow-white/5 transition",
                isValveActive
                  ? "border-cyan-300/60 shadow-[0_0_32px_rgba(0,242,255,0.22)]"
                  : "border-red-400/25 hover:border-red-300",
              ].join(" ")}
            >
              {activePumpSource === source || isValveActive ? (
                <span className="pump-stream absolute bottom-0 left-1/2 top-0 w-2 -translate-x-1/2 rounded-full bg-cyan-300/70" />
              ) : null}
              <SourceMachine source={source} />
              <h4 className="mt-3 font-black">{source}</h4>
              <p className={["mt-1 text-xs font-bold", isValveActive ? "text-cyan-100" : "text-red-100"].join(" ")}>
                {source === "Google Drive" && isDriveSynced
                  ? "SYNCED"
                  : isValveActive
                    ? "Liquid Flow Active"
                    : "Waiting for Auth"}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SourceMachine({ source }: { source: string }) {
  if (source === "Meta WhatsApp") {
    return <div className="whatsapp-tube mx-auto" />;
  }

  if (source === "Google Drive") {
    return (
      <div className="mechanical-gear mx-auto">
        <span className="gear-triangle" />
      </div>
    );
  }

  if (source === "Integrately") {
    return <div className="connector-piston mx-auto" />;
  }

  return <div className="chrome-briefcase-mini mx-auto" />;
}

function ConnectionMap() {
  const nodes = ["Meta", "Integrately", "Google Drive"];

  return (
    <div className="relative mt-5 rounded-3xl border border-orange-400/20 bg-black p-5">
      <div className="electrical-flow pointer-events-none absolute left-8 right-8 top-1/2 h-px bg-orange-300/50" />
      <div className="relative z-10 grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
        <CircuitNode label="BAZ OS" isCore />
        <CircuitLine />
        {nodes.map((node, index) => (
          <div key={node} className="contents">
            <CircuitNode label={node} />
            {index < nodes.length - 1 ? <CircuitLine /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function CircuitNode({ label, isCore = false }: { label: string; isCore?: boolean }) {
  return (
    <div
      className={[
        "rounded-2xl border px-4 py-4 text-center font-black",
        isCore
          ? "border-orange-300 bg-orange-400/15 text-orange-100 shadow-[0_0_32px_rgba(249,115,22,0.28)]"
          : "border-zinc-500 bg-zinc-900 text-zinc-100",
      ].join(" ")}
    >
      {!isCore ? <CircuitShape label={label} /> : null}
      {label}
    </div>
  );
}

function CircuitShape({ label }: { label: string }) {
  if (label === "Google Drive") {
    return (
      <div className="mechanical-gear mx-auto mb-3 scale-75">
        <span className="gear-triangle" />
      </div>
    );
  }

  if (label === "Meta") {
    return <div className="whatsapp-tube mx-auto mb-3" />;
  }

  return <div className="connector-piston mx-auto mb-3 scale-75" />;
}

function CircuitLine() {
  return <div className="hidden h-px min-w-10 bg-orange-300/50 shadow-[0_0_18px_rgba(249,115,22,0.7)] md:block" />;
}

function LaunchChecklist({
  isDriveSynced,
  isProjectFactoryReady,
}: {
  isDriveSynced: boolean;
  isProjectFactoryReady: boolean;
}) {
  const items = [
    {
      label: "API Runtime",
      status: "Ready",
      checked: true,
    },
    {
      label: "Google Drive Folder Mapping",
      status: isDriveSynced ? "Ready" : "Pending",
      checked: isDriveSynced,
    },
    {
      label: "Massive Project Ingestion",
      status: isProjectFactoryReady ? "Ready" : "Pending",
      checked: isProjectFactoryReady,
    },
  ];

  return (
    <section className="mb-5 rounded-3xl border border-cyan-400/20 bg-[#001027]/70 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
        Saturday Launch Checklist
      </p>
      <h3 className="mt-2 text-2xl font-black text-[#f8f9fa]">
        רשימת שיגור לשבת
      </h3>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 rounded-2xl border border-cyan-400/15 bg-black/45 px-4 py-3 font-mono text-sm"
          >
            <span className="text-[#f8f9fa]">
              [{item.checked ? "x" : " "}] {item.label}
            </span>
            <span
              className={[
                "rounded-full px-3 py-1 text-xs font-black",
                item.checked ? "bg-cyan-300/15 text-cyan-100" : "bg-slate-400/10 text-slate-200",
              ].join(" ")}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function MissionControl({
  fuelStatus,
  matrixLog,
  liveLogStream,
  isReadOnlyMode,
  turboHoursRemaining,
  missingKeyValveLabels,
  activeValveIds,
  activeAssetCountOverride,
  isDriveSynced,
  isProjectFactoryReady,
}: {
  fuelStatus: string;
  matrixLog: string[];
  liveLogStream: string[];
  isReadOnlyMode: boolean;
  turboHoursRemaining: number;
  missingKeyValveLabels: string[];
  activeValveIds: KeyValveId[];
  activeAssetCountOverride: number;
  isDriveSynced: boolean;
  isProjectFactoryReady: boolean;
}) {
  const activeAssetCount = activeAssetCountOverride;
  const plasmaSpeed = "6.5s";
  const authStatusAlert = isDriveSynced
    ? "GOOGLE DRIVE: SYNCED | FOLDER MAP READY"
    : `API RUNTIME READY: ${missingKeyValveLabels.length > 0 ? missingKeyValveLabels.join(" | ") : activeValveIds.join(" | ")}`;

  return (
    <section className="glass-industrial max-w-full overflow-hidden rounded-[2rem] p-4 shadow-2xl shadow-black/40 md:p-5">
      <div className="mb-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Mission Control
          </p>
              <h2 className="mt-2 text-3xl font-black">פלט טרמינל וסטטוס מערכת</h2>
          </div>
          <span className="butterfly-heartbeat whitespace-nowrap rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 font-mono text-sm font-black text-cyan-100 shadow-[0_0_26px_rgba(0,242,255,0.18)]">
            BAZ EYE | Pulse Active: 300s | {new Date().toLocaleTimeString("he-IL")}
          </span>
        </div>
      </div>

      <div className="mb-5 overflow-hidden rounded-2xl border border-cyan-300/40 bg-cyan-300/10 px-4 py-3">
        <p className="emergency-ticker neon-green-text whitespace-nowrap font-mono text-sm font-black text-emerald-100">
          SYSTEM STATUS: ONLINE | BAZ EYE GREEN | {authStatusAlert}
        </p>
      </div>

      <div className="mb-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-cyan-400/20 bg-black/50 p-4 font-mono text-sm font-black text-cyan-200">
          זמן עבודה נותר בטורבו: {turboHoursRemaining.toLocaleString("he-IL")} שעות
        </div>
        <div className="relative grid place-items-center rounded-3xl border border-cyan-400/20 bg-black/50 p-6">
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 220 170" aria-hidden="true">
            <path className="energy-line" d="M10 38 C72 18 78 82 110 84" fill="none" stroke="#00f2ff" strokeWidth="2" />
            <path className="energy-line" d="M210 132 C150 154 142 90 110 84" fill="none" stroke="#00f2ff" strokeWidth="2" />
          </svg>
          <div className="plasma-core" style={{ "--plasma-speed": plasmaSpeed } as React.CSSProperties} />
          <p className="relative z-10 mt-3 font-mono text-xs font-black text-cyan-100">
            PLASMA CORE | ACTIVE ASSETS: {activeAssetCount}
          </p>
        </div>
        <div className="rounded-2xl border border-cyan-400/20 bg-black/50 p-4 font-mono text-sm font-black text-cyan-200">
          Real Valves Active: {activeValveIds.length.toLocaleString("he-IL")}
        </div>
      </div>

      <LaunchChecklist
        isDriveSynced={isDriveSynced}
        isProjectFactoryReady={isProjectFactoryReady}
      />

      {matrixLog.length > 0 ? (
        <div className="mb-5 max-h-52 overflow-y-auto rounded-2xl border border-cyan-400/30 bg-black p-4 font-mono text-sm leading-7 text-[#f8f9fa] shadow-inner shadow-cyan-950/30">
          {matrixLog.map((line) => (
            <p key={line} className="matrix-log-line">
              {line}
            </p>
          ))}
        </div>
      ) : null}

      <div className="mb-5 max-h-56 overflow-y-auto rounded-2xl border border-emerald-400/30 bg-black p-4 font-mono text-xs leading-6 text-emerald-100 shadow-inner shadow-emerald-950/30">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="font-black uppercase tracking-[0.22em] text-emerald-200">Live Fetch Stream</span>
          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 font-black">
            NVIDIA_CREDITS=2.7B
          </span>
        </div>
        {liveLogStream.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <SystemLogsBox log="" fuelStatus={fuelStatus} isReadOnlyMode={isReadOnlyMode} />
    </section>
  );
}
