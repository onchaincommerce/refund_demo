import { motion } from 'framer-motion';

interface SpinnerProps {
  size?: number;
  color?: string;
}

export const Spinner = ({ size = 40, color = '#3B82F6' }: SpinnerProps) => {
  const containerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1.5,
        ease: "linear",
        repeat: Infinity
      }
    }
  };

  const dotVariants = {
    animate: (i: number) => ({
      scale: [1, 1.5, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        delay: i * 0.2
      }
    })
  };

  const dots = Array.from({ length: 4 });
  
  return (
    <motion.div
      style={{
        width: size,
        height: size,
        position: 'relative'
      }}
      animate="animate"
      variants={containerVariants}
    >
      {dots.map((_, i) => {
        const angle = (i / dots.length) * 2 * Math.PI;
        const x = Math.cos(angle) * (size / 3);
        const y = Math.sin(angle) * (size / 3);
        
        return (
          <motion.div
            key={i}
            custom={i}
            variants={dotVariants}
            animate="animate"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: size / 5,
              height: size / 5,
              borderRadius: '50%',
              backgroundColor: color,
              transform: `translate(${x}px, ${y}px)`,
              margin: -size / 10
            }}
          />
        );
      })}
    </motion.div>
  );
}; 