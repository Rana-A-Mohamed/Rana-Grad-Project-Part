import { describe, expect, it } from 'vitest';
import { parseDurationToMs } from '../../src/shared/utils/duration.js';

describe('parseDurationToMs', () => {
  it.each([
    ['15m', 15 * 60_000],
    ['7d', 7 * 86_400_000],
    ['3600s', 3_600_000],
    ['2h', 2 * 3_600_000],
    ['500ms', 500],
  ])('parses %s', (input, expected) => {
    expect(parseDurationToMs(input)).toBe(expected);
  });

  it('throws on invalid input', () => {
    expect(() => parseDurationToMs('nonsense')).toThrow();
  });
});
