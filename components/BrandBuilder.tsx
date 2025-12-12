
import React, { useState, useEffect } from 'react';
import { BrandIdentity } from '../types';
import { generateBrandIdentity, generateBrandLogo } from '../services/geminiService';

interface BrandBuilderProps {
  productImages: string[];
  onComplete: (identity: BrandIdentity) => void;
  onClose: () => void;
  onShowToast: (type: 'success' | 'error', message: string) => void;
}

export const BrandBuilder: React.FC<BrandBuilderProps> = ({ 
  productImages, 
  onComplete, 
  onClose,
  onShowToast 
}) => {
  const [step, setStep] = useState<'analyzing' | 'generating_logo' | 'complete'>('analyzing');
  const [identity, setIdentity] = useState<BrandIdentity | null>(null);
  
  // Start process on mount
  useEffect(() => {
    startProcess();
  }, []);

  const startProcess = async () => {
    try {
      // Step 1: Analyze DNA & Text Identity
      setStep('analyzing');
      const id = await generateBrandIdentity(productImages);
      setIdentity(id);
      
      // Step 2: Generate Logo
      setStep('generating_logo');
      const logo = await generateBrandLogo(id.name, id.archetype, id.story);
      
      const completeIdentity = { ...id, logoImage: logo };
      setIdentity(completeIdentity);
      setStep('complete');
      onComplete(completeIdentity);
      
    } catch (e: any) {
      onShowToast('error', e.message);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-nc-ink/90 backdrop-blur-lg p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl relative animate-scale-in">
        
        {/* Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-20 text-gray-400 hover:text-gray-900 transition-colors"
        >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Loading State */}
        {step !== 'complete' && (
            <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 mb-8 relative">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 font-display">
                    {step === 'analyzing' ? 'Extracting Style DNA...' : 'Crafting Visual Identity...'}
                </h2>
                <p className="text-gray-500 text-sm">AI is defining your brand archetype and aesthetics.</p>
            </div>
        )}

        {/* Result State */}
        {step === 'complete' && identity && (
            <div className="flex flex-col md:flex-row h-full max-h-[80vh]">
                {/* Brand Visuals (Left) */}
                <div className="w-full md:w-1/2 bg-gray-50 p-8 flex flex-col items-center justify-center border-r border-gray-100 text-center">
                    {identity.logoImage && (
                        <div className="w-40 h-40 bg-white shadow-xl rounded-full p-6 mb-8 flex items-center justify-center border border-gray-100">
                            <img src={`data:image/png;base64,${identity.logoImage}`} className="w-full h-full object-contain" alt="Brand Logo" />
                        </div>
                    )}
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-widest mb-2 font-display">{identity.name}</h1>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-6">{identity.tagline}</p>
                    
                    <div className="flex gap-2">
                        {identity.colorPalette.map((col, i) => (
                            <div key={i} className="group relative">
                                <div 
                                    className="w-8 h-8 rounded-full border-2 border-white shadow-md cursor-help"
                                    style={{ backgroundColor: col.hex }}
                                />
                                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    {col.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Brand Strategy (Right) */}
                <div className="w-full md:w-1/2 p-8 overflow-y-auto bg-white custom-scrollbar">
                    <div className="mb-6">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Archetype</span>
                        <h3 className="text-xl font-bold text-indigo-900">{identity.archetype}</h3>
                    </div>

                    <div className="mb-6">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manifesto</span>
                        <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-indigo-500 pl-4 my-2">
                            "{identity.story}"
                        </p>
                    </div>

                    <div className="mb-6">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Audience</span>
                        <p className="text-sm text-gray-800 font-medium">{identity.targetAudience}</p>
                    </div>

                    <div className="mb-8">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Typography</span>
                        <div className="flex flex-col gap-1 mt-1">
                            <span className="text-lg font-serif text-gray-900">{identity.typography.primary} (Primary)</span>
                            <span className="text-sm font-sans text-gray-500">{identity.typography.secondary} (Secondary)</span>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-gray-900 text-white font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
                    >
                        Accept Brand Identity
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
