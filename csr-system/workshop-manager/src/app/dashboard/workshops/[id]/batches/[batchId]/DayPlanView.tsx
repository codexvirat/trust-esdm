import type { DayPlanEntry, UserSummary } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Admin (Super)",
  admin: "Org Admin",
  manager: "Manager",
  workshop_manager: "Workshop Manager",
};

export function DayPlanView({ entries, staff }: { entries: DayPlanEntry[]; staff: UserSummary[] }) {
  const staffById = new Map(staff.map((s) => [s._id, s]));
  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold text-slate-900">Day-wise plan</h2>
      <p className="mt-1 text-sm text-slate-500">What runs on which date, and who&apos;s responsible for it.</p>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        <ul className="divide-y divide-slate-100">
          {sortedEntries.map((entry) => {
            const assignee = entry.assignedToUserId ? staffById.get(entry.assignedToUserId) : null;
            return (
              <li key={entry._id} className="px-4 py-3 text-sm">
                <p className="font-medium text-slate-900">
                  {new Date(entry.date).toLocaleDateString()} — {entry.title}
                </p>
                <p className="text-xs text-slate-500">
                  {assignee ? `${assignee.fullName} (${ROLE_LABELS[assignee.roleCode] ?? assignee.roleCode})` : "Unassigned"}
                </p>
              </li>
            );
          })}
          {sortedEntries.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">No day-plan entries yet.</li>}
        </ul>
      </div>
    </div>
  );
}
