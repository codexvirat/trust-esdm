import { FeedbackForm } from "../models/FeedbackForm";
import { FeedbackResponse } from "../models/FeedbackResponse";
import { Enrollment } from "../models/Enrollment";
import { ApiError } from "../utils/ApiError";

export async function submitFeedback(input: {
  projectId: string;
  workshopId: string;
  formId: string;
  candidateUserId: string;
  trainerId?: string;
  answers?: { questionIndex: number; ratingValue?: number; textValue?: string }[];
  courseRating?: number;
  trainerRating?: number;
  comments?: string;
}) {
  const form = await FeedbackForm.findOne({ _id: input.formId, projectId: input.projectId, workshopId: input.workshopId });
  if (!form) throw ApiError.notFound("Feedback form not found");
  if (!form.isEnabled) throw ApiError.badRequest("Feedback is not currently open for this workshop");

  const enrollment = await Enrollment.findOne({ projectId: input.projectId, workshopId: input.workshopId, candidateUserId: input.candidateUserId });
  if (!enrollment) throw ApiError.forbidden("You are not enrolled in this workshop");

  const existing = await FeedbackResponse.findOne({ feedbackFormId: form._id, candidateUserId: input.candidateUserId });
  if (existing) throw ApiError.conflict("Feedback already submitted for this form");

  const response = await FeedbackResponse.create({
    projectId: input.projectId,
    feedbackFormId: form._id,
    workshopId: input.workshopId,
    candidateUserId: input.candidateUserId,
    trainerId: input.trainerId ?? null,
    answers: input.answers ?? [],
    courseRating: input.courseRating,
    trainerRating: input.trainerRating,
    comments: input.comments,
    submittedAt: new Date(),
    formVersionAtResponse: form.version,
  });

  await Enrollment.updateOne({ _id: enrollment.id }, { $set: { feedbackSubmitted: true } });

  return response;
}

export async function listResponsesForForm(projectId: string, formId: string) {
  return FeedbackResponse.find({ projectId, feedbackFormId: formId }).sort({ submittedAt: -1 });
}

export async function getOwnResponse(candidateUserId: string, formId: string) {
  return FeedbackResponse.findOne({ candidateUserId, feedbackFormId: formId });
}
