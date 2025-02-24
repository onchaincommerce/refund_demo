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
  const [isPolling, setIsPolling] = useState(false);
  
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
    
    console.log('Starting to poll for payment success...', { chargeId });
    setIsPolling(true);
    
    // Clear any existing polling interval
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    
    // Create a new polling interval
    const interval = setInterval(async () => {
      try {
        console.log('Polling payment status for charge:', chargeId);
        const response = await fetch(`/api/payment-status/${chargeId}`);
        const data = await response.json();
        
        console.log('Payment status response:', data);
        
        if (data.status === 'success') {
          console.log('Payment success detected! Triggering confetti.');
          
          // Payment successful (charge:pending was received), trigger confetti
          if (onPaymentSuccess) {
            onPaymentSuccess();
          }
          
          // Stop polling
          clearInterval(interval);
          setPollInterval(null);
          setIsPolling(false);
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
        setIsPolling(false);
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
        
        {/* Show polling indicator when active */}
        {isPolling && (
          <motion.div 
            className="absolute bottom-4 left-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-3 py-1 rounded-full text-xs shadow-md flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Waiting for payment
          </motion.div>
        )}
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