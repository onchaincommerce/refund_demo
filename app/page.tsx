'use client';

import { WalletIsland } from '@coinbase/onchainkit/wallet';
import { Checkout, CheckoutButton } from '@coinbase/onchainkit/checkout';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ProductCard } from './components/ProductCard';
import { Confetti } from './components/Confetti';

export default function ProductPage() {
  const { address } = useAccount();
  const [showConfetti, setShowConfetti] = useState(false);

  // Show confetti when page first loads
  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  // Function to handle successful payment - now empty
  const handlePaymentSuccess = () => {
    // No action needed
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Background animation */}
      <div className="absolute inset-0 z-0 opacity-30">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500 filter blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ 
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-purple-500 filter blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ 
            duration: 18,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute top-2/3 right-1/3 w-72 h-72 rounded-full bg-teal-500 filter blur-3xl"
          animate={{ 
            scale: [1, 1.4, 1],
            x: [0, 60, 0],
            y: [0, -30, 0],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </div>

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

      <main className="max-w-7xl mx-auto px-4 py-12 relative z-1">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <div className="max-w-md">
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
      
      <footer className="py-8 border-t dark:border-gray-700 relative z-1">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            &copy; {new Date().getFullYear()} OnchainKit Store. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
