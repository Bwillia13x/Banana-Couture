
import React, { useState, useEffect } from 'react';
import { generateSeamlessPattern, applyTextureToDesign } from '../services/geminiService';

interface PatternGeneratorProps {
  onApplyTexture: (patternBase64: string) => Promise<void>;
  autoPrompt?: string | null;
  onFeedback?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const PatternGenerator: React.FC<PatternGeneratorProps> = ({ onApplyTexture, autoPrompt, onFeedback }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Auto-generate if prompt provided from external source (e.g. Aura)
  useEffect(() => {
      if (autoPrompt) {
          setPrompt(autoPrompt);
          handleGenerate(autoPrompt);
      }
  }, [autoPrompt]);

  const handleGenerate = async (textToUse?: string) => {
    const text = textToUse || prompt;
    if (!text.trim()) return;
    
    setIsGenerating(true);
    try {
      const base64 = await generateSeamlessPattern(text);
      setPatterns(prev => [base64, ...prev]);
      setSelectedPattern(base64);
      setStatus(`Pattern added to swatch board: "${text}". Tap preview to apply.`);
      onFeedback?.('success', `Pattern added for "${text}"`);
    } catch (e: any) {
      console.error(e);
      setStatus('Pattern generation failed.');
      onFeedback?.('error', "Failed to generate pattern");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!selectedPattern) return;
    setIsApplying(true);
    try {
      await onApplyTexture(selectedPattern);
      setStatus('Pattern applied to design.');
      onFeedback?.('success', 'Pattern applied to design');
    } catch (e: any) {
      console.error(e);
      setStatus('Failed to apply pattern.');
      onFeedback?.('error', 'Failed to apply pattern');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Pattern Lab</h4>
      </div>

      <div className="flex gap-2">
        <input 
          type="text" 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder="e.g. Neon floral glitch..."
          className="flex-1 text-xs bg-gray-50 border-transparent focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/10 rounded-lg p-2.5 outline-none transition-all shadow-sm"
        />
        <button 
          onClick={() => handleGenerate()}
          disabled={isGenerating || !prompt.trim()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md shadow-indigo-500/20"
        >
          {isGenerating ? '...' : 'Go'}
        </button>
      </div>

      {status && (
        <p className="text-[11px] text-gray-600 font-medium">{status}</p>
      )}

      {patterns.length > 0 && (
        <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
          {patterns.map((pat, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedPattern(pat)}
              className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all shadow-sm ${selectedPattern === pat ? 'border-indigo-600 ring-2 ring-indigo-100 scale-105' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <img src={`data:image/png;base64,${pat}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {selectedPattern && (
        <div className="animate-fade-in pt-1">
           <div className="flex gap-2">
               <button 
                 onClick={handleApply}
                 disabled={isApplying}
                 className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-gray-50 hover:text-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
               >
                 {isApplying ? (
                     <div className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                 ) : (
                     <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                        Apply to Design
                     </>
                 )}
               </button>
               <a 
                 href={`data:image/png;base64,${selectedPattern}`} 
                 download={`pattern-${Date.now()}.png`}
                 className="px-3 py-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
                 title="Download Pattern"
               >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
               </a>
           </div>
        </div>
      )}
    </div>
  );
};
