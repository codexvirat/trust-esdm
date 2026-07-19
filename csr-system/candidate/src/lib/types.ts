export type WorkshopStatus = "draft" | "published" | "ongoing" | "completed" | "cancelled";

export interface WorkshopSummary {
  _id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  mode: string;
  status: WorkshopStatus;
  startDate: string;
  endDate: string;
}

export interface Batch {
  _id: string;
  workshopId: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
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

export type AttendanceStatus = "present" | "late" | "absent";

export interface AttendanceRecord {
  _id: string;
  attendanceSessionId: string;
  batchId: string;
  workshopId: string;
  scanTime: string;
  status: AttendanceStatus;
}

export interface CandidateQuestionOption {
  text: string;
}

export interface CandidateAssessmentQuestion {
  questionText: string;
  type: "single_choice" | "multiple_choice" | "true_false";
  marks: number;
  options: CandidateQuestionOption[];
}

/** The sanitized, candidate-facing shape — never includes which options are correct. */
export interface CandidateAssessment {
  id: string;
  title: string;
  description?: string;
  totalMarks: number;
  passingPercent: number;
  maxAttempts: number;
  durationMinutes: number;
  questions: CandidateAssessmentQuestion[];
}

export type AttemptStatus = "in_progress" | "submitted" | "auto_submitted";
export type AttemptResult = "pass" | "fail";

export interface AssessmentAttempt {
  _id: string;
  assessmentId: string;
  candidateUserId: string;
  attemptNumber: number;
  answers: { questionIndex: number; selectedOptions: number[]; isCorrect: boolean; marksAwarded: number }[];
  score: number;
  percentage: number;
  result?: AttemptResult | null;
  status: AttemptStatus;
  startedAt: string;
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
  version: number;
}

export interface FeedbackResponse {
  _id: string;
  feedbackFormId: string;
  answers: { questionIndex: number; ratingValue?: number; textValue?: string }[];
  submittedAt: string;
}

export type CertificateStatus = "issued" | "revoked";

export interface Certificate {
  _id: string;
  enrollmentId: string;
  workshopId: string;
  batchId: string;
  certificateNumber: string;
  verificationCode: string;
  issueDate: string;
  status: CertificateStatus;
  fileUrl?: string | null;
}

export interface EducationEntry {
  degree?: string;
  institution?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
  grade?: string;
}

export interface AffiliatedOrganisation {
  name?: string;
  email?: string;
  phone?: string;
  type?: string;
  addressLine1?: string;
  addressLine2?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  shortCode?: string;
  industry?: string;
  employeeCount?: number;
  establishedDate?: string;
}

export interface CandidateProfile {
  _id: string;
  userId: string;
  dob?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  alternatePhone?: string | null;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  } | null;
  education: EducationEntry[];
  skills: string[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    twitter?: string;
  } | null;
  emergencyContact?: {
    name?: string;
    relation?: string;
    phone?: string;
  } | null;
  affiliatedOrganisation?: AffiliatedOrganisation | null;
  profileCompletionPercent: number;
}
