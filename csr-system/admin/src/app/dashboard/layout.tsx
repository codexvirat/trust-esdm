import Link from "next/link";
import { requireAdminRole } from "@/lib/dal";
import { logoutAction } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/users", label: "Users" },
  { href: "/dashboard/roles", label: "Roles & Permissions" },
  { href: "/dashboard/workshops", label: "Workshops" },
  { href: "/dashboard/workshop-categories", label: "Workshop Categories" },
  { href: "/dashboard/venues", label: "Venues" },
  { href: "/dashboard/marquee", label: "Marquee" },
  { href: "/dashboard/registrations", label: "Registrations" },
  { href: "/dashboard/organisations", label: "Organisations" },
  { href: "/dashboard/candidates", label: "Candidates" },
  { href: "/dashboard/question-bank", label: "Question Bank" },
  { href: "/dashboard/feedback-question-bank", label: "Feedback Question Bank" },
  { href: "/dashboard/certificates", label: "Certificates" },
  { href: "/dashboard/certificate-templates", label: "Certificate Templates" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdminRole();

  return (
    <div className="flex min-h-full flex-1">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-100">
        <div className="px-5 py-5 text-lg font-semibold tracking-tight text-white">Platform Admin</div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-800 px-5 py-4">
          <p className="truncate text-sm font-medium text-white">{user.fullName}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-600">Super Admin</p>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="text-xs font-medium text-slate-500 underline decoration-dotted hover:text-white">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-100 px-8 py-8">{children}</main>
    </div>
  );
}
