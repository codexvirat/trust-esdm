"use client";

import { useTransition } from "react";
import { setUserStatusAction, deleteUserAction } from "@/app/actions/users";
import { StatusPill } from "@/components/StatusPill";
import type { UserSummary } from "@/lib/types";

export function UserRow({ user, redirectPath }: { user: UserSummary; redirectPath: string }) {
  const [pending, startTransition] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const nextStatus = user.status === "active" ? "suspended" : "active";
  const actionLabel = user.status === "active" ? "Suspend" : "Reactivate";

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div>
        <p className="text-sm font-medium text-slate-900">{user.fullName}</p>
        <p className="text-xs text-slate-500">{user.email}</p>
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
