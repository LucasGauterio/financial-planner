import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildIncomeRows,
  buildExpenseRows,
  buildLoanRows,
  buildPortfolioRows,
  buildCashFlowRows,
  buildTimelineRows,
  exportAllToSpreadsheet
} from './spreadsheetExportService';

const jsonToSheetMock = vi.fn((rows) => ({ __rows: rows }));
const aoaToSheetMock = vi.fn((rows) => ({ __aoa: rows }));
const bookNewMock = vi.fn(() => ({ __sheets: [] }));
const bookAppendSheetMock = vi.fn();
const writeFileMock = vi.fn();

vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: (...args) => jsonToSheetMock(...args),
    aoa_to_sheet: (...args) => aoaToSheetMock(...args),
    book_new: (...args) => bookNewMock(...args),
    book_append_sheet: (...args) => bookAppendSheetMock(...args)
  },
  writeFile: (...args) => writeFileMock(...args)
}));

describe('spreadsheetExportService', () => {
  beforeEach(() => {
    jsonToSheetMock.mockClear();
    aoaToSheetMock.mockClear();
    bookNewMock.mockClear();
    bookAppendSheetMock.mockClear();
    writeFileMock.mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00'));
  });

  describe('buildIncomeRows', () => {
    it('flattens income sources into one row per projected month', () => {
      const sources = [
        { id: 'i1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true }
      ];
      const rows = buildIncomeRows(sources, 2);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({ Source: 'Salary', Type: 'salario', Month: '2026-01', Status: 'pending', ExpectedAmount: 5000, ActualAmount: 5000 });
    });

    it('returns an empty array for no sources', () => {
      expect(buildIncomeRows([], 12)).toEqual([]);
      expect(buildIncomeRows(null, 12)).toEqual([]);
    });
  });

  describe('buildExpenseRows', () => {
    it('flattens expense sources into one row per projected month', () => {
      const sources = [
        { id: 'e1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: true }
      ];
      const rows = buildExpenseRows(sources, 1);
      expect(rows).toEqual([
        { Source: 'Rent', Type: 'fixed bill', Month: '2026-01', Status: 'pending', ExpectedAmount: 1500, ActualAmount: 1500 }
      ]);
    });

    it('returns an empty array for no sources', () => {
      expect(buildExpenseRows([], 12)).toEqual([]);
    });
  });

  describe('buildLoanRows', () => {
    it('flattens a credit loan into one row per installment', () => {
      const loans = [
        {
          name: 'Card Purchase',
          type: 'credit',
          installments: [
            { number: 1, dueDate: '2026-02-10', amount: 100, status: 'pending' },
            { number: 2, dueDate: '2026-03-10', amount: 100, status: 'pending' }
          ]
        }
      ];
      expect(buildLoanRows(loans)).toEqual([
        { LoanName: 'Card Purchase', Type: 'credit', DueDate: '2026-02-10', Amount: 100, Status: 'pending' },
        { LoanName: 'Card Purchase', Type: 'credit', DueDate: '2026-03-10', Amount: 100, Status: 'pending' }
      ]);
    });

    it('flattens a casual loan into one row per payment', () => {
      const loans = [
        {
          name: 'Loan to Friend',
          type: 'casual',
          payments: [{ id: 'p1', amount: 200, date: '2026-01-20', notes: '' }]
        }
      ];
      expect(buildLoanRows(loans)).toEqual([
        { LoanName: 'Loan to Friend', Type: 'casual', DueDate: '2026-01-20', Amount: 200, Status: 'paid' }
      ]);
    });

    it('returns an empty array for no loans', () => {
      expect(buildLoanRows([])).toEqual([]);
    });
  });

  describe('buildPortfolioRows', () => {
    it('flattens holdings into one row each', () => {
      const investments = [
        { name: 'Savings', type: 'Savings', investedValue: 1000, balance: 1200, monthly: 300, increase: 5, rate: 10, actualStartDate: '2024-01' }
      ];
      expect(buildPortfolioRows(investments)).toEqual([
        { Name: 'Savings', Type: 'Savings', InvestedValue: 1000, Balance: 1200, MonthlyContribution: 300, AnnualIncreasePercent: 5, Rate: 10, StartDate: '2024-01' }
      ]);
    });

    it('returns an empty array for no investments', () => {
      expect(buildPortfolioRows([])).toEqual([]);
    });
  });

  describe('buildCashFlowRows', () => {
    it('flattens merged income+expense entries into one row per projected month', () => {
      const incomeSources = [{ id: 'i1', name: 'Salary', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: false }];
      const expenseSources = [{ id: 'e1', name: 'Rent', type: 'fixed bill', amount: 1500, startMonth: '2026-01', recurring: false }];
      const rows = buildCashFlowRows(incomeSources, expenseSources, 1);
      expect(rows).toHaveLength(2);
      expect(rows.map(r => r.Kind).sort()).toEqual(['expense', 'income']);
    });

    it('returns an empty array when both domains have no sources', () => {
      expect(buildCashFlowRows([], [], 12)).toEqual([]);
    });
  });

  describe('buildTimelineRows', () => {
    it('flattens investments into one row per projected month, joined with stateMap', () => {
      const investments = [{ name: 'Savings', type: 'Savings', monthly: 300, increase: 0, actualStartDate: '2026-01', alreadyMade: false }];
      const rows = buildTimelineRows(investments, { 'Savings_2026-01': { checked: true, actualValue: 350, reportedBalance: 1000 } });
      const jan = rows.find(r => r.Month === '2026-01');
      expect(jan).toMatchObject({ Investment: 'Savings', ExpectedAmount: 300, Status: 'done', ActualValue: 350, ReportedBalance: 1000 });
    });

    it('defaults status to pending when no stateMap entry exists', () => {
      const investments = [{ name: 'Savings', type: 'Savings', monthly: 300, increase: 0, actualStartDate: '2026-01', alreadyMade: false }];
      const rows = buildTimelineRows(investments, {});
      expect(rows[0]).toMatchObject({ Status: 'pending', ActualValue: null, ReportedBalance: null });
    });

    it('returns an empty array for no investments', () => {
      expect(buildTimelineRows([], {})).toEqual([]);
    });
  });

  describe('exportAllToSpreadsheet', () => {
    it('assembles a workbook with exactly 6 sheets and calls writeFile once', () => {
      exportAllToSpreadsheet({
        income: [{ Source: 'Salary', Type: 'salario', Month: '2026-01', Status: 'pending', ExpectedAmount: 5000, ActualAmount: 5000 }],
        expenses: [],
        loans: [],
        portfolio: [],
        cashFlow: [],
        timeline: []
      });

      expect(bookNewMock).toHaveBeenCalledTimes(1);
      expect(bookAppendSheetMock).toHaveBeenCalledTimes(6);
      expect(writeFileMock).toHaveBeenCalledTimes(1);
      expect(writeFileMock.mock.calls[0][1]).toBe('financial_planner_export_2026-01-15.xlsx');
    });

    it('emits a header-only sheet (via aoa_to_sheet) for an empty domain', () => {
      exportAllToSpreadsheet({ income: [], expenses: [], loans: [], portfolio: [], cashFlow: [], timeline: [] });
      expect(aoaToSheetMock).toHaveBeenCalledTimes(6);
      expect(jsonToSheetMock).not.toHaveBeenCalled();
    });
  });
});
