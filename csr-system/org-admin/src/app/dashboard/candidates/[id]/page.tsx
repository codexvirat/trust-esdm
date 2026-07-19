import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { CandidateProfile, UserSummary } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";

function formatDate(iso?: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : "—";
}

function formatLabel(value?: string | null): string {
  return value ? value.replace(/_/g, " ") : "—";
}

function mediaUrl(ref: CandidateProfile["photoMediaId"]): string | null {
  return ref && typeof ref === "object" ? ref.url : null;
}

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { accessToken } = await requireOrgAdminRole();

  let result: { user: UserSummary; profile: CandidateProfile | null };
  try {
    result = await apiFetch<{ user: UserSummary; profile: CandidateProfile | null }>(`/users/${id}/candidate-profile`, { accessToken });
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }

  const { user: candidate, profile } = result;
  const photoUrl = mediaUrl(profile?.photoMediaId ?? null);
  const resumeUrl = mediaUrl(profile?.resumeMediaId ?? null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard/candidates" className="text-sm text-slate-500 hover:text-slate-800">
          ← Candidates
        </Link>
        <div className="mt-2 flex items-center gap-4">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={candidate.fullName} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-400">
              {candidate.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">{candidate.fullName}</h1>
              <StatusPill status={candidate.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {candidate.email} {candidate.phone ? `· ${candidate.phone}` : ""}
            </p>
          </div>
        </div>
      </div>

      {!profile && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          This candidate hasn&apos;t filled in their profile details yet.
        </div>
      )}

      {profile && (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Personal information</h2>
              <span className="text-xs text-slate-400">{profile.profileCompletionPercent}% complete</span>
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Detail label="Date of birth" value={formatDate(profile.dob)} />
              <Detail label="Gender" value={formatLabel(profile.gender)} />
              <Detail label="Blood group" value={profile.bloodGroup ?? "—"} />
              <Detail label="Alternate phone" value={profile.alternatePhone ?? "—"} />
              <Detail label="Alumni status" value={profile.alumniStatus ? "Yes" : "No"} />
              <Detail
                label="Resume"
                value={
                  resumeUrl ? (
                    <a href={resumeUrl} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline">
                      View resume
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">Address</h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Detail label="Line 1" value={profile.address?.line1 || "—"} />
              <Detail label="Line 2" value={profile.address?.line2 || "—"} />
              <Detail label="City" value={profile.address?.city || "—"} />
              <Detail label="State" value={profile.address?.state || "—"} />
              <Detail label="Country" value={profile.address?.country || "—"} />
              <Detail label="Pincode" value={profile.address?.pincode || "—"} />
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">Education</h2>
            {profile.education.length === 0 ? (
              <p className="mt-4 text-xs text-slate-400">No education added.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {profile.education.map((entry, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="font-medium text-slate-900">
                      {entry.degree || "—"} {entry.fieldOfStudy ? `· ${entry.fieldOfStudy}` : ""}
                    </p>
                    <p className="mt-1 text-slate-500">
                      {entry.institution || "—"} ({entry.startYear ?? "?"}–{entry.endYear ?? "?"}) {entry.grade ? `· ${entry.grade}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">Skills</h2>
            {profile.skills.length === 0 ? (
              <p className="mt-4 text-xs text-slate-400">No skills added.</p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">Social links</h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Detail label="LinkedIn" value={<ExternalLink href={profile.socialLinks?.linkedin} />} />
              <Detail label="GitHub" value={<ExternalLink href={profile.socialLinks?.github} />} />
              <Detail label="Portfolio" value={<ExternalLink href={profile.socialLinks?.portfolio} />} />
              <Detail label="Twitter / X" value={<ExternalLink href={profile.socialLinks?.twitter} />} />
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">Emergency contact</h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Detail label="Name" value={profile.emergencyContact?.name || "—"} />
              <Detail label="Relation" value={profile.emergencyContact?.relation || "—"} />
              <Detail label="Phone" value={profile.emergencyContact?.phone || "—"} />
            </dl>
          </div>

          {profile.affiliatedOrganisation?.name && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-base font-semibold text-slate-900">Affiliated organisation</h2>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Detail label="Name" value={profile.affiliatedOrganisation.name || "—"} />
                <Detail label="Type" value={formatLabel(profile.affiliatedOrganisation.type)} />
                <Detail label="Email" value={profile.affiliatedOrganisation.email || "—"} />
                <Detail label="Phone" value={profile.affiliatedOrganisation.phone || "—"} />
                <Detail label="Industry" value={profile.affiliatedOrganisation.industry || "—"} />
                <Detail label="Address line 1" value={profile.affiliatedOrganisation.addressLine1 || "—"} />
                <Detail label="Address line 2" value={profile.affiliatedOrganisation.addressLine2 || "—"} />
                <Detail label="City" value={profile.affiliatedOrganisation.city || "—"} />
                <Detail label="District" value={profile.affiliatedOrganisation.district || "—"} />
                <Detail label="State" value={profile.affiliatedOrganisation.state || "—"} />
                <Detail label="Pincode" value={profile.affiliatedOrganisation.pincode || "—"} />
                <Detail label="GSTIN" value={profile.affiliatedOrganisation.gstin || "—"} />
                <Detail label="PAN" value={profile.affiliatedOrganisation.pan || "—"} />
                <Detail label="Short code" value={profile.affiliatedOrganisation.shortCode || "—"} />
                <Detail label="Employee count" value={profile.affiliatedOrganisation.employeeCount ?? "—"} />
                <Detail label="Established date" value={formatDate(profile.affiliatedOrganisation.establishedDate)} />
              </dl>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-700">{value}</dd>
    </div>
  );
}

function ExternalLink({ href }: { href?: string }) {
  if (!href) return <>—</>;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline">
      {href}
    </a>
  );
}
