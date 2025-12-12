
import React, { useState } from 'react';
import { Product } from '../types';
import { generateOutfit } from '../services/geminiService';
import { LazyImage } from './LazyImage';

interface StylingRoomProps {
  inventory: Product[];
  onClose: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const VIBES = [
    "Paris Fashion Week Street Style", 
    "Cyberpunk Utility", 
    "Cozy Minimalist", 
    "High-End Editorial", 
    "Summer Resort",
    "Underground Club"
];

export const StylingRoom: React.FC<StylingRoomProps> = ({ inventory, onClose, onShowToast }) => {
  const [selectedItems, setSelectedItems] = useState<Product[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedVibe, setSelectedVibe] = useState(VIBES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const toggleItem = (item: Product) => {
      if (selectedItems.find(i => i.id === item.id)) {
          setSelectedItems(prev => prev.filter(i => i.id !== item.id));
      } else {
          if (selectedItems.length >= 4) {
              onShowToast('info', 'Max 4 items allowed per outfit');
              return;
          }
          setSelectedItems(prev => [...prev, item]);
      }
  };

  const handleGenerate = async () => {
      if (selectedItems.length === 0) {
          onShowToast('error', 'Select at least 1 item');
          return;
      }
      
      setIsGenerating(true);
      const prompt = `${selectedVibe}. ${customPrompt}`;
      
      try {
          const image = await generateOutfit(selectedItems, prompt);
          setResultImage(image);
          onShowToast('success', 'Outfit generated!');
      } catch (e: any) {
          onShowToast('error', e.message);
      } finally {
          setIsGenerating(false);
      }
  };

  const handleDownload = () => {
      if (!resultImage) return;
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${resultImage}`;
      link.download = `outfit-${Date.now()}.png`;
      link.click();
  };

  return (
    <div className="fixed inset-0 z-[200] flex bg-nc-bg text-nc-ink animate-fade-in">
        
        {/* Left Panel: Result & Controls */}
        <div className="flex-1 flex flex-col p-6 relative bg-gradient-to-br from-nc-bg-soft to-white">
            <button 
                onClick={onClose} 
                className="absolute top-6 left-6 z-20 p-2 bg-white/50 hover:bg-white rounded-full transition-all shadow-sm"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex-1 flex items-center justify-center relative">
                {resultImage ? (
                    <div className="relative w-full max-w-lg aspect-[3/4] shadow-2xl rounded-lg overflow-hidden group">
                        <img src={`data:image/png;base64,${resultImage}`} className="w-full h-full object-cover" alt="Outfit" />
                        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setResultImage(null)} className="px-4 py-2 bg-white rounded-full text-xs font-bold uppercase hover:bg-gray-100 shadow-lg">Back</button>
                            <button onClick={handleDownload} className="px-4 py-2 bg-nc-ink text-white rounded-full text-xs font-bold uppercase hover:bg-nc-ink-soft shadow-lg">Download</button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center opacity-40 max-w-md">
                        <div className="w-32 h-32 border-4 border-dashed border-nc-border-strong rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-nc-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <h2 className="text-2xl font-display font-bold mb-2">AI Stylist</h2>
                        <p className="text-sm">Select items from your wardrobe to generate a complete look.</p>
                    </div>
                )}
                
                {isGenerating && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                        <div className="w-16 h-16 border-4 border-nc-accent/30 border-t-nc-accent rounded-full animate-spin mb-4"></div>
                        <span className="text-nc-ink font-bold tracking-widest animate-pulse font-display">Styling Look...</span>
                    </div>
                )}
            </div>

            {/* Prompt Controls */}
            <div className="mt-6 bg-white p-4 rounded-xl shadow-lg border border-nc-border-subtle max-w-2xl mx-auto w-full">
                <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-nc-ink-subtle block mb-2">Vibe / Context</label>
                        <select 
                            value={selectedVibe}
                            onChange={(e) => setSelectedVibe(e.target.value)}
                            className="w-full p-2 bg-nc-bg-soft rounded-lg text-sm border-none focus:ring-1 focus:ring-nc-accent outline-none"
                        >
                            {VIBES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div className="flex-[2]">
                        <label className="text-[10px] uppercase font-bold text-nc-ink-subtle block mb-2">Additional Details</label>
                        <input 
                            type="text" 
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="e.g. dramatic lighting, futuristic accessories..."
                            className="w-full p-2 bg-nc-bg-soft rounded-lg text-sm border-none focus:ring-1 focus:ring-nc-accent outline-none"
                        />
                    </div>
                </div>
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || selectedItems.length === 0}
                    className="w-full py-3 bg-nc-ink text-white font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-nc-ink-soft transition-all disabled:opacity-50 shadow-md"
                >
                    Generate Outfit ({selectedItems.length} items)
                </button>
            </div>
        </div>

        {/* Right Panel: Inventory */}
        <div className="w-80 bg-white border-l border-nc-border-subtle flex flex-col">
            <div className="p-6 border-b border-nc-border-subtle">
                <h3 className="font-bold text-lg font-display">Wardrobe</h3>
                <p className="text-xs text-nc-ink-subtle">{inventory.length} items available</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {inventory.map(item => {
                    const isSelected = selectedItems.find(i => i.id === item.id);
                    return (
                        <div 
                            key={item.id}
                            onClick={() => toggleItem(item)}
                            className={`flex gap-3 p-2 rounded-lg cursor-pointer transition-all border ${
                                isSelected ? 'bg-nc-accent-soft border-nc-accent' : 'bg-nc-bg-soft border-transparent hover:border-nc-border-strong'
                            }`}
                        >
                            <div className="w-16 h-16 bg-white rounded-md overflow-hidden flex-shrink-0">
                                <LazyImage 
                                    src={item.imageUrl.startsWith('http') ? item.imageUrl : `data:image/png;base64,${item.imageUrl}`} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h4 className="text-xs font-bold text-nc-ink truncate">{item.name}</h4>
                                <p className="text-[10px] text-nc-ink-subtle truncate">{item.creator}</p>
                            </div>
                            <div className="flex items-center pr-2">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-nc-accent bg-nc-accent text-white' : 'border-nc-border-strong'}`}>
                                    {isSelected && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};
