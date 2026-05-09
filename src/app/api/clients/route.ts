import { NextResponse } from "next/server";
import { readDbWithRecovery, writeDbWithSnapshot } from "@/src/lib/db-manager";

type ClientMemory = {
  id: string;
  name: string;
  health: number;
  fuelStatus: number;
  activeAutomations: string[];
  needsHumanHelp: boolean;
};

type EmpireDb = {
  clients: ClientMemory[];
};

async function readDb() {
  return readDbWithRecovery<EmpireDb>();
}

async function writeDb(db: EmpireDb) {
  await writeDbWithSnapshot(db);
}

export async function GET() {
  try {
    const db = await readDb();
    return NextResponse.json({ clients: db.clients });
  } catch {
    return NextResponse.json(
      { error: "Failed to load clients." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { clientId } = (await req.json()) as { clientId?: string };

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required." },
        { status: 400 },
      );
    }

    const db = await readDb();
    const updatedClients = db.clients.map((client) =>
      client.id === clientId ? { ...client, needsHumanHelp: true } : client,
    );
    const flaggedClient = updatedClients.find((client) => client.id === clientId);

    if (!flaggedClient) {
      return NextResponse.json(
        { error: "Client not found." },
        { status: 404 },
      );
    }

    await writeDb({ ...db, clients: updatedClients });

    return NextResponse.json({
      status: "flagged",
      client: flaggedClient,
      clients: updatedClients,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to flag client." },
      { status: 500 },
    );
  }
}
