/**
 * מילוי discovered_tools.json מקומי בלבד — ללא API.
 * סדר עדיפות: BAZ_ALL_APPS_EXPORT.json (אם קיים) → ai_export.json.programs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "src", "data");
const outPath = path.join(dataDir, "discovered_tools.json");

const candidates = [
  path.join(dataDir, "BAZ_ALL_APPS_EXPORT.json"),
  path.join(__dirname, "..", "BAZ_ALL_APPS_EXPORT.json"),
  path.join(__dirname, "..", "..", "BAZ_ALL_APPS_EXPORT.json"),
];

function extractToolsFromExport(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  if (Array.isArray(raw.tools)) return raw.tools;
  if (Array.isArray(raw.programs)) return raw.programs;
  if (Array.isArray(raw.discovered_tools)) return raw.discovered_tools;
  if (Array.isArray(raw.discoveredTools)) return raw.discoveredTools;
  return [];
}

let tools = [];
let source = "fallback:ai_export.programs";

for (const p of candidates) {
  if (!fs.existsSync(p)) continue;
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  tools = extractToolsFromExport(raw);
  if (tools.length) {
    source = `file:${path.basename(p)}`;
    break;
  }
}

if (tools.length === 0) {
  const aiPath = path.join(dataDir, "ai_export.json");
  const ai = JSON.parse(fs.readFileSync(aiPath, "utf8"));
  tools = Array.isArray(ai.programs) ? ai.programs : [];
  source = "fallback:ai_export.programs";
}

fs.writeFileSync(outPath, JSON.stringify(tools, null, 2), "utf8");
console.log(`Wrote ${tools.length} records to discovered_tools.json (${source})`);
