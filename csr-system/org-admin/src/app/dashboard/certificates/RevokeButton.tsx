"use client";

import { useActionState, useState } from "react";
import { revokeCertificateAction, type FormState } from "@/app/actions/certificates";

const initialState: FormState = {};

export function RevokeButton({ certificateId }: { certificateId: string }) {
  const [open, setOpen] = useState(false);
  const bound = revokeCertificateAction.bind(null, certificateId);
  const [state, action, pending] = useActionState(async (_prev: FormState, formData: FormData) => bound(String(formData.get("reason") ?? "")), initialState);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-red-700 hover:underline">
        Revoke
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input name="reason" required placeholder="Reason" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
      <button type="submit" disabled={pending} className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60">
        {pending ? "Revoking…" : "Confirm"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:text-slate-800">
        Cancel
      </button>
      {state.error && <p className="w-full text-xs text-red-700">{state.error}</p>}
    </form>
  );
}
