'use client';

import { useEffect, useState } from 'react';
import { WalletIsland } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import Link from 'next/link';

const MERCHANT_ADDRESS = process.env.NEXT_PUBLIC_MERCHANT_ADDRESS as string;

interface CommerceCharge {
  id: string;
  code: string;
  name: string;
  description: string;
  customer_email: string;
  created_at: string;
  confirmed_at?: string;
  expires_at: string;
  payments: Array<{
    transaction_id: string;
    status: string;
    value: {
      local: {
        amount: string;
        currency: string;
      };
      crypto: {
        amount: string;
        currency: string;
      };
    };
  }>;
  timeline: Array<{
    time: string;
    status: string;
  }>;
  metadata?: {
    refunded?: boolean;
    refund_tx?: string;
    refund_date?: string;
    original_payment_tx?: string;
    refund_requested?: boolean;
    refund_request_date?: string;
  };
}

export default function AdminPortal() {
  const { address } = useAccount();
  const [charges, setCharges] = useState<CommerceCharge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingChargeId, setProcessingChargeId] = useState<string | null>(null);
  const isMerchant = address?.toLowerCase() === MERCHANT_ADDRESS.toLowerCase();

  useEffect(() => {
    if (isMerchant) {
      fetchCharges();
    }
  }, [isMerchant]);

  const fetchCharges = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/charges', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch charges');
      }

      const data = await response.json();
      
      // Filter for charges that have payments
      const validCharges = data.data.filter((charge: CommerceCharge) => {
        // Check if there's a payment
        const hasPayment = charge.payments && charge.payments.length > 0;
        if (!hasPayment) return false;

        // Check timeline status
        const lastTimelineStatus = charge.timeline[charge.timeline.length - 1]?.status;
        const isValidStatus = ['PENDING', 'COMPLETED'].includes(lastTimelineStatus);

        return hasPayment && isValidStatus;
      });
      
      console.log('Found valid charges:', validCharges.length);
      setCharges(validCharges);
    } catch (error) {
      setError('Error fetching charges. Please try again.');
      console.error('Error fetching charges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = async (chargeId: string) => {
    try {
      setProcessingChargeId(chargeId);
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      console.log('Processing refund for charge:', chargeId);
      
      const response = await fetch('/api/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chargeId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process refund');
      }

      if (data.success) {
        setSuccessMessage(
          `Refund processed successfully. Transaction: ${data.transactionHash}`
        );
        // Refresh the charges list to show updated status
        await fetchCharges();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error processing refund';
      setError(`Refund failed: ${errorMessage}`);
      console.error('Error processing refund:', error);
    } finally {
      setIsLoading(false);
      setProcessingChargeId(null);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Admin Portal</h1>
        <WalletIsland />
      </div>
    );
  }

  if (!isMerchant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4 dark:text-white">Unauthorized Access</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only the merchant wallet can access this portal.
        </p>
        <Link
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Return to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="p-4 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold dark:text-white">Admin Portal</h1>
            <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
              Merchant
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Back to Store
            </Link>
            <WalletIsland />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold dark:text-white flex items-center gap-3">
              Charges
              {charges.length > 0 && (
                <span className="px-2 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">
                  {charges.length} total
                </span>
              )}
            </h2>
            <button
              onClick={fetchCharges}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              disabled={isLoading}
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 4V2C6.5 2 2 6.5 2 12H4C4 7.6 7.6 4 12 4Z"/>
              </svg>
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <div>
                <div>{successMessage}</div>
                <a
                  href={`https://basescan.org/tx/${successMessage.split(': ')[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 hover:text-green-900 underline text-sm mt-1 inline-block"
                >
                  View on BaseScan
                </a>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            {isLoading ? (
              <div className="p-6 text-center text-gray-600 dark:text-gray-300">
                Loading charges...
              </div>
            ) : charges.length === 0 ? (
              <p className="p-6 text-gray-600 dark:text-gray-300">No charges found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Refund Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {charges.map((charge) => {
                      // Check payment status - payments[0].status can be NEW, PENDING, CONFIRMED, FAILED, DELAYED, REFUND_PENDING, REFUNDED
                      const paymentStatus = charge.payments[0]?.status?.toUpperCase();
                      const isPaymentConfirmed = paymentStatus === 'CONFIRMED';
                      const isPaymentPending = paymentStatus === 'PENDING';
                      
                      // Check charge status from timeline - can be NEW, PENDING, COMPLETED, EXPIRED, UNRESOLVED, RESOLVED, CANCELED
                      const chargeStatus = charge.timeline[charge.timeline.length - 1]?.status;
                      const isChargeCompleted = chargeStatus === 'COMPLETED';
                      const isChargePending = chargeStatus === 'PENDING';
                      
                      // Determine overall status
                      const status = isChargeCompleted ? 'COMPLETED' 
                        : isChargePending ? 'PENDING'
                        : isPaymentConfirmed ? 'PAYMENT_CONFIRMED'
                        : isPaymentPending ? 'PAYMENT_PENDING'
                        : chargeStatus || 'UNKNOWN';

                      return (
                        <tr key={charge.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            <div className="space-y-1">
                              <div>{new Date(charge.created_at).toLocaleDateString()}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(charge.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            <div className="space-y-1">
                              <div>{charge.customer_email || 'N/A'}</div>
                              <div className="text-xs text-gray-500">
                                ID: {charge.id}
                              </div>
                              <div className="text-xs text-gray-500">
                                Code: {charge.code}
                              </div>
                              <div className="text-xs text-gray-500">
                                {charge.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {charge.payments[0]?.value?.local ? (
                              <div className="space-y-1">
                                <div>
                                  {charge.payments[0].value.local.amount} {charge.payments[0].value.local.currency}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {charge.payments[0].value.crypto.amount} {charge.payments[0].value.crypto.currency}
                                </div>
                              </div>
                            ) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-800'
                                  : (status === 'PENDING' || status === 'PAYMENT_PENDING')
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : status === 'PAYMENT_CONFIRMED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {status === 'COMPLETED' 
                                ? 'Completed' 
                                : status === 'PENDING'
                                ? 'Pending'
                                : status === 'PAYMENT_PENDING'
                                ? 'Payment Pending'
                                : status === 'PAYMENT_CONFIRMED'
                                ? 'Payment Confirmed'
                                : status}
                            </span>
                            {paymentStatus && paymentStatus !== status && (
                              <div className="text-xs text-gray-500 mt-1">
                                Payment: {paymentStatus}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {charge.metadata?.refunded ? (
                              <div className="space-y-1">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                  Refunded
                                </span>
                                <div className="text-xs text-gray-500">
                                  {charge.metadata.refund_date && new Date(charge.metadata.refund_date).toLocaleDateString()}
                                </div>
                                {charge.metadata.refund_tx && (
                                  <a
                                    href={`https://basescan.org/tx/${charge.metadata.refund_tx}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    View Transaction
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Not Refunded
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {!charge.metadata?.refunded && (
                              <button
                                onClick={() => handleRefund(charge.id)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isLoading || processingChargeId === charge.id}
                              >
                                {processingChargeId === charge.id ? (
                                  <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                    </svg>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                                    </svg>
                                    Process Refund
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
} 