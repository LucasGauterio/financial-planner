import { describe, it, expect } from 'vitest';
import { 
  generateCreditCardInstallments, 
  calculateCasualLoanSummary, 
  calculateCreditLoanSummary 
} from './loanCalculations';

describe('Loan Calculations Service', () => {
  describe('generateCreditCardInstallments', () => {
    it('returns empty array for invalid inputs', () => {
      expect(generateCreditCardInstallments(0, 10, '2026-05', 10)).toEqual([]);
      expect(generateCreditCardInstallments(100, 0, '2026-05', 10)).toEqual([]);
    });

    it('splits installments equally and handles rounding remainders on the final installment', () => {
      const installments = generateCreditCardInstallments(1000, 3, '2026-05', 10);
      expect(installments).toHaveLength(3);
      
      // 1000 / 3 = 333.333333...
      // Base amount = 333.33
      // Remainder = 1000 - 333.33 * 3 = 0.01
      // Last installment should be 333.33 + 0.01 = 333.34
      expect(installments[0].amount).toBe(333.33);
      expect(installments[1].amount).toBe(333.33);
      expect(installments[2].amount).toBe(333.34);

      // Verify total sums up exactly to 1000
      const totalSum = installments.reduce((sum, inst) => sum + inst.amount, 0);
      expect(totalSum).toBe(1000);
    });

    it('correctly increments year and month for subsequent installments', () => {
      const installments = generateCreditCardInstallments(300, 3, '2026-11', 15);
      expect(installments).toHaveLength(3);

      expect(installments[0].dueDate).toBe('2026-11-15');
      expect(installments[1].dueDate).toBe('2026-12-15');
      expect(installments[2].dueDate).toBe('2027-01-15'); // Crosses year boundary!
    });

    it('caps due date day at max month length', () => {
      // March 31 -> April 30 -> May 31 -> June 30
      const installments = generateCreditCardInstallments(400, 4, '2026-03', 31);
      expect(installments).toHaveLength(4);

      expect(installments[0].dueDate).toBe('2026-03-31');
      expect(installments[1].dueDate).toBe('2026-04-30'); // Capped at 30 days!
      expect(installments[2].dueDate).toBe('2026-05-31');
      expect(installments[3].dueDate).toBe('2026-06-30'); // Capped at 30 days!
    });

    it('correctly handles leap years for February due days', () => {
      // 2028 is a leap year (February has 29 days)
      const installmentsLeap = generateCreditCardInstallments(200, 2, '2028-01', 30);
      expect(installmentsLeap[1].dueDate).toBe('2028-02-29'); // Capped to 29!

      // 2029 is not a leap year (February has 28 days)
      const installmentsNormal = generateCreditCardInstallments(200, 2, '2029-01', 30);
      expect(installmentsNormal[1].dueDate).toBe('2029-02-28'); // Capped to 28!
    });
  });

  describe('calculateCasualLoanSummary', () => {
    it('calculates correct metrics with no payments', () => {
      const loan = {
        amountLent: 500,
        payments: []
      };
      const summary = calculateCasualLoanSummary(loan);
      expect(summary.totalLent).toBe(500);
      expect(summary.totalPaid).toBe(0);
      expect(summary.remainingBalance).toBe(500);
      expect(summary.progressPercent).toBe(0);
    });

    it('calculates correct metrics with multiple payments', () => {
      const loan = {
        amountLent: 500,
        payments: [
          { amount: 100 },
          { amount: 150 },
          { amount: 50.55 }
        ]
      };
      const summary = calculateCasualLoanSummary(loan);
      expect(summary.totalLent).toBe(500);
      expect(summary.totalPaid).toBe(300.55);
      expect(summary.remainingBalance).toBe(199.45);
      expect(summary.progressPercent).toBe(60.1); // (300.55 / 500) * 100 = 60.11% rounded to 1 dec place is 60.1
    });

    it('limits progress percent to 100 if paid amount exceeds lent amount', () => {
      const loan = {
        amountLent: 100,
        payments: [
          { amount: 120 }
        ]
      };
      const summary = calculateCasualLoanSummary(loan);
      expect(summary.totalPaid).toBe(120);
      expect(summary.remainingBalance).toBe(0);
      expect(summary.progressPercent).toBe(100);
    });
  });

  describe('calculateCreditLoanSummary', () => {
    const mockLoan = {
      totalAmount: 1200,
      installmentsCount: 12,
      installments: [
        { number: 1, amount: 100, status: 'paid', dueDate: '2026-05-10' },
        { number: 2, amount: 100, status: 'paid', dueDate: '2026-06-10' },
        { number: 3, amount: 100, status: 'pending', dueDate: '2026-07-10' },
        { number: 4, amount: 100, status: 'pending', dueDate: '2026-08-10' }
      ]
    };

    it('calculates totals and remaining balance correctly', () => {
      const summary = calculateCreditLoanSummary(mockLoan);
      expect(summary.totalLent).toBe(1200);
      expect(summary.totalPaid).toBe(200);
      expect(summary.remainingBalance).toBe(1000);
      expect(summary.paidInstallmentsCount).toBe(2);
      expect(summary.totalInstallmentsCount).toBe(4);
      expect(summary.progressPercent).toBe(50.0); // 2 of 4 paid = 50%
    });

    it('identifies the next pending installment', () => {
      const summary = calculateCreditLoanSummary(mockLoan);
      expect(summary.nextInstallment).not.toBeNull();
      expect(summary.nextInstallment.number).toBe(3);
      expect(summary.nextInstallment.dueDate).toBe('2026-07-10');
    });

    it('returns null for nextPending if all installments are paid', () => {
      const completedLoan = {
        totalAmount: 200,
        installments: [
          { number: 1, amount: 100, status: 'paid' },
          { number: 2, amount: 100, status: 'paid' }
        ]
      };
      const summary = calculateCreditLoanSummary(completedLoan);
      expect(summary.nextInstallment).toBeNull();
      expect(summary.progressPercent).toBe(100);
      expect(summary.remainingBalance).toBe(0);
    });
  });
});
