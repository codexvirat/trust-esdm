"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function WorkshopTabs({ workshopId }: { workshopId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/workshops/${workshopId}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/assessments`, label: "Assessments" },
    { href: `${base}/feedback`, label: "Feedback" },
    { href: `${base}/results`, label: "Results" },
  ];

  return (
    <div className="flex gap-1 border-b border-slate-200">
      {tabs.map((tab) => {
        const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
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
