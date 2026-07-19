export type WorkshopStatus = "draft" | "published" | "ongoing" | "completed" | "cancelled";
export type WorkshopType = "workshop" | "bootcamp" | "seminar" | "csr_drive" | "webinar" | "other";
export type WorkshopMode = "online" | "offline" | "hybrid";
export type RegistrationStatus = "pending" | "approved" | "rejected" | "waitlisted";
export type BatchStatus = "scheduled" | "ongoing" | "completed" | "cancelled";

export interface WorkshopSummary {
  _id: string;
  title: string;
  slug: string;
  description: string;
  type: WorkshopType;
  mode: WorkshopMode;
  status: WorkshopStatus;
  startDate: string;
  endDate: string;
  capacity?: number | null;
  enrolledCount: number;
  createdAt: string;
}

export interface Registration {
  _id: string;
  workshopId: string;
  fullName: string;
  email: string;
  phone: string;
  status: RegistrationStatus;
  source: string;
  createdAt: string;
  rejectionReason?: string;
}

export interface Batch {
  _id: string;
  workshopId: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  capacity?: number | null;
  enrolledCount: number;
  status: BatchStatus;
}

export type TrainerAssignmentRole = "lead" | "co_trainer";

export interface TrainerAssignment {
  _id: string;
  batchId: string;
  workshopId: string;
  trainerId: string;
  roleInBatch: TrainerAssignmentRole;
  status: "active" | "removed";
}

export interface UserSummary {
  _id: string;
  fullName: string;
  email: string;
  roleCode: "super_admin" | "admin" | "manager" | "workshop_manager" | "trainer" | "candidate";
  status: string;
}

export type EnrollmentStatus = "assigned" | "in_progress" | "completed" | "dropped" | "certified";
export type AssessmentEnrollmentStatus = "not_started" | "in_progress" | "passed" | "failed";

export interface Enrollment {
  _id: string;
  candidateUserId: string;
  workshopId: string;
  batchId: string;
  status: EnrollmentStatus;
  attendancePercent: number;
  assessmentStatus: AssessmentEnrollmentStatus;
  feedbackSubmitted: boolean;
  certificateId?: string | null;
}

export type AttendanceSessionStatus = "open" | "closed";
export type AttendanceStatus = "present" | "late" | "absent";

export interface AttendanceSession {
  _id: string;
  batchId: string;
  workshopId: string;
  sessionDate: string;
  sessionLabel: string;
  qrExpiresAt: string;
  status: AttendanceSessionStatus;
}

export interface AttendanceRecord {
  _id: string;
  attendanceSessionId: string;
  batchId: string;
  candidateUserId: string;
  markedByUserId?: string | null;
  scanTime: string;
  status: AttendanceStatus;
}

export type QuestionType = "single_choice" | "multiple_choice" | "true_false";
export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  _id: string;
  questionText: string;
  type: QuestionType;
  options: QuestionOption[];
  marks: number;
  difficulty: QuestionDifficulty;
  tags: string[];
}

export interface AssessmentQuestion {
  questionText: string;
  type: QuestionType;
  options: QuestionOption[];
  marks: number;
}

export interface Assessment {
  _id: string;
  workshopId: string;
  batchId?: string | null;
  title: string;
  description?: string;
  questions: AssessmentQuestion[];
  totalMarks: number;
  passingPercent: number;
  maxAttempts: number;
  durationMinutes: number;
  isEnabled: boolean;
}

export type AttemptStatus = "in_progress" | "submitted" | "auto_submitted";
export type AttemptResult = "pass" | "fail";

export interface AssessmentAttempt {
  _id: string;
  assessmentId: string;
  candidateUserId: string;
  attemptNumber: number;
  score: number;
  percentage: number;
  result?: AttemptResult | null;
  status: AttemptStatus;
  submittedAt?: string | null;
}

export type FeedbackQuestionType = "rating" | "text" | "nps";

export interface FeedbackFormQuestion {
  questionText: string;
  type: FeedbackQuestionType;
  required: boolean;
}

export interface FeedbackForm {
  _id: string;
  workshopId: string;
  questions: FeedbackFormQuestion[];
  isEnabled: boolean;
}

export interface FeedbackResponse {
  _id: string;
  feedbackFormId: string;
  candidateUserId: string;
  courseRating?: number;
  trainerRating?: number;
  comments?: string;
  submittedAt: string;
}

export interface CertificateTemplate {
  _id: string;
  name: string;
  isActive: boolean;
}

export type CertificateStatus = "issued" | "revoked";

export interface Certificate {
  _id: string;
  enrollmentId: string;
  candidateUserId: string;
  workshopId: string;
  batchId: string;
  certificateNumber: string;
  verificationCode: string;
  issueDate: string;
  status: CertificateStatus;
  revokedReason?: string;
}

export interface TrainerProfile {
  _id: string;
  userId: string;
  specializations: string[];
  bio?: string;
  experienceYears: number;
  certifications: string[];
  ratingAverage: number;
  ratingCount: number;
}

export interface CertificateEligibility {
  eligible: boolean;
  gates: {
    attendance: { required: number; actual: number; met: boolean };
    assessment: { required: boolean; applicable: boolean; met: boolean };
    feedback: { required: boolean; applicable: boolean; met: boolean };
  };
}
