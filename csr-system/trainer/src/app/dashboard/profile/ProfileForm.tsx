"use client";

import { useState, useTransition } from "react";
import { updateTrainerProfileAction } from "@/app/actions/profile";
import type { TrainerProfile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: TrainerProfile | null }) {
  const [specializationsText, setSpecializationsText] = useState((profile?.specializations ?? []).join(", "));
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [experienceYears, setExperienceYears] = useState(String(profile?.experienceYears ?? 0));
  const [certificationsText, setCertificationsText] = useState((profile?.certifications ?? []).join(", "));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(undefined);
    setSaved(false);
    startTransition(async () => {
      const result = await updateTrainerProfileAction({
        specializations: specializationsText.split(",").map((s) => s.trim()).filter(Boolean),
        bio: bio || undefined,
        experienceYears: Number(experienceYears) || 0,
        certifications: certificationsText.split(",").map((s) => s.trim()).filter(Boolean),
      });
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Trainer profile</h2>
        <div className="mt-4 flex flex-col gap-4">
          <Field label="Specializations" htmlFor="specializations" hint="Comma-separated">
            <input
              id="specializations"
              value={specializationsText}
              onChange={(e) => setSpecializationsText(e.target.value)}
              placeholder="First aid, Public speaking, Excel"
              className={inputClass}
            />
          </Field>

          <Field label="Bio" htmlFor="bio">
            <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className={inputClass} />
          </Field>

          <Field label="Years of experience" htmlFor="experienceYears">
            <input
              id="experienceYears"
              type="number"
              min={0}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className={`${inputClass} max-w-32`}
            />
          </Field>

          <Field label="Certifications" htmlFor="certifications" hint="Comma-separated">
            <input
              id="certifications"
              value={certificationsText}
              onChange={(e) => setCertificationsText(e.target.value)}
              placeholder="Certified First Aid Trainer, PMP"
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {profile && profile.ratingCount > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Feedback rating</h2>
          <p className="mt-2 text-sm text-slate-600">
            <b className="text-lg text-slate-900">{profile.ratingAverage.toFixed(1)}</b> / 5 from {profile.ratingCount} response
            {profile.ratingCount === 1 ? "" : "s"}
          </p>
        </section>
      )}

      {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {saved && !error && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Profile saved.</p>}

      <div>
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="rounded-md bg-indigo-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>
  );
}

const inputClass = "rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600";

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label} {hint && <span className="font-normal text-slate-400">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
