import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { PROJECT_SLUG } from "@/lib/constants";
import type { PublicBatch, PublicBatchStatus } from "@/lib/types";
import { Header } from "@/components/Header";

const TABS: { value: "completed" | "ongoing" | "upcoming"; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "ongoing", label: "Ongoing" },
  { value: "upcoming", label: "Upcoming" },
];

function statusToBackendStatus(status: string): PublicBatchStatus {
  return status === "upcoming" ? "scheduled" : (status as PublicBatchStatus);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function BatchesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: requestedStatus } = await searchParams;
  const activeTab = TABS.some((t) => t.value === requestedStatus) ? (requestedStatus as (typeof TABS)[number]["value"]) : "completed";
  const backendStatus = statusToBackendStatus(activeTab);

  const [enableBatches, leadBatches] = await Promise.all([
    apiFetch<PublicBatch[]>(`/public/${PROJECT_SLUG}/workshops/enable/batches`),
    apiFetch<PublicBatch[]>(`/public/${PROJECT_SLUG}/workshops/lead/batches`),
  ]);

  const rows = [
    ...enableBatches.map((b) => ({ ...b, track: "ENABLE" })),
    ...leadBatches.map((b) => ({ ...b, track: "LEAD" })),
  ]
    .filter((b) => b.status === backendStatus)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <>
      <Header marqueeItems={[]} />
      <main>
        <section className="section-tight">
          <div className="wrap" style={{ maxWidth: 960 }}>
            <div className="eyebrow">Batch Status</div>
            <h1 style={{ fontSize: "2rem" }}>Where TRUST-ESDM batches stand today</h1>
            <p className="lead" style={{ maxWidth: "none" }}>A quick look at completed, ongoing, and upcoming batches across both tracks.</p>

            <div className="tabs">
              {TABS.map((t) => (
                <Link key={t.value} href={`/batches?status=${t.value}`} className={`tab${t.value === activeTab ? " active" : ""}`}>
                  {t.label}
                </Link>
              ))}
            </div>

            <div className="batches-table-wrap">
              <table className="batches-table">
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Track</th>
                    <th>Venue</th>
                    <th>Start date</th>
                    <th>End date</th>
                    {activeTab === "upcoming" && <th />}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => (
                    <tr key={b._id}>
                      <td className="name-cell">
                        <Link href={`/batches/${b._id}`}>{b.name}</Link>
                      </td>
                      <td>{b.track}</td>
                      <td>{b.venue?.city || b.venue?.name || "—"}</td>
                      <td>{formatDate(b.startDate)}</td>
                      <td>{formatDate(b.endDate)}</td>
                      {activeTab === "upcoming" && (
                        <td>
                          <Link href="/#enroll" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: ".82rem" }}>
                            Enroll now
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={activeTab === "upcoming" ? 6 : 5} style={{ textAlign: "center", padding: "32px 20px" }}>
                        No {activeTab} batches right now.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
      <footer>
        <div className="wrap">
          <small>© 2026 DRIIV.</small>
        </div>
      </footer>
    </>
  );
}
