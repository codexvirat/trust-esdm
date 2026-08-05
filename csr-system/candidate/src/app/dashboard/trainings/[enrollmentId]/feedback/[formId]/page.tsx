import { requireCandidateRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Enrollment, FeedbackForm, FeedbackResponse } from "@/lib/types";
import { FeedbackFormClient } from "./FeedbackFormClient";
import { FeedbackResponseView } from "./FeedbackResponseView";

export default async function FeedbackFormPage({
  params,
}: {
  params: Promise<{ enrollmentId: string; formId: string }>;
}) {
  const { enrollmentId, formId } = await params;
  const { accessToken } = await requireCandidateRole();

  const enrollment = await apiFetch<Enrollment>(`/enrollments/${enrollmentId}`, { accessToken });
  const [form, existing] = await Promise.all([
    apiFetch<FeedbackForm>(`/workshops/${enrollment.workshopId}/feedback-forms/${formId}`, { accessToken }),
    apiFetch<FeedbackResponse | null>(`/workshops/${enrollment.workshopId}/feedback-forms/${formId}/responses/mine`, { accessToken }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Feedback</h1>
        <p className="mt-1 text-sm text-slate-500">
          {existing ? "Here's what you submitted." : "Your responses help us improve future trainings."}
        </p>
      </div>
      {existing ? (
        <FeedbackResponseView form={form} response={existing} />
      ) : (
        <FeedbackFormClient workshopId={enrollment.workshopId} formId={formId} enrollmentId={enrollmentId} form={form} />
      )}
    </div>
  );
}
