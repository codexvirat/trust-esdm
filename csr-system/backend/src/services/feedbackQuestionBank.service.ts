import { FeedbackQuestionBank } from "../models/FeedbackQuestionBank";
import { ApiError } from "../utils/ApiError";
import { softDeleteById } from "../utils/softDelete";

export async function createQuestion(input: {
  projectId: string;
  questionText: string;
  type: string;
  required?: boolean;
  tags?: string[];
  createdByUserId: string;
}) {
  return FeedbackQuestionBank.create(input);
}

export async function listQuestions(projectId: string, tags?: string[]) {
  const query: Record<string, unknown> = { projectId };
  if (tags && tags.length > 0) query.tags = { $in: tags };
  return FeedbackQuestionBank.find(query).sort({ createdAt: -1 });
}

export async function getQuestionById(projectId: string, id: string) {
  const question = await FeedbackQuestionBank.findOne({ _id: id, projectId });
  if (!question) throw ApiError.notFound("Question not found");
  return question;
}

export async function updateQuestion(projectId: string, id: string, updates: Record<string, unknown>, updatedBy: string) {
  const question = await FeedbackQuestionBank.findOneAndUpdate({ _id: id, projectId }, { $set: { ...updates, updatedBy } }, { new: true });
  if (!question) throw ApiError.notFound("Question not found");
  return question;
}

export async function deleteQuestion(projectId: string, id: string, deletedBy: string) {
  const question = await softDeleteById(FeedbackQuestionBank, id, { projectId }, deletedBy);
  if (!question) throw ApiError.notFound("Question not found");
}
