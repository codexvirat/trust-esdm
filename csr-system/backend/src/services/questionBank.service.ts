import { QuestionBank } from "../models/QuestionBank";
import { ApiError } from "../utils/ApiError";
import { softDeleteById } from "../utils/softDelete";

export async function createQuestion(input: {
  projectId: string;
  questionText: string;
  type: string;
  options: { text: string; isCorrect: boolean }[];
  marks: number;
  difficulty?: string;
  tags?: string[];
  createdByUserId: string;
}) {
  if (!input.options.some((o) => o.isCorrect)) {
    throw ApiError.badRequest("At least one option must be marked correct");
  }
  return QuestionBank.create(input);
}

export async function listQuestions(projectId: string, tags?: string[]) {
  const query: Record<string, unknown> = { projectId };
  if (tags && tags.length > 0) query.tags = { $in: tags };
  return QuestionBank.find(query).sort({ createdAt: -1 });
}

export async function getQuestionById(projectId: string, id: string) {
  const question = await QuestionBank.findOne({ _id: id, projectId });
  if (!question) throw ApiError.notFound("Question not found");
  return question;
}

export async function updateQuestion(projectId: string, id: string, updates: Record<string, unknown>, updatedBy: string) {
  const question = await QuestionBank.findOneAndUpdate({ _id: id, projectId }, { $set: { ...updates, updatedBy } }, { new: true });
  if (!question) throw ApiError.notFound("Question not found");
  return question;
}

export async function deleteQuestion(projectId: string, id: string, deletedBy: string) {
  const question = await softDeleteById(QuestionBank, id, { projectId }, deletedBy);
  if (!question) throw ApiError.notFound("Question not found");
}
