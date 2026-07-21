import { NextResponse } from "next/server";
import JSZip from "jszip";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Batch, Certificate, UserSummary } from "@/lib/types";

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string; batchId: string }> }) {
  const { id: workshopId, batchId } = await params;
  const { accessToken, user } = await requireAdminRole();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") || user.projectId;
  const orgQuery = `projectId=${projectId}`;

  const [batch, allCertificates, candidates] = await Promise.all([
    apiFetch<Batch>(`/workshops/${workshopId}/batches/${batchId}?${orgQuery}`, { accessToken }),
    // Drafts included on purpose — this is how an admin reviews rendered certificates before publishing them.
    apiFetch<Certificate[]>(`/certificates?workshopId=${workshopId}&batchId=${batchId}&${orgQuery}`, { accessToken }),
    apiFetch<UserSummary[]>(`/users?roleCode=candidate&${orgQuery}`, { accessToken }),
  ]);

  const certificates = allCertificates.filter((c) => c.status !== "revoked");

  if (certificates.length === 0) {
    return NextResponse.json({ message: "No certificates for this batch yet." }, { status: 404 });
  }

  const candidateById = new Map(candidates.map((c) => [c._id, c]));

  const zip = new JSZip();
  for (const cert of certificates) {
    if (!cert.fileUrl) continue;
    const pdfRes = await fetch(cert.fileUrl);
    if (!pdfRes.ok) continue;
    const buffer = Buffer.from(await pdfRes.arrayBuffer());
    const candidateName = candidateById.get(cert.candidateUserId)?.fullName ?? "candidate";
    zip.file(`${sanitizeFilenamePart(cert.certificateNumber)}-${sanitizeFilenamePart(candidateName)}.pdf`, buffer);
  }

  const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="certificates-${batch.code}.zip"`,
    },
  });
}
