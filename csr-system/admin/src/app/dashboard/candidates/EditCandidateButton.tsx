"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { EditCandidateModal } from "./EditCandidateModal";
import type { UserSummary } from "@/lib/types";

export function EditCandidateButton({ projectId, candidate }: { projectId: string; candidate: UserSummary }) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-teal-700 hover:text-teal-900">
        Edit
      </button>
      {editing &&
        createPortal(<EditCandidateModal projectId={projectId} candidate={candidate} onClose={() => setEditing(false)} />, document.body)}
    </>
  );
}
