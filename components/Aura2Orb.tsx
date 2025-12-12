
import React, { useEffect, useRef } from 'react';

interface Aura2OrbProps {
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  volume: number;
  isAnalyzing: boolean;
  onClick: () => void;
}

export const Aura2Orb: React.FC<Aura2OrbProps> = ({
  isConnected,
  isSpeaking,
  isListening,
  volume,
  isAnalyzing,
  onClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const draw = () => {
      time += 0.03;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Outer glow ring
      if (isConnected) {
        const glowRadius = 45 + (isSpeaking ? Math.sin(time * 5) * 5 : 0) + (isListening ? volume * 10 : 0);
        const gradient = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, glowRadius);
        
        if (isSpeaking) {
          gradient.addColorStop(0, 'rgba(167, 139, 250, 0.4)'); // Purple (Speaking)
          gradient.addColorStop(1, 'transparent');
        } else if (isListening && volume > 0.1) {
          gradient.addColorStop(0, 'rgba(52, 211, 153, 0.4)'); // Green (Listening)
          gradient.addColorStop(1, 'transparent');
        } else if (isAnalyzing) {
          gradient.addColorStop(0, 'rgba(251, 191, 36, 0.4)'); // Gold (Analyzing)
          gradient.addColorStop(1, 'transparent');
        } else {
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)'); // Indigo (Idle)
          gradient.addColorStop(1, 'transparent');
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Scanning ring for analyzing
      if (isAnalyzing) {
        ctx.strokeStyle = 'rgba(220, 165, 74, 0.8)'; // Sharper Gold
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Create an open arc that rotates
        const startAngle = time * 3;
        const endAngle = startAngle + Math.PI / 1.5;
        ctx.arc(centerX, centerY, 38, startAngle, endAngle);
        ctx.stroke();
      }

      // Wave rings when speaking
      if (isSpeaking) {
        for (let i = 0; i < 3; i++) {
          const waveRadius = 30 + i * 8 + Math.sin(time * 4 + i * 0.5) * 3;
          ctx.strokeStyle = `rgba(167, 139, 250, ${0.4 - i * 0.1})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Main orb
      const baseRadius = 25;
      const orbRadius = baseRadius + (isListening ? volume * 8 : 0) + (isSpeaking ? Math.sin(time * 5) * 3 : 0);
      
      // Gradient fill
      const orbGradient = ctx.createRadialGradient(
        centerX - 5, centerY - 5, 5,
        centerX, centerY, orbRadius
      );
      
      if (!isConnected) {
        orbGradient.addColorStop(0, '#94a3b8');
        orbGradient.addColorStop(1, '#64748b');
      } else if (isSpeaking) {
        orbGradient.addColorStop(0, '#c4b5fd');
        orbGradient.addColorStop(1, '#8b5cf6');
      } else if (isListening && volume > 0.1) {
        orbGradient.addColorStop(0, '#6ee7b7');
        orbGradient.addColorStop(1, '#10b981');
      } else if (isAnalyzing) {
        orbGradient.addColorStop(0, '#fde047');
        orbGradient.addColorStop(1, '#f59e0b');
      } else {
        orbGradient.addColorStop(0, '#a5b4fc');
        orbGradient.addColorStop(1, '#6366f1');
      }
      
      ctx.fillStyle = orbGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(centerX - 8, centerY - 8, orbRadius * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isConnected, isSpeaking, isListening, volume, isAnalyzing]);

  return (
    <button
      onClick={onClick}
      className="relative group focus:outline-none"
      title={isConnected ? 'Aura 2.0 Active - Click to open panel' : 'Click to activate Aura 2.0'}
    >
      <canvas 
        ref={canvasRef} 
        width={100} 
        height={100} 
        className="w-14 h-14 cursor-pointer transition-transform hover:scale-110 active:scale-95"
      />
      
      {/* Status indicator badge */}
      <div className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-colors duration-300 ${
        !isConnected ? 'bg-gray-400' :
        isSpeaking ? 'bg-purple-500 animate-pulse' :
        isListening ? 'bg-emerald-500' :
        isAnalyzing ? 'bg-amber-500 animate-pulse' :
        'bg-indigo-500'
      }`} />
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-white/10 pointer-events-none transform translate-y-1 group-hover:translate-y-0 duration-200">
        {!isConnected ? 'Activate Aura' : 
         isSpeaking ? 'Aura Speaking' :
         isListening ? 'Listening...' :
         isAnalyzing ? 'Analyzing...' :
         'Aura Ready'}
         {/* Little tooltip arrow */}
         <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900/90"></div>
      </div>
    </button>
  );
};
