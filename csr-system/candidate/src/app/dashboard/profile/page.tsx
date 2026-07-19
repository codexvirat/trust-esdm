import { requireCandidateRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { CandidateProfile } from "@/lib/types";
import { ProfileForm } from "./ProfileForm";

interface MeResponse {
  user: { fullName: string; email: string };
  profile: CandidateProfile | null;
}

export default async function ProfilePage() {
  const { accessToken } = await requireCandidateRole();
  const me = await apiFetch<MeResponse>("/me", { accessToken });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          {me.user.fullName} · {me.user.email}
        </p>
      </div>

      <ProfileForm profile={me.profile} />
    </div>
  );
}
