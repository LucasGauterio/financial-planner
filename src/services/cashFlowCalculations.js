/**
 * Service for combined Income + Expense cash flow aggregation (Phase 9, TD-02).
 */

import { generateIncomeProjection } from './incomeCalculations';
import { generateExpenseProjection } from './expenseCalculations';

/**
 * Merges Income and Expense projections into a single, month-sorted list of entries,
 * each tagged with its originating domain.
 *
 * @param {Array} incomeSources - Income sources, per `generateIncomeProjection`.
 * @param {Array} expenseSources - Expense sources, per `generateExpenseProjection`.
 * @param {number} horizonMonths - Number of months to project.
 * @param {Object} incomeOverrides - Flattened `${sourceId}:${YYYY-MM}` -> override map for income.
 * @param {Object} expenseOverrides - Flattened `${sourceId}:${YYYY-MM}` -> override map for expenses.
 * @param {Date} [referenceDate] - The "current" date used to anchor the horizon for both domains;
 *   defaults to `new Date()`. Exposed so tests can pin "today" deterministically.
 * @returns {Array} List of projected entries: { sourceId, name, type, month, amount, expectedAmount, status, kind }.
 */
export function buildCashFlowEntries(incomeSources, expenseSources, horizonMonths, incomeOverrides = {}, expenseOverrides = {}, referenceDate = new Date()) {
  const incomeEntries = generateIncomeProjection(incomeSources, horizonMonths, incomeOverrides, referenceDate)
    .map(entry => ({ ...entry, kind: 'income' }));
  const expenseEntries = generateExpenseProjection(expenseSources, horizonMonths, expenseOverrides, referenceDate)
    .map(entry => ({ ...entry, kind: 'expense' }));

  return [...incomeEntries, ...expenseEntries].sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Sums a set of merged cash flow entries for a single month into combined
 * Pending/Paid/Received totals plus the net cash flow (income minus expenses).
 *
 * Bug fix (2026-09-15): the previous `total` field summed every entry regardless of
 * kind (`pending + paid + received`), which for a merged income+expense list is
 * effectively income-plus-expenses, not a cash-flow figure. `net` now correctly
 * subtracts expenses from income instead.
 *
 * @param {Array} monthEntries - Merged entries (income + expense) belonging to the same month.
 * @returns {Object} { received, paid, pending, pendingIncome, pendingExpense, net }.
 *   `pending` is the combined (both-kinds) pending amount, kept for informational display;
 *   `net` is `(received + pendingIncome) - (paid + pendingExpense)` — the projected net
 *   cash flow for the month, including not-yet-confirmed entries.
 */
export function calculateCombinedMonthlyTotals(monthEntries) {
  const totals = (monthEntries || []).reduce((acc, entry) => {
    if (entry.kind === 'income') {
      if (entry.status === 'received') {
        acc.received += entry.amount;
      } else {
        acc.pendingIncome += entry.amount;
      }
    } else if (entry.kind === 'expense') {
      if (entry.status === 'paid') {
        acc.paid += entry.amount;
      } else {
        acc.pendingExpense += entry.amount;
      }
    }
    return acc;
  }, { received: 0, pendingIncome: 0, paid: 0, pendingExpense: 0 });

  const round = value => Math.round(value * 100) / 100;
  const net = (totals.received + totals.pendingIncome) - (totals.paid + totals.pendingExpense);

  return {
    received: round(totals.received),
    paid: round(totals.paid),
    pending: round(totals.pendingIncome + totals.pendingExpense),
    pendingIncome: round(totals.pendingIncome),
    pendingExpense: round(totals.pendingExpense),
    net: round(net)
  };
}
