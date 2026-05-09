export type DriveFolderNode = {
  id: string;
  name: string;
  type: "root" | "project" | "subfolder";
  status: "FOUND" | "MAPPED" | "READY";
  children?: DriveFolderNode[];
};

type ProjectLike = {
  id: string;
  name: string;
};

const rootFolderName = "BAZ_PROJECTS_2026";
const projectSubfolders = ["Invoices", "Leads", "Content"] as const;

function slug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9א-ת]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function buildProjectFolder(project: ProjectLike): DriveFolderNode {
  const projectId = slug(project.id || project.name);

  return {
    id: `drive-project-${projectId}`,
    name: project.name,
    type: "project",
    status: "MAPPED",
    children: projectSubfolders.map((subfolder) => ({
      id: `drive-project-${projectId}-${subfolder.toLowerCase()}`,
      name: subfolder,
      type: "subfolder",
      status: "READY",
    })),
  };
}

export function discoverBazProjectsRoot(projects: ProjectLike[]): DriveFolderNode {
  return {
    id: "drive-root-baz-projects-2026",
    name: rootFolderName,
    type: "root",
    status: "FOUND",
    children: projects.map(buildProjectFolder),
  };
}

export function summarizeDriveMapping(root: DriveFolderNode) {
  const projectCount = root.children?.length ?? 0;
  const subfolderCount =
    root.children?.reduce((sum, project) => sum + (project.children?.length ?? 0), 0) ?? 0;

  return {
    rootFolderName,
    rootFound: root.status === "FOUND",
    projectCount,
    subfolderCount,
    isReady: root.status === "FOUND" && projectCount > 0,
  };
}
