"use client";

import { useTransition } from "react";
import { deleteCertificateTemplateAction } from "@/app/actions/certificates";

export function DeleteTemplateButton({ projectId, templateId, templateName }: { projectId: string; templateId: string; templateName: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete the "${templateName}" template? It will no longer be usable for new certificates.`)) return;
        startTransition(() => deleteCertificateTemplateAction(projectId, templateId));
      }}
      className="text-xs font-medium text-red-700 underline hover:text-red-900 disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
