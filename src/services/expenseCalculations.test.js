import { describe, it, expect } from 'vitest';
import { generateExpenseProjection, calculateMonthlyTotals } from './expenseCalculations';

describe('Expense Calculations Service', () => {
  describe('generateExpenseProjection', () => {
    it('returns empty array for invalid inputs', () => {
      expect(generateExpenseProjection([], 12)).toEqual([]);
      expect(generateExpenseProjection(null, 12)).toEqual([]);
      expect(generateExpenseProjection([{ id: '1', startMonth: '2026-01' }], 0)).toEqual([]);
    });

    it('projects a one-off entry only in its start month', () => {
      const sources = [
        { id: 's1', name: 'Car repair', type: 'variable spending', amount: 500, startMonth: '2026-03', recurring: false }
      ];
      const entries = generateExpenseProjection(sources, 12);
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({ sourceId: 's1', month: '2026-03', amount: 500, status: 'pending' });
    });

    it('expands a recurring entry across the full horizon, crossing year boundaries', () => {
      const sources = [
        { id: 's1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-11', recurring: true }
      ];
      const entries = generateExpenseProjection(sources, 4);
      expect(entries.map(e => e.month)).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
      expect(entries.every(e => e.amount === 1500)).toBe(true);
    });

    it('defaults every month to pending when there is no override', () => {
      const sources = [
        { id: 's1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: true }
      ];
      const entries = generateExpenseProjection(sources, 3);
      expect(entries.every(e => e.status === 'pending')).toBe(true);
    });

    it('applies status overrides keyed by sourceId and month', () => {
      const sources = [
        { id: 's1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: true }
      ];
      const overrides = { 's1:2026-02': 'paid' };
      const entries = generateExpenseProjection(sources, 3, overrides);
      expect(entries.find(e => e.month === '2026-01').status).toBe('pending');
      expect(entries.find(e => e.month === '2026-02').status).toBe('paid');
      expect(entries.find(e => e.month === '2026-03').status).toBe('pending');
    });

    it('projects a recurring source across a multi-year (35-year) horizon', () => {
      const sources = [
        { id: 's1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: true }
      ];
      const horizonMonths = 35 * 12;
      const entries = generateExpenseProjection(sources, horizonMonths);
      expect(entries).toHaveLength(horizonMonths);
      expect(entries[0].month).toBe('2026-01');
      expect(entries[entries.length - 1].month).toBe('2060-12');
    });

    it('stops a recurring source at endMonth even when horizonMonths extends further', () => {
      const sources = [
        { id: 's1', name: 'Financiamento', type: 'fixed bill', amount: 300, startMonth: '2026-01', recurring: true, endMonth: '2026-03' }
      ];
      const entries = generateExpenseProjection(sources, 12);
      expect(entries.map(e => e.month)).toEqual(['2026-01', '2026-02', '2026-03']);
    });

    it('does not affect a recurring source with no endMonth (regression)', () => {
      const sources = [
        { id: 's1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: true }
      ];
      const entries = generateExpenseProjection(sources, 3);
      expect(entries).toHaveLength(3);
    });

    it('produces no entries when endMonth is before startMonth', () => {
      const sources = [
        { id: 's1', name: 'Financiamento', type: 'fixed bill', amount: 300, startMonth: '2026-05', recurring: true, endMonth: '2026-01' }
      ];
      const entries = generateExpenseProjection(sources, 12);
      expect(entries).toEqual([]);
    });

    it('merges and sorts entries from multiple sources by month', () => {
      const sources = [
        { id: 's1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: true },
        { id: 's2', name: 'Streaming', type: 'subscription', amount: 40, startMonth: '2026-02', recurring: false }
      ];
      const entries = generateExpenseProjection(sources, 2);
      expect(entries).toHaveLength(3);
      expect(entries.map(e => e.month)).toEqual(['2026-01', '2026-02', '2026-02']);
    });
  });

  describe('calculateMonthlyTotals', () => {
    it('returns zeroed totals for an empty month', () => {
      expect(calculateMonthlyTotals([])).toEqual({ paid: 0, pending: 0, total: 0 });
      expect(calculateMonthlyTotals(undefined)).toEqual({ paid: 0, pending: 0, total: 0 });
    });

    it('splits totals between paid and pending', () => {
      const monthEntries = [
        { amount: 1500, status: 'paid' },
        { amount: 200.5, status: 'pending' },
        { amount: 99.5, status: 'paid' }
      ];
      expect(calculateMonthlyTotals(monthEntries)).toEqual({ paid: 1599.5, pending: 200.5, total: 1800 });
    });
  });
});
