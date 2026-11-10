import { describe, it, expect } from 'vitest';
import {
  formatTimeRemaining,
  getSecondsRemaining,
  parseServerDate,
  normalizeServerDates,
  isAuctionLive,
  timeAgo,
} from '../src/utils/time';

describe('Reloop Time & Countdown Utilities', () => {
  it('formats remaining seconds into human readable countdown', () => {
    expect(formatTimeRemaining(0)).toBe('Auction Closed');
    expect(formatTimeRemaining(-10)).toBe('Auction Closed');
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

describe('Server timestamps are UTC even without a "Z" (backend sends naive UTC)', () => {
  it('treats a naive timestamp as UTC, independent of the browser timezone', () => {
    expect(parseServerDate('2026-11-08T10:00:00').toISOString()).toBe('2026-11-08T10:00:00.000Z');
    expect(parseServerDate('2026-11-08T10:00:00Z').toISOString()).toBe('2026-11-08T10:00:00.000Z');
    expect(parseServerDate('2026-11-08T15:30:00+05:30').toISOString()).toBe('2026-11-08T10:00:00.000Z');
    expect(parseServerDate(null)).toBeNull();
  });

  it('counts down correctly for a naive UTC string two hours ahead', () => {
    const naive = new Date(Date.now() + 2 * 3600 * 1000).toISOString().replace('Z', '').split('.')[0];
    const rem = getSecondsRemaining(naive);
    expect(rem).toBeGreaterThan(2 * 3600 - 5);
    expect(rem).toBeLessThanOrEqual(2 * 3600);
  });

  it('normalizes every *_at field in nested API responses', () => {
    const out = normalizeServerDates({
      ends_at: '2026-11-08T10:00:00',
      title: '2026-11-08T10:00:00',
      bids: [{ created_at: '2026-11-08 09:00:00' }],
    });
    expect(out.ends_at).toBe('2026-11-08T10:00:00Z');
    expect(out.title).toBe('2026-11-08T10:00:00'); // untouched: not a *_at key
    expect(out.bids[0].created_at).toBe('2026-11-08T09:00:00Z');
  });
});

describe('Live auction detection and relative time', () => {
  const future = new Date(Date.now() + 3600 * 1000).toISOString();
  const past = new Date(Date.now() - 3600 * 1000).toISOString();

  it('is live only when active AND the deadline is ahead', () => {
    expect(isAuctionLive({ status: 'active', ends_at: future })).toBe(true);
    expect(isAuctionLive({ status: 'active', ends_at: past })).toBe(false);
    expect(isAuctionLive({ status: 'sold', ends_at: future })).toBe(false);
    expect(isAuctionLive(null)).toBe(false);
  });

  it('formats relative times', () => {
    const now = Date.now();
    expect(timeAgo(new Date(now - 10 * 1000).toISOString(), now)).toBe('just now');
    expect(timeAgo(new Date(now - 5 * 60 * 1000).toISOString(), now)).toBe('5 min ago');
    expect(timeAgo(new Date(now - 3 * 3600 * 1000).toISOString(), now)).toBe('3 h ago');
    expect(timeAgo(new Date(now - 2 * 86400 * 1000).toISOString(), now)).toBe('2 d ago');
  });
});
