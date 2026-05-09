import { NextResponse } from "next/server";
import { readDbWithRecovery, writeDbWithSnapshot } from "@/src/lib/db-manager";

type VaultAsset = {
  id: string;
  tool_name: string;
  api_key: string;
  expiry_date: string;
  credit_balance: number;
  status: string;
};

type EmpireDb = {
  vault_assets: VaultAsset[];
};

function normalizeExpiryStatus(asset: VaultAsset): VaultAsset {
  const now = new Date();
  const expiry = new Date(`${asset.expiry_date}T23:59:59`);
  const daysLeft = (expiry.getTime() - now.getTime()) / 86_400_000;

  if (daysLeft >= 0 && daysLeft < 7) {
    return { ...asset, status: "CRITICAL_EXPIRY" };
  }

  return asset;
}

async function readDb() {
  return readDbWithRecovery<EmpireDb>();
}

async function writeDb(db: EmpireDb) {
  await writeDbWithSnapshot(db);
}

export async function GET() {
  try {
    const db = await readDb();
    const assets = db.vault_assets.map(normalizeExpiryStatus);

    return NextResponse.json({ assets });
  } catch {
    return NextResponse.json(
      { error: "Failed to load vault assets." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const asset = (await req.json()) as Partial<VaultAsset>;

    if (!asset.id || !asset.tool_name || !asset.api_key || !asset.expiry_date) {
      return NextResponse.json(
        { error: "id, tool_name, api_key and expiry_date are required." },
        { status: 400 },
      );
    }

    const db = await readDb();
    const normalizedAsset = normalizeExpiryStatus({
      id: asset.id,
      tool_name: asset.tool_name,
      api_key: asset.api_key,
      expiry_date: asset.expiry_date,
      credit_balance: asset.credit_balance ?? 0,
      status: asset.status ?? "ACTIVE",
    });
    const existingIndex = db.vault_assets.findIndex(
      (item) => item.id === normalizedAsset.id,
    );

    if (existingIndex >= 0) {
      db.vault_assets[existingIndex] = normalizedAsset;
    } else {
      db.vault_assets.push(normalizedAsset);
    }

    await writeDb(db);

    return NextResponse.json({ status: "saved", asset: normalizedAsset });
  } catch {
    return NextResponse.json(
      { error: "Failed to save vault asset." },
      { status: 500 },
    );
  }
}
