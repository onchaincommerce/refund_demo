import { useState, useEffect } from 'react';

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';
type PaymentCallback = (status: PaymentStatus, data?: any) => void;

// Map to store callbacks for different charge IDs
const paymentListeners: Map<string, PaymentCallback[]> = new Map();

// This function will be called from our webhook route
export const notifyPaymentUpdate = (chargeId: string, status: PaymentStatus, data?: any) => {
  const listeners = paymentListeners.get(chargeId) || [];
  listeners.forEach(callback => callback(status, data));
};

// React hook to register and listen for payment updates
export const usePaymentStatus = (chargeId: string | null): [PaymentStatus, any | null] => {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    if (!chargeId) return;

    const handlePaymentUpdate = (newStatus: PaymentStatus, newData?: any) => {
      setStatus(newStatus);
      if (newData) setData(newData);
    };

    // Register this component as a listener for the charge ID
    const existingListeners = paymentListeners.get(chargeId) || [];
    paymentListeners.set(chargeId, [...existingListeners, handlePaymentUpdate]);

    // Clean up when component unmounts
    return () => {
      const listeners = paymentListeners.get(chargeId) || [];
      paymentListeners.set(
        chargeId,
        listeners.filter(listener => listener !== handlePaymentUpdate)
      );
    };
  }, [chargeId]);

  return [status, data];
};

// Store the current charge ID in session storage
export const setCurrentChargeId = (chargeId: string) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('currentChargeId', chargeId);
  }
};

// Get the current charge ID from session storage
export const getCurrentChargeId = (): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('currentChargeId');
  }
  return null;
}; 