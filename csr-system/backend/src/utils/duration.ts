const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Parses simple durations like "15m", "30d", "1h" (as used in JWT *_TTL env vars) into milliseconds. */
export function parseDurationToMs(input: string): number {
  const match = /^(\d+)([smhd])$/.exec(input.trim());
  if (!match) {
    const asNumber = Number(input);
    if (Number.isFinite(asNumber)) return asNumber * 1000;
    throw new Error(`Invalid duration string: "${input}"`);
  }
  const [, amount, unit] = match;
  return Number(amount) * UNIT_MS[unit as string]!;
}
