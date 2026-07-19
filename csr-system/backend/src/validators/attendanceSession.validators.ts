import { z } from "zod";

export const createAttendanceSessionSchema = z.object({
  body: z.object({
    sessionDate: z.coerce.date(),
    sessionLabel: z.string().min(1),
    expiresInMinutes: z.number().min(1).max(1440).optional(),
    geoFence: z.object({ lat: z.number(), lng: z.number(), radiusMeters: z.number().min(1) }).optional(),
  }),
});
