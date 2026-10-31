export interface CreditCalculation {
  principal: number;
  monthlyPayment: number;
  totalPayment: number;
  overpayment: number;
}

export function calculateCredit(
  vehiclePrice: number,
  downPaymentPercent: number,
  annualRatePercent: number,
  termMonths: number,
): CreditCalculation {
  const principal = Math.max(0, vehiclePrice * (1 - downPaymentPercent / 100));
  const monthlyRate = annualRatePercent / 100 / 12;
  const monthlyPayment = monthlyRate === 0
    ? principal / termMonths
    : principal * monthlyRate / (1 - (1 + monthlyRate) ** -termMonths);
  const totalPayment = monthlyPayment * termMonths;

  return {
    principal,
    monthlyPayment,
    totalPayment,
    overpayment: totalPayment - principal,
  };
}
