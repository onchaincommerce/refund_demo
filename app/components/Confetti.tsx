import { useEffect, useState } from 'react';
import { useWindowSize } from 'react-use';
import ReactConfetti from 'react-confetti';

interface ConfettiProps {
  duration?: number;
}

export const Confetti = ({ duration = 5000 }: ConfettiProps) => {
  const [isActive, setIsActive] = useState(true);
  const { width, height } = useWindowSize();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsActive(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!isActive) return null;

  return (
    <ReactConfetti
      width={width}
      height={height}
      recycle={false}
      numberOfPieces={500}
      gravity={0.2}
      colors={['#00C6FB', '#005BEA', '#9B51E0', '#FFD166', '#EF476F']}
    />
  );
}; 