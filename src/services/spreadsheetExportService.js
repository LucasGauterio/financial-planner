/**
 * Service for exporting every tracked financial domain to a single downloadable
 * .xlsx workbook, one sheet per domain (Phase 12, TD-01/TD-02).
 */

import * as XLSX from 'xlsx';
import { generateIncomeProjection } from './incomeCalculations';
import { generateExpenseProjection } from './expenseCalculations';
import { buildCashFlowEntries } from './cashFlowCalculations';

const SHEET_NAMES = {
  income: 'Income',
  expenses: 'Expenses',
  loans: 'Loans',
  portfolio: 'Portfolio',
  cashFlow: 'Cash Flow',
  timeline: 'Investment Timeline'
};

// Mirrors IncomeTracker.vue / ExpenseTracker.vue / CashFlowOverview.vue's own
// `flattenOverrides` — builds the `${sourceId}:${YYYY-MM}` -> status map each
// generate*Projection function expects, from each source's own per-source
// `statusOverrides` map.
function flattenOverrides(sources) {
  const map = {};
  sources.forEach(source => {
    Object.entries(source.statusOverrides || {}).forEach(([month, status]) => {
      map[`${source.id}:${month}`] = status;
    });
  });
  return map;
}

/**
 * Flattens Income sources into one row per projected month.
 * @param {Array} sources - Income sources, per `generateIncomeProjection`.
 * @param {number} horizonMonths
 * @returns {Array} Flat rows: { Source, Type, Month, Status, ExpectedAmount, ActualAmount }.
 */
export function buildIncomeRows(sources, horizonMonths) {
  if (!sources || sources.length === 0) return [];
  const entries = generateIncomeProjection(sources, horizonMonths, flattenOverrides(sources));
  return entries.map(entry => ({
    Source: entry.name,
    Type: entry.type,
    Month: entry.month,
    Status: entry.status,
    ExpectedAmount: entry.expectedAmount,
    ActualAmount: entry.amount
  }));
}

/**
 * Flattens Expense sources into one row per projected month.
 * @param {Array} sources - Expense sources, per `generateExpenseProjection`.
 * @param {number} horizonMonths
 * @returns {Array} Flat rows: { Source, Type, Month, Status, ExpectedAmount, ActualAmount }.
 */
export function buildExpenseRows(sources, horizonMonths) {
  if (!sources || sources.length === 0) return [];
  const entries = generateExpenseProjection(sources, horizonMonths, flattenOverrides(sources));
  return entries.map(entry => ({
    Source: entry.name,
    Type: entry.type,
    Month: entry.month,
    Status: entry.status,
    ExpectedAmount: entry.expectedAmount,
    ActualAmount: entry.amount
  }));
}

/**
 * Flattens every loan into one row per installment (credit loans) or payment (casual loans).
 * @param {Array} loans - Loan objects, per `LoanTracker.vue`'s data model
 *   (`type: 'casual' | 'credit'`; casual carries `payments`, credit carries `installments`).
 * @returns {Array} Flat rows: { LoanName, Type, DueDate, Amount, Status }.
 */
export function buildLoanRows(loans) {
  if (!loans || loans.length === 0) return [];
  const rows = [];
  loans.forEach(loan => {
    if (loan.type === 'credit') {
      (loan.installments || []).forEach(inst => {
        rows.push({
          LoanName: loan.name,
          Type: 'credit',
          DueDate: inst.dueDate,
          Amount: inst.amount,
          Status: inst.status
        });
      });
    } else {
      (loan.payments || []).forEach(payment => {
        rows.push({
          LoanName: loan.name,
          Type: 'casual',
          DueDate: payment.date,
          Amount: payment.amount,
          Status: 'paid'
        });
      });
    }
  });
  return rows;
}

/**
 * Flattens every Portfolio holding into one row.
 * @param {Array} investments - Investment holdings, per `PortfolioTracker.vue`'s data model.
 * @returns {Array} Flat rows: { Name, Type, InvestedValue, Balance, MonthlyContribution,
 *   AnnualIncreasePercent, Rate, StartDate }.
 */
export function buildPortfolioRows(investments) {
  if (!investments || investments.length === 0) return [];
  return investments.map(inv => ({
    Name: inv.name,
    Type: inv.type,
    InvestedValue: inv.investedValue,
    Balance: inv.balance,
    MonthlyContribution: inv.monthly,
    AnnualIncreasePercent: inv.increase,
    Rate: inv.rate,
    StartDate: inv.actualStartDate
  }));
}

/**
 * Flattens the combined Income+Expense cash flow into one row per projected month.
 * @param {Array} incomeSources
 * @param {Array} expenseSources
 * @param {number} horizonMonths
 * @returns {Array} Flat rows: { Kind, Source, Month, Status, Amount }.
 */
export function buildCashFlowRows(incomeSources, expenseSources, horizonMonths) {
  if ((!incomeSources || incomeSources.length === 0) && (!expenseSources || expenseSources.length === 0)) return [];
  const entries = buildCashFlowEntries(
    incomeSources || [],
    expenseSources || [],
    horizonMonths,
    flattenOverrides(incomeSources || []),
    flattenOverrides(expenseSources || [])
  );
  return entries.map(entry => ({
    Kind: entry.kind,
    Source: entry.name,
    Month: entry.month,
    Status: entry.status,
    Amount: entry.amount
  }));
}

// Reimplements InvestmentTimeline.vue's inline `generateTimeline` month-iteration loop
// as a pure function, so it can run outside the component (no Vue/DOM dependency).
function generateTimelineItems(investments, referenceDate = new Date()) {
  const groups = [];
  let maxHistoricalMonths = 0;
  investments.forEach(inv => {
    if (inv.actualStartDate) {
      const [sy, sm] = inv.actualStartDate.split('-');
      const elapsed = (referenceDate.getFullYear() - Number.parseInt(sy)) * 12 + (referenceDate.getMonth() + 1 - Number.parseInt(sm));
      if (elapsed > maxHistoricalMonths) maxHistoricalMonths = elapsed;
    }
  });

  for (let m = -maxHistoricalMonths; m < 24; m++) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + m, 1);
    const groupKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    investments.forEach(inv => {
      let elapsedPrior = 0;
      if (inv.actualStartDate) {
        const [sy, sm] = inv.actualStartDate.split('-');
        elapsedPrior = (referenceDate.getFullYear() - Number.parseInt(sy)) * 12 + (referenceDate.getMonth() + 1 - Number.parseInt(sm));
      }
      if (elapsedPrior + m < 0) return;
      if (m === 0 && inv.alreadyMade) return;

      let amount = Number.parseFloat(inv.monthly);
      if (inv.increase && inv.increase > 0) {
        const newAnniversaries = Math.floor((elapsedPrior + m) / 12) - Math.floor(elapsedPrior / 12);
        if (newAnniversaries !== 0) {
          amount = amount * Math.pow(1 + (inv.increase / 100), newAnniversaries);
        }
      }
      if (!(amount > 0)) return;

      groups.push({
        id: `${inv.name}_${groupKey}`,
        invName: inv.name,
        type: inv.type,
        month: groupKey,
        amount
      });
    });
  }
  return groups;
}

/**
 * Flattens the Investment Timeline into one row per projected month, joined with
 * each item's persisted mark-as-Done state.
 * @param {Array} investments - Portfolio holdings, per `PortfolioTracker.vue`'s data model.
 * @param {Object} stateMap - Persisted per-item state, keyed by item id:
 *   `{ checked, actualValue, reportedBalance }` (per `InvestmentTimeline.vue`).
 * @returns {Array} Flat rows: { Investment, Type, Month, ExpectedAmount, Status, ActualValue, ReportedBalance }.
 */
export function buildTimelineRows(investments, stateMap) {
  if (!investments || investments.length === 0) return [];
  const items = generateTimelineItems(investments);
  const state = stateMap || {};
  return items.map(item => {
    const itemState = state[item.id] || {};
    return {
      Investment: item.invName,
      Type: item.type,
      Month: item.month,
      ExpectedAmount: item.amount,
      Status: itemState.checked ? 'done' : 'pending',
      ActualValue: itemState.actualValue ?? null,
      ReportedBalance: itemState.reportedBalance ?? null
    };
  });
}

// Excel disallows these characters in a sheet name and caps the length at 31.
function toSafeSheetName(name) {
  return name.replaceAll(/[:\\/?*[\]]/g, '').slice(0, 31);
}

function rowsToWorksheet(rows, placeholderHeaders) {
  if (rows.length > 0) {
    return XLSX.utils.json_to_sheet(rows);
  }
  // json_to_sheet([]) produces a sheet with no header row at all; emit an explicit
  // header-only sheet instead, so an empty domain still documents its column shape.
  return XLSX.utils.aoa_to_sheet([placeholderHeaders]);
}

/**
 * Assembles one multi-sheet .xlsx workbook from the six domains' pre-built row
 * arrays and triggers the browser download (TD-02: always all six domains, one file).
 * @param {Object} domainsData - `{ income, expenses, loans, portfolio, cashFlow, timeline }`,
 *   each the corresponding `build*Rows` output.
 */
export function exportAllToSpreadsheet(domainsData) {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, rowsToWorksheet(domainsData.income, ['Source', 'Type', 'Month', 'Status', 'ExpectedAmount', 'ActualAmount']), toSafeSheetName(SHEET_NAMES.income));
  XLSX.utils.book_append_sheet(wb, rowsToWorksheet(domainsData.expenses, ['Source', 'Type', 'Month', 'Status', 'ExpectedAmount', 'ActualAmount']), toSafeSheetName(SHEET_NAMES.expenses));
  XLSX.utils.book_append_sheet(wb, rowsToWorksheet(domainsData.loans, ['LoanName', 'Type', 'DueDate', 'Amount', 'Status']), toSafeSheetName(SHEET_NAMES.loans));
  XLSX.utils.book_append_sheet(wb, rowsToWorksheet(domainsData.portfolio, ['Name', 'Type', 'InvestedValue', 'Balance', 'MonthlyContribution', 'AnnualIncreasePercent', 'Rate', 'StartDate']), toSafeSheetName(SHEET_NAMES.portfolio));
  XLSX.utils.book_append_sheet(wb, rowsToWorksheet(domainsData.cashFlow, ['Kind', 'Source', 'Month', 'Status', 'Amount']), toSafeSheetName(SHEET_NAMES.cashFlow));
  XLSX.utils.book_append_sheet(wb, rowsToWorksheet(domainsData.timeline, ['Investment', 'Type', 'Month', 'ExpectedAmount', 'Status', 'ActualValue', 'ReportedBalance']), toSafeSheetName(SHEET_NAMES.timeline));

  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `financial_planner_export_${date}.xlsx`);
}
