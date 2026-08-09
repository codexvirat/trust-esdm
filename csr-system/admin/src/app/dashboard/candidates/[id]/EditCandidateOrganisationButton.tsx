"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { EditCandidateOrganisationModal } from "./EditCandidateOrganisationModal";
import type { AffiliatedOrganisation, Organisation } from "@/lib/types";

export function EditCandidateOrganisationButton({
  projectId,
  candidateId,
  organisations,
  currentOrganisationId,
  currentAffiliatedOrganisation,
}: {
  projectId: string;
  candidateId: string;
  organisations: Organisation[];
  currentOrganisationId?: string | null;
  currentAffiliatedOrganisation?: AffiliatedOrganisation | null;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-teal-700 hover:text-teal-900">
        Edit
      </button>
      {editing &&
        createPortal(
          <EditCandidateOrganisationModal
            projectId={projectId}
            candidateId={candidateId}
            organisations={organisations}
            currentOrganisationId={currentOrganisationId}
            currentAffiliatedOrganisation={currentAffiliatedOrganisation}
            onClose={() => setEditing(false)}
          />,
          document.body,
        )}
    </>
  );
}
