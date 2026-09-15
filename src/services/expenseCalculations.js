/**
 * Service for monthly expense projection and aggregation.
 */

/**
 * Expands expense sources into a month-by-month projection over a horizon,
 * applying manually-confirmed status overrides and defaulting every
 * unmarked month to 'pending' (TD-04, inherited from monthly-income-tracker).
 *
 * A recurring source with no `endMonth` always projects at least through `horizonMonths`
 * months counted from the current month, in addition to every month from its `startMonth`
 * up to today (bug fix: previously the window was `horizonMonths` months counted from
 * `startMonth` only, so a source registered further in the past than the selected horizon
 * would never reach — let alone project past — the current month).
 *
 * A recurring source WITH an `endMonth` ignores `horizonMonths` entirely and always
 * projects its complete `startMonth`-to-`endMonth` span (bug fix: previously a bounded
 * source could be cut short by a small horizon selection, hiding months that were still
 * within its own defined lifetime — see ADR-011).
 *
 * @param {Array} sources - Expense sources: { id, name, amount, type, startMonth ('YYYY-MM'), recurring, endMonth? }.
 *   `endMonth` ('YYYY-MM', optional) bounds a recurring source to its full start-to-end span,
 *   independent of `horizonMonths` (TD-01, expense-recurring-end-date / ADR-011). Ignored when unset.
 * @param {number} horizonMonths - Number of months to project forward from the current month,
 *   for recurring sources with no `endMonth`. Ignored for bounded (has `endMonth`) sources.
 * @param {Object} statusOverrides - Sparse map keyed by `${sourceId}:${YYYY-MM}` -> 'paid' | 'pending'
 *   (legacy) or `{ status: 'paid' | 'pending', actualAmount: number | null }` (Phase 9, TD-01).
 * @param {Date} [referenceDate] - The "current" date used to anchor the horizon; defaults to `new Date()`.
 *   Exposed as a parameter so tests can pin "today" deterministically.
 * @returns {Array} List of projected entries: { sourceId, name, type, month, amount, expectedAmount, status }.
 *   `amount` resolves to `actualAmount` when status is 'paid' and it is set; otherwise it equals
 *   `expectedAmount` (the source's registered amount).
 */
export function generateExpenseProjection(sources, horizonMonths, statusOverrides = {}, referenceDate = new Date()) {
  if (!sources || sources.length === 0 || !horizonMonths || horizonMonths <= 0) {
    return [];
  }

  const entries = [];
  const currentYear = referenceDate.getFullYear();
  const currentMonthNum = referenceDate.getMonth() + 1;

  for (const source of sources) {
    const { id, name, amount, type, startMonth, recurring, endMonth } = source;
    const [startYear, startMonthNum] = startMonth.split('-').map(Number);

    let occurrences;
    if (!recurring) {
      occurrences = 1;
    } else if (endMonth) {
      // Bounded source: always span the full startMonth-to-endMonth range, regardless of
      // horizonMonths (ADR-011). A negative/zero span (endMonth before startMonth) yields
      // no entries, same as before.
      const [endYear, endMonthNum] = endMonth.split('-').map(Number);
      occurrences = (endYear - startYear) * 12 + (endMonthNum - startMonthNum) + 1;
    } else {
      // Months already elapsed between the source's start and the current month (0 when
      // startMonth is this month or in the future — no catch-up needed in that case).
      const monthsSinceStart = Math.max(0, (currentYear - startYear) * 12 + (currentMonthNum - startMonthNum));
      occurrences = horizonMonths + monthsSinceStart;
    }

    for (let i = 0; i < occurrences; i++) {
      let curMonth = startMonthNum - 1 + i;
      const curYear = startYear + Math.floor(curMonth / 12);
      curMonth = curMonth % 12;

      const monthOffset = (curYear - startYear) * 12 + curMonth - (startMonthNum - 1);
      if (monthOffset >= occurrences) {
        break;
      }

      const formattedMonth = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`;
      if (endMonth && formattedMonth > endMonth) {
        break;
      }

      const overrideKey = `${id}:${formattedMonth}`;
      const override = statusOverrides[overrideKey];
      // TD-01 (Phase 9): a legacy string override carries no actual amount; an object
      // override carries { status, actualAmount } directly.
      const status = (typeof override === 'string' ? override : override?.status) || 'pending';
      const actualAmount = typeof override === 'object' && override !== null ? override.actualAmount : null;
      const resolvedAmount = status === 'paid' && actualAmount != null ? actualAmount : amount;

      entries.push({
        sourceId: id,
        name,
        type,
        month: formattedMonth,
        amount: resolvedAmount,
        expectedAmount: amount,
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
