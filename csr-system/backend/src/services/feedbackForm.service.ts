import { FeedbackForm } from "../models/FeedbackForm";
import { FeedbackQuestionBank } from "../models/FeedbackQuestionBank";
import { Workshop } from "../models/Workshop";
import { ApiError } from "../utils/ApiError";

interface InlineFeedbackQuestion {
  feedbackQuestionBankId?: string;
  questionText: string;
  type: string;
  required?: boolean;
}

async function buildQuestionSnapshot(projectId: string, questions?: InlineFeedbackQuestion[], feedbackQuestionBankIds?: string[]) {
  const snapshot: InlineFeedbackQuestion[] = [...(questions ?? [])];

  if (feedbackQuestionBankIds && feedbackQuestionBankIds.length > 0) {
    const bankQuestions = await FeedbackQuestionBank.find({ _id: { $in: feedbackQuestionBankIds }, projectId });
    if (bankQuestions.length !== feedbackQuestionBankIds.length) {
      throw ApiError.badRequest("One or more feedbackQuestionBankIds were not found in this project");
    }
    for (const q of bankQuestions) {
      snapshot.push({
        feedbackQuestionBankId: q.id,
        questionText: q.questionText,
        type: q.type,
        required: q.required,
      });
    }
  }

  if (snapshot.length === 0) throw ApiError.badRequest("A feedback form needs at least one question");
  return snapshot;
}

export async function createFeedbackForm(input: {
  projectId: string;
  workshopId: string;
  batchId?: string;
  title?: string;
  questions?: InlineFeedbackQuestion[];
  feedbackQuestionBankIds?: string[];
  createdBy: string;
}) {
  const workshop = await Workshop.findOne({ _id: input.workshopId, projectId: input.projectId });
  if (!workshop) throw ApiError.notFound("Workshop not found");

  const questions = await buildQuestionSnapshot(input.projectId, input.questions, input.feedbackQuestionBankIds);

  return FeedbackForm.create({
    projectId: input.projectId,
    workshopId: input.workshopId,
    batchId: input.batchId ?? null,
    title: input.title ?? "",
    questions,
    isEnabled: false,
    createdBy: input.createdBy,
  });
}

export async function listFormsForWorkshop(projectId: string, workshopId: string) {
  return FeedbackForm.find({ projectId, workshopId }).sort({ createdAt: -1 });
}

export async function getFormById(projectId: string, workshopId: string, formId: string) {
  const form = await FeedbackForm.findOne({ _id: formId, projectId, workshopId });
  if (!form) throw ApiError.notFound("Feedback form not found");
  return form;
}

export async function updateFeedbackForm(projectId: string, workshopId: string, formId: string, updates: Record<string, unknown>, updatedBy: string) {
  const form = await FeedbackForm.findOneAndUpdate({ _id: formId, projectId, workshopId }, { $set: { ...updates, updatedBy } }, { new: true });
  if (!form) throw ApiError.notFound("Feedback form not found");
  return form;
}

export async function setFormEnabled(projectId: string, workshopId: string, formId: string, isEnabled: boolean, updatedBy: string) {
  const form = await FeedbackForm.findOneAndUpdate({ _id: formId, projectId, workshopId }, { $set: { isEnabled, updatedBy } }, { new: true });
  if (!form) throw ApiError.notFound("Feedback form not found");
  return form;
}
