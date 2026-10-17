import { describe, it, expect } from 'vitest';
import { formatTimeRemaining, getSecondsRemaining } from '../src/utils/time';

describe('Reloop Time & Countdown Utilities', () => {
  it('formats remaining seconds into human readable countdown', () => {
    expect(formatTimeRemaining(0)).toBe('Bidding Closed');
    expect(formatTimeRemaining(-10)).toBe('Bidding Closed');
    expect(formatTimeRemaining(45)).toBe('45s left');
    expect(formatTimeRemaining(130)).toBe('2m 10s left');
    expect(formatTimeRemaining(3665)).toBe('1h 1m left');
    expect(formatTimeRemaining(90000)).toBe('1d 1h left');
  });

  it('calculates remaining seconds relative to future ISO date', () => {
    const futureDate = new Date(Date.now() + 60000).toISOString();
    const rem = getSecondsRemaining(futureDate);
    expect(rem).toBeGreaterThan(50);
    expect(rem).toBeLessThanOrEqual(60);

    const pastDate = new Date(Date.now() - 60000).toISOString();
    expect(getSecondsRemaining(pastDate)).toBe(0);
  });
});
