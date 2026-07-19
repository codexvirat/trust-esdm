import type { RoleCode } from "./enums";

/**
 * Master permission catalog — mirrors the `permissions` collection.
 * Grouped by module so the seed script and any future role-builder UI
 * can render/validate against a single source of truth.
 */
export const PERMISSIONS = {
  PROJECT_CREATE: "PROJECT_CREATE",
  PROJECT_MANAGE: "PROJECT_MANAGE",
  ROLE_MANAGE: "ROLE_MANAGE",
  USER_MANAGE_ADMIN: "USER_MANAGE_ADMIN",
  USER_MANAGE_MANAGER: "USER_MANAGE_MANAGER",
  USER_MANAGE_WORKSHOP_MANAGER: "USER_MANAGE_WORKSHOP_MANAGER",
  USER_MANAGE_TRAINER: "USER_MANAGE_TRAINER",
  USER_MANAGE_CANDIDATE: "USER_MANAGE_CANDIDATE",

  WORKSHOP_CREATE: "WORKSHOP_CREATE",
  WORKSHOP_EDIT: "WORKSHOP_EDIT",
  WORKSHOP_DELETE: "WORKSHOP_DELETE",
  WORKSHOP_VIEW: "WORKSHOP_VIEW",
  WORKSHOP_ASSIGN_TRAINER: "WORKSHOP_ASSIGN_TRAINER",

  REGISTRATION_VIEW: "REGISTRATION_VIEW",
  REGISTRATION_APPROVE: "REGISTRATION_APPROVE",
  REGISTRATION_REJECT: "REGISTRATION_REJECT",

  ORGANISATION_MANAGE: "ORGANISATION_MANAGE",

  ATTENDANCE_GENERATE_QR: "ATTENDANCE_GENERATE_QR",
  ATTENDANCE_MARK: "ATTENDANCE_MARK",
  ATTENDANCE_VIEW: "ATTENDANCE_VIEW",

  ASSESSMENT_MANAGE: "ASSESSMENT_MANAGE",
  ASSESSMENT_TOGGLE: "ASSESSMENT_TOGGLE",
  ASSESSMENT_ATTEMPT: "ASSESSMENT_ATTEMPT",
  ASSESSMENT_VIEW_RESULTS: "ASSESSMENT_VIEW_RESULTS",

  FEEDBACK_MANAGE: "FEEDBACK_MANAGE",
  FEEDBACK_TOGGLE: "FEEDBACK_TOGGLE",
  FEEDBACK_SUBMIT: "FEEDBACK_SUBMIT",
  FEEDBACK_VIEW: "FEEDBACK_VIEW",

  CERTIFICATE_ISSUE: "CERTIFICATE_ISSUE",
  CERTIFICATE_REVOKE: "CERTIFICATE_REVOKE",
  CERTIFICATE_VIEW: "CERTIFICATE_VIEW",

  NOTIFICATION_SEND: "NOTIFICATION_SEND",
  NOTIFICATION_MANAGE_TEMPLATES: "NOTIFICATION_MANAGE_TEMPLATES",

  REPORT_VIEW: "REPORT_VIEW",
  ANALYTICS_VIEW: "ANALYTICS_VIEW",
  AUDIT_LOG_VIEW: "AUDIT_LOG_VIEW",
  SYSTEM_SETTINGS_MANAGE: "SYSTEM_SETTINGS_MANAGE",

  PROFILE_VIEW_OWN: "PROFILE_VIEW_OWN",
  PROFILE_EDIT_OWN: "PROFILE_EDIT_OWN",

  CONTACT_MESSAGE_VIEW: "CONTACT_MESSAGE_VIEW",
  CONTACT_MESSAGE_RESPOND: "CONTACT_MESSAGE_RESPOND",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_CATALOG: { code: PermissionCode; module: string; description: string }[] = [
  { code: PERMISSIONS.PROJECT_CREATE, module: "projects", description: "Create new projects" },
  { code: PERMISSIONS.PROJECT_MANAGE, module: "projects", description: "Edit existing projects and project settings" },
  { code: PERMISSIONS.ROLE_MANAGE, module: "identity", description: "Create/edit roles and permission grants" },
  { code: PERMISSIONS.USER_MANAGE_ADMIN, module: "identity", description: "Manage Admin accounts" },
  { code: PERMISSIONS.USER_MANAGE_MANAGER, module: "identity", description: "Manage Manager accounts" },
  { code: PERMISSIONS.USER_MANAGE_WORKSHOP_MANAGER, module: "identity", description: "Manage Workshop Manager accounts" },
  { code: PERMISSIONS.USER_MANAGE_TRAINER, module: "identity", description: "Manage Trainer accounts" },
  { code: PERMISSIONS.USER_MANAGE_CANDIDATE, module: "identity", description: "Manage Candidate accounts" },

  { code: PERMISSIONS.WORKSHOP_CREATE, module: "workshops", description: "Create workshops" },
  { code: PERMISSIONS.WORKSHOP_EDIT, module: "workshops", description: "Edit workshops" },
  { code: PERMISSIONS.WORKSHOP_DELETE, module: "workshops", description: "Delete workshops" },
  { code: PERMISSIONS.WORKSHOP_VIEW, module: "workshops", description: "View workshops" },
  { code: PERMISSIONS.WORKSHOP_ASSIGN_TRAINER, module: "workshops", description: "Assign trainers to batches" },

  { code: PERMISSIONS.REGISTRATION_VIEW, module: "registrations", description: "View public registrations" },
  { code: PERMISSIONS.REGISTRATION_APPROVE, module: "registrations", description: "Approve a candidate registration" },
  { code: PERMISSIONS.REGISTRATION_REJECT, module: "registrations", description: "Reject a candidate registration" },

  { code: PERMISSIONS.ORGANISATION_MANAGE, module: "organisations", description: "Create/edit the master list of candidate-affiliated organisations" },

  { code: PERMISSIONS.ATTENDANCE_GENERATE_QR, module: "attendance", description: "Open/close an attendance session" },
  { code: PERMISSIONS.ATTENDANCE_MARK, module: "attendance", description: "Mark candidate attendance (badge scan or manual)" },
  { code: PERMISSIONS.ATTENDANCE_VIEW, module: "attendance", description: "View attendance records" },

  { code: PERMISSIONS.ASSESSMENT_MANAGE, module: "assessment", description: "Create/edit assessments" },
  { code: PERMISSIONS.ASSESSMENT_TOGGLE, module: "assessment", description: "Enable/disable an assessment" },
  { code: PERMISSIONS.ASSESSMENT_ATTEMPT, module: "assessment", description: "Attempt an assessment" },
  { code: PERMISSIONS.ASSESSMENT_VIEW_RESULTS, module: "assessment", description: "View assessment results" },

  { code: PERMISSIONS.FEEDBACK_MANAGE, module: "feedback", description: "Create/edit feedback forms" },
  { code: PERMISSIONS.FEEDBACK_TOGGLE, module: "feedback", description: "Enable/disable feedback collection" },
  { code: PERMISSIONS.FEEDBACK_SUBMIT, module: "feedback", description: "Submit feedback" },
  { code: PERMISSIONS.FEEDBACK_VIEW, module: "feedback", description: "View feedback responses" },

  { code: PERMISSIONS.CERTIFICATE_ISSUE, module: "certificate", description: "Issue certificates" },
  { code: PERMISSIONS.CERTIFICATE_REVOKE, module: "certificate", description: "Revoke certificates" },
  { code: PERMISSIONS.CERTIFICATE_VIEW, module: "certificate", description: "View/download certificates" },

  { code: PERMISSIONS.NOTIFICATION_SEND, module: "notification", description: "Send notifications" },
  { code: PERMISSIONS.NOTIFICATION_MANAGE_TEMPLATES, module: "notification", description: "Manage notification templates" },

  { code: PERMISSIONS.REPORT_VIEW, module: "reporting", description: "View reports" },
  { code: PERMISSIONS.ANALYTICS_VIEW, module: "reporting", description: "View analytics dashboards" },
  { code: PERMISSIONS.AUDIT_LOG_VIEW, module: "system", description: "View audit logs" },
  { code: PERMISSIONS.SYSTEM_SETTINGS_MANAGE, module: "system", description: "Manage system settings" },

  { code: PERMISSIONS.PROFILE_VIEW_OWN, module: "profile", description: "View own profile" },
  { code: PERMISSIONS.PROFILE_EDIT_OWN, module: "profile", description: "Edit own profile" },

  { code: PERMISSIONS.CONTACT_MESSAGE_VIEW, module: "public_site", description: "View contact form submissions" },
  { code: PERMISSIONS.CONTACT_MESSAGE_RESPOND, module: "public_site", description: "Respond to contact submissions" },
];

/** Default permission grants per base system role — seeded verbatim into `roles.permissions`. */
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleCode, PermissionCode[]> = {
  super_admin: PERMISSION_CATALOG.map((p) => p.code),

  // Scoped to exactly one project (User.projectId) — everything a manager has,
  // plus the ability to create Manager/Workshop Manager users within that project.
  admin: [
    PERMISSIONS.WORKSHOP_CREATE,
    PERMISSIONS.WORKSHOP_EDIT,
    PERMISSIONS.WORKSHOP_DELETE,
    PERMISSIONS.WORKSHOP_VIEW,
    PERMISSIONS.WORKSHOP_ASSIGN_TRAINER,
    PERMISSIONS.REGISTRATION_VIEW,
    PERMISSIONS.REGISTRATION_APPROVE,
    PERMISSIONS.REGISTRATION_REJECT,
    PERMISSIONS.ORGANISATION_MANAGE,
    PERMISSIONS.ATTENDANCE_GENERATE_QR,
    PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ASSESSMENT_MANAGE,
    PERMISSIONS.ASSESSMENT_TOGGLE,
    PERMISSIONS.ASSESSMENT_VIEW_RESULTS,
    PERMISSIONS.FEEDBACK_MANAGE,
    PERMISSIONS.FEEDBACK_TOGGLE,
    PERMISSIONS.FEEDBACK_VIEW,
    PERMISSIONS.CERTIFICATE_ISSUE,
    PERMISSIONS.CERTIFICATE_REVOKE,
    PERMISSIONS.CERTIFICATE_VIEW,
    PERMISSIONS.NOTIFICATION_SEND,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.USER_MANAGE_MANAGER,
    PERMISSIONS.USER_MANAGE_WORKSHOP_MANAGER,
    PERMISSIONS.USER_MANAGE_TRAINER,
    PERMISSIONS.USER_MANAGE_CANDIDATE,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
    PERMISSIONS.CONTACT_MESSAGE_VIEW,
    PERMISSIONS.CONTACT_MESSAGE_RESPOND,
  ],

  manager: [
    PERMISSIONS.WORKSHOP_CREATE,
    PERMISSIONS.WORKSHOP_EDIT,
    PERMISSIONS.WORKSHOP_DELETE,
    PERMISSIONS.WORKSHOP_VIEW,
    PERMISSIONS.WORKSHOP_ASSIGN_TRAINER,
    PERMISSIONS.REGISTRATION_VIEW,
    PERMISSIONS.REGISTRATION_APPROVE,
    PERMISSIONS.REGISTRATION_REJECT,
    PERMISSIONS.ORGANISATION_MANAGE,
    PERMISSIONS.ATTENDANCE_GENERATE_QR,
    PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ASSESSMENT_MANAGE,
    PERMISSIONS.ASSESSMENT_TOGGLE,
    PERMISSIONS.ASSESSMENT_VIEW_RESULTS,
    PERMISSIONS.FEEDBACK_MANAGE,
    PERMISSIONS.FEEDBACK_TOGGLE,
    PERMISSIONS.FEEDBACK_VIEW,
    PERMISSIONS.CERTIFICATE_ISSUE,
    PERMISSIONS.CERTIFICATE_REVOKE,
    PERMISSIONS.CERTIFICATE_VIEW,
    PERMISSIONS.NOTIFICATION_SEND,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.USER_MANAGE_WORKSHOP_MANAGER,
    PERMISSIONS.USER_MANAGE_TRAINER,
    PERMISSIONS.USER_MANAGE_CANDIDATE,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
    PERMISSIONS.CONTACT_MESSAGE_VIEW,
    PERMISSIONS.CONTACT_MESSAGE_RESPOND,
  ],

  // Scoped to one or more specific Batches (via WorkshopManagerAssignment),
  // not the whole project — manager-equivalent operational access minus
  // project-wide capabilities (no workshop create/delete, no question-bank
  // management, no user management, no certificate issue/revoke).
  workshop_manager: [
    PERMISSIONS.WORKSHOP_VIEW,
    PERMISSIONS.WORKSHOP_EDIT,
    PERMISSIONS.WORKSHOP_ASSIGN_TRAINER,
    PERMISSIONS.ATTENDANCE_GENERATE_QR,
    PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ASSESSMENT_TOGGLE,
    PERMISSIONS.ASSESSMENT_VIEW_RESULTS,
    PERMISSIONS.FEEDBACK_TOGGLE,
    PERMISSIONS.FEEDBACK_VIEW,
    PERMISSIONS.CERTIFICATE_VIEW,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
  ],

  trainer: [
    PERMISSIONS.WORKSHOP_VIEW,
    PERMISSIONS.ATTENDANCE_GENERATE_QR,
    PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ASSESSMENT_TOGGLE,
    PERMISSIONS.ASSESSMENT_VIEW_RESULTS,
    PERMISSIONS.FEEDBACK_TOGGLE,
    PERMISSIONS.FEEDBACK_VIEW,
    // Read-only: lets a trainer see whether their candidates are on track for
    // certification (attendance/assessment/feedback gates) without granting
    // CERTIFICATE_ISSUE/REVOKE, which stay manager-only.
    PERMISSIONS.CERTIFICATE_VIEW,
    PERMISSIONS.NOTIFICATION_SEND,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
  ],

  candidate: [
    PERMISSIONS.WORKSHOP_VIEW,
    PERMISSIONS.ASSESSMENT_ATTEMPT,
    PERMISSIONS.FEEDBACK_SUBMIT,
    PERMISSIONS.CERTIFICATE_VIEW,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
  ],
};
