// Since we're in a serverless environment, we need a persistent solution
// For simplicity, we'll use a combination approach that works in both environments

// Server-side collection for the current request
const pendingPayments = new Set<string>();

// Track last charge ID globally
let lastAddedChargeId: string | null = null;

export const addPendingPayment = (chargeId: string): void => {
  console.log('Adding pending payment:', chargeId);
  pendingPayments.add(chargeId);
  
  // Store the last charge ID
  lastAddedChargeId = chargeId;
  
  // Save to a file or output a log that can be checked
  console.log('PAYMENT_TRACKING: Charge pending', { chargeId, time: new Date().toISOString() });
};

export const getLastChargeId = (): string | null => {
  return lastAddedChargeId;
};

export const hasPendingPayment = (chargeId: string): boolean => {
  // Check the in-memory set
  const inMemory = pendingPayments.has(chargeId);
  
  // Also check if this is the last added charge
  const isLastCharge = lastAddedChargeId === chargeId;
  
  console.log('Checking payment status:', { 
    chargeId, 
    inMemory, 
    isLastCharge, 
    lastAddedChargeId 
  });
  
  return inMemory || isLastCharge;
};

export const removePendingPayment = (chargeId: string): void => {
  console.log('Removing pending payment:', chargeId);
  pendingPayments.delete(chargeId);
  
  // If we're removing the last charge ID, clear it
  if (lastAddedChargeId === chargeId) {
    lastAddedChargeId = null;
  }
}; 