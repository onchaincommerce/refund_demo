import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Checkout, CheckoutButton } from '@coinbase/onchainkit/checkout';
import { setCurrentChargeId } from '../utils/paymentListener';

interface ProductCardProps {
  image: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  productId: string;
  onPaymentSuccess?: () => void;
}

export const ProductCard = ({
  image,
  name,
  description,
  price,
  currency,
  productId,
  onPaymentSuccess,
}: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [chargeId, setChargeId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Function to capture the charge ID from Coinbase
  const handleButtonClick = () => {
    // Listen for the onchainkit:checkout:load event which contains charge info
    const handleCheckoutLoad = (event: any) => {
      if (event.detail && event.detail.chargeId) {
        console.log('Charge created:', event.detail.chargeId);
        setChargeId(event.detail.chargeId);
        setCurrentChargeId(event.detail.chargeId);
      }
    };
    
    window.addEventListener('onchainkit:checkout:load', handleCheckoutLoad);
  };
  
  // Poll for payment status when we have a charge ID
  useEffect(() => {
    if (!chargeId) return;
    
    // Clear any existing polling interval
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    
    // Create a new polling interval
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payment-status/${chargeId}`);
        const data = await response.json();
        
        if (data.status === 'success') {
          // Payment successful, trigger confetti
          if (onPaymentSuccess) {
            onPaymentSuccess();
          }
          
          // Stop polling
          clearInterval(interval);
          setPollInterval(null);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 2000); // Check every 2 seconds
    
    setPollInterval(interval);
    
    // Clean up interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [chargeId, onPaymentSuccess]);

  return (
    <motion.div
      className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden">
        <motion.div
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src={image}
            alt={name}
            width={400}
            height={400}
            className="w-full object-cover"
            priority
          />
        </motion.div>
        
        {/* Price tag */}
        <motion.div 
          className="absolute top-4 right-4 bg-white dark:bg-gray-900 px-3 py-1 rounded-full shadow-md"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="font-bold text-lg">{price} {currency}</span>
        </motion.div>
      </div>
      
      <div className="p-6">
        <motion.h2 
          className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {name}
        </motion.h2>
        
        <motion.p 
          className="text-gray-600 dark:text-gray-300 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {description}
        </motion.p>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Checkout productId={productId}>
            <div onClick={handleButtonClick}>
              <CheckoutButton />
            </div>
          </Checkout>
        </motion.div>
      </div>
    </motion.div>
  );
}; 