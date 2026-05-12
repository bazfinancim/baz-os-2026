/**
 * כותב את דו"ח ה-Visual Auditor לקובץ ב-src/data (ללא גיבוי מלא)
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildPanelLayoutReport } from "../src/logic/visual-auditor";

const root = process.cwd();
const out = join(root, "src", "data", "panel_layout_audit.txt");
writeFileSync(out, buildPanelLayoutReport(), "utf8");
console.log("נכתב:", out);
