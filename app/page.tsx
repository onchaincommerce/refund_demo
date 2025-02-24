'use client';

import { WalletIsland } from '@coinbase/onchainkit/wallet';
import { Checkout, CheckoutButton } from '@coinbase/onchainkit/checkout';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ProductCard } from './components/ProductCard';
import { Confetti } from './components/Confetti';
import { useToast } from './components/ToastContext';

export default function ProductPage() {
  const { address } = useAccount();
  const [showConfetti, setShowConfetti] = useState(false);
  const { showToast } = useToast();

  // Function to handle successful payment
  const handlePaymentSuccess = () => {
    setShowConfetti(true);
    showToast('Payment successful! Thank you for your purchase.', 'success');
    setTimeout(() => setShowConfetti(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {showConfetti && <Confetti />}
      
      <header className="p-4 border-b dark:border-gray-700 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <motion.svg 
              className="w-8 h-8" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            >
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
            <motion.span
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              OnchainKit Store
            </motion.span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
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
            <h1 className="text-4xl font-bold dark:text-white mb-4">OCK Mug</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Elevate your coffee experience with our premium matte black OCK mug. Perfect for your morning brew or late-night coding sessions.
            </p>
            
            <div className="max-w-md mx-auto">
              <ProductCard 
                image="/ock-mug.png"
                name="OCK Mug"
                description="Elevate your coffee experience with our premium matte black OCK mug. Perfect for your morning brew or late-night coding sessions."
                price="1"
                currency="USDC"
                productId="32b87e00-c125-46c9-9f43-dfab7668854c"
                onPaymentSuccess={handlePaymentSuccess}
              />
            </div>
          </motion.div>
        </div>
      </main>
      
      <footer className="py-8 border-t dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            &copy; {new Date().getFullYear()} OnchainKit Store. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
