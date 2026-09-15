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
      // referenceDate pinned to startMonth: source was just registered, no catch-up months yet.
      const entries = generateExpenseProjection(sources, 4, {}, new Date('2026-11-15'));
      expect(entries.map(e => e.month)).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
      expect(entries.every(e => e.amount === 1500)).toBe(true);
    });

    it('defaults every month to pending when there is no override', () => {
      const sources = [
        { id: 's1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: true }
      ];
      const entries = generateExpenseProjection(sources, 3, {}, new Date('2026-01-15'));
      expect(entries.every(e => e.status === 'pending')).toBe(true);
    });

    it('applies status overrides keyed by sourceId and month', () => {
      const sources = [
        { id: 's1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: true }
      ];
      const overrides = { 's1:2026-02': 'paid' };
      const entries = generateExpenseProjection(sources, 3, overrides, new Date('2026-01-15'));
      expect(entries.find(e => e.month === '2026-01').status).toBe('pending');
      expect(entries.find(e => e.month === '2026-02').status).toBe('paid');
      expect(entries.find(e => e.month === '2026-03').status).toBe('pending');
    });

    it('resolves a legacy string override to the expected amount (back-compat, TD-01)', () => {
      const sources = [
        { id: 's1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: true }
      ];
      const overrides = { 's1:2026-01': 'paid' };
      const entries = generateExpenseProjection(sources, 1, overrides, new Date('2026-01-15'));
      expect(entries[0]).toMatchObject({ status: 'paid', amount: 1500, expectedAmount: 1500 });
    });

    it('resolves an object override actualAmount in place of the expected amount (TD-01)', () => {
      const sources = [
        { id: 's1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: true }
      ];
      const overrides = { 's1:2026-01': { status: 'paid', actualAmount: 1450 } };
      const entries = generateExpenseProjection(sources, 1, overrides, new Date('2026-01-15'));
      expect(entries[0]).toMatchObject({ status: 'paid', amount: 1450, expectedAmount: 1500 });
    });

    it('falls back to the expected amount when an object override has a null actualAmount (TD-01)', () => {
      const sources = [
        { id: 's1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: true }
      ];
      const overrides = { 's1:2026-01': { status: 'paid', actualAmount: null } };
      const entries = generateExpenseProjection(sources, 1, overrides, new Date('2026-01-15'));
      expect(entries[0]).toMatchObject({ status: 'paid', amount: 1500, expectedAmount: 1500 });
    });

    it('projects a recurring source across a multi-year (35-year) horizon', () => {
      const sources = [
        { id: 's1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: true }
      ];
      const horizonMonths = 35 * 12;
      const entries = generateExpenseProjection(sources, horizonMonths, {}, new Date('2026-01-15'));
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
      const entries = generateExpenseProjection(sources, 3, {}, new Date('2026-01-15'));
      expect(entries).toHaveLength(3);
    });

    it("shows a bounded source's full start-to-end span even when it exceeds the selected horizon (ADR-011)", () => {
      const sources = [
        { id: 's1', name: 'Financiamento', type: 'fixed bill', amount: 300, startMonth: '2026-01', recurring: true, endMonth: '2028-12' }
      ];
      // Horizon is only 1 year (12 months), but the source's own span is 3 years — the
      // full span must still be shown, not truncated to the horizon.
      const entries = generateExpenseProjection(sources, 12, {}, new Date('2026-01-15'));
      expect(entries).toHaveLength(36);
      expect(entries[0].month).toBe('2026-01');
      expect(entries[entries.length - 1].month).toBe('2028-12');
    });

    it('ignores the current-month catch-up extension for a bounded source whose span already ended in the past (ADR-011)', () => {
      const sources = [
        { id: 's1', name: 'Financiamento antigo', type: 'fixed bill', amount: 300, startMonth: '2020-01', recurring: true, endMonth: '2020-06' }
      ];
      // Even though "today" is years after the source's own end, its span is exactly
      // Jan-Jun 2020 — no catch-up padding is applied to a bounded source.
      const entries = generateExpenseProjection(sources, 12, {}, new Date('2026-09-15'));
      expect(entries.map(e => e.month)).toEqual(['2020-01', '2020-02', '2020-03', '2020-04', '2020-05', '2020-06']);
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
      const entries = generateExpenseProjection(sources, 2, {}, new Date('2026-01-15'));
      expect(entries).toHaveLength(3);
      expect(entries.map(e => e.month)).toEqual(['2026-01', '2026-02', '2026-02']);
    });

    it('always includes the current month for a recurring source registered further in the past than the selected horizon (bug fix)', () => {
      const sources = [
        { id: 's1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2025-01', recurring: true }
      ];
      const entries = generateExpenseProjection(sources, 12, {}, new Date('2026-09-15'));
      expect(entries.some(e => e.month === '2026-09')).toBe(true);
      expect(entries.some(e => e.month === '2027-08')).toBe(true);
      expect(entries.some(e => e.month === '2027-09')).toBe(false);
    });

    it('preserves every historical month back to startMonth in addition to the forward horizon (bug fix)', () => {
      const sources = [
        { id: 's1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2025-01', recurring: true }
      ];
      const entries = generateExpenseProjection(sources, 1, {}, new Date('2026-09-15'));
      expect(entries[0].month).toBe('2025-01');
      expect(entries[entries.length - 1].month).toBe('2026-09');
    });

    it("respects endMonth even when the catch-up extension would otherwise reach further (bug fix interaction)", () => {
      const sources = [
        { id: 's1', name: 'Financiamento', type: 'fixed bill', amount: 300, startMonth: '2025-01', recurring: true, endMonth: '2025-06' }
      ];
      const entries = generateExpenseProjection(sources, 12, {}, new Date('2026-09-15'));
      expect(entries.map(e => e.month)).toEqual(['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06']);
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

    it('reflects a resolved actual amount rather than the expected amount when they differ (TD-01)', () => {
      const sources = [
        { id: 's1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: true }
      ];
      const overrides = { 's1:2026-01': { status: 'paid', actualAmount: 1450 } };
      const entries = generateExpenseProjection(sources, 1, overrides, new Date('2026-01-15'));
      expect(calculateMonthlyTotals(entries)).toEqual({ paid: 1450, pending: 0, total: 1450 });
    });
  });
});
