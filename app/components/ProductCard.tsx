import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Checkout, CheckoutButton } from '@coinbase/onchainkit/checkout';

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

  return (
    <motion.div
      className="max-w-sm mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
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
            width={350}
            height={350}
            className="w-full object-cover"
            priority
          />
        </motion.div>
        
        {/* Price tag */}
        <motion.div 
          className="absolute top-3 right-3 bg-white dark:bg-gray-900 px-2 py-1 rounded-full shadow-md"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="font-bold text-base">{price} {currency}</span>
        </motion.div>
      </div>
      
      <div className="p-4">
        <motion.h2 
          className="text-xl font-bold text-gray-900 dark:text-white mb-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {name}
        </motion.h2>
        
        <motion.p 
          className="text-sm text-gray-600 dark:text-gray-300 mb-4"
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
            <CheckoutButton />
          </Checkout>
        </motion.div>
      </div>
    </motion.div>
  );
}; 