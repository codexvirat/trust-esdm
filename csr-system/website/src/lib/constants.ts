export const PROJECT_SLUG = "trust-esdm";

export const CANDIDATE_PORTAL_URL = process.env.NEXT_PUBLIC_CANDIDATE_PORTAL_URL ?? "http://localhost:3004";

export const TRACKS = {
  enable: { workshopSlug: "enable", label: "ENABLE — foundational program" },
  lead: { workshopSlug: "lead", label: "LEAD — advanced program" },
} as const;

export type TrackKey = keyof typeof TRACKS;
