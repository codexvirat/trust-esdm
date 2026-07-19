import { z } from "zod";

export const createVenueSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    address: z.string().optional(),
    city: z.string().optional(),
    capacity: z.number().min(1).optional(),
    geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  }),
});

export const updateVenueSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    capacity: z.number().min(1).optional(),
    geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  }),
});
