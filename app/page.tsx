'use client';

import { WalletIsland } from '@coinbase/onchainkit/wallet';
import { Checkout, CheckoutButton } from '@coinbase/onchainkit/checkout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useEffect, useState, useCallback } from 'react';

interface Charge {
  id: string;
  code: string;
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
  };
  payer_addresses?: Record<string, string>;
}

export default function ProductPage() {
  const { address } = useAccount();
  const [userCharges, setUserCharges] = useState<Charge[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserCharges = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/charges');
      if (response.ok) {
        const data = await response.json();
        // Filter charges for the current user
        const userCharges = data.data.filter((charge: Charge) => {
          return charge.payer_addresses && 
            Object.values(charge.payer_addresses).includes(address?.toLowerCase() || '');
        });
        setUserCharges(userCharges);
      }
    } catch (error) {
      console.error('Error fetching charges:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Fetch user's charges when they connect their wallet
  useEffect(() => {
    if (address) {
      fetchUserCharges();
    }
  }, [address, fetchUserCharges]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="p-4 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            OnchainKit Store
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              Admin Portal
            </Link>
            <WalletIsland />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold dark:text-white mb-4">Premium Product</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Experience the future of digital commerce with our premium product. Secure, fast, and powered by blockchain technology.
            </p>
            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
              <div className="mb-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">1 USDC</div>
                <div className="text-gray-500 dark:text-gray-400">≈ $1.00 USD</div>
              </div>
              <Checkout productId="32b87e00-c125-46c9-9f43-dfab7668854c">
                <CheckoutButton />
              </Checkout>
            </div>
          </motion.div>

          {address && userCharges.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-16"
            >
              <h2 className="text-2xl font-bold dark:text-white mb-6">Your Purchases</h2>
              <div className="grid gap-6 max-w-2xl mx-auto">
                {userCharges.map((charge) => (
                  <div key={charge.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                          Order #{charge.code}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {new Date(charge.timeline[0].time).toLocaleDateString()} at{' '}
                          {new Date(charge.timeline[0].time).toLocaleTimeString()}
                        </div>
                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                          {charge.payments[0]?.value?.local.amount} {charge.payments[0]?.value?.local.currency}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-3">
                        {charge.metadata?.refunded && (
                          <>
                            <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800">
                              Refunded
                            </span>
                            {charge.metadata.refund_tx && (
                              <a
                                href={`https://basescan.org/tx/${charge.metadata.refund_tx}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <span>View Transaction</span>
                                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                </svg>
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
