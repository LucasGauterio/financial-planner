/**
 * Service for monthly expense projection and aggregation.
 */

/**
 * Expands expense sources into a month-by-month projection over a horizon,
 * applying manually-confirmed status overrides and defaulting every
 * unmarked month to 'pending' (TD-04, inherited from monthly-income-tracker).
 *
 * @param {Array} sources - Expense sources: { id, name, amount, type, startMonth ('YYYY-MM'), recurring, endMonth? }.
 *   `endMonth` ('YYYY-MM', optional) bounds a recurring source: no entries are generated past it
 *   (inclusive), regardless of `horizonMonths` (TD-01, expense-recurring-end-date). Ignored when unset.
 * @param {number} horizonMonths - Number of months to project, starting from each source's startMonth.
 * @param {Object} statusOverrides - Sparse map keyed by `${sourceId}:${YYYY-MM}` -> 'paid' | 'pending'.
 * @returns {Array} List of projected entries: { sourceId, name, type, month, amount, status }.
 */
export function generateExpenseProjection(sources, horizonMonths, statusOverrides = {}) {
  if (!sources || sources.length === 0 || !horizonMonths || horizonMonths <= 0) {
    return [];
  }

  const entries = [];

  for (const source of sources) {
    const { id, name, amount, type, startMonth, recurring, endMonth } = source;
    const [startYear, startMonthNum] = startMonth.split('-').map(Number);

    const occurrences = recurring ? horizonMonths : 1;

    for (let i = 0; i < occurrences; i++) {
      let curMonth = startMonthNum - 1 + i;
      const curYear = startYear + Math.floor(curMonth / 12);
      curMonth = curMonth % 12;

      const monthOffset = (curYear - startYear) * 12 + curMonth - (startMonthNum - 1);
      if (monthOffset >= horizonMonths) {
        break;
      }

      const formattedMonth = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`;
      if (endMonth && formattedMonth > endMonth) {
        break;
      }

      const overrideKey = `${id}:${formattedMonth}`;
      const status = statusOverrides[overrideKey] || 'pending';

      entries.push({
        sourceId: id,
        name,
        type,
        month: formattedMonth,
        amount,
        status
      });
    }
  }

  return entries.sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Sums a set of projection entries for a single month, split by paid vs. pending.
 *
 * @param {Array} monthEntries - Projection entries belonging to the same month.
 * @returns {Object} { paid, pending, total }.
 */
export function calculateMonthlyTotals(monthEntries) {
  const totals = (monthEntries || []).reduce((acc, entry) => {
    if (entry.status === 'paid') {
      acc.paid += entry.amount;
    } else {
      acc.pending += entry.amount;
    }
    return acc;
  }, { paid: 0, pending: 0 });

  return {
    paid: Math.round(totals.paid * 100) / 100,
    pending: Math.round(totals.pending * 100) / 100,
    total: Math.round((totals.paid + totals.pending) * 100) / 100
  };
}
