import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const dbFile = join(process.cwd(), "src", "lib", "db.json");
const backupDir = join(process.cwd(), "src", "lib", "backups");

function snapshotName(date = new Date()) {
  return `db-${date.toISOString().replace(/[:.]/g, "-")}.json`;
}

async function ensureBackupDir() {
  await mkdir(backupDir, { recursive: true });
}

async function createSnapshotFromRaw(rawDb: string) {
  await ensureBackupDir();
  const backupFile = join(backupDir, snapshotName());
  await writeFile(backupFile, rawDb.endsWith("\n") ? rawDb : `${rawDb}\n`, "utf8");
  return backupFile;
}

async function latestBackupFile() {
  await ensureBackupDir();
  const files = (await readdir(backupDir))
    .filter((file) => file.startsWith("db-") && file.endsWith(".json"))
    .sort();

  return files.length > 0 ? join(backupDir, files[files.length - 1]) : null;
}

export async function readDbWithRecovery<T>() {
  try {
    const rawDb = await readFile(dbFile, "utf8");
    return JSON.parse(rawDb) as T;
  } catch {
    const backupFile = await latestBackupFile();

    if (!backupFile) {
      throw new Error("db.json is missing or corrupted and no backup exists.");
    }

    const backupRaw = await readFile(backupFile, "utf8");
    JSON.parse(backupRaw);
    await writeFile(dbFile, backupRaw.endsWith("\n") ? backupRaw : `${backupRaw}\n`, "utf8");
    return JSON.parse(backupRaw) as T;
  }
}

export async function writeDbWithSnapshot<T>(db: T) {
  let previousRaw = "";

  try {
    previousRaw = await readFile(dbFile, "utf8");
  } catch {
    previousRaw = JSON.stringify(db, null, 2);
  }

  const backupFile = await createSnapshotFromRaw(previousRaw);
  await writeFile(dbFile, `${JSON.stringify(db, null, 2)}\n`, "utf8");

  return {
    backupFile,
    snapshotAt: new Date().toISOString(),
  };
}
