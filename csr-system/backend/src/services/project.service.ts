import { Project } from "../models/Project";
import { ApiError } from "../utils/ApiError";
import { softDeleteById } from "../utils/softDelete";
import type { ProjectType } from "../types/enums";

export interface CreateProjectInput {
  name: string;
  slug: string;
  type: ProjectType;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  parentProjectId?: string | null;
  createdBy: string;
}

export async function createProject(input: CreateProjectInput) {
  const existing = await Project.findOne({ slug: input.slug.toLowerCase() });
  if (existing) throw ApiError.conflict(`Project slug "${input.slug}" is already taken`);

  return Project.create({
    name: input.name,
    slug: input.slug.toLowerCase(),
    type: input.type,
    contactEmail: input.contactEmail.toLowerCase(),
    contactPhone: input.contactPhone,
    website: input.website,
    parentProjectId: input.parentProjectId ?? null,
    createdBy: input.createdBy,
  });
}

export async function listProjects(query: { status?: string; type?: string }) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  return Project.find(filter).sort({ createdAt: -1 });
}

export async function getProjectById(id: string) {
  const project = await Project.findById(id);
  if (!project) throw ApiError.notFound("Project not found");
  return project;
}

export async function updateProject(id: string, updates: Partial<CreateProjectInput>, updatedBy: string) {
  const project = await getProjectById(id);
  Object.assign(project, updates, { updatedBy });
  await project.save();
  return project;
}

export async function deleteProject(id: string, deletedBy: string) {
  const project = await softDeleteById(Project, id, {}, deletedBy);
  if (!project) throw ApiError.notFound("Project not found");
  return project;
}
