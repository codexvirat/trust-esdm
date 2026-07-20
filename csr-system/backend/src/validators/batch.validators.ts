import { z } from "zod";
import { BATCH_STATUSES } from "../types/enums";

export const createBatchSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    venueId: z.string().optional(),
    capacity: z.number().min(1).optional(),
  }),
});

export const updateBatchSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    venueId: z.string().nullable().optional(),
    capacity: z.number().min(1).optional(),
    status: z.enum(BATCH_STATUSES).optional(),
  }),
});

export const createDayPlanEntrySchema = z.object({
  body: z.object({
    date: z.coerce.date(),
    title: z.string().min(1),
    assignedToUserId: z.string().nullable().optional(),
  }),
});

export const updateDayPlanEntrySchema = z.object({
  body: z.object({
    date: z.coerce.date().optional(),
    title: z.string().min(1).optional(),
    assignedToUserId: z.string().nullable().optional(),
  }),
});
