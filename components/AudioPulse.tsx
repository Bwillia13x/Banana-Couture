
import React, { useEffect, useRef } from 'react';

interface AudioPulseProps {
  active: boolean;
  volume: number; // 0 to 1
  isSpeaking: boolean;
}

export const AudioPulse: React.FC<AudioPulseProps> = ({ active, volume, isSpeaking }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let time = 0;

    const draw = () => {
      time += 0.1;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      
      ctx.clearRect(0, 0, width, height);
      
      // Dynamic color based on state
      // Speaking (AI) -> Cyan/Purple
      // Listening (User) -> Green/Emerald if volume high, else Indigo
      let color = '';
      let baseRadius = 20;
      
      if (isSpeaking) {
          color = `rgba(167, 139, 250, ${0.5 + Math.sin(time) * 0.2})`; // Purple pulse
          baseRadius = 25 + Math.sin(time * 5) * 5;
      } else {
          // React to mic volume
          const volBoost = Math.max(0.1, volume) * 30;
          baseRadius = 20 + volBoost;
          color = volume > 0.1 ? 'rgba(52, 211, 153, 0.6)' : 'rgba(99, 102, 241, 0.4)'; // Emerald active, Indigo idle
      }

      // Draw glowing orb
      const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.2, centerX, centerY, baseRadius * 2);
      gradient.addColorStop(0, isSpeaking ? '#a78bfa' : (volume > 0.1 ? '#34d399' : '#6366f1'));
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = isSpeaking ? '#fff' : (volume > 0.1 ? '#ecfdf5' : '#e0e7ff');
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      animationId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => cancelAnimationFrame(animationId);
  }, [active, volume, isSpeaking]);

  if (!active) return null;

  return (
    <canvas 
        ref={canvasRef} 
        width={100} 
        height={100} 
        className="w-12 h-12 pointer-events-none"
    />
  );
};
