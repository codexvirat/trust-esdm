"use client";

import { useActionState, useTransition } from "react";
import { uploadBatchPhotoAction, removeBatchPhotoAction, type UploadPhotoState } from "@/app/actions/workshops";
import type { BatchPhoto } from "@/lib/types";

const initialState: UploadPhotoState = {};

export function BatchPhotosPanel({
  projectId,
  workshopId,
  batchId,
  photos,
}: {
  projectId: string;
  workshopId: string;
  batchId: string;
  photos: BatchPhoto[];
}) {
  const boundAction = uploadBatchPhotoAction.bind(null, projectId, workshopId, batchId);
  const [state, action, pending] = useActionState(boundAction, initialState);
  const [removePending, startRemove] = useTransition();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Batch photos</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Training photos for this batch — shown on the public website when someone opens this batch&apos;s details.
      </p>

      <form action={action} className="mt-4 flex flex-wrap items-center gap-3">
        <input type="file" name="photo" accept="image/*" required className="text-sm" />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Uploading…" : "Upload photo"}
        </button>
        {state.error && <p className="w-full text-sm text-red-700">{state.error}</p>}
      </form>

      {photos.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo._id} className="group relative overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="Batch training" className="h-32 w-full object-cover" />
              <button
                type="button"
                disabled={removePending}
                onClick={() => startRemove(() => removeBatchPhotoAction(projectId, workshopId, batchId, photo._id))}
                className="absolute right-1 top-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-red-700 opacity-0 shadow transition group-hover:opacity-100 disabled:opacity-60"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-400">No photos uploaded yet.</p>
      )}
    </div>
  );
}
