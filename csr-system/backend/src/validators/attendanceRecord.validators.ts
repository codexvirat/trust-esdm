import { z } from "zod";
import { ATTENDANCE_STATUSES } from "../types/enums";

export const scanCandidateBadgeSchema = z.object({
  body: z.object({
    candidateQrToken: z.string().min(1),
    location: z.object({ lat: z.number(), lng: z.number() }).optional(),
    deviceInfo: z.string().optional(),
  }),
});

export const markAttendanceSchema = z.object({
  body: z.object({
    candidateUserId: z.string().min(1),
    status: z.enum(ATTENDANCE_STATUSES),
  }),
});
