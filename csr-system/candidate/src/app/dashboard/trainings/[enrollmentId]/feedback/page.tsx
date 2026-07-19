import Link from "next/link";
import { requireCandidateRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Enrollment, FeedbackForm, FeedbackResponse } from "@/lib/types";

export default async function FeedbackListPage({ params }: { params: Promise<{ enrollmentId: string }> }) {
  const { enrollmentId } = await params;
  const { accessToken } = await requireCandidateRole();

  const enrollment = await apiFetch<Enrollment>(`/enrollments/${enrollmentId}`, { accessToken });
  const forms = await apiFetch<FeedbackForm[]>(`/workshops/${enrollment.workshopId}/feedback-forms`, { accessToken });

  const responses = await Promise.all(
    forms.map((f) =>
      apiFetch<FeedbackResponse | null>(`/workshops/${enrollment.workshopId}/feedback-forms/${f._id}/responses/mine`, { accessToken }),
    ),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Feedback</h1>
        <p className="mt-1 text-sm text-slate-500">Tell us how this training went.</p>
      </div>

      <div className="flex flex-col gap-3">
        {forms.map((form, i) => {
          const response = responses[i];
          return (
            <div key={form._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5">
              <div>
                <p className="text-sm font-medium text-slate-900">Feedback form</p>
                <p className="mt-1 text-xs text-slate-500">{form.questions.length} questions</p>
              </div>
              {response ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Submitted {new Date(response.submittedAt).toLocaleDateString()}
                </span>
              ) : (
                <Link
                  href={`/dashboard/trainings/${enrollmentId}/feedback/${form._id}`}
                  className="rounded-md bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
                >
                  Give feedback
                </Link>
              )}
            </div>
          );
        })}
        {forms.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            No feedback form is open for this training yet.
          </p>
        )}
      </div>
    </div>
  );
}
