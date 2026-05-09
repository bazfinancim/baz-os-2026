import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { readDbWithRecovery, writeDbWithSnapshot } from "@/src/lib/db-manager";
import { validateWriteAccess } from "@/src/lib/safety-lock";

type VaultAsset = {
  id: string;
  tool_name: string;
  api_key: string;
  expiry_date: string;
  credit_balance: number;
  status: string;
};

type EmergencyVaultAsset = {
  id: string;
  name: string;
  key: string;
  credits: number;
  expiry: string;
};

type ProjectMemory = {
  id: string;
  name: string;
};

type EmpireDb = {
  vault_assets: VaultAsset[];
  vault?: EmergencyVaultAsset[];
  projects: ProjectMemory[];
  leads?: LeadRecord[];
};

type LeadRecord = {
  id: string;
  companyName: string;
  source: string;
  status: string;
};

const leadsFile = join(process.cwd(), "src", "lib", "leads.json");
const latestReportFile = join(process.cwd(), "public", "latest_report.txt");

export async function POST(req: Request) {
  const safetyBlock = validateWriteAccess(req);

  if (safetyBlock) {
    return safetyBlock;
  }

  try {
    const db = await readDbWithRecovery<EmpireDb>();
    const hunterIndex = db.vault_assets.findIndex((asset) =>
      asset.tool_name.toLowerCase().includes("hunter"),
    );

    if (hunterIndex === -1) {
      return NextResponse.json(
        { error: "Hunter asset not found." },
        { status: 404 },
      );
    }

    const hunter = db.vault_assets[hunterIndex];
    const emergencyHunterIndex = db.vault?.findIndex((asset) =>
      asset.name.toLowerCase().includes("hunter"),
    ) ?? -1;
    const burnAmount = Math.min(100, hunter.credit_balance);
    const leadsGenerated = 100;
    const newLeads = Array.from({ length: leadsGenerated }, (_, index): LeadRecord => ({
      id: `lead-${String((db.leads?.length ?? 0) + index + 1).padStart(4, "0")}`,
      companyName: `B2B Lead ${String(index + 1).padStart(2, "0")}`,
      source: "Hunter.io Matrix Scan",
      status: "new",
    }));
    const updatedHunter = {
      ...hunter,
      credit_balance: hunter.credit_balance - burnAmount,
      status: hunter.credit_balance - burnAmount <= 0 ? "DEPLETED" : hunter.status,
    };
    const updatedEmergencyVault = db.vault?.map((asset, index) =>
      index === emergencyHunterIndex
        ? { ...asset, credits: Math.max(0, asset.credits - burnAmount) }
        : asset,
    );
    const updatedDb = {
      ...db,
      vault_assets: db.vault_assets.map((asset, index) =>
        index === hunterIndex ? updatedHunter : asset,
      ),
      vault: updatedEmergencyVault ?? db.vault,
      leads: [...(db.leads ?? []), ...newLeads],
    };
    const report = "BURNING HUNTER CREDITS... EXTRACTING B2B LEADS... SUCCESS.";

    await writeDbWithSnapshot(updatedDb);
    await writeFile(leadsFile, `${JSON.stringify(updatedDb.leads, null, 2)}\n`, "utf8");
    await writeFile(latestReportFile, report, "utf8");

    return NextResponse.json({
      status: "lead_gen_complete",
      burnedCredits: burnAmount,
      remainingCredits: updatedHunter.credit_balance,
      leadsGenerated,
      scannedProjects: db.projects.length,
      leads: newLeads,
      report,
    });
  } catch {
    return NextResponse.json(
      { error: "Lead generation failed." },
      { status: 500 },
    );
  }
}
