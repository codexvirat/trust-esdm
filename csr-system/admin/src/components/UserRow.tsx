"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { setUserStatusAction, deleteUserAction, updateUserAction, type FormState } from "@/app/actions/users";
import { StatusPill } from "@/components/StatusPill";
import type { UserSummary } from "@/lib/types";

const initialEditState: FormState = {};

export function UserRow({ user, redirectPath }: { user: UserSummary; redirectPath: string }) {
  const [pending, startTransition] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [editing, setEditing] = useState(false);

  const nextStatus = user.status === "active" ? "suspended" : "active";
  const actionLabel = user.status === "active" ? "Suspend" : "Reactivate";

  const boundUpdate = updateUserAction.bind(null, user._id, user.projectId, redirectPath);
  const [editState, editAction, editPending] = useActionState(boundUpdate, initialEditState);
  const wasEditPending = useRef(false);

  useEffect(() => {
    if (wasEditPending.current && !editPending && !editState.error) {
      setEditing(false);
    }
    wasEditPending.current = editPending;
  }, [editPending, editState.error]);

  if (editing) {
    return (
      <li className="py-3">
        <form action={editAction} className="flex flex-wrap items-center gap-2">
          <input
            name="fullName"
            defaultValue={user.fullName}
            required
            placeholder="Full name"
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
          <input
            name="email"
            type="email"
            defaultValue={user.email}
            required
            placeholder="Email"
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
          <input
            name="phone"
            defaultValue={user.phone ?? ""}
            placeholder="Phone"
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
          <button
            type="submit"
            disabled={editPending}
            className="rounded-md bg-teal-700 px-3 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {editPending ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-slate-400 hover:text-slate-700">
            Cancel
          </button>
          {editState.error && <p role="alert" className="w-full text-xs text-red-600">{editState.error}</p>}
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div>
        <p className="text-sm font-medium text-slate-900">{user.fullName}</p>
        <p className="text-xs text-slate-500">
          {user.email} {user.phone ? `· ${user.phone}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
          {user.roleCode.replace("_", " ")}
        </span>
        <StatusPill status={user.status} />
        {user.mustChangePassword && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">Pending first login</span>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => setUserStatusAction(user._id, user.projectId, nextStatus, redirectPath))}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {pending ? "Updating…" : actionLabel}
        </button>
        <button
          type="button"
          disabled={deletePending}
          onClick={() => {
            if (window.confirm(`Delete "${user.fullName}"? This cannot be undone from the UI.`)) {
              startDelete(() => deleteUserAction(user._id, user.projectId, redirectPath));
            }
          }}
          className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {deletePending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
