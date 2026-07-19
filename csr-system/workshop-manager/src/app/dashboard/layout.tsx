import Link from "next/link";
import { requireWorkshopManagerRole } from "@/lib/dal";
import { logoutAction } from "@/app/actions/auth";

const NAV_ITEMS = [{ href: "/dashboard", label: "My Batches" }];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireWorkshopManagerRole();

  return (
    <div className="flex min-h-full flex-1">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-slate-100">
        <div className="px-5 py-5 text-lg font-semibold tracking-tight">CSR Workshop Manager</div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-800 px-5 py-4">
          <p className="truncate text-sm font-medium text-white">{user.fullName}</p>
          <p className="truncate text-xs text-slate-400">{user.email}</p>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">{user.roleCode.replace("_", " ")}</p>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="text-xs font-medium text-slate-400 underline decoration-dotted hover:text-white">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-50 px-8 py-8">{children}</main>
    </div>
  );
}
