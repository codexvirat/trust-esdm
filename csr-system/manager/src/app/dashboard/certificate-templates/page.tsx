import { requireManagerRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { CertificateTemplate } from "@/lib/types";
import { CreateTemplateForm } from "./CreateTemplateForm";

export default async function CertificateTemplatesPage() {
  const { accessToken } = await requireManagerRole();
  const templates = await apiFetch<CertificateTemplate[]>("/certificate-templates", { accessToken });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Certificate templates</h1>
        <p className="mt-1 text-sm text-slate-500">Used when issuing a certificate from a candidate&apos;s enrollment.</p>
      </div>

      <CreateTemplateForm />

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <ul className="divide-y divide-slate-100">
          {templates.map((t) => (
            <li key={t._id} className="flex items-center justify-between py-3">
              <p className="text-sm font-medium text-slate-900">{t.name}</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${t.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {t.isActive ? "Active" : "Inactive"}
              </span>
            </li>
          ))}
          {templates.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No templates yet.</li>}
        </ul>
      </div>
    </div>
  );
}
