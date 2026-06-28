/**
 * Parse a short duration string (e.g. "15m", "7d", "3600s", "2h") into
 * milliseconds. Used to derive the refresh-token TTL from the same env value
 * passed to the JWT signer, so the persisted expiry matches the token.
 */
const UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function parseDurationToMs(input: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid duration string: "${input}" (expected e.g. 15m, 7d, 3600s)`);
  }
  const value = Number(match[1]);
  const unit = match[2] as keyof typeof UNIT_MS;
  return value * (UNIT_MS[unit] ?? 1);
}
