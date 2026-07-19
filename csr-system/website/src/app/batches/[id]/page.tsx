import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { PROJECT_SLUG } from "@/lib/constants";
import type { PublicBatchDetail } from "@/lib/types";
import { Header } from "@/components/Header";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let batch: PublicBatchDetail;
  try {
    batch = await apiFetch<PublicBatchDetail>(`/public/${PROJECT_SLUG}/batches/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <>
      <Header marqueeItems={[]} />
      <main>
        <section className="section-tight">
          <div className="wrap" style={{ maxWidth: 960 }}>
            <Link href="/batches" className="batch-back-link">
              ← Back to all batches
            </Link>

            <div className="eyebrow">{batch.workshop.title}</div>
            <h1 style={{ fontSize: "2rem" }}>{batch.name}</h1>
            <p className="lead" style={{ maxWidth: "none" }}>
              {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
              {batch.venue?.name ? ` · ${batch.venue.name}${batch.venue.city ? `, ${batch.venue.city}` : ""}` : ""}
            </p>

            <h2 style={{ fontSize: "1.3rem", marginTop: 32 }}>Training photos</h2>
            {batch.photos.length > 0 ? (
              <div className="batch-photo-grid">
                {batch.photos.map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={photo._id} src={photo.url} alt={`${batch.name} training`} />
                ))}
              </div>
            ) : (
              <p className="lead" style={{ maxWidth: "none", marginTop: 12 }}>
                No photos have been added for this batch yet.
              </p>
            )}
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
