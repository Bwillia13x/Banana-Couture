
import React, { useEffect } from 'react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleReset = () => {
    if (window.confirm("⚠️ Reset Demo Data?\n\nThis will clear all generated designs, drafts, and profile stats. The app will reload.")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#0F0A0A] rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-50"></div>
        
        <div className="relative z-10 p-8 md:p-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white font-display tracking-tight mb-2">
                Banana<span className="text-nc-accent font-light">Couture</span>
              </h2>
              <p className="text-sm text-white/50 uppercase tracking-widest font-bold">Hackathon Submission • 2025</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <p className="text-white/80 leading-relaxed mb-8">
            The world's first comprehensive Generative AI Fashion Atelier. Built to empower designers by collapsing the gap between concept and manufacturing.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-nc-accent"></span>
                Google Gemini Stack
              </h3>
              <ul className="space-y-3">
                <li className="flex justify-between items-center text-xs text-white/70">
                  <span>Logic & Reasoning</span>
                  <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white">gemini-3-pro</span>
                </li>
                <li className="flex justify-between items-center text-xs text-white/70">
                  <span>Visual Generation</span>
                  <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white">gemini-3-image</span>
                </li>
                <li className="flex justify-between items-center text-xs text-white/70">
                  <span>Video Production</span>
                  <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white">veo-3.1</span>
                </li>
                <li className="flex justify-between items-center text-xs text-white/70">
                  <span>Voice & Vision (Aura)</span>
                  <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white">gemini-live-2.0</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-nc-emerald"></span>
                Key Features
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Live Co-Design', 'FashionGPT', 'Veo Runway', 'Search Grounding', 'Maps Sourcing', 'DNA Splicer', 'Cost Analysis'].map(tag => (
                  <span key={tag} className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded text-white/60">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-white/10 pt-6">
            <div className="text-[10px] text-white/40 uppercase tracking-widest">
              <span>Built with React + Vite + Tailwind</span>
            </div>
            
            <button 
                onClick={handleReset}
                className="text-[10px] font-bold text-nc-rose hover:text-red-400 uppercase tracking-wider transition-colors flex items-center gap-2"
            >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Reset Demo Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
