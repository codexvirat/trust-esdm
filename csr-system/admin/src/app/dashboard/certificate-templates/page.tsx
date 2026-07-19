import { requireAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { CertificateTemplate, Project } from "@/lib/types";
import { ProjectFilter } from "@/components/ProjectFilter";
import { CreateTemplateForm } from "./CreateTemplateForm";
import { DeleteTemplateButton } from "./DeleteTemplateButton";

export default async function CertificateTemplatesPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const { accessToken, user } = await requireAdminRole();
  const { projectId: requestedProjectId } = await searchParams;
  const projectId = requestedProjectId || user.projectId;

  const [projects, templates] = await Promise.all([
    apiFetch<Project[]>("/projects", { accessToken }),
    apiFetch<CertificateTemplate[]>(`/certificate-templates?projectId=${projectId}`, { accessToken }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Certificate templates</h1>
        <p className="mt-1 text-sm text-slate-500">Used when issuing a certificate from a candidate&apos;s enrollment.</p>
      </div>

      <ProjectFilter projects={projects} selectedId={projectId} basePath="/dashboard/certificate-templates" />

      <CreateTemplateForm projectId={projectId} />

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <ul className="divide-y divide-slate-100">
          {templates.map((t) => (
            <li key={t._id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3">
                {t.backgroundImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.backgroundImageUrl} alt={t.name} className="h-12 w-20 rounded border border-slate-200 object-cover" />
                ) : (
                  <div className="flex h-12 w-20 items-center justify-center rounded border border-dashed border-slate-300 text-[10px] text-slate-400">
                    No image
                  </div>
                )}
                <p className="text-sm font-medium text-slate-900">{t.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${t.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {t.isActive ? "Active" : "Inactive"}
                </span>
                <DeleteTemplateButton projectId={projectId} templateId={t._id} templateName={t.name} />
              </div>
            </li>
          ))}
          {templates.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No templates yet.</li>}
        </ul>
      </div>
    </div>
  );
}
