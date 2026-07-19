import { requireOrgAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Registration, WorkshopSummary } from "@/lib/types";
import { RegistrationRow } from "./RegistrationRow";

export default async function RegistrationsPage() {
  const { accessToken } = await requireOrgAdminRole();
  const registrations = await apiFetch<Registration[]>("/registrations?status=pending", { accessToken });

  const workshopIds = Array.from(new Set(registrations.map((r) => r.workshopId)));
  const workshops = await Promise.all(workshopIds.map((id) => apiFetch<WorkshopSummary>(`/workshops/${id}`, { accessToken })));

  const workshopTitleById = new Map(workshops.map((e) => [e._id, e.title]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Registration queue</h1>
        <p className="mt-1 text-sm text-slate-500">
          Approving creates the candidate&apos;s dashboard account. Enroll them into a batch afterward from the Candidates page — that&apos;s
          when their login and QR badge get emailed.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <ul className="divide-y divide-slate-100">
          {registrations.map((registration) => (
            <RegistrationRow key={registration._id} registration={registration} workshopTitle={workshopTitleById.get(registration.workshopId) ?? "Unknown workshop"} />
          ))}
          {registrations.length === 0 && <li className="py-10 text-center text-sm text-slate-400">No pending registrations right now.</li>}
        </ul>
      </div>
    </div>
  );
}
