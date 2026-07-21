"use client";

import { useActionState, useState } from "react";
import { uploadCertificateTemplateAction, type FormState } from "@/app/actions/certificates";

const initialState: FormState = {};

export function CreateTemplateForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const bound = uploadCertificateTemplateAction.bind(null, projectId);
  const [state, action, pending] = useActionState(bound, initialState);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
        + New template
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-1 flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Template name</label>
        <input name="name" required placeholder="Standard Certificate" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Background image</label>
        <input type="file" name="background" accept="image/*" required className="text-sm" />
      </div>
      {state.error && <p className="w-full text-sm text-red-700">{state.error}</p>}
      <p className="w-full text-xs text-slate-400">
        Candidate name and certificate no. are always overlaid automatically using a default layout tuned for a landscape certificate —
        upload the background exactly as it should look with those areas left blank.
      </p>
      <div className="flex w-full flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="locationFilledIn" value="true" />
          Location is already filled in on this background
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="dateFilledIn" value="true" />
          Date is already filled in on this background
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="qrFilledIn" value="true" />
          Verification QR is already printed on this background
        </label>
      </div>
      <button type="submit" disabled={pending} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
        {pending ? "Uploading…" : "Create"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-500 hover:text-slate-800">
        Cancel
      </button>
    </form>
  );
}
