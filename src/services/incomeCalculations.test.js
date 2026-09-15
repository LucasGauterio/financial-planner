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
      // referenceDate pinned to startMonth: source was just registered, no catch-up months yet.
      const entries = generateIncomeProjection(sources, 4, {}, new Date('2026-11-15'));
      expect(entries.map(e => e.month)).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
      expect(entries.every(e => e.amount === 5000)).toBe(true);
    });

    it('defaults every month to pending when there is no override', () => {
      const sources = [
        { id: 's1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true }
      ];
      const entries = generateIncomeProjection(sources, 3, {}, new Date('2026-01-15'));
      expect(entries.every(e => e.status === 'pending')).toBe(true);
    });

    it('applies status overrides keyed by sourceId and month', () => {
      const sources = [
        { id: 's1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true }
      ];
      const overrides = { 's1:2026-02': 'received' };
      const entries = generateIncomeProjection(sources, 3, overrides, new Date('2026-01-15'));
      expect(entries.find(e => e.month === '2026-01').status).toBe('pending');
      expect(entries.find(e => e.month === '2026-02').status).toBe('received');
      expect(entries.find(e => e.month === '2026-03').status).toBe('pending');
    });

    it('resolves a legacy string override to the expected amount (back-compat, TD-01)', () => {
      const sources = [
        { id: 's1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true }
      ];
      const overrides = { 's1:2026-01': 'received' };
      const entries = generateIncomeProjection(sources, 1, overrides, new Date('2026-01-15'));
      expect(entries[0]).toMatchObject({ status: 'received', amount: 5000, expectedAmount: 5000 });
    });

    it('resolves an object override actualAmount in place of the expected amount (TD-01)', () => {
      const sources = [
        { id: 's1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true }
      ];
      const overrides = { 's1:2026-01': { status: 'received', actualAmount: 4800 } };
      const entries = generateIncomeProjection(sources, 1, overrides, new Date('2026-01-15'));
      expect(entries[0]).toMatchObject({ status: 'received', amount: 4800, expectedAmount: 5000 });
    });

    it('falls back to the expected amount when an object override has a null actualAmount (TD-01)', () => {
      const sources = [
        { id: 's1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true }
      ];
      const overrides = { 's1:2026-01': { status: 'received', actualAmount: null } };
      const entries = generateIncomeProjection(sources, 1, overrides, new Date('2026-01-15'));
      expect(entries[0]).toMatchObject({ status: 'received', amount: 5000, expectedAmount: 5000 });
    });

    it('projects a recurring source across a multi-year (35-year) horizon', () => {
      const sources = [
        { id: 's1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true }
      ];
      const horizonMonths = 35 * 12;
      const entries = generateIncomeProjection(sources, horizonMonths, {}, new Date('2026-01-15'));
      expect(entries).toHaveLength(horizonMonths);
      expect(entries[0].month).toBe('2026-01');
      expect(entries[entries.length - 1].month).toBe('2060-12');
    });

    it('merges and sorts entries from multiple sources by month', () => {
      const sources = [
        { id: 's1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true },
        { id: 's2', name: 'Dividend', type: 'dividendo', amount: 200, startMonth: '2026-02', recurring: false }
      ];
      const entries = generateIncomeProjection(sources, 2, {}, new Date('2026-01-15'));
      expect(entries).toHaveLength(3);
      expect(entries.map(e => e.month)).toEqual(['2026-01', '2026-02', '2026-02']);
    });

    it('stops a recurring source at endMonth even when horizonMonths extends further (ADR-010)', () => {
      const sources = [
        { id: 's1', name: 'Consultoria', type: 'contrato', amount: 3000, startMonth: '2026-01', recurring: true, endMonth: '2026-03' }
      ];
      const entries = generateIncomeProjection(sources, 12, {}, new Date('2026-01-15'));
      expect(entries.map(e => e.month)).toEqual(['2026-01', '2026-02', '2026-03']);
    });

    it('shows a bounded source\'s full start-to-end span even when it exceeds the selected horizon (ADR-011)', () => {
      const sources = [
        { id: 's1', name: 'Consultoria', type: 'contrato', amount: 3000, startMonth: '2026-01', recurring: true, endMonth: '2028-12' }
      ];
      // Horizon is only 1 year (12 months), but the source's own span is 3 years — the
      // full span must still be shown, not truncated to the horizon.
      const entries = generateIncomeProjection(sources, 12, {}, new Date('2026-01-15'));
      expect(entries).toHaveLength(36);
      expect(entries[0].month).toBe('2026-01');
      expect(entries[entries.length - 1].month).toBe('2028-12');
    });

    it('ignores the current-month catch-up extension for a bounded source whose span already ended in the past (ADR-011)', () => {
      const sources = [
        { id: 's1', name: 'Consultoria antiga', type: 'contrato', amount: 3000, startMonth: '2020-01', recurring: true, endMonth: '2020-06' }
      ];
      // Even though "today" is years after the source's own end, its span is exactly
      // Jan-Jun 2020 — no catch-up padding is applied to a bounded source.
      const entries = generateIncomeProjection(sources, 12, {}, new Date('2026-09-15'));
      expect(entries.map(e => e.month)).toEqual(['2020-01', '2020-02', '2020-03', '2020-04', '2020-05', '2020-06']);
    });

    it('does not affect a recurring source with no endMonth (regression, ADR-010)', () => {
      const sources = [
        { id: 's1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true }
      ];
      const entries = generateIncomeProjection(sources, 3, {}, new Date('2026-01-15'));
      expect(entries).toHaveLength(3);
    });

    it('produces no entries when endMonth is before startMonth (ADR-010)', () => {
      const sources = [
        { id: 's1', name: 'Consultoria', type: 'contrato', amount: 3000, startMonth: '2026-05', recurring: true, endMonth: '2026-01' }
      ];
      const entries = generateIncomeProjection(sources, 12, {}, new Date('2026-01-15'));
      expect(entries).toEqual([]);
    });

    it('respects endMonth even when the catch-up extension would otherwise reach further (bug fix interaction, ADR-010)', () => {
      const sources = [
        { id: 's1', name: 'Consultoria', type: 'contrato', amount: 3000, startMonth: '2025-01', recurring: true, endMonth: '2025-06' }
      ];
      const entries = generateIncomeProjection(sources, 12, {}, new Date('2026-09-15'));
      expect(entries.map(e => e.month)).toEqual(['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06']);
    });

    it('always includes the current month for a recurring source registered further in the past than the selected horizon (bug fix)', () => {
      const sources = [
        { id: 's1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2025-01', recurring: true }
      ];
      // 1-year horizon requested, but the source started 20 months before "today" — the
      // current month must still appear (previously it silently fell outside the window).
      const entries = generateIncomeProjection(sources, 12, {}, new Date('2026-09-15'));
      expect(entries.some(e => e.month === '2026-09')).toBe(true);
      // The requested horizon is still honored going forward from today.
      expect(entries.some(e => e.month === '2027-08')).toBe(true);
      expect(entries.some(e => e.month === '2027-09')).toBe(false);
    });

    it('preserves every historical month back to startMonth in addition to the forward horizon (bug fix)', () => {
      const sources = [
        { id: 's1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2025-01', recurring: true }
      ];
      const entries = generateIncomeProjection(sources, 1, {}, new Date('2026-09-15'));
      expect(entries[0].month).toBe('2025-01');
      // horizonMonths: 1 is a 1-month-wide forward window anchored at the current month,
      // so it ends AT the current month (no extra month beyond it).
      expect(entries[entries.length - 1].month).toBe('2026-09');
    });

    it('does not add catch-up months for a source whose startMonth is this month or in the future', () => {
      const sources = [
        { id: 's1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-09', recurring: true }
      ];
      const entries = generateIncomeProjection(sources, 3, {}, new Date('2026-09-15'));
      expect(entries.map(e => e.month)).toEqual(['2026-09', '2026-10', '2026-11']);
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

    it('reflects a resolved actual amount rather than the expected amount when they differ (TD-01)', () => {
      const sources = [
        { id: 's1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true }
      ];
      const overrides = { 's1:2026-01': { status: 'received', actualAmount: 4800 } };
      const entries = generateIncomeProjection(sources, 1, overrides, new Date('2026-01-15'));
      expect(calculateMonthlyTotals(entries)).toEqual({ received: 4800, pending: 0, total: 4800 });
    });
  });
});
