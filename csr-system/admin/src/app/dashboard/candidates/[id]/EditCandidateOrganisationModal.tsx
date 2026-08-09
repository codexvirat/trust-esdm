"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateCandidateOrganisationAction, type FormState } from "@/app/actions/candidates";
import { OrganisationFormFields, inputClass } from "@/app/dashboard/organisations/OrganisationFormFields";
import type { AffiliatedOrganisation, Organisation } from "@/lib/types";

const initialState: FormState = {};

export function EditCandidateOrganisationModal({
  projectId,
  candidateId,
  organisations,
  currentOrganisationId,
  currentAffiliatedOrganisation,
  onClose,
}: {
  projectId: string;
  candidateId: string;
  organisations: Organisation[];
  currentOrganisationId?: string | null;
  currentAffiliatedOrganisation?: AffiliatedOrganisation | null;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"existing" | "manual" | "clear">(
    currentOrganisationId ? "existing" : currentAffiliatedOrganisation?.name ? "manual" : "existing",
  );

  const bound = updateCandidateOrganisationAction.bind(null, projectId, candidateId);
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
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Edit affiliated organisation</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
            ✕
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Corrects the company shown on this candidate&apos;s certificate and public verification page.
        </p>

        <form action={action} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="mode" value={mode} />

          <div className="flex gap-1 rounded-md border border-slate-200 bg-slate-50 p-1 text-sm">
            <TabButton active={mode === "existing"} onClick={() => setMode("existing")}>
              Pick registered company
            </TabButton>
            <TabButton active={mode === "manual"} onClick={() => setMode("manual")}>
              Enter manually
            </TabButton>
            <TabButton active={mode === "clear"} onClick={() => setMode("clear")}>
              Remove
            </TabButton>
          </div>

          {mode === "existing" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Registered company</label>
              <select name="organisationId" defaultValue={currentOrganisationId ?? ""} required className={inputClass}>
                <option value="" disabled>
                  Select a company
                </option>
                {organisations.map((org) => (
                  <option key={org._id} value={org._id}>
                    {org.name}
                  </option>
                ))}
              </select>
              {organisations.length === 0 && (
                <p className="text-xs text-slate-400">No companies registered yet — add one under Organisations, or enter manually.</p>
              )}
            </div>
          )}

          {mode === "manual" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <OrganisationFormFields defaults={currentAffiliatedOrganisation ?? undefined} />
            </div>
          )}

          {mode === "clear" && (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              This will remove the affiliated organisation from this candidate entirely — the certificate/verify page will show no company.
            </p>
          )}

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

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded px-3 py-1.5 font-medium ${active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
    >
      {children}
    </button>
  );
}
