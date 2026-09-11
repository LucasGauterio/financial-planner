import { describe, it, expect } from 'vitest';
import { generateIncomeProjection, calculateMonthlyTotals } from './incomeCalculations';

describe('Income Calculations Service', () => {
  describe('generateIncomeProjection', () => {
    it('returns empty array for invalid inputs', () => {
      expect(generateIncomeProjection([], 12)).toEqual([]);
      expect(generateIncomeProjection(null, 12)).toEqual([]);
      expect(generateIncomeProjection([{ id: '1', startMonth: '2026-01' }], 0)).toEqual([]);
    });

    it('projects a one-off entry only in its start month', () => {
      const sources = [
        { id: 's1', name: 'Bonus', type: 'payment', amount: 500, startMonth: '2026-03', recurring: false }
      ];
      const entries = generateIncomeProjection(sources, 12);
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({ sourceId: 's1', month: '2026-03', amount: 500, status: 'pending' });
    });

    it('expands a recurring entry across the full horizon, crossing year boundaries', () => {
      const sources = [
        { id: 's1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-11', recurring: true }
      ];
      const entries = generateIncomeProjection(sources, 4);
      expect(entries.map(e => e.month)).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
      expect(entries.every(e => e.amount === 5000)).toBe(true);
    });

    it('defaults every month to pending when there is no override', () => {
      const sources = [
        { id: 's1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true }
      ];
      const entries = generateIncomeProjection(sources, 3);
      expect(entries.every(e => e.status === 'pending')).toBe(true);
    });

    it('applies status overrides keyed by sourceId and month', () => {
      const sources = [
        { id: 's1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true }
      ];
      const overrides = { 's1:2026-02': 'received' };
      const entries = generateIncomeProjection(sources, 3, overrides);
      expect(entries.find(e => e.month === '2026-01').status).toBe('pending');
      expect(entries.find(e => e.month === '2026-02').status).toBe('received');
      expect(entries.find(e => e.month === '2026-03').status).toBe('pending');
    });

    it('projects a recurring source across a multi-year (35-year) horizon', () => {
      const sources = [
        { id: 's1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true }
      ];
      const horizonMonths = 35 * 12;
      const entries = generateIncomeProjection(sources, horizonMonths);
      expect(entries).toHaveLength(horizonMonths);
      expect(entries[0].month).toBe('2026-01');
      expect(entries[entries.length - 1].month).toBe('2060-12');
    });

    it('merges and sorts entries from multiple sources by month', () => {
      const sources = [
        { id: 's1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true },
        { id: 's2', name: 'Dividend', type: 'dividendo', amount: 200, startMonth: '2026-02', recurring: false }
      ];
      const entries = generateIncomeProjection(sources, 2);
      expect(entries).toHaveLength(3);
      expect(entries.map(e => e.month)).toEqual(['2026-01', '2026-02', '2026-02']);
    });
  });

  describe('calculateMonthlyTotals', () => {
    it('returns zeroed totals for an empty month', () => {
      expect(calculateMonthlyTotals([])).toEqual({ received: 0, pending: 0, total: 0 });
      expect(calculateMonthlyTotals(undefined)).toEqual({ received: 0, pending: 0, total: 0 });
    });

    it('splits totals between received and pending', () => {
      const monthEntries = [
        { amount: 5000, status: 'received' },
        { amount: 200.5, status: 'pending' },
        { amount: 99.5, status: 'received' }
      ];
      expect(calculateMonthlyTotals(monthEntries)).toEqual({ received: 5099.5, pending: 200.5, total: 5300 });
    });
  });
});
