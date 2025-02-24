'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
}

export const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  // Colors for particles - brand-appropriate colors
  const colors = ['#00C6FB', '#005BEA', '#9B51E0', '#FFD166', '#EF476F'];

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const { width, height } = canvasRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width, height });
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        
        // Reinitialize particles when resizing
        initParticles();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Initialize particles
  const initParticles = () => {
    if (!canvasRef.current) return;

    const { width, height } = canvasRef.current;
    const particles: Particle[] = [];
    
    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 5 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.5 + 0.1
      });
    }
    
    particlesRef.current = particles;
  };

  // Animation loop
  const animate = (time: number) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    particlesRef.current.forEach((particle, index) => {
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // Bounce off edges
      if (particle.x > canvas.width || particle.x < 0) {
        particle.speedX = -particle.speedX;
      }
      
      if (particle.y > canvas.height || particle.y < 0) {
        particle.speedY = -particle.speedY;
      }
      
      // Draw particle
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Connect nearby particles with lines
      for (let j = index + 1; j < particlesRef.current.length; j++) {
        const p2 = particlesRef.current[j];
        const dx = particle.x - p2.x;
        const dy = particle.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          ctx.beginPath();
          ctx.strokeStyle = particle.color;
          ctx.globalAlpha = 0.2 * (1 - distance / 100);
          ctx.lineWidth = 0.5;
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    });
    
    // Continue animation
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  // Start animation
  useEffect(() => {
    initParticles();
    requestRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [dimensions]);

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0"
      />
      
      {/* Add floating gradient orbs for depth */}
      <motion.div 
        className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl"
        animate={{
          x: [0, 100, 50, 200, 0],
          y: [0, 50, 100, 50, 0],
          scale: [1, 1.1, 1, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        style={{ top: '20%', left: '10%' }}
      />
      
      <motion.div 
        className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-pink-500/10 to-yellow-500/10 blur-xl"
        animate={{
          x: [0, -100, -50, -150, 0],
          y: [0, 100, 50, 150, 0],
          scale: [1, 0.9, 1.1, 1, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        style={{ top: '40%', right: '15%' }}
      />
      
      <motion.div 
        className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-teal-500/15 to-blue-500/15 blur-xl"
        animate={{
          x: [0, 150, 100, 50, 0],
          y: [0, -50, -100, -50, 0],
          scale: [1, 1.2, 0.8, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        style={{ bottom: '15%', left: '25%' }}
      />
    </div>
  );
}; 