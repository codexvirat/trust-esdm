/**
 * Central enum catalog. Every Mongoose `enum:` validator and every RBAC check
 * imports from here so there is exactly one place that defines valid values —
 * see AGENTS.md-level design doc, Part 01 (naming conventions: lowercase snake_case enums).
 */

export const ROLE_CODES = ["super_admin", "admin", "manager", "workshop_manager", "trainer", "candidate"] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export const PROJECT_TYPES = ["university", "company", "ngo", "csr_partner", "government", "msme", "other"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_STATUSES = ["active", "suspended", "inactive"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const USER_STATUSES = ["active", "inactive", "suspended", "pending"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const GENDERS = ["male", "female", "other", "prefer_not_to_say"] as const;
export type Gender = (typeof GENDERS)[number];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const WORKSHOP_TYPES = ["workshop", "bootcamp", "seminar", "csr_drive", "webinar", "other"] as const;
export type WorkshopType = (typeof WORKSHOP_TYPES)[number];

export const WORKSHOP_MODES = ["online", "offline", "hybrid"] as const;
export type WorkshopMode = (typeof WORKSHOP_MODES)[number];

export const WORKSHOP_STATUSES = ["draft", "published", "ongoing", "completed", "cancelled"] as const;
export type WorkshopStatus = (typeof WORKSHOP_STATUSES)[number];

export const BATCH_STATUSES = ["scheduled", "ongoing", "completed", "cancelled"] as const;
export type BatchStatus = (typeof BATCH_STATUSES)[number];

export const TRAINER_ASSIGNMENT_ROLES = ["lead", "co_trainer"] as const;
export type TrainerAssignmentRole = (typeof TRAINER_ASSIGNMENT_ROLES)[number];

export const TRAINER_ASSIGNMENT_STATUSES = ["active", "removed"] as const;
export type TrainerAssignmentStatus = (typeof TRAINER_ASSIGNMENT_STATUSES)[number];

export const WORKSHOP_MANAGER_ASSIGNMENT_STATUSES = ["active", "removed"] as const;
export type WorkshopManagerAssignmentStatus = (typeof WORKSHOP_MANAGER_ASSIGNMENT_STATUSES)[number];

export const REGISTRATION_SOURCES = ["website", "referral", "campaign", "staff"] as const;
export type RegistrationSource = (typeof REGISTRATION_SOURCES)[number];

export const REGISTRATION_STATUSES = ["pending", "approved", "rejected", "waitlisted"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const ENROLLMENT_STATUSES = ["assigned", "in_progress", "completed", "dropped", "certified"] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const ASSESSMENT_ENROLLMENT_STATUSES = ["not_started", "in_progress", "passed", "failed"] as const;
export type AssessmentEnrollmentStatus = (typeof ASSESSMENT_ENROLLMENT_STATUSES)[number];

export const ATTENDANCE_SESSION_STATUSES = ["open", "closed"] as const;
export type AttendanceSessionStatus = (typeof ATTENDANCE_SESSION_STATUSES)[number];

export const ATTENDANCE_STATUSES = ["present", "late", "absent"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const QUESTION_TYPES = ["single_choice", "multiple_choice", "true_false"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type QuestionDifficulty = (typeof QUESTION_DIFFICULTIES)[number];

export const ATTEMPT_STATUSES = ["in_progress", "submitted", "auto_submitted"] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

export const ATTEMPT_RESULTS = ["pass", "fail"] as const;
export type AttemptResult = (typeof ATTEMPT_RESULTS)[number];

export const FEEDBACK_QUESTION_TYPES = ["rating", "text", "nps"] as const;
export type FeedbackQuestionType = (typeof FEEDBACK_QUESTION_TYPES)[number];

export const CERTIFICATE_STATUSES = ["issued", "revoked"] as const;
export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

export const NOTIFICATION_CHANNELS = ["email", "sms", "whatsapp", "push"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_STATUSES = ["queued", "sent", "failed", "read"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const MEDIA_FILE_TYPES = ["image", "pdf", "doc"] as const;
export type MediaFileType = (typeof MEDIA_FILE_TYPES)[number];

export const MEDIA_PROVIDERS = ["cloudinary", "s3"] as const;
export type MediaProvider = (typeof MEDIA_PROVIDERS)[number];

export const MEDIA_STATUSES = ["pending", "confirmed", "rejected"] as const;
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export const CONTACT_MESSAGE_STATUSES = ["new", "in_review", "resolved"] as const;
export type ContactMessageStatus = (typeof CONTACT_MESSAGE_STATUSES)[number];

export const PASSWORD_RESET_PURPOSES = ["reset", "first_login", "email_verify"] as const;
export type PasswordResetPurpose = (typeof PASSWORD_RESET_PURPOSES)[number];
