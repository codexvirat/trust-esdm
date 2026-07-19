import { requireAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Batch, WorkshopSummary, FeedbackBankQuestion, FeedbackForm, FeedbackResponse } from "@/lib/types";
import { WorkshopHeader } from "../WorkshopHeader";
import { CreateFeedbackForm } from "./CreateFeedbackForm";
import { FeedbackFormListItem } from "./FeedbackFormListItem";

export default async function FeedbackTabPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { id: workshopId } = await params;
  const { accessToken, user } = await requireAdminRole();
  const { projectId: requestedProjectId } = await searchParams;
  const projectId = requestedProjectId || user.projectId;

  const [workshop, forms, bankQuestions, batches] = await Promise.all([
    apiFetch<WorkshopSummary>(`/workshops/${workshopId}?projectId=${projectId}`, { accessToken }),
    apiFetch<FeedbackForm[]>(`/workshops/${workshopId}/feedback-forms?projectId=${projectId}`, { accessToken }),
    apiFetch<FeedbackBankQuestion[]>(`/feedback-question-bank?projectId=${projectId}`, { accessToken }),
    apiFetch<Batch[]>(`/workshops/${workshopId}/batches?projectId=${projectId}`, { accessToken }),
  ]);
  const responsesByForm = await Promise.all(
    forms.map((f) => apiFetch<FeedbackResponse[]>(`/workshops/${workshopId}/feedback-forms/${f._id}/responses?projectId=${projectId}`, { accessToken })),
  );
  const batchNameById = new Map(batches.map((b) => [b._id, b.name]));

  return (
    <div className="flex flex-col gap-6">
      <WorkshopHeader workshop={workshop} projectId={projectId} />

      <CreateFeedbackForm projectId={projectId} workshopId={workshopId} bankQuestions={bankQuestions} />

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <ul className="divide-y divide-slate-100">
          {forms.map((form, i) => (
            <FeedbackFormListItem
              key={form._id}
              projectId={projectId}
              workshopId={workshopId}
              form={form}
              responses={responsesByForm[i] ?? []}
              batchName={form.batchId ? batchNameById.get(form.batchId) : undefined}
            />
          ))}
          {forms.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No feedback forms yet.</li>}
        </ul>
      </div>
    </div>
  );
}
