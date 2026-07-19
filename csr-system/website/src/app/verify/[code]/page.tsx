import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { Header } from "@/components/Header";

interface VerifyResult {
  certificateNumber: string;
  status: "issued" | "revoked";
  issueDate: string;
  candidateName: string;
  workshopTitle: string;
  batchName: string | null;
  projectName: string;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  let result: VerifyResult;
  try {
    result = await apiFetch<VerifyResult>(`/certificates/verify/${code}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const isValid = result.status === "issued";

  return (
    <>
      <Header marqueeItems={[]} />
      <main>
        <section className="section-tight">
          <div className="wrap" style={{ maxWidth: 640 }}>
            <div className="eyebrow">Certificate Verification</div>
            <h1 style={{ fontSize: "2rem" }}>{result.candidateName}</h1>
            <p
              style={{
                display: "inline-block",
                marginTop: 8,
                padding: "6px 14px",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: "0.9rem",
                color: isValid ? "#065f46" : "#991b1b",
                background: isValid ? "#d1fae5" : "#fee2e2",
              }}
            >
              {isValid ? "✓ Valid Certificate" : "✕ Revoked"}
            </p>

            <div style={{ marginTop: 28, display: "grid", gap: 14 }}>
              <Row label="Workshop" value={result.workshopTitle} />
              {result.batchName && <Row label="Batch" value={result.batchName} />}
              <Row label="Certificate No." value={result.certificateNumber} />
              <Row label="Issued on" value={formatDateTime(result.issueDate)} />
              <Row label="Organization" value={result.projectName} />
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line, #e5e7eb)", paddingBottom: 10 }}>
      <span style={{ color: "var(--ink-soft, #64748b)" }}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
