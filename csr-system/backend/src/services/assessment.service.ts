import { Assessment } from "../models/Assessment";
import { AssessmentAttempt } from "../models/AssessmentAttempt";
import { QuestionBank } from "../models/QuestionBank";
import { Workshop } from "../models/Workshop";
import { ApiError } from "../utils/ApiError";
import { softDeleteById } from "../utils/softDelete";

interface InlineQuestion {
  questionBankId?: string;
  questionText: string;
  type: string;
  options: { text: string; isCorrect: boolean }[];
  marks: number;
}

async function buildQuestionSnapshot(projectId: string, questions?: InlineQuestion[], questionBankIds?: string[]) {
  const snapshot: InlineQuestion[] = [...(questions ?? [])];

  if (questionBankIds && questionBankIds.length > 0) {
    const bankQuestions = await QuestionBank.find({ _id: { $in: questionBankIds }, projectId });
    if (bankQuestions.length !== questionBankIds.length) {
      throw ApiError.badRequest("One or more questionBankIds were not found in this project");
    }
    for (const q of bankQuestions) {
      snapshot.push({
        questionBankId: q.id,
        questionText: q.questionText,
        type: q.type,
        options: q.options,
        marks: q.marks,
      });
    }
  }

  if (snapshot.length === 0) throw ApiError.badRequest("An assessment needs at least one question");
  for (const q of snapshot) {
    if (!q.options.some((o) => o.isCorrect)) {
      throw ApiError.badRequest(`Question "${q.questionText}" has no correct option marked`);
    }
  }
  return snapshot;
}

export async function createAssessment(input: {
  projectId: string;
  workshopId: string;
  batchId?: string;
  title: string;
  description?: string;
  questions?: InlineQuestion[];
  questionBankIds?: string[];
  passingPercent: number;
  maxAttempts?: number;
  durationMinutes: number;
  createdBy: string;
}) {
  const workshop = await Workshop.findOne({ _id: input.workshopId, projectId: input.projectId });
  if (!workshop) throw ApiError.notFound("Workshop not found");

  // Frozen at creation time — a later edit to question_bank must never
  // retroactively change what a candidate is tested on (design doc Part 06/16).
  const questions = await buildQuestionSnapshot(input.projectId, input.questions, input.questionBankIds);
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return Assessment.create({
    projectId: input.projectId,
    workshopId: input.workshopId,
    batchId: input.batchId ?? null,
    title: input.title,
    description: input.description,
    questions,
    totalMarks,
    passingPercent: input.passingPercent,
    maxAttempts: input.maxAttempts ?? 1,
    durationMinutes: input.durationMinutes,
    isEnabled: false,
    createdBy: input.createdBy,
  });
}

export async function listAssessmentsForWorkshop(projectId: string, workshopId: string) {
  return Assessment.find({ projectId, workshopId }).sort({ createdAt: -1 });
}

export async function getAssessmentById(projectId: string, workshopId: string, assessmentId: string) {
  const assessment = await Assessment.findOne({ _id: assessmentId, projectId, workshopId });
  if (!assessment) throw ApiError.notFound("Assessment not found");
  return assessment;
}

/** Candidate-facing view — never leaks which options are correct. */
export function sanitizeAssessmentForCandidate(assessment: {
  id?: string;
  title: string;
  description?: string | null;
  totalMarks: number;
  passingPercent: number;
  maxAttempts: number;
  durationMinutes: number;
  questions: { questionText: string; type: string; marks: number; options: { text: string }[] }[];
}) {
  return {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    totalMarks: assessment.totalMarks,
    passingPercent: assessment.passingPercent,
    maxAttempts: assessment.maxAttempts,
    durationMinutes: assessment.durationMinutes,
    questions: assessment.questions.map((q) => ({
      questionText: q.questionText,
      type: q.type,
      marks: q.marks,
      options: q.options.map((o) => ({ text: o.text })),
    })),
  };
}

async function assertNotLocked(assessmentId: string) {
  const attemptExists = await AssessmentAttempt.exists({ assessmentId });
  if (attemptExists) {
    throw ApiError.conflict("This assessment already has candidate attempts — questions, marks, and duration are locked");
  }
}

export async function updateAssessment(projectId: string, workshopId: string, assessmentId: string, updates: Record<string, unknown>, updatedBy: string) {
  const assessment = await getAssessmentById(projectId, workshopId, assessmentId);

  const touchesLockedFields = ["questions", "passingPercent", "maxAttempts", "durationMinutes"].some((key) => key in updates);
  if (touchesLockedFields) {
    await assertNotLocked(assessmentId);
  }

  const patch: Record<string, unknown> = { ...updates, updatedBy };
  if (updates.questions) {
    const questions = await buildQuestionSnapshot(projectId, updates.questions as InlineQuestion[]);
    patch.questions = questions;
    patch.totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    patch.version = (assessment.version ?? 1) + 1;
  }

  Object.assign(assessment, patch);
  await assessment.save();
  return assessment;
}

export async function setAssessmentEnabled(projectId: string, workshopId: string, assessmentId: string, isEnabled: boolean, updatedBy: string) {
  const assessment = await Assessment.findOneAndUpdate(
    { _id: assessmentId, projectId, workshopId },
    { $set: { isEnabled, updatedBy } },
    { new: true },
  );
  if (!assessment) throw ApiError.notFound("Assessment not found");
  return assessment;
}

export async function deleteAssessment(projectId: string, workshopId: string, assessmentId: string, deletedBy: string) {
  await assertNotLocked(assessmentId);
  const assessment = await softDeleteById(Assessment, assessmentId, { projectId, workshopId }, deletedBy);
  if (!assessment) throw ApiError.notFound("Assessment not found");
}
