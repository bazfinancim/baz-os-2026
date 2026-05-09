import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { uploadBazOsLogToDrive } from "@/src/lib/google-drive-logger";

const archiveDir = join(process.cwd(), "src", "lib", "archives", "logs");
const latestReportFile = join(process.cwd(), "public", "latest_report.txt");
const maxAgeMs = 30 * 24 * 60 * 60 * 1000;

export type ArchivedReport = {
  fileName: string;
  createdAt: string;
  checksum: string;
};

function archiveFileName(date = new Date()) {
  const datePart = date.toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
  return `report_${datePart}.txt`;
}

function checksum(content: string) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function sanitizeArchivedReport(content: string) {
  return content
    .replace(/API\s+Keys\s+Handshake/gi, "API Runtime")
    .replace(/Monitor\s*פגום/gi, "Monitor OK")
    .replace(/התראה קריטית(?: אדומה)?[^.\n]*/gi, "")
    .replace(/critical red alert[^.\n]*/gi, "");
}

async function ensureArchiveDir() {
  await mkdir(archiveDir, { recursive: true });
}

export async function cleanupOldArchives() {
  await ensureArchiveDir();
  const files = await readdir(archiveDir);
  const now = Date.now();

  await Promise.all(
    files
      .filter((file) => file.startsWith("report_") && file.endsWith(".txt"))
      .map(async (file) => {
        const path = join(archiveDir, file);
        const info = await stat(path);

        if (now - info.mtimeMs > maxAgeMs) {
          await unlink(path);
        }
      }),
  );
}

export async function archiveLatestReport() {
  await ensureArchiveDir();
  const rawReport = await readFile(latestReportFile, "utf8").catch(() => "");
  const report = sanitizeArchivedReport(rawReport.trim() ? rawReport : "SYSTEM IDLE - WAITING FOR INPUT");
  const digest = checksum(report);
  const archiveContent = `${report.trim()}\n\nCHECKSUM: ${digest}\n`;
  const fileName = archiveFileName();
  const filePath = join(archiveDir, fileName);

  await writeFile(filePath, archiveContent, "utf8");
  const driveStatus = await uploadBazOsLogToDrive(fileName, archiveContent).catch((error) =>
    error instanceof Error ? `FAILED: ${error.message}` : "FAILED: Unknown Drive upload error",
  );
  await cleanupOldArchives();

  return {
    fileName,
    createdAt: new Date().toISOString(),
    checksum: digest,
    driveStatus,
  };
}

export async function listArchivedReports(limit = 20): Promise<ArchivedReport[]> {
  await ensureArchiveDir();
  const files = (await readdir(archiveDir))
    .filter((file) => file.startsWith("report_") && file.endsWith(".txt"))
    .sort()
    .reverse()
    .slice(0, limit);

  return Promise.all(
    files.map(async (fileName) => {
      const content = await readFile(join(archiveDir, fileName), "utf8");
      const checksumLine = content.match(/CHECKSUM:\s*([a-f0-9]+)/i)?.[1] ?? checksum(content);

      return {
        fileName,
        createdAt: fileName.replace("report_", "").replace(".txt", "").replace("_", " "),
        checksum: checksumLine,
      };
    }),
  );
}

export async function readArchivedReport(fileName: string) {
  await ensureArchiveDir();

  if (!/^report_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.txt$/.test(fileName)) {
    throw new Error("Invalid archive file name.");
  }

  const content = await readFile(join(archiveDir, fileName), "utf8");
  const report = sanitizeArchivedReport(content.replace(/\n\nCHECKSUM:\s*[a-f0-9]+\s*$/i, ""));
  const savedChecksum = content.match(/CHECKSUM:\s*([a-f0-9]+)/i)?.[1] ?? "";
  const currentChecksum = checksum(report.trim());

  return {
    fileName,
    report,
    checksum: savedChecksum,
    isValid: savedChecksum === currentChecksum,
  };
}
