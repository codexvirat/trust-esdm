import Link from "next/link";
import { requireCandidateRole } from "@/lib/dal";
import { logoutAction } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "home" },
  { href: "/dashboard/attendance", label: "Attendance", icon: "qr" },
  { href: "/dashboard/certificates", label: "Certificates", icon: "certificate" },
  { href: "/dashboard/profile", label: "Profile", icon: "profile" },
] as const;

function NavIcon({ icon }: { icon: (typeof NAV_ITEMS)[number]["icon"] }) {
  const props = { className: "h-5 w-5 shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.8 };
  switch (icon) {
    case "home":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />
        </svg>
      );
    case "qr":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3M17 14v3m0 3h3" />
        </svg>
      );
    case "certificate":
      return (
        <svg {...props}>
          <circle cx="12" cy="10" r="7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 10 2 2 4-4M9 16.5 8 21l4-2 4 2-1-4.5" />
        </svg>
      );
    case "profile":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.5" />
          <path strokeLinecap="round" d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
        </svg>
      );
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireCandidateRole();

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden shrink-0 flex-col border-r border-slate-200 bg-teal-900 text-teal-50 md:flex md:w-60">
        <div className="px-5 py-5 text-lg font-semibold tracking-tight">CSR Training</div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-teal-100 transition hover:bg-teal-800 hover:text-white"
            >
              <NavIcon icon={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-teal-800 px-5 py-4">
          <p className="truncate text-sm font-medium text-white">{user.fullName}</p>
          <p className="truncate text-xs text-teal-300">{user.email}</p>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="text-xs font-medium text-teal-300 underline decoration-dotted hover:text-white">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-teal-800 bg-teal-900 px-4 py-3 text-teal-50 md:hidden">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">CSR Training</p>
          <p className="truncate text-xs text-teal-300">{user.fullName}</p>
        </div>
        <form action={logoutAction} className="shrink-0">
          <button type="submit" className="text-xs font-medium text-teal-300 underline decoration-dotted hover:text-white">
            Sign out
          </button>
        </form>
      </header>

      <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-slate-500 active:text-teal-700"
          >
            <NavIcon icon={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
