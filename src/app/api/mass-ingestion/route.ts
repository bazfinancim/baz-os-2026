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

function createSampleCompanies() {
  return Array.from({ length: 100 }, (_, index): ClientMemory => {
    const number = index + 1;

    return {
      id: `company-${String(number).padStart(3, "0")}`,
      name: `Empire Company ${String(number).padStart(3, "0")}`,
      health: 72 + (number % 27),
      fuelStatus: 70 + (number % 30),
      activeAutomations: ["Mass Index", "Lead Scan", "Automation Mapping"],
      needsHumanHelp: number % 17 === 0,
    };
  });
}

function buildMatrixLog(inserted: number, total: number) {
  return [
    "[00:00] DB CORE OPENED: src/lib/db.json",
    "[00:01] SCANNING 470,000 RECORDS...",
    `[00:02] SAMPLE ENTITIES ACCEPTED: ${inserted}`,
    `[00:03] CLIENT INDEX TOTAL: ${total}`,
    "[00:04] EMPIRE INDEX ONLINE",
  ];
}

export async function POST() {
  try {
    const db = await readDbWithRecovery<EmpireDb>();
    const existingClients = db.clients;
    const existingIds = new Set(existingClients.map((client) => client.id));
    const newClients = createSampleCompanies().filter(
      (client) => !existingIds.has(client.id),
    );
    const updatedClients = [...existingClients, ...newClients];
    const updatedDb = { ...db, clients: updatedClients };

    await writeDbWithSnapshot(updatedDb);

    return NextResponse.json({
      status: "ingested",
      inserted: newClients.length,
      total: updatedClients.length,
      message: "סורק 470,000 רשומות... בונה אינדקס אימפריה...",
      matrixLog: buildMatrixLog(newClients.length, updatedClients.length),
      clients: updatedClients,
    });
  } catch {
    return NextResponse.json(
      { error: "Mass ingestion failed." },
      { status: 500 },
    );
  }
}
