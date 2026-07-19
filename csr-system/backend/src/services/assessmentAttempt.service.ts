import { Assessment } from "../models/Assessment";
import { AssessmentAttempt } from "../models/AssessmentAttempt";
import { Enrollment } from "../models/Enrollment";
import { ApiError } from "../utils/ApiError";
import { sanitizeAssessmentForCandidate } from "./assessment.service";

async function findCandidateEnrollment(projectId: string, workshopId: string, batchId: string | null, candidateUserId: string) {
  const query: Record<string, unknown> = { projectId, workshopId, candidateUserId };
  if (batchId) query.batchId = batchId;
  const enrollment = await Enrollment.findOne(query);
  if (!enrollment) throw ApiError.forbidden("You are not enrolled in the workshop/batch this assessment belongs to");
  return enrollment;
}

async function recomputeAssessmentStatus(projectId: string, assessmentId: string, candidateUserId: string, enrollmentId: string) {
  const attempts = await AssessmentAttempt.find({ projectId, assessmentId, candidateUserId });
  const assessment = await Assessment.findById(assessmentId);
  const passed = attempts.some((a) => a.result === "pass");
  const exhausted = attempts.filter((a) => a.status !== "in_progress").length >= (assessment?.maxAttempts ?? 1);

  const assessmentStatus = passed ? "passed" : exhausted ? "failed" : attempts.length > 0 ? "in_progress" : "not_started";
  await Enrollment.updateOne({ _id: enrollmentId }, { $set: { assessmentStatus } });
  return assessmentStatus;
}

export async function startAttempt(input: { projectId: string; workshopId: string; assessmentId: string; candidateUserId: string }) {
  const assessment = await Assessment.findOne({ _id: input.assessmentId, projectId: input.projectId, workshopId: input.workshopId });
  if (!assessment) throw ApiError.notFound("Assessment not found");
  if (!assessment.isEnabled) throw ApiError.badRequest("This assessment is not currently open");

  await findCandidateEnrollment(input.projectId, input.workshopId, assessment.batchId?.toString() ?? null, input.candidateUserId);

  const existingAttempts = await AssessmentAttempt.countDocuments({ assessmentId: assessment._id, candidateUserId: input.candidateUserId });
  const inProgress = await AssessmentAttempt.findOne({
    assessmentId: assessment._id,
    candidateUserId: input.candidateUserId,
    status: "in_progress",
  });
  if (inProgress) {
    return { attempt: inProgress, assessment: sanitizeAssessmentForCandidate(assessment) };
  }
  if (existingAttempts >= assessment.maxAttempts) {
    throw ApiError.conflict(`Maximum attempts (${assessment.maxAttempts}) already used`);
  }

  const attempt = await AssessmentAttempt.create({
    projectId: input.projectId,
    assessmentId: assessment._id,
    candidateUserId: input.candidateUserId,
    attemptNumber: existingAttempts + 1,
    startedAt: new Date(),
    status: "in_progress",
  });

  return { attempt, assessment: sanitizeAssessmentForCandidate(assessment) };
}

export async function submitAttempt(input: {
  projectId: string;
  workshopId: string;
  assessmentId: string;
  attemptId: string;
  candidateUserId: string;
  answers: { questionIndex: number; selectedOptions: number[] }[];
}) {
  const assessment = await Assessment.findOne({ _id: input.assessmentId, projectId: input.projectId, workshopId: input.workshopId });
  if (!assessment) throw ApiError.notFound("Assessment not found");

  const attempt = await AssessmentAttempt.findOne({ _id: input.attemptId, assessmentId: assessment._id, candidateUserId: input.candidateUserId });
  if (!attempt) throw ApiError.notFound("Attempt not found");
  if (attempt.status !== "in_progress") throw ApiError.conflict("This attempt was already submitted");

  const isLate = Date.now() - attempt.startedAt.getTime() > assessment.durationMinutes * 60_000;

  let score = 0;
  const gradedAnswers = assessment.questions.map((question, index) => {
    const given = input.answers.find((a) => a.questionIndex === index);
    const selectedOptions = given?.selectedOptions ?? [];
    const correctIndexes = question.options.map((o, i) => (o.isCorrect ? i : -1)).filter((i) => i >= 0);
    const isCorrect =
      selectedOptions.length === correctIndexes.length && correctIndexes.every((i) => selectedOptions.includes(i));
    const marksAwarded = isCorrect ? question.marks : 0;
    score += marksAwarded;
    return { questionIndex: index, selectedOptions, isCorrect, marksAwarded };
  });

  const percentage = assessment.totalMarks === 0 ? 0 : Math.round((score / assessment.totalMarks) * 100);
  const result = percentage >= assessment.passingPercent ? "pass" : "fail";

  // Plain-array assignment to a subdocument array trips Mongoose's stricter TS
  // typing even though it casts fine at runtime — .set() sidesteps that cleanly.
  attempt.set("answers", gradedAnswers);
  attempt.score = score;
  attempt.percentage = percentage;
  attempt.result = result;
  attempt.submittedAt = new Date();
  attempt.status = isLate ? "auto_submitted" : "submitted";
  await attempt.save();

  const enrollment = await findCandidateEnrollment(
    input.projectId,
    input.workshopId,
    assessment.batchId?.toString() ?? null,
    input.candidateUserId,
  );
  const assessmentStatus = await recomputeAssessmentStatus(input.projectId, assessment.id, input.candidateUserId, enrollment.id);

  return { attempt, assessmentStatus };
}

export async function listOwnAttempts(candidateUserId: string, assessmentId: string) {
  return AssessmentAttempt.find({ candidateUserId, assessmentId }).sort({ attemptNumber: 1 });
}

export async function listAttemptsForAssessment(projectId: string, assessmentId: string) {
  return AssessmentAttempt.find({ projectId, assessmentId }).sort({ createdAt: -1 });
}
