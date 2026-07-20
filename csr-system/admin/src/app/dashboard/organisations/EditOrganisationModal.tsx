"use client";

import { useActionState, useEffect, useRef } from "react";
import { updateOrganisationAction, type FormState } from "@/app/actions/organisations";
import { OrganisationFormFields } from "./OrganisationFormFields";
import type { Organisation } from "@/lib/types";

const initialState: FormState = {};

export function EditOrganisationModal({
  projectId,
  organisation,
  onClose,
}: {
  projectId: string;
  organisation: Organisation;
  onClose: () => void;
}) {
  const bound = updateOrganisationAction.bind(null, projectId, organisation._id);
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
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Edit organisation</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
            ✕
          </button>
        </div>

        <form action={action} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <OrganisationFormFields defaults={organisation} />

          {state.error && <p className="w-full rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
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
