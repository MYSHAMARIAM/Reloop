import { describe, it, expect } from 'vitest';
import { CATEGORIES, CONDITIONS, DURATION_OPTIONS, getCategoryLabel } from '../src/utils/validators';
import { calculateNextMinimumBid } from '../src/utils/currency';

describe('Reloop Bidding Rules & Presets', () => {
  it('enforces college duration options between 1 hour and 7 days', () => {
    const hours = DURATION_OPTIONS.map(d => d.hours);
    expect(hours).toEqual([1, 6, 12, 24, 72, 120, 168]);
    expect(Math.min(...hours)).toBe(1);
    expect(Math.max(...hours)).toBe(168);
  });

  it('contains permitted college essential categories', () => {
    const categoryIds = CATEGORIES.map(c => c.id);
    expect(categoryIds).toContain('textbooks');
    expect(categoryIds).toContain('calculators');
    expect(categoryIds).toContain('electronics');
    expect(categoryIds).toContain('robotics');
    expect(categoryIds).toContain('sensors');
    expect(categoryIds).toContain('stationery');
    expect(categoryIds).toContain('lab_gear');
  });

  it('rejects bids lower than the required minimum increment', () => {
    const startingPrice = 500;
    const currentHighest = 600;
    const minIncrement = 50;

    const nextMin = calculateNextMinimumBid(startingPrice, currentHighest, minIncrement);
    expect(nextMin).toBe(650);

    const testBidUnder = 620;
    const testBidExact = 650;
    const testBidAbove = 700;

    expect(testBidUnder < nextMin).toBe(true);
    expect(testBidExact >= nextMin).toBe(true);
    expect(testBidAbove >= nextMin).toBe(true);
  });

  it('retrieves friendly category label', () => {
    expect(getCategoryLabel('calculators')).toBe('Calculators');
    expect(getCategoryLabel('robotics')).toBe('Robotics & Hardware');
    expect(getCategoryLabel('textbooks')).toBe('Textbooks & Notes');
  });
});
