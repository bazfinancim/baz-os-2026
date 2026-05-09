export type EmpireEntityBase = {
  id: string;
  companyName: string;
  apiKey: string;
  credits: number;
  activeAutomations: string[];
};

export type IngestionBatch = {
  source: "Meta" | "Integrately" | "Google Drive" | "Base44" | "Manual";
  receivedAt: string;
  entities: EmpireEntityBase[];
};

export type IngestionResult = {
  totalEntities: number;
  acceptedEntities: number;
  rejectedEntities: number;
  readyForVirtualScrolling: boolean;
};

export const baseEmpireEntity: EmpireEntityBase = {
  id: "entity-template",
  companyName: "Company Name",
  apiKey: "API_KEY_PLACEHOLDER",
  credits: 0,
  activeAutomations: [],
};

export function normalizeEntity(entity: EmpireEntityBase): EmpireEntityBase {
  return {
    id: entity.id.trim(),
    companyName: entity.companyName.trim(),
    apiKey: entity.apiKey.trim(),
    credits: Math.max(0, entity.credits),
    activeAutomations: entity.activeAutomations.filter(Boolean),
  };
}

export function prepareMassIngestion(batch: IngestionBatch): IngestionResult {
  const acceptedEntities = batch.entities.filter(
    (entity) => entity.id && entity.companyName,
  ).length;

  return {
    totalEntities: batch.entities.length,
    acceptedEntities,
    rejectedEntities: batch.entities.length - acceptedEntities,
    readyForVirtualScrolling: batch.entities.length >= 1000,
  };
}
