
import React, { useState } from 'react';
import { generateCampaignImage } from '../services/geminiService';

interface CampaignStudioProps {
  isOpen: boolean;
  onClose: () => void;
  garmentImage: string | null;
  onSetCampaignImage: (img: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const MODELS = [
  { id: 'classic', label: 'Classic Runway Model', desc: 'Tall, elegant, neutral expression' },
  { id: 'diverse', label: 'Diverse Street Cast', desc: 'Authentic, urban, diverse backgrounds' },
  { id: 'cyber', label: 'Digital Avatar', desc: 'Futuristic, perfect skin, glowing accents' },
  { id: 'minimal', label: 'Minimalist Muse', desc: 'Clean lines, natural makeup, sophisticated' },
  { id: 'editorial', label: 'High Fashion Editorial', desc: 'Dramatic poses, avant-garde styling' }
];

const LOCATIONS = [
  { id: 'studio', label: 'White Cube Studio', desc: 'Clean, infinite white background, soft lighting' },
  { id: 'tokyo', label: 'Neon Tokyo Night', desc: 'Rain-slicked streets, neon signs, cyberpunk vibe' },
  { id: 'nature', label: 'Icelandic Landscape', desc: 'Black sand beach, moody sky, dramatic nature' },
  { id: 'urban', label: 'Concrete Brutalist', desc: 'Raw concrete architecture, sharp shadows' },
  { id: 'luxury', label: 'Parisian Apartment', desc: 'Ornate moldings, wooden floors, soft morning light' }
];

export const CampaignStudio: React.FC<CampaignStudioProps> = ({ 
  isOpen, 
  onClose, 
  garmentImage, 
  onSetCampaignImage,
  onShowToast 
}) => {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!garmentImage) return;
    
    setIsGenerating(true);
    const prompt = `A professional fashion campaign shot.
    Model: ${selectedModel.desc}.
    Location: ${selectedLocation.desc}.
    Vibe: High-end, cinematic, 4k resolution.`;
    
    try {
      const result = await generateCampaignImage(garmentImage, prompt);
      setGeneratedImages(prev => [result, ...prev]);
      setActiveImage(result);
      onShowToast('success', 'Campaign shot generated!');
    } catch (e: any) {
      onShowToast('error', e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!activeImage) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${activeImage}`;
    link.download = `campaign-${Date.now()}.png`;
    link.click();
  };

  const handleUseAsCover = () => {
    if (activeImage) {
      onSetCampaignImage(activeImage);
      onClose();
      onShowToast('success', 'Set as primary campaign image');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-6xl h-[85vh] bg-[#0F0F0F] border border-white/10 rounded-2xl flex overflow-hidden shadow-2xl">
        
        {/* Left: Configuration */}
        <div className="w-80 bg-[#1A1A1A] border-r border-white/10 flex flex-col">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-white font-bold text-xl font-display mb-1">Campaign Studio</h2>
            <p className="text-white/40 text-xs">Create editorial marketing assets</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Model Selection */}
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold block mb-3">Cast Model</label>
              <div className="space-y-2">
                {MODELS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedModel.id === m.id 
                        ? 'bg-white text-black border-white' 
                        : 'bg-transparent text-white/70 border-white/10 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <div className="text-sm font-bold">{m.label}</div>
                    <div className={`text-[10px] ${selectedModel.id === m.id ? 'text-black/60' : 'text-white/40'}`}>{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Location Selection */}
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold block mb-3">Set Location</label>
              <div className="space-y-2">
                {LOCATIONS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLocation(l)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedLocation.id === l.id 
                        ? 'bg-white text-black border-white' 
                        : 'bg-transparent text-white/70 border-white/10 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <div className="text-sm font-bold">{l.label}</div>
                    <div className={`text-[10px] ${selectedLocation.id === l.id ? 'text-black/60' : 'text-white/40'}`}>{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/10">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !garmentImage}
              className="w-full py-4 bg-gradient-to-r from-nc-accent to-fuchsia-600 hover:from-nc-accent-strong hover:to-fuchsia-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Shooting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Shoot Campaign
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Gallery & Preview */}
        <div className="flex-1 bg-[#0a0a0a] flex flex-col relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-white text-white hover:text-black rounded-full transition-colors border border-white/10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {/* Main Preview */}
          <div className="flex-1 flex items-center justify-center p-8 bg-[radial-gradient(circle_at_center,#1a1a1a_0%,#000_100%)]">
            {activeImage ? (
              <img 
                src={`data:image/png;base64,${activeImage}`} 
                alt="Campaign Result" 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm border border-white/5"
              />
            ) : (
              <div className="text-center opacity-30">
                <svg className="w-20 h-20 mx-auto mb-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-white font-light text-lg">No photos generated yet</p>
              </div>
            )}
          </div>

          {/* Bottom Bar: Thumbnails & Actions */}
          <div className="h-32 border-t border-white/10 bg-[#141414] p-4 flex items-center justify-between gap-6">
            <div className="flex gap-3 overflow-x-auto max-w-2xl py-2 custom-scrollbar">
              {generatedImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-nc-accent' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={`data:image/png;base64,${img}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                disabled={!activeImage}
                className="px-6 py-3 rounded-xl border border-white/20 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-colors disabled:opacity-30"
              >
                Download
              </button>
              <button
                onClick={handleUseAsCover}
                disabled={!activeImage}
                className="px-6 py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors disabled:opacity-30 shadow-lg"
              >
                Use as Cover
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
