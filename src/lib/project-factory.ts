import { readDbWithRecovery, writeDbWithSnapshot } from "@/src/lib/db-manager";

export type FactoryFuelPriority = "High" | "Medium" | "Low";

export type FactoryProject = {
  id: string;
  name: string;
  context: string;
  platform: string;
  assignedTo: string;
  status: string;
  sector: string;
  fuelPriority: FactoryFuelPriority;
  fuelLevel: number;
  protectionStatus: "LOCKED";
  isLocked: boolean;
  needsAttention: boolean;
};

type EmpireDb = {
  lastSync?: string;
  projects: FactoryProject[];
};

function slugify(value: string, fallback: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9א-ת]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function sectorFor(name: string) {
  const haystack = name.toLowerCase();

  if (/seo|organic|content|backlink|תוכן|קידום/.test(haystack)) {
    return "SEO";
  }

  if (/invoice|finance|billing|ledger|חשבונית|פיננס/.test(haystack)) {
    return "Finance";
  }

  if (/meta|ads|campaign|marketing|lead|שיווק|קמפיין|לידים/.test(haystack)) {
    return "Marketing";
  }

  if (/bot|whatsapp|automation|n8n|api|בוט|אוטומ/.test(haystack)) {
    return "Automation";
  }

  return "Web Assets";
}

function priorityFor(sector: string): FactoryFuelPriority {
  if (sector === "Finance" || sector === "Marketing" || sector === "Automation") {
    return "High";
  }

  if (sector === "SEO" || sector === "Web Assets") {
    return "Medium";
  }

  return "Low";
}

function fuelLevelFor(priority: FactoryFuelPriority, index: number) {
  if (priority === "High") {
    return 88 + (index % 12);
  }

  if (priority === "Medium") {
    return 62 + (index % 18);
  }

  return 38 + (index % 16);
}

function normalizeFactoryProject(name: string, index: number): FactoryProject {
  const sector = sectorFor(name);
  const fuelPriority = priorityFor(sector);
  const fuelLevel = Math.min(100, fuelLevelFor(fuelPriority, index));

  return {
    id: slugify(name, `factory-project-${index + 1}`),
    name,
    context: `Factory generated ${sector} briefcase. Ready for Saturday data injection.`,
    platform: "BAZ_PROJECTS_2026",
    assignedTo: index % 2 === 0 ? "Alon" : "Itay",
    status: "factory-ready",
    sector,
    fuelPriority,
    fuelLevel,
    protectionStatus: "LOCKED",
    isLocked: true,
    needsAttention: false,
  };
}

export async function createEmpire(projectList: string[]) {
  const cleanList = projectList.map((name) => name.trim()).filter(Boolean).slice(0, 70);
  const generatedProjects = cleanList.map(normalizeFactoryProject);
  const db = await readDbWithRecovery<EmpireDb>();
  const byId = new Map<string, FactoryProject>();

  for (const project of db.projects) {
    byId.set(project.id, project);
  }

  for (const project of generatedProjects) {
    byId.set(project.id, project);
  }

  const updatedProjects = Array.from(byId.values());
  const updatedDb = {
    ...db,
    lastSync: new Date().toISOString(),
    projects: updatedProjects,
  };

  await writeDbWithSnapshot(updatedDb);

  return {
    status: "factory-ready",
    generated: generatedProjects.length,
    totalProjects: updatedProjects.length,
    projects: updatedProjects,
  };
}
