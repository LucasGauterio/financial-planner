import { describe, it, expect } from 'vitest';
import { calculateCompoundInterest, calculateRequiredMonthlyContribution } from './financialCalculations';

describe('Financial Calculations', () => {
  it('calculates future value of past investments correctly (no principal)', () => {
    const result = calculateCompoundInterest(0, 1000, 0.01, 12, 0);
    expect(result).toBeCloseTo(12682.50, 2);
  });

  it('calculates future value with a starting principal', () => {
    const result = calculateCompoundInterest(5000, 100, 0.005, 24, 0);
    expect(result).toBeCloseTo(8179.00, 1);
  });

  it('calculates future value with an annual apport increase', () => {
    const result = calculateCompoundInterest(0, 100, 0.05, 24, 10);
    expect(result).toBeCloseTo(4609.37, 1);
  });

  it('calculates required monthly contribution for a goal (no principal)', () => {
    const pmt = calculateRequiredMonthlyContribution(1000000, 0, 0.01, 360, 0);
    expect(pmt).toBeCloseTo(286.13, 1);
  });
  
  it('calculates required monthly contribution with starting principal', () => {
    const pmt = calculateRequiredMonthlyContribution(100000, 50000, 0.005, 60, 0);
    expect(pmt).toBeCloseTo(466.64, 1);
  });

  it('calculates required monthly contribution with annual increase', () => {
    // The required PMT currently will only be supported with 0% increase using the static formula, OR simulated with binary search.
    // We will use binary search to find the required PMT accurately.
    const pmt = calculateRequiredMonthlyContribution(100000, 0, 0.01, 120, 10);
    // It should be LESS than the standard PMT without an increase.
    const pmtFlat = calculateRequiredMonthlyContribution(100000, 0, 0.01, 120, 0);
    expect(pmt).toBeLessThan(pmtFlat);
  });

  it('handles extremely large targetAmount gracefully without infinite looping', () => {
    const start = Date.now();
    const pmt = calculateRequiredMonthlyContribution(1e18, 0, 0.01, 360, 0);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // Must be super fast and not hang!
    expect(pmt).toBeGreaterThan(0);
  });
});

