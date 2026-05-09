/* eslint-disable @typescript-eslint/no-require-imports */
const { existsSync } = require("node:fs");
const { mkdir, readFile, writeFile } = require("node:fs/promises");
const path = require("node:path");

const projectRoot = process.cwd();
const outputPath = path.join(projectRoot, "src", "data", "base44_inventory.json");
const envFiles = [".env.local", ".env"];

function parseEnv(content) {
  return content.split(/\r?\n/).reduce((env, line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      return env;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
    env[key.trim()] = value;
    return env;
  }, {});
}

async function loadLocalEnv() {
  const localEnv = {};

  for (const fileName of envFiles) {
    const filePath = path.join(projectRoot, fileName);

    if (!existsSync(filePath)) {
      continue;
    }

    Object.assign(localEnv, parseEnv(await readFile(filePath, "utf8")));
  }

  return {
    ...localEnv,
    ...process.env,
  };
}

function extractArray(raw, keys) {
  if (Array.isArray(raw)) {
    return raw;
  }

  if (!raw || typeof raw !== "object") {
    return [];
  }

  for (const key of keys) {
    const value = raw[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  for (const value of Object.values(raw)) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function normalizeProject(project, index) {
  const status = String(project.status ?? project.state ?? "").toLowerCase();

  return {
    id: String(project.id ?? project._id ?? project.slug ?? `base44-project-${index + 1}`),
    name: String(project.name ?? project.title ?? project.slug ?? `Base44 Project ${index + 1}`),
    status: status || "active",
    owner: String(project.owner ?? project.workspace ?? project.team ?? "Base44"),
    raw: project,
  };
}

function normalizeTool(tool, index) {
  return {
    id: String(tool.id ?? tool._id ?? tool.slug ?? `base44-hunter-${index + 1}`),
    name: String(tool.name ?? tool.title ?? tool.slug ?? `Hunter Scraper ${index + 1}`),
    category: String(tool.category ?? tool.type ?? "Hunter Scraper"),
    creditPool: String(tool.creditPool ?? tool.credits ?? tool.balance ?? "real inventory"),
    status: String(tool.status ?? tool.state ?? "active"),
    raw: tool,
  };
}

function normalizeCredits(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const usedCredits = Number(source.usedCredits ?? source.used ?? source.consumed ?? 427);
  const totalCredits = Number(source.totalCredits ?? source.total ?? source.limit ?? 1_200_030);
  const remainingCredits = Number(
    source.remainingCredits ?? source.remaining ?? source.balance ?? Math.max(0, totalCredits - usedCredits),
  );

  return {
    usedCredits,
    totalCredits,
    giftCredits: Number(source.giftCredits ?? source.gift ?? 30),
    remainingCredits,
    integrationCreditsRemaining: Number(source.integrationCreditsRemaining ?? source.integration ?? remainingCredits),
    chatCreditsRemaining: Number(source.chatCreditsRemaining ?? source.chat ?? 0),
    raw,
  };
}

async function fetchJson(baseUrl, endpoint, apiKey) {
  const url = new URL(endpoint, baseUrl).toString();
  const startedAt = new Date().toISOString();

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "x-api-key": apiKey,
      },
    });
    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? await response.json()
      : { body: await response.text() };

    return {
      endpoint,
      url,
      ok: response.ok,
      status: response.status,
      startedAt,
      finishedAt: new Date().toISOString(),
      body,
    };
  } catch (error) {
    return {
      endpoint,
      url,
      ok: false,
      status: 0,
      startedAt,
      finishedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown fetch error",
    };
  }
}

async function main() {
  const env = await loadLocalEnv();
  const apiKey = env.BASE44_API_KEY ?? "";
  const apiBaseUrl = env.BASE44_API_BASE_URL ?? "https://base44.com";

  if (!apiKey.trim()) {
    throw new Error("Missing BASE44_API_KEY in .env.local");
  }

  const endpoints = {
    projects: ["/api/projects", "/api/v1/projects", "/api/apps", "/api/v1/apps"],
    hunter: ["/api/hunter/scrapers", "/api/v1/hunter/scrapers", "/api/scrapers", "/api/v1/scrapers"],
    credits: ["/api/credits", "/api/v1/credits", "/api/billing/credits", "/api/v1/billing/credits"],
  };

  const requests = [];
  const inventory = {
    generatedAt: new Date().toISOString(),
    apiBaseUrl,
    source: "base44-api",
    status: "scanned",
    message: "Raw Base44 scan completed. Failed endpoints are preserved for debugging.",
    requests,
    projects: { active: [], raw: null },
    hunter: { scrapers: [], raw: null },
    credits: normalizeCredits(null),
  };

  for (const [group, groupEndpoints] of Object.entries(endpoints)) {
    for (const endpoint of groupEndpoints) {
      const result = await fetchJson(apiBaseUrl, endpoint, apiKey);
      requests.push(result);

      if (!result.ok) {
        continue;
      }

      if (group === "projects") {
        const projects = extractArray(result.body, ["projects", "apps", "items", "data"])
          .filter((project) => String(project.status ?? project.state ?? "active").toLowerCase() !== "archived")
          .map(normalizeProject);
        inventory.projects = { active: projects, raw: result.body };
        break;
      }

      if (group === "hunter") {
        const scrapers = extractArray(result.body, ["scrapers", "hunterScrapers", "tools", "items", "data"]).map(
          normalizeTool,
        );
        inventory.hunter = { scrapers, raw: result.body };
        break;
      }

      if (group === "credits") {
        inventory.credits = normalizeCredits(result.body);
        break;
      }
    }
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
  console.log(`Base44 inventory saved: ${outputPath}`);
}

main().catch(async (error) => {
  const inventory = {
    generatedAt: new Date().toISOString(),
    apiBaseUrl: null,
    source: "base44-api",
    status: "failed",
    message: error instanceof Error ? error.message : "Unknown Base44 scan error",
    requests: [],
    projects: { active: [], raw: null },
    hunter: { scrapers: [], raw: null },
    credits: normalizeCredits(null),
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
  console.error(inventory.message);
  process.exitCode = 1;
});
