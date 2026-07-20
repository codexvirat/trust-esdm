import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { CandidateProfile, UserSummary } from "@/lib/types";

export async function GET(request: Request) {
  const { accessToken, user } = await requireAdminRole();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") || user.projectId;

  const candidates = await apiFetch<UserSummary[]>(`/users?roleCode=candidate&projectId=${projectId}`, { accessToken });
  const profiles = await Promise.all(
    candidates.map((c) =>
      apiFetch<{ user: UserSummary; profile: CandidateProfile | null }>(`/users/${c._id}/candidate-profile?projectId=${projectId}`, {
        accessToken,
      }).catch(() => ({ user: c, profile: null })),
    ),
  );
  const profileByCandidateId = new Map(candidates.map((c, i) => [c._id, profiles[i]?.profile ?? null]));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Candidates");
  sheet.columns = [
    { header: "Full Name", key: "fullName", width: 24 },
    { header: "Email", key: "email", width: 28 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Status", key: "status", width: 12 },
    { header: "Organisation", key: "organisation", width: 24 },
    { header: "City", key: "city", width: 16 },
    { header: "State", key: "state", width: 16 },
    { header: "Date of Birth", key: "dob", width: 14 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "Blood Group", key: "bloodGroup", width: 12 },
    { header: "Alternate Phone", key: "alternatePhone", width: 16 },
    { header: "Skills", key: "skills", width: 30 },
    { header: "Education", key: "education", width: 40 },
  ];

  candidates.forEach((c) => {
    const profile = profileByCandidateId.get(c._id) ?? null;
    sheet.addRow({
      fullName: c.fullName,
      email: c.email,
      phone: c.phone ?? "",
      status: c.status,
      organisation: profile?.affiliatedOrganisation?.name ?? "",
      city: profile?.address?.city ?? "",
      state: profile?.address?.state ?? "",
      dob: profile?.dob ? new Date(profile.dob).toLocaleDateString() : "",
      gender: profile?.gender ?? "",
      bloodGroup: profile?.bloodGroup ?? "",
      alternatePhone: profile?.alternatePhone ?? "",
      skills: (profile?.skills ?? []).join(", "),
      education: (profile?.education ?? [])
        .map((e) => `${e.degree ?? ""}${e.institution ? ` - ${e.institution}` : ""} (${e.startYear ?? "?"}-${e.endYear ?? "?"})`)
        .join("; "),
    });
  });
  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="candidates.xlsx"`,
    },
  });
}
