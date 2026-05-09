import db from "@/src/lib/db.json";

type ExternalSource = "drive" | "base44";

type ProjectMemory = {
  id: string;
  name: string;
  context: string;
  platform: string;
  assignedTo: string;
  status: string;
};

type ExternalFolderNode = {
  id: string;
  source: ExternalSource;
  path: string;
  projectId: string;
  projectName: string;
  assignedTo: string;
  status: string;
};

function normalizeSourceName(source: ExternalSource) {
  return source === "drive" ? "Google Drive" : "Base44";
}

export function scanExternalSource(source: ExternalSource): ExternalFolderNode[] {
  const projects = (db as { projects: ProjectMemory[] }).projects;
  const sourceName = normalizeSourceName(source);

  return projects
    .filter((project) => project.platform.toLowerCase().includes(source === "drive" ? "drive" : "base44"))
    .map((project, index) => ({
      id: `${source}-${project.id}-${index + 1}`,
      source,
      path: `${sourceName}/BAZ_OS_PROJECTS/${project.assignedTo}/${project.id}`,
      projectId: project.id,
      projectName: project.name,
      assignedTo: project.assignedTo,
      status: project.status,
    }));
}

export function scanAllExternalSources() {
  return {
    drive: scanExternalSource("drive"),
    base44: scanExternalSource("base44"),
  };
}
