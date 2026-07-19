"use client";

import { useTransition } from "react";
import { deleteMarqueeAction, toggleMarqueeAction } from "@/app/actions/marquee";
import type { Marquee } from "@/lib/types";

export function MarqueeRow({ projectId, marquee }: { projectId: string; marquee: Marquee }) {
  const [pending, startTransition] = useTransition();

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3 text-slate-900">{marquee.message}</td>
      <td className="px-4 py-3 text-slate-600">{marquee.linkTarget}</td>
      <td className="px-4 py-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => toggleMarqueeAction(projectId, marquee._id, !marquee.isActive))}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${marquee.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
        >
          {marquee.isActive ? "Active" : "Hidden"}
        </button>
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm("Delete this marquee item?")) startTransition(() => deleteMarqueeAction(projectId, marquee._id));
          }}
          className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
      </td>
    </tr>
  );
}
