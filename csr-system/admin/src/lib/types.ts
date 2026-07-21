export type ProjectType = "university" | "company" | "ngo" | "csr_partner" | "government" | "other";
export type ProjectStatus = "active" | "suspended" | "inactive";

export interface Project {
  _id: string;
  name: string;
  slug: string;
  type: ProjectType;
  logoUrl?: string;
  website?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  status: ProjectStatus;
  plan: "free" | "standard" | "enterprise";
  createdAt: string;
}

export type RoleCode = "super_admin" | "admin" | "manager" | "workshop_manager" | "trainer" | "candidate";

export interface UserSummary {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  roleCode: RoleCode;
  status: string;
  projectId: string;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface EducationEntry {
  degree?: string;
  institution?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
  grade?: string;
}

export interface MediaRef {
  _id: string;
  url: string;
  mimeType?: string;
}

export interface AffiliatedOrganisation {
  name?: string;
  email?: string;
  phone?: string;
  type?: ProjectType;
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
  resumeMediaId?: MediaRef | string | null;
  photoMediaId?: MediaRef | string | null;
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
  alumniStatus: boolean;
  profileCompletionPercent: number;
  attendanceQrToken?: string | null;
}

export interface Role {
  _id: string;
  projectId: string | null;
  name: string;
  code: string;
  description?: string;
  isSystemRole: boolean;
  permissions: string[];
}

export interface PermissionCatalogEntry {
  code: string;
  module: string;
  description: string;
}

export type WorkshopStatus = "draft" | "published" | "ongoing" | "completed" | "cancelled";
export type WorkshopType = "workshop" | "bootcamp" | "seminar" | "csr_drive" | "webinar" | "other";
export type WorkshopMode = "online" | "offline" | "hybrid";
export type RegistrationStatus = "pending" | "approved" | "rejected" | "waitlisted";
export type BatchStatus = "scheduled" | "ongoing" | "completed" | "cancelled";

export interface WorkshopSummary {
  _id: string;
  projectId: string;
  title: string;
  slug: string;
  description: string;
  type: WorkshopType;
  mode: WorkshopMode;
  status: WorkshopStatus;
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
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  } | null;
  affiliatedOrganisation?: AffiliatedOrganisation | null;
  status: RegistrationStatus;
  source: string;
  createdAt: string;
  rejectionReason?: string;
}

export interface BatchPhoto {
  _id: string;
  url: string;
}

export interface DayPlanEntry {
  _id: string;
  date: string;
  title: string;
  assignedToUserId?: string | null;
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
  venueId?: string | null;
  photos?: BatchPhoto[];
  dayPlan?: DayPlanEntry[];
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

export interface WorkshopManagerAssignment {
  _id: string;
  batchId: string;
  workshopId: string;
  workshopManagerId: string;
  status: "active" | "removed";
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
  feedbackQuestionBankId?: string | null;
  questionText: string;
  type: FeedbackQuestionType;
  required: boolean;
}

export interface FeedbackBankQuestion {
  _id: string;
  questionText: string;
  type: FeedbackQuestionType;
  required: boolean;
  tags: string[];
}

export interface FeedbackForm {
  _id: string;
  workshopId: string;
  batchId?: string | null;
  title?: string;
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

export interface CertificateLayoutFieldPosition {
  xPct: number;
  yPct: number;
  fontSize?: number;
  widthPct?: number;
  color?: string;
  align?: "left" | "center" | "right";
}

export interface CertificateLayoutConfig {
  certificateNumber?: CertificateLayoutFieldPosition;
  participantName?: CertificateLayoutFieldPosition;
  location?: CertificateLayoutFieldPosition;
  issueDate?: CertificateLayoutFieldPosition;
  qr?: CertificateLayoutFieldPosition;
}

export interface CertificateTemplate {
  _id: string;
  name: string;
  isActive: boolean;
  backgroundImageUrl?: string | null;
  layoutConfig?: CertificateLayoutConfig;
}

export type CertificateStatus = "draft" | "issued" | "revoked";

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
  fileUrl?: string | null;
}

export interface CertificateEligibility {
  eligible: boolean;
  gates: {
    attendance: { required: number; actual: number; met: boolean };
    assessment: { required: boolean; applicable: boolean; met: boolean };
    feedback: { required: boolean; applicable: boolean; met: boolean };
  };
}

export interface BatchGenerateResult {
  totalEnrollments: number;
  drafted: { enrollmentId: string; candidateName: string; certificateId: string; certificateNumber: string }[];
  skippedAlreadyCertified: { enrollmentId: string; candidateName: string }[];
  skippedIneligible: {
    enrollmentId: string;
    candidateName: string;
    gates: {
      attendance: { required: number; actual: number; met: boolean };
      assessment: { required: boolean; applicable: boolean; met: boolean };
      feedback: { required: boolean; applicable: boolean; met: boolean };
    };
  }[];
  failed: { enrollmentId: string; candidateName: string; error: string }[];
}

export interface BatchPublishResult {
  totalDrafts: number;
  published: { certificateId: string; candidateName: string; certificateNumber: string; emailDelivered: boolean }[];
  failed: { certificateId: string; candidateName: string; error: string }[];
}

export interface Organisation {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  type?: ProjectType;
  addressLine1?: string;
  addressLine2?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  udyamNumber?: string;
  shortCode?: string;
  industry?: string;
  employeeCount?: number;
  establishedDate?: string;
  isActive: boolean;
}

export interface WorkshopCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Venue {
  _id: string;
  name: string;
  address?: string;
  city?: string;
  capacity?: number | null;
  geo?: { lat: number; lng: number };
}

export interface Marquee {
  _id: string;
  message: string;
  linkTarget: string;
  isActive: boolean;
  createdAt: string;
}
