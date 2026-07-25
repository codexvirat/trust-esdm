"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BatchTabs({ workshopId, batchId, projectId }: { workshopId: string; batchId: string; projectId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/workshops/${workshopId}/batches/${batchId}`;
  const suffix = `?projectId=${projectId}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/manage`, label: "Manage" },
  ];

  return (
    <div className="flex gap-1 border-b border-slate-200">
      {tabs.map((tab) => {
        const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={`${tab.href}${suffix}`}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
              active ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
