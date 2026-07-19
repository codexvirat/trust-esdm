import { requireAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { WorkshopSummary, Project, Question } from "@/lib/types";
import { ProjectFilter } from "@/components/ProjectFilter";
import { CreateQuestionForm } from "./CreateQuestionForm";
import { QuestionRow } from "./QuestionRow";
import { CreateAssessmentPaperForm } from "./CreateAssessmentPaperForm";

export default async function QuestionBankPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const { accessToken, user } = await requireAdminRole();
  const { projectId: requestedProjectId } = await searchParams;
  const projectId = requestedProjectId || user.projectId;

  const [projects, questions, workshops] = await Promise.all([
    apiFetch<Project[]>("/projects", { accessToken }),
    apiFetch<Question[]>(`/question-bank?projectId=${projectId}`, { accessToken }),
    apiFetch<WorkshopSummary[]>(`/workshops?projectId=${projectId}`, { accessToken }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Question bank</h1>
        <p className="mt-1 text-sm text-slate-500">Reusable questions you can pull into any workshop&apos;s assessments.</p>
      </div>

      <ProjectFilter projects={projects} selectedId={projectId} basePath="/dashboard/question-bank" />

      <CreateAssessmentPaperForm projectId={projectId} workshops={workshops} bankQuestions={questions} />

      <CreateQuestionForm projectId={projectId} />

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <ul className="divide-y divide-slate-100">
          {questions.map((q) => (
            <QuestionRow key={q._id} projectId={projectId} question={q} />
          ))}
          {questions.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No questions yet.</li>}
        </ul>
      </div>
    </div>
  );
}
