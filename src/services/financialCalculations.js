export function calculateCompoundInterest(principal, startingMonthlyContribution, monthlyRate, months, annualApportIncreasePercent = 0, elapsedMonthsSinceStart = 0) {
  const maxVal = 999999999999999; // Explicitly capped below a quadrillion
  let currentBalance = Math.min(maxVal, principal);
  let increaseMultiplier = 1 + (annualApportIncreasePercent / 100);
  
  let currentContribution = Math.min(maxVal, startingMonthlyContribution);

  for (let i = 1; i <= months; i++) {
    if ((elapsedMonthsSinceStart + i - 1) > 0 && (elapsedMonthsSinceStart + i - 1) % 12 === 0 && annualApportIncreasePercent > 0) {
      currentContribution = Math.min(maxVal, currentContribution * increaseMultiplier);
    }
    currentBalance += (currentBalance * monthlyRate) + currentContribution;
    if (currentBalance >= maxVal) {
      return maxVal;
    }
  }
  return Math.min(maxVal, currentBalance);
}

export function calculateRequiredMonthlyContribution(targetAmount, principal, monthlyRate, months, annualApportIncreasePercent = 0, elapsedMonthsSinceStart = 0) {
  const maxVal = 999999999999999; // Explicitly capped below a quadrillion
  const target = Math.min(maxVal, targetAmount);
  if (months <= 0) return 0;

  let low = 0;
  let high = target; 
  let requiredPMT = 0;
  const tolerance = 0.01; 
  let iterations = 0;

  while (high - low > tolerance && iterations < 150) {
    iterations++;
    const mid = (low + high) / 2;
    
    // Prevent infinite loops when high and low are mathematically adjacent float representations
    if (mid === low || mid === high) {
      break;
    }
    
    const projectedTarget = calculateCompoundInterest(principal, mid, monthlyRate, months, annualApportIncreasePercent, elapsedMonthsSinceStart);
    
    if (projectedTarget >= target) {
      requiredPMT = mid;
      high = mid; 
    } else {
      low = mid; 
    }
  }

  return Math.min(maxVal, requiredPMT);
}
