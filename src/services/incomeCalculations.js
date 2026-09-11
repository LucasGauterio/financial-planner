/**
 * Service for monthly income projection and aggregation.
 */

/**
 * Expands income sources into a month-by-month projection over a horizon,
 * applying manually-confirmed status overrides and defaulting every
 * unmarked month to 'pending' (TD-04).
 *
 * @param {Array} sources - Income sources: { id, name, amount, type, startMonth ('YYYY-MM'), recurring }.
 * @param {number} horizonMonths - Number of months to project, starting from each source's startMonth.
 * @param {Object} statusOverrides - Sparse map keyed by `${sourceId}:${YYYY-MM}` -> 'received' | 'pending'.
 * @returns {Array} List of projected entries: { sourceId, name, type, month, amount, status }.
 */
export function generateIncomeProjection(sources, horizonMonths, statusOverrides = {}) {
  if (!sources || sources.length === 0 || !horizonMonths || horizonMonths <= 0) {
    return [];
  }

  const entries = [];

  for (const source of sources) {
    const { id, name, amount, type, startMonth, recurring } = source;
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
 * Sums a set of projection entries for a single month, split by received vs. pending.
 *
 * @param {Array} monthEntries - Projection entries belonging to the same month.
 * @returns {Object} { received, pending, total }.
 */
export function calculateMonthlyTotals(monthEntries) {
  const totals = (monthEntries || []).reduce((acc, entry) => {
    if (entry.status === 'received') {
      acc.received += entry.amount;
    } else {
      acc.pending += entry.amount;
    }
    return acc;
  }, { received: 0, pending: 0 });

  return {
    received: Math.round(totals.received * 100) / 100,
    pending: Math.round(totals.pending * 100) / 100,
    total: Math.round((totals.received + totals.pending) * 100) / 100
  };
}
