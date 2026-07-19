"use client";

import { useTransition } from "react";
import { deleteCandidateAction } from "@/app/actions/candidates";

export function DeleteCandidateButton({ projectId, candidateId, candidateName }: { projectId: string; candidateId: string; candidateName: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(`Delete "${candidateName}"? This also removes their enrollments, certificates, and attendance records.`)) {
          startTransition(() => {
            deleteCandidateAction(projectId, candidateId);
          });
        }
      }}
      className="text-xs font-medium text-red-700 hover:underline disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
