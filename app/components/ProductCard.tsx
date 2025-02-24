import { useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
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
  const controls = useAnimation();
  const [rotateY, setRotateY] = useState(0);
  const [rotateX, setRotateX] = useState(0);
  const [showSparkle, setShowSparkle] = useState(false);

  // Shimmer effect on load
  useEffect(() => {
    const sequence = async () => {
      await controls.start({
        background: [
          'linear-gradient(45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 75%, rgba(255,255,255,0.8) 90%, rgba(255,255,255,0) 100%)',
          'linear-gradient(45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 20%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 80%, rgba(255,255,255,0) 100%)',
          'linear-gradient(45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 0%)',
        ],
        backgroundSize: '200% 100%',
        backgroundPosition: ['100% 0%', '0% 0%', '0% 0%'],
        transition: { duration: 1.5, ease: 'easeInOut' }
      });
    };
    sequence();
    
    // Periodically show sparkle effect
    const intervalId = setInterval(() => {
      setShowSparkle(true);
      setTimeout(() => setShowSparkle(false), 1500);
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [controls]);

  // Update card rotation based on mouse position
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHovered) return;
    
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation values (limited range for subtle effect)
    const rotY = ((x / rect.width) - 0.5) * 10; // -5 to 5 degrees
    const rotX = ((y / rect.height) - 0.5) * -10; // -5 to 5 degrees
    
    setRotateY(rotY);
    setRotateX(rotX);
  };

  return (
    <motion.div
      className="relative max-w-sm mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        boxShadow: isHovered ? 
          '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1), 0 0 20px 5px rgba(0, 198, 251, 0.2)' : 
          '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        rotateX,
        rotateY,
        transition: {
          boxShadow: { duration: 0.3 },
          rotateX: { duration: 0.1, ease: 'linear' },
          rotateY: { duration: 0.1, ease: 'linear' }
        }
      }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => {
        setIsHovered(false);
        setRotateX(0);
        setRotateY(0);
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Shimmer overlay */}
      <motion.div 
        className="absolute inset-0 z-10 pointer-events-none overflow-hidden"
        animate={controls}
      />
      
      {/* Sparkle effect */}
      <AnimatePresence>
        {showSparkle && (
          <motion.div 
            className="absolute inset-0 pointer-events-none z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                initial={{ 
                  opacity: 1,
                  scale: 0,
                  x: Math.random() * 100 + 50,
                  y: Math.random() * 100 + 100
                }}
                animate={{ 
                  opacity: [1, 0.8, 0],
                  scale: [0, 1.5, 0.5],
                  y: (Math.random() * 100 + 100) - 100
                }}
                transition={{ 
                  duration: 1 + Math.random(),
                  ease: 'easeOut'
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative overflow-hidden">
        <motion.div
          animate={{ 
            scale: isHovered ? 1.05 : 1,
            filter: isHovered ? 'brightness(1.1)' : 'brightness(1)'
          }}
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
          className="absolute top-3 right-3 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-full shadow-md"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ 
            scale: 1.05, 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            transition: { duration: 0.2 }
          }}
        >
          <span className="font-bold text-base">{price} {currency}</span>
        </motion.div>
      </div>
      
      <div className="p-6">
        <motion.h2 
          className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {name}
        </motion.h2>
        
        <motion.p 
          className="text-base text-gray-600 dark:text-gray-300 mb-6"
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
          whileHover={{ scale: 1.02 }}
        >
          <Checkout productId={productId}>
            <CheckoutButton />
          </Checkout>
        </motion.div>
      </div>
      
      {/* Corner accent decoration */}
      <motion.div 
        className="absolute top-0 left-0 w-20 h-20 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-blue-500/30 to-purple-500/0 transform -rotate-45 origin-top-left" />
      </motion.div>
    </motion.div>
  );
}; 