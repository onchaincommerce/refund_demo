import { useEffect, useState } from 'react';
import { useWindowSize } from 'react-use';
import ReactConfetti from 'react-confetti';

interface ConfettiProps {
  duration?: number;
}

export const Confetti = ({ duration = 5000 }: ConfettiProps) => {
  const [isActive, setIsActive] = useState(true);
  const { width, height } = useWindowSize();
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    // Create an image element for the logo
    const img = new Image();
    img.src = '/base-logo.png';
    img.onload = () => {
      setLogoImage(img);
    };

    const timer = setTimeout(() => {
      setIsActive(false);
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [duration]);

  if (!isActive) return null;

  return (
    <ReactConfetti
      width={width}
      height={height}
      recycle={false}
      numberOfPieces={200}
      gravity={0.2}
      colors={['#00C6FB', '#005BEA', '#9B51E0', '#FFD166', '#EF476F']}
      confettiSource={{
        x: width / 2,
        y: height / 3,
        w: 0,
        h: 0
      }}
      drawShape={ctx => {
        if (logoImage) {
          // Scale the logo to be an appropriate size for confetti
          const size = 30;
          ctx.drawImage(logoImage, -size/2, -size/2, size, size);
        } else {
          // Fallback to a circle if image isn't loaded
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, 2 * Math.PI);
          ctx.fill();
        }
      }}
    />
  );
}; 