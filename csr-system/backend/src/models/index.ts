/**
 * Side-effect import barrel — ensures every model is registered with Mongoose
 * before any `ref: "X"` populate/cast is resolved. Import this once, early
 * (see server.ts), rather than relying on individual route modules to import
 * models in the right order.
 */
export * from "./Project";
export * from "./Role";
export * from "./Permission";
export * from "./User";
export * from "./CandidateProfile";
export * from "./TrainerProfile";
export * from "./AuthSession";
export * from "./PasswordResetToken";

export * from "./WorkshopCategory";
export * from "./Venue";
export * from "./Workshop";
export * from "./Batch";
export * from "./Marquee";
export * from "./TrainerAssignment";
export * from "./WorkshopManagerAssignment";
export * from "./Registration";
export * from "./Organisation";
export * from "./Enrollment";

export * from "./AttendanceSession";
export * from "./AttendanceRecord";

export * from "./QuestionBank";
export * from "./Assessment";
export * from "./AssessmentAttempt";

export * from "./FeedbackQuestionBank";
export * from "./FeedbackForm";
export * from "./FeedbackResponse";

export * from "./CertificateTemplate";
export * from "./Certificate";

export * from "./NotificationTemplate";
export * from "./Notification";
export * from "./AuditLog";
export * from "./Media";
export * from "./ContactMessage";
export * from "./SystemSetting";
export * from "./Counter";
