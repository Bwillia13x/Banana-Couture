
import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  message: string;
}

// Engaging tips to display while waiting
const DESIGN_TIPS = [
  "Did you know? The bias cut was popularized by Madeleine Vionnet in the 1920s.",
  "Tip: Mentioning specific fabric weights improves render realism.",
  "Engineering: Standard seam allowance for woven fabrics is usually 1cm.",
  "Sustainability: Digital sampling reduces textile waste by up to 96%.",
  "Style DNA: Mixing 'Structured' and 'Fluid' genes creates avant-garde silhouettes.",
  "Tip: Use the 'Magic Mirror' to visualize drape on a human form.",
  "History: The zipper was not widely used in high fashion until the 1930s.",
  "Color Theory: Complementary colors create maximum contrast."
];

const LOG_MESSAGES = [
    "Initializing neural pathways...",
    "Loading style embeddings...",
    "Calculating drape physics...",
    "Synthesizing texture maps...",
    "Optimizing geometry...",
    "Applying subsurface scattering...",
    "Finalizing render pass...",
    "Quality check passed."
];

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  // Cycle through tips
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % DESIGN_TIPS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Simulate log stream
  useEffect(() => {
      let step = 0;
      const interval = setInterval(() => {
          if (step < LOG_MESSAGES.length) {
              setLogs(prev => [...prev.slice(-4), `> ${LOG_MESSAGES[step]}`]);
              step++;
          }
      }, 800);
      return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 bg-nc-ink/90 backdrop-blur-md flex flex-col items-center justify-center z-[100] animate-fade-in p-6">
      <div className="bg-[#0F0A0A] border border-white/10 p-1 w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden">
          
          {/* Animated Gradient Border */}
          <div className="absolute inset-0 bg-gradient-to-r from-nc-accent via-pink-500 to-nc-gold opacity-20 animate-spin-slow blur-xl"></div>
          
          <div className="relative bg-[#0F0A0A] rounded-xl p-8 flex flex-col items-center z-10">
            {/* Main Visual Loader */}
            <div className="relative mb-8 mt-2">
                <div className="w-20 h-20 rounded-full border-2 border-white/5 border-t-nc-accent animate-spin"></div>
                <div className="absolute inset-0 border-2 border-white/5 border-b-nc-rose rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-nc-accent to-nc-rose rounded-full animate-pulse blur-md opacity-50"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl animate-bounce">✨</span>
                </div>
            </div>
            
            <h3 className="text-xl font-bold text-white font-display tracking-tight mb-2 text-center">{message}</h3>
            
            {/* Terminal Log */}
            <div className="w-full bg-black/50 rounded-lg p-3 mb-6 font-mono text-[10px] text-green-400/80 h-24 overflow-hidden border border-white/5 flex flex-col justify-end">
                {logs.map((log, i) => (
                    <div key={i} className="animate-slide-up">{log}</div>
                ))}
                <div className="animate-pulse">_</div>
            </div>

            {/* Dynamic Tip Section */}
            <div className="bg-white/5 rounded-xl p-4 w-full border border-white/5 text-center">
                <p className="text-[9px] text-white/40 uppercase font-bold tracking-widest mb-2">Designer Insight</p>
                <p key={tipIndex} className="text-xs text-white/80 italic leading-relaxed animate-fade-in">
                "{DESIGN_TIPS[tipIndex]}"
                </p>
            </div>
            
            <div className="flex items-center gap-2 mt-6 opacity-30">
                <span className="w-1 h-1 bg-white rounded-full"></span>
                <span className="text-[9px] text-white uppercase tracking-widest">Powered by Gemini 3.0</span>
                <span className="w-1 h-1 bg-white rounded-full"></span>
            </div>
          </div>
      </div>
    </div>
  );
};
