import Link from "next/link";
import { requireTrainerRole } from "@/lib/dal";
import { logoutAction } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Batches", icon: "batches" },
  { href: "/dashboard/profile", label: "Profile", icon: "profile" },
] as const;

function NavIcon({ icon }: { icon: (typeof NAV_ITEMS)[number]["icon"] }) {
  const props = { className: "h-5 w-5 shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.8 };
  switch (icon) {
    case "batches":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
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
  const { user } = await requireTrainerRole();

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden shrink-0 flex-col border-r border-indigo-950 bg-indigo-950 text-indigo-50 md:flex md:w-60">
        <div className="px-5 py-5 text-lg font-semibold tracking-tight">CSR Trainer</div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-900 hover:text-white"
            >
              <NavIcon icon={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-indigo-900 px-5 py-4">
          <p className="truncate text-sm font-medium text-white">{user.fullName}</p>
          <p className="truncate text-xs text-indigo-300">{user.email}</p>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="text-xs font-medium text-indigo-300 underline decoration-dotted hover:text-white">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-indigo-900 bg-indigo-950 px-4 py-3 text-indigo-50 md:hidden">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">CSR Trainer</p>
          <p className="truncate text-xs text-indigo-300">{user.fullName}</p>
        </div>
        <form action={logoutAction} className="shrink-0">
          <button type="submit" className="text-xs font-medium text-indigo-300 underline decoration-dotted hover:text-white">
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
            className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-slate-500 active:text-indigo-700"
          >
            <NavIcon icon={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
