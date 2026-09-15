import { describe, it, expect } from 'vitest';
import { buildCashFlowEntries, calculateCombinedMonthlyTotals } from './cashFlowCalculations';

describe('Cash Flow Calculations Service', () => {
  describe('buildCashFlowEntries', () => {
    it('merges and sorts income and expense entries by month', () => {
      const incomeSources = [
        { id: 'i1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-02', recurring: false }
      ];
      const expenseSources = [
        { id: 'e1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: false }
      ];
      const entries = buildCashFlowEntries(incomeSources, expenseSources, 3);
      expect(entries.map(e => e.month)).toEqual(['2026-01', '2026-02']);
      expect(entries[0]).toMatchObject({ kind: 'expense', sourceId: 'e1' });
      expect(entries[1]).toMatchObject({ kind: 'income', sourceId: 'i1' });
    });

    it('tags every entry with its originating kind', () => {
      const incomeSources = [
        { id: 'i1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true }
      ];
      const expenseSources = [
        { id: 'e1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: true }
      ];
      const entries = buildCashFlowEntries(incomeSources, expenseSources, 1);
      expect(entries.find(e => e.sourceId === 'i1').kind).toBe('income');
      expect(entries.find(e => e.sourceId === 'e1').kind).toBe('expense');
    });

    it('still produces entries for the other domain when one side has no sources', () => {
      const expenseSources = [
        { id: 'e1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: true }
      ];
      const entries = buildCashFlowEntries([], expenseSources, 2, {}, {}, new Date('2026-01-15'));
      expect(entries).toHaveLength(2);
      expect(entries.every(e => e.kind === 'expense')).toBe(true);
    });

    it('always includes the current month for a source registered further in the past than the selected horizon (bug fix)', () => {
      const incomeSources = [
        { id: 'i1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2025-01', recurring: true }
      ];
      const expenseSources = [
        { id: 'e1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2025-01', recurring: true }
      ];
      const entries = buildCashFlowEntries(incomeSources, expenseSources, 1, {}, {}, new Date('2026-09-15'));
      expect(entries.some(e => e.kind === 'income' && e.month === '2026-09')).toBe(true);
      expect(entries.some(e => e.kind === 'expense' && e.month === '2026-09')).toBe(true);
    });

    it('resolves actual amounts from overrides per domain (TD-01)', () => {
      const incomeSources = [
        { id: 'i1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: false }
      ];
      const expenseSources = [
        { id: 'e1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: false }
      ];
      const entries = buildCashFlowEntries(
        incomeSources,
        expenseSources,
        1,
        { 'i1:2026-01': { status: 'received', actualAmount: 4800 } },
        { 'e1:2026-01': { status: 'paid', actualAmount: 1450 } }
      );
      expect(entries.find(e => e.kind === 'income').amount).toBe(4800);
      expect(entries.find(e => e.kind === 'expense').amount).toBe(1450);
    });
  });

  describe('calculateCombinedMonthlyTotals', () => {
    it('returns zeroed totals for an empty month', () => {
      const zeroed = { received: 0, paid: 0, pending: 0, pendingIncome: 0, pendingExpense: 0, net: 0 };
      expect(calculateCombinedMonthlyTotals([])).toEqual(zeroed);
      expect(calculateCombinedMonthlyTotals(undefined)).toEqual(zeroed);
    });

    it('separates pending, paid, and received across kinds, and nets income against expenses (bug fix)', () => {
      const monthEntries = [
        { kind: 'income', amount: 5000, status: 'received' },
        { kind: 'income', amount: 200, status: 'pending' },
        { kind: 'expense', amount: 1500, status: 'paid' },
        { kind: 'expense', amount: 40, status: 'pending' }
      ];
      // net = (received + pendingIncome) - (paid + pendingExpense) = (5000+200) - (1500+40) = 3660,
      // NOT the previous (buggy) sum of every entry regardless of kind (6740).
      expect(calculateCombinedMonthlyTotals(monthEntries)).toEqual({
        received: 5000,
        paid: 1500,
        pending: 240,
        pendingIncome: 200,
        pendingExpense: 40,
        net: 3660
      });
    });

    it('produces a negative net when expenses exceed income', () => {
      const monthEntries = [
        { kind: 'income', amount: 1000, status: 'received' },
        { kind: 'expense', amount: 2500, status: 'paid' }
      ];
      expect(calculateCombinedMonthlyTotals(monthEntries).net).toBe(-1500);
    });

    it('reflects resolved actual amounts rather than expected amounts when they differ (TD-01)', () => {
      const incomeSources = [
        { id: 'i1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: false }
      ];
      const expenseSources = [
        { id: 'e1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: false }
      ];
      const entries = buildCashFlowEntries(
        incomeSources,
        expenseSources,
        1,
        { 'i1:2026-01': { status: 'received', actualAmount: 4800 } },
        { 'e1:2026-01': { status: 'paid', actualAmount: 1450 } }
      );
      expect(calculateCombinedMonthlyTotals(entries)).toEqual({
        received: 4800,
        paid: 1450,
        pending: 0,
        pendingIncome: 0,
        pendingExpense: 0,
        net: 3350
      });
    });
  });
});
