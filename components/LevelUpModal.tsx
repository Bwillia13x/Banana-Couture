
import React, { useEffect } from 'react';

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ level, onClose }) => {
  // Auto close on keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === 'Enter') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in cursor-pointer" onClick={onClose}>
      <div className="relative flex flex-col items-center justify-center text-center p-12 w-full max-w-2xl overflow-hidden">
        
        {/* Background Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>
        
        <div className="relative z-10 animate-fade-in-up flex flex-col items-center">
            <span className="text-sm font-bold text-yellow-400 uppercase tracking-[0.3em] mb-4 animate-bounce">Design Mastery Increased</span>
            
            <h2 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 via-white to-purple-300 mb-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] italic tracking-tighter transform -skew-x-6">
                LEVEL UP!
            </h2>
            
            <div className="relative mb-10 group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-1000"></div>
                <div className="w-48 h-48 bg-[#0F131E] rounded-3xl flex items-center justify-center relative z-10 border border-white/20 shadow-2xl rotate-3 group-hover:rotate-6 transition-transform duration-500">
                    <span className="text-9xl font-black text-white">{level}</span>
                    
                    {/* Decorative corners */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/30"></div>
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/30"></div>
                </div>
            </div>

            <p className="text-2xl text-slate-300 font-light mb-8 max-w-md">
                Congratulations! You've unlocked new prestige as a <span className="text-white font-bold">Level {level} Designer</span>.
            </p>
            
            <div className="flex gap-4">
                 <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-xs text-slate-400">
                     <span className="block text-white font-bold text-lg">+500</span>
                     Max Token Limit
                 </div>
                 <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-xs text-slate-400">
                     <span className="block text-white font-bold text-lg">Unlocks</span>
                     Pro Materials
                 </div>
            </div>

            <div className="mt-12 text-sm text-slate-500 animate-pulse">
                Click anywhere to continue
            </div>
        </div>
      </div>
    </div>
  );
};
