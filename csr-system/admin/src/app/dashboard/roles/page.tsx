import { requireAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { PermissionCatalogEntry, Role } from "@/lib/types";

export default async function RolesPage() {
  const { accessToken } = await requireAdminRole();

  const [roles, catalog] = await Promise.all([
    apiFetch<Role[]>("/roles", { accessToken }),
    apiFetch<PermissionCatalogEntry[]>("/roles/permission-catalog", { accessToken }),
  ]);

  const modules = [...new Set(catalog.map((c) => c.module))];
  const catalogByCode = new Map(catalog.map((c) => [c.code, c]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Roles & Permissions</h1>
        <p className="mt-1 text-sm text-slate-500">
          System roles ship with a fixed permission set. Custom per-project roles aren&apos;t editable from this screen yet.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {roles.map((role) => (
          <div key={role._id} className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{role.name}</h2>
                <p className="text-xs text-slate-500">
                  {role.code} {role.isSystemRole && "· system role"} {role.projectId === null ? "· platform-wide" : ""}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {modules.map((mod) => {
                const modulePerms = catalog.filter((c) => c.module === mod);
                const granted = modulePerms.filter((p) => role.permissions.includes(p.code));
                if (granted.length === 0) return null;
                return (
                  <div key={mod}>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{mod.replace("_", " ")}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {granted.map((p) => (
                        <span
                          key={p.code}
                          title={catalogByCode.get(p.code)?.description}
                          className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                        >
                          {p.code}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {roles.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">No roles found.</p>
        )}
      </div>
    </div>
  );
}
