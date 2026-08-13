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
  answers?: { questionIndex: number; ratingValue?: number; textValue?: string; gridValues?: number[]; selectedOptions?: string[] }[];
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
  return FeedbackResponse.find({ projectId, feedbackFormId: formId })
    .sort({ submittedAt: -1 })
    .populate("candidateUserId", "fullName email");
}

export async function getOwnResponse(candidateUserId: string, formId: string) {
  return FeedbackResponse.findOne({ candidateUserId, feedbackFormId: formId });
}

/** Staff-side override — see setResponseRatingSchema for why this exists alongside submitFeedback. */
export async function setResponseRating(
  projectId: string,
  workshopId: string,
  formId: string,
  responseId: string,
  updates: { courseRating?: number; trainerRating?: number },
) {
  const response = await FeedbackResponse.findOneAndUpdate(
    { _id: responseId, projectId, workshopId, feedbackFormId: formId },
    { $set: updates },
    { new: true },
  );
  if (!response) throw ApiError.notFound("Feedback response not found");
  return response;
}

/**
 * Staff-side delete, so a candidate can be let back in to resubmit (submitFeedback rejects a
 * second response for the same form while one exists). Also un-sets Enrollment.feedbackSubmitted —
 * the exact inverse of what submitFeedback sets — so the feedback gate in certificate.service.ts
 * and the report's "feedback submitted" column don't keep treating deleted feedback as satisfied.
 */
export async function deleteResponse(projectId: string, workshopId: string, formId: string, responseId: string) {
  const response = await FeedbackResponse.findOneAndDelete({ _id: responseId, projectId, workshopId, feedbackFormId: formId });
  if (!response) throw ApiError.notFound("Feedback response not found");

  await Enrollment.updateOne(
    { projectId, workshopId, candidateUserId: response.candidateUserId },
    { $set: { feedbackSubmitted: false } },
  );

  return response;
}
