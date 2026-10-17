import { describe, it, expect } from 'vitest';
import { formatRupees, paiseToRupees, rupeesToPaise, calculateNextMinimumBid } from '../src/utils/currency';

describe('Reloop Currency & Bid Math Utilities', () => {
  it('formats rupees correctly into INR currency format', () => {
    expect(formatRupees(500)).toContain('500');
    expect(formatRupees(1250.50)).toContain('1,250.5');
    expect(formatRupees(0)).toContain('0');
  });

  it('converts paise to rupees accurately', () => {
    expect(paiseToRupees(50000)).toBe(500);
    expect(paiseToRupees(150)).toBe(1.5);
    expect(paiseToRupees(0)).toBe(0);
  });

  it('converts rupees to paise accurately without floating point drift', () => {
    expect(rupeesToPaise(500)).toBe(50000);
    expect(rupeesToPaise(12.34)).toBe(1234);
    expect(rupeesToPaise(999.99)).toBe(99999);
  });

  it('calculates the next minimum bid correctly', () => {
    // When no bids exist: starting price is the minimum
    expect(calculateNextMinimumBid(500, null, 50)).toBe(500);
    expect(calculateNextMinimumBid(500, 0, 50)).toBe(500);

    // When highest bid exists: minimum is highest bid + increment
    expect(calculateNextMinimumBid(500, 600, 50)).toBe(650);
    expect(calculateNextMinimumBid(1000, 1500, 100)).toBe(1600);
  });
});
