
import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Progress bar animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Non-linear progress for realism
        return prev + Math.random() * 15;
      });
    }, 150);

    // Exit transition
    const exitTimer = setTimeout(() => {
      setOpacity(0);
    }, 2200);

    // Unmount trigger
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 2700);

    return () => {
      clearInterval(interval);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-[#0F0505] flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out"
      style={{ opacity }}
    >
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Container with Glow */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-nc-accent/20 blur-[60px] rounded-full animate-pulse"></div>
          <Logo className="w-24 h-24 relative z-10 drop-shadow-2xl animate-[scaleIn_1s_ease-out]" />
        </div>

        {/* Text */}
        <h1 className="text-4xl font-display text-white font-bold tracking-tight mb-2 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.3s_forwards]">
          Banana<span className="font-light text-nc-accent">Couture</span>
        </h1>
        <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-12 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.5s_forwards]">
          AI Native Atelier
        </p>

        {/* Loading Bar */}
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
          <div 
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-nc-accent to-nc-rose transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, progress)}%` }}
          ></div>
        </div>
        
        <p className="text-nc-ink-subtle text-[9px] mt-4 font-mono animate-pulse">
          {progress < 30 ? 'Initializing Core...' : 
           progress < 60 ? 'Loading Models...' : 
           progress < 90 ? 'Connecting to Gemini...' : 
           'Ready'}
        </p>
      </div>

      {/* Decorative Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none"></div>
    </div>
  );
};
