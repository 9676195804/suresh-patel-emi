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

export const calculateLateFee = (dueDate: string, feePerDay: number): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays * feePerDay : 0;
};