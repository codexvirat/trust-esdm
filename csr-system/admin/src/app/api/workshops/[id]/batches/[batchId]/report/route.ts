import { NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/dal";
import { API_URL } from "@/lib/api";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; batchId: string }> }) {
  const { id: workshopId, batchId } = await params;
  const { accessToken, user } = await requireAdminRole();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") || user.projectId;

  const res = await fetch(`${API_URL}/workshops/${workshopId}/batches/${batchId}/report?projectId=${projectId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const message = res.headers.get("content-type")?.includes("application/json") ? ((await res.json()) as { message?: string }).message : undefined;
    return NextResponse.json({ message: message ?? "Failed to generate batch report." }, { status: res.status });
  }

  const pdfBuffer = await res.arrayBuffer();
  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/pdf",
      "Content-Disposition": res.headers.get("content-disposition") ?? `attachment; filename="batch-report-${batchId}.pdf"`,
    },
  });
}
