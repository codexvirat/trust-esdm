"use client";

import { useActionState, useState, useTransition } from "react";
import { approveRegistrationAction, rejectRegistrationAction, type FormState } from "@/app/actions/registrations";
import type { Registration } from "@/lib/types";

const initialState: FormState = {};

export function RegistrationRow({ registration, workshopTitle }: { registration: Registration; workshopTitle: string }) {
  const [mode, setMode] = useState<"idle" | "reject">("idle");
  const [approveError, setApproveError] = useState<string | null>(null);
  const [approvePending, startApprove] = useTransition();
  const rejectWithId = rejectRegistrationAction.bind(null, registration._id);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectWithId, initialState);

  const handleApprove = () => {
    setApproveError(null);
    startApprove(async () => {
      const result = await approveRegistrationAction(registration._id);
      if (result.error) setApproveError(result.error);
    });
  };

  return (
    <li className="py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-900">{registration.fullName}</p>
          <p className="text-xs text-slate-500">
            {registration.email} · {registration.phone}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Applied to <span className="font-medium text-slate-600">{workshopTitle}</span> · {new Date(registration.createdAt).toLocaleDateString()}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Organisation: <span className="font-medium text-slate-600">{registration.affiliatedOrganisation?.name || "—"}</span>
            {" · "}
            Location: <span className="font-medium text-slate-600">{registration.address?.city || "—"}{registration.address?.state ? `, ${registration.address.state}` : ""}</span>
          </p>
          {approveError && <p className="mt-1 text-xs text-red-700">{approveError}</p>}
        </div>
        {mode === "idle" && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={handleApprove}
              disabled={approvePending}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {approvePending ? "Approving…" : "Approve"}
            </button>
            <button
              type="button"
              onClick={() => setMode("reject")}
              className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {mode === "reject" && (
        <form action={rejectAction} className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex min-w-64 flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Reason</label>
            <input name="reason" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          {rejectState.error && <p className="w-full text-sm text-red-700">{rejectState.error}</p>}
          <button
            type="submit"
            disabled={rejectPending}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {rejectPending ? "Rejecting…" : "Confirm rejection"}
          </button>
          <button type="button" onClick={() => setMode("idle")} className="text-sm text-slate-500 hover:text-slate-800">
            Cancel
          </button>
        </form>
      )}
    </li>
  );
}
