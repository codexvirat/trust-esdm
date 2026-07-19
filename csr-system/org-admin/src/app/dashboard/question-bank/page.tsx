import { requireOrgAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Question } from "@/lib/types";
import { CreateQuestionForm } from "./CreateQuestionForm";
import { QuestionRow } from "./QuestionRow";

export default async function QuestionBankPage() {
  const { accessToken } = await requireOrgAdminRole();
  const questions = await apiFetch<Question[]>("/question-bank", { accessToken });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Question bank</h1>
        <p className="mt-1 text-sm text-slate-500">Reusable questions you can pull into any workshop&apos;s assessments.</p>
      </div>

      <CreateQuestionForm />

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <ul className="divide-y divide-slate-100">
          {questions.map((q) => (
            <QuestionRow key={q._id} question={q} />
          ))}
          {questions.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No questions yet.</li>}
        </ul>
      </div>
    </div>
  );
}
