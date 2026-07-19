import { requireManagerRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Organisation } from "@/lib/types";
import { CreateOrganisationForm } from "./CreateOrganisationForm";
import { OrganisationRow } from "./OrganisationRow";

export default async function OrganisationsPage() {
  const { accessToken } = await requireManagerRole();
  const organisations = await apiFetch<Organisation[]>("/organisations", { accessToken });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Organisations</h1>
        <p className="mt-1 text-sm text-slate-500">
          Companies registered here are selectable on the public registration form, so candidates don&apos;t have to retype the same
          company details every time.
        </p>
      </div>

      <CreateOrganisationForm />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {organisations.map((o) => (
              <OrganisationRow key={o._id} organisation={o} />
            ))}
            {organisations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No organisations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
