/**
 * Empire Backup — גיבוי src/data ל-backups/v[TIMESTAMP] + commit + תג CLEAN_STATE
 * הרצה: npm run empire:snapshot (מתוך my-app)
 */
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execSync, spawnSync } from "node:child_process";
import { buildPanelLayoutReport } from "../src/logic/visual-auditor";

const root = process.cwd();
const srcData = join(root, "src", "data");
const backupsRoot = join(root, "backups");

/** העתקת תיקייה — ב-Windows לעיתים cpSync זורק EIO; robocopy יציב יותר */
function copyDataTree(src: string, dest: string): void {
  if (process.platform === "win32") {
    const res = spawnSync(
      "robocopy",
      [src, dest, "/E", "/R:2", "/W:1", "/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np"],
      { stdio: "inherit", windowsHide: true },
    );
    const code = res.status ?? 1;
    if (code >= 8) {
      console.error(`robocopy נכשל (קוד ${code})`);
      process.exit(1);
    }
    return;
  }
  cpSync(src, dest, { recursive: true });
}

function main() {
  if (!existsSync(srcData)) {
    console.error("לא נמצא src/data");
    process.exit(1);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const versionDir = `v${stamp}`;
  const destRoot = join(backupsRoot, versionDir);
  const destData = join(destRoot, "data");

  mkdirSync(destRoot, { recursive: true });

  const report = buildPanelLayoutReport();
  writeFileSync(join(destRoot, "LAYOUT_AUDIT.txt"), report, "utf8");
  copyDataTree(srcData, destData);
  writeFileSync(join(destData, "panel_layout_audit.txt"), report, "utf8");

  const auditLive = join(srcData, "panel_layout_audit.txt");
  writeFileSync(auditLive, report, "utf8");

  const relBackup = join("backups", versionDir).replace(/\\/g, "/");
  const relAudit = join("src", "data", "panel_layout_audit.txt").replace(/\\/g, "/");

  try {
    execSync(`git add ${JSON.stringify(relBackup)} ${JSON.stringify(relAudit)}`, {
      cwd: root,
      stdio: "inherit",
    });
  } catch {
    console.error("git add נכשל — ודא שאתה בתוך repo עם git");
    process.exit(1);
  }

  const msg = `chore(snapshot): CLEAN_STATE empire backup ${versionDir}`;
  try {
    execSync(`git commit -m ${JSON.stringify(msg)}`, { cwd: root, stdio: "inherit" });
  } catch {
    console.warn("אין commit (אולי אין שינויים?) — ממשיך לתיוג אם אפשר");
  }

  const tagUnique = `CLEAN_STATE-${stamp}`;
  try {
    execSync(`git tag -a ${JSON.stringify(tagUnique)} -m ${JSON.stringify("CLEAN_STATE")}`, {
      cwd: root,
      stdio: "inherit",
    });
  } catch (e) {
    console.warn("תג ייחודי נכשל:", e);
  }

  try {
    execSync(`git tag -d CLEAN_STATE`, { cwd: root, stdio: "pipe" });
  } catch {
    /* אין תג קודם */
  }
  try {
    execSync(`git tag CLEAN_STATE`, { cwd: root, stdio: "inherit" });
  } catch {
    console.warn("תג CLEAN_STATE נכשל");
  }

  console.log(`נקודת שחזור: ${destRoot}`);
  console.log(`תגים: ${tagUnique}, CLEAN_STATE`);
}

main();
