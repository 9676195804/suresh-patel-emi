export const calculateEMI = (
  principal: number,
  ratePercent: number,
  tenure: number
): number => {
  const monthlyRate = ratePercent / 100 / 12;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
              (Math.pow(1 + monthlyRate, tenure) - 1);
  return Math.round(emi * 100) / 100;
};

export const generateEMISchedule = (
  purchaseId: string,
  loanAmount: number,
  emiAmount: number,
  interestRate: number,
  tenure: number,
  startDate: string
) => {
  const schedule = [];
  const monthlyRate = interestRate / 100 / 12;
  let remainingPrincipal = loanAmount;
  
  for (let i = 1; i <= tenure; i++) {
    const interestAmount = remainingPrincipal * monthlyRate;
    const principalAmount = emiAmount - interestAmount;
    remainingPrincipal -= principalAmount;
    
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    schedule.push({
      purchase_id: purchaseId,
      installment_number: i,
      due_date: dueDate.toISOString().split('T')[0],
      principal_amount: Math.round(principalAmount * 100) / 100,
      interest_amount: Math.round(interestAmount * 100) / 100,
      total_amount: emiAmount,
      status: 'pending'
    });
  }
  
  return schedule;
};

// Calculate late fee with 3-day grace period
// Example: Due date 2nd → Grace period ends 5th → Charges start from 5th onwards
export const calculateLateFee = (dueDate: string, feePerDay: number): number => {
  const due = new Date(dueDate);
  const today = new Date();

  // Add 3 days grace period
  const graceEndDate = new Date(due);
  graceEndDate.setDate(graceEndDate.getDate() + 3);

  // If today is before grace period end, no late fee
  if (today <= graceEndDate) {
    return 0;
  }

  // Calculate days after grace period
  const diffTime = today.getTime() - graceEndDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays * feePerDay : 0;
};

// Check if EMI is eligible for late fees (3+ days overdue)
export const isEligibleForLateFee = (dueDate: string): boolean => {
  const due = new Date(dueDate);
  const today = new Date();

  // Grace period ends 3 days after due date
  const graceEndDate = new Date(due);
  graceEndDate.setDate(graceEndDate.getDate() + 3);

  return today > graceEndDate;
};

// Calculate days overdue (after grace period)
export const calculateDaysOverdue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();

  // Add 3 days grace period
  const graceEndDate = new Date(due);
  graceEndDate.setDate(graceEndDate.getDate() + 3);

  if (today <= graceEndDate) {
    return 0;
  }

  const diffTime = today.getTime() - graceEndDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
};