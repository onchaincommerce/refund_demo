// Store pending payments in memory (in a real app, use Redis or a database)
const pendingPayments = new Set<string>();

export const addPendingPayment = (chargeId: string): void => {
  pendingPayments.add(chargeId);
};

export const hasPendingPayment = (chargeId: string): boolean => {
  return pendingPayments.has(chargeId);
};

export const removePendingPayment = (chargeId: string): void => {
  pendingPayments.delete(chargeId);
}; 