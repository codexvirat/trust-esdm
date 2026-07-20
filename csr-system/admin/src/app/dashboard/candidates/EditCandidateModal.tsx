"use client";

import { useActionState, useEffect, useRef } from "react";
import { updateUserAction, type FormState } from "@/app/actions/users";
import type { UserSummary } from "@/lib/types";

const initialState: FormState = {};

export function EditCandidateModal({
  projectId,
  candidate,
  onClose,
}: {
  projectId: string;
  candidate: UserSummary;
  onClose: () => void;
}) {
  const bound = updateUserAction.bind(null, candidate._id, projectId, "/dashboard/candidates");
  const [state, action, pending] = useActionState(bound, initialState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      onClose();
    }
    wasPending.current = pending;
  }, [pending, state.error, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Edit candidate</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
            ✕
          </button>
        </div>

        <form action={action} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Full name</label>
            <input
              name="fullName"
              defaultValue={candidate.fullName}
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={candidate.email}
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Phone</label>
            <input name="phone" defaultValue={candidate.phone ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>

          {state.error && (
            <p role="alert" className="text-xs text-red-600">
              {state.error}
            </p>
          )}

          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
