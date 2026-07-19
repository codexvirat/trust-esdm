import { Enrollment } from "../models/Enrollment";
import { Batch } from "../models/Batch";
import { Workshop } from "../models/Workshop";
import { Certificate } from "../models/Certificate";
import { AttendanceRecord } from "../models/AttendanceRecord";
import { AttendanceSession } from "../models/AttendanceSession";
import { AssessmentAttempt } from "../models/AssessmentAttempt";
import { FeedbackResponse } from "../models/FeedbackResponse";
import { Assessment } from "../models/Assessment";
import { FeedbackForm } from "../models/FeedbackForm";
import { TrainerAssignment } from "../models/TrainerAssignment";
import { CandidateProfile } from "../models/CandidateProfile";
import { TrainerProfile } from "../models/TrainerProfile";

function deletedStamp(deletedBy: string) {
  return { isDeleted: true, deletedAt: new Date(), updatedBy: deletedBy };
}

/**
 * Soft-deletes a candidate's account and everything that hangs off it —
 * profile, enrollments, certificates, attendance, assessment attempts,
 * feedback responses — and reverses the enrolledCount their enrollments
 * added to each batch/workshop. Nothing is hard-deleted (basePlugin's global
 * query filter just hides isDeleted:true docs), so this is recoverable
 * directly in Mongo if a deletion turns out to be a mistake.
 */
export async function cascadeDeleteCandidate(projectId: string, candidateUserId: string, deletedBy: string) {
  const set = deletedStamp(deletedBy);

  const enrollments = await Enrollment.find({ projectId, candidateUserId });
  for (const enrollment of enrollments) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.all([
      Batch.updateOne({ _id: enrollment.batchId }, { $inc: { enrolledCount: -1 } }),
      Workshop.updateOne({ _id: enrollment.workshopId }, { $inc: { enrolledCount: -1 } }),
    ]);
  }

  await Promise.all([
    Enrollment.updateMany({ projectId, candidateUserId }, { $set: set }),
    CandidateProfile.updateMany({ projectId, userId: candidateUserId }, { $set: set }),
    Certificate.updateMany({ projectId, candidateUserId }, { $set: set }),
    AttendanceRecord.updateMany({ projectId, candidateUserId }, { $set: set }),
    AssessmentAttempt.updateMany({ projectId, candidateUserId }, { $set: set }),
    FeedbackResponse.updateMany({ projectId, candidateUserId }, { $set: set }),
  ]);
}

/**
 * Soft-deletes a batch and everything scoped to it — enrollments (reversing
 * the Workshop.enrolledCount they added), attendance sessions/records,
 * certificates, trainer assignments, and any assessment/feedback form that
 * was scoped specifically to this batch (a batch-level override of the
 * workshop's defaults), along with the attempts/responses recorded against
 * those forms.
 */
export async function cascadeDeleteBatch(projectId: string, batchId: string, workshopId: string, deletedBy: string) {
  const set = deletedStamp(deletedBy);

  const enrollmentCount = await Enrollment.countDocuments({ projectId, batchId });
  if (enrollmentCount > 0) {
    await Workshop.updateOne({ _id: workshopId }, { $inc: { enrolledCount: -enrollmentCount } });
  }

  const [batchAssessments, batchFeedbackForms] = await Promise.all([
    Assessment.find({ projectId, batchId }, { _id: 1 }),
    FeedbackForm.find({ projectId, batchId }, { _id: 1 }),
  ]);
  const assessmentIds = batchAssessments.map((a) => a._id);
  const feedbackFormIds = batchFeedbackForms.map((f) => f._id);

  await Promise.all([
    Enrollment.updateMany({ projectId, batchId }, { $set: set }),
    AttendanceSession.updateMany({ projectId, batchId }, { $set: set }),
    AttendanceRecord.updateMany({ projectId, batchId }, { $set: set }),
    Certificate.updateMany({ projectId, batchId }, { $set: set }),
    TrainerAssignment.updateMany({ projectId, batchId }, { $set: set }),
    Assessment.updateMany({ projectId, batchId }, { $set: set }),
    FeedbackForm.updateMany({ projectId, batchId }, { $set: set }),
    assessmentIds.length > 0 ? AssessmentAttempt.updateMany({ projectId, assessmentId: { $in: assessmentIds } }, { $set: set }) : null,
    feedbackFormIds.length > 0 ? FeedbackResponse.updateMany({ projectId, feedbackFormId: { $in: feedbackFormIds } }, { $set: set }) : null,
  ]);
}

/**
 * Soft-deletes a trainer's profile and unassigns them everywhere — marks
 * their TrainerAssignment rows "removed" (same status the manual unassign
 * flow uses, rather than soft-deleting the assignment record itself) and
 * pulls them out of any Workshop.assignedTrainerIds arrays.
 */
export async function cascadeDeleteTrainer(projectId: string, trainerUserId: string, deletedBy: string) {
  await Promise.all([
    TrainerProfile.updateMany({ projectId, userId: trainerUserId }, { $set: deletedStamp(deletedBy) }),
    TrainerAssignment.updateMany(
      { projectId, trainerId: trainerUserId, status: "active" },
      { $set: { status: "removed", updatedBy: deletedBy } },
    ),
    Workshop.updateMany({ projectId, assignedTrainerIds: trainerUserId }, { $pull: { assignedTrainerIds: trainerUserId } }),
  ]);
}
