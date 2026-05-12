/**
 * Service for loan mathematical and scheduling calculations.
 */

/**
 * Generates an array of scheduled installments for a credit limit loan,
 * spreading rounding remainders precisely onto the final installment.
 * 
 * @param {number} totalAmount - Total amount lent.
 * @param {number} installmentsCount - Number of monthly payments.
 * @param {string} startMonthStr - The starting month in "YYYY-MM" format.
 * @param {number} dueDay - Day of the month on which payments are due (1-31).
 * @returns {Array} List of installment objects.
 */
export function generateCreditCardInstallments(totalAmount, installmentsCount, startMonthStr, dueDay) {
  if (!totalAmount || totalAmount <= 0 || !installmentsCount || installmentsCount <= 0) {
    return [];
  }

  const installments = [];
  const baseAmount = Math.floor((totalAmount / installmentsCount) * 100) / 100;
  const remainder = Math.round((totalAmount - (baseAmount * installmentsCount)) * 100) / 100;

  // startMonthStr is expected to be "YYYY-MM"
  const [year, month] = startMonthStr.split('-').map(Number);

  for (let i = 0; i < installmentsCount; i++) {
    const installmentNumber = i + 1;
    
    // Compute current month and year (0-indexed month)
    let curMonth = month - 1 + i;
    let curYear = year + Math.floor(curMonth / 12);
    curMonth = curMonth % 12;

    // Enforce valid day of month (e.g. Day 31 in June becomes June 30)
    const maxDaysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const actualDay = Math.min(dueDay, maxDaysInMonth);

    // Format YYYY-MM-DD
    const formattedMonth = String(curMonth + 1).padStart(2, '0');
    const formattedDay = String(actualDay).padStart(2, '0');
    const dueDate = `${curYear}-${formattedMonth}-${formattedDay}`;

    // Last installment absorbs any floating point/division remainders
    const amount = installmentNumber === installmentsCount 
      ? (baseAmount + remainder) 
      : baseAmount;

    installments.push({
      number: installmentNumber,
      dueDate,
      amount: Math.round(amount * 100) / 100,
      status: 'pending',
      paymentDate: ''
    });
  }

  return installments;
}

/**
 * Computes metrics summary for a casual friend loan.
 * 
 * @param {Object} loan - The casual loan object.
 * @returns {Object} Summary of payments.
 */
export function calculateCasualLoanSummary(loan) {
  const amountLent = loan.amountLent || 0;
  const payments = loan.payments || [];

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remainingBalance = Math.max(0, Math.round((amountLent - totalPaid) * 100) / 100);
  const progressPercent = amountLent > 0 
    ? Math.min(100, Math.round((totalPaid / amountLent) * 1000) / 10) 
    : 0;

  return {
    totalLent: amountLent,
    totalPaid: Math.round(totalPaid * 100) / 100,
    remainingBalance,
    progressPercent
  };
}

/**
 * Computes metrics summary for a credit limit loan.
 * 
 * @param {Object} loan - The credit card limit loan object.
 * @returns {Object} Summary of installments.
 */
export function calculateCreditLoanSummary(loan) {
  const totalAmount = loan.totalAmount || 0;
  const installments = loan.installments || [];

  const totalPaid = installments
    .filter(inst => inst.status === 'paid')
    .reduce((sum, inst) => sum + (inst.amount || 0), 0);

  const remainingBalance = Math.max(0, Math.round((totalAmount - totalPaid) * 100) / 100);
  
  const paidInstallmentsCount = installments.filter(inst => inst.status === 'paid').length;
  const totalInstallmentsCount = installments.length;

  const progressPercent = totalInstallmentsCount > 0 
    ? Math.min(100, Math.round((paidInstallmentsCount / totalInstallmentsCount) * 1000) / 10) 
    : 0;

  const nextInstallment = installments.find(inst => inst.status === 'pending') || null;

  return {
    totalLent: totalAmount,
    totalPaid: Math.round(totalPaid * 100) / 100,
    remainingBalance,
    progressPercent,
    paidInstallmentsCount,
    totalInstallmentsCount,
    nextInstallment
  };
}
