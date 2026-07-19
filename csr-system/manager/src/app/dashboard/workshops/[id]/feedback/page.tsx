import { requireManagerRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { FeedbackForm, FeedbackResponse } from "@/lib/types";
import { CreateFeedbackForm } from "./CreateFeedbackForm";
import { FeedbackFormListItem } from "./FeedbackFormListItem";

export default async function FeedbackTabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workshopId } = await params;
  const { accessToken } = await requireManagerRole();

  const forms = await apiFetch<FeedbackForm[]>(`/workshops/${workshopId}/feedback-forms`, { accessToken });
  const responsesByForm = await Promise.all(
    forms.map((f) => apiFetch<FeedbackResponse[]>(`/workshops/${workshopId}/feedback-forms/${f._id}/responses`, { accessToken })),
  );

  return (
    <div className="flex flex-col gap-6">
      <CreateFeedbackForm workshopId={workshopId} />

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <ul className="divide-y divide-slate-100">
          {forms.map((form, i) => (
            <FeedbackFormListItem key={form._id} workshopId={workshopId} form={form} responses={responsesByForm[i] ?? []} />
          ))}
          {forms.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No feedback forms yet.</li>}
        </ul>
      </div>
    </div>
  );
}
