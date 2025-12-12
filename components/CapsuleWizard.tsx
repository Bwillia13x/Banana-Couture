import React, { useState } from 'react';
import { generateCapsuleCollection } from '../services/geminiService';
import { CapsuleCollectionResult, CapsuleGarment } from '../types';

interface CapsuleWizardProps {
  onClose: () => void;
  onLoadLook: (garment: CapsuleGarment) => void;
}

type WizardStep = 'config' | 'generating' | 'results';

export const CapsuleWizard: React.FC<CapsuleWizardProps> = ({ onClose, onLoadLook }) => {
  const [step, setStep] = useState<WizardStep>('config');
  const [loadingMsg, setLoadingMsg] = useState('Initializing...');
  const [result, setResult] = useState<CapsuleCollectionResult | null>(null);

  // Form State
  const [brandPersona, setBrandPersona] = useState('');
  const [vibe, setVibe] = useState('');
  const [season, setSeason] = useState('SS25');
  const [garmentCount, setGarmentCount] = useState(3);
  
  const handleGenerate = async () => {
    setStep('generating');
    try {
        const res = await generateCapsuleCollection({
            brandPersona,
            vibe: `${vibe} for ${season}`,
            budgetBand: "Luxury",
            sustainabilityFocus: "High",
            garmentCount
        }, (msg) => setLoadingMsg(msg));
        setResult(res);
        setStep('results');
    } catch (e: any) {
        alert("Failed: " + e.message);
        setStep('config');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-nc-ink/90 backdrop-blur-lg">
      <div className="w-full max-w-5xl h-[85vh] bg-[#0F0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-fade-in-up">
        
        {/* Header */}
        <div className="h-16 border-b border-white/10 flex justify-between items-center px-8 bg-white/5">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">AI</div>
                <h2 className="text-white font-bold tracking-tight">Collection Generator</h2>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
            
            {/* BACKGROUND DECORATION */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px]"></div>
            </div>

            {/* STEP 1: CONFIG */}
            {step === 'config' && (
                <div className="h-full flex flex-col items-center justify-center p-8 relative z-10">
                    <div className="max-w-xl w-full space-y-8">
                        <div className="text-center">
                            <h3 className="text-3xl font-black text-white mb-2 font-display">Define Your Capsule</h3>
                            <p className="text-white/60">Orchestrate a cohesive line of {garmentCount} looks driven by a unified creative direction.</p>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-2">Brand Persona</label>
                                <input 
                                    type="text" 
                                    value={brandPersona}
                                    onChange={e => setBrandPersona(e.target.value)}
                                    placeholder="e.g. 'Avant-garde minimalist with brutalist influences'"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-2">Creative Direction / Vibe</label>
                                <textarea 
                                    value={vibe}
                                    onChange={e => setVibe(e.target.value)}
                                    placeholder="e.g. 'Cybernetic flora, neon bioluminescence, structured organza, Tokyo night rain'"
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-2">Season</label>
                                    <select 
                                        value={season} 
                                        onChange={e => setSeason(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="SS25">Spring/Summer '25</option>
                                        <option value="FW25">Fall/Winter '25</option>
                                        <option value="Resort">Resort</option>
                                        <option value="Couture">Haute Couture</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-2">Looks</label>
                                    <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
                                        {[3, 4, 5].map(n => (
                                            <button 
                                                key={n}
                                                onClick={() => setGarmentCount(n)}
                                                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-colors ${garmentCount === n ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={!brandPersona || !vibe}
                            className="w-full bg-white text-black font-bold text-lg py-4 rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            Generate Collection
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2: GENERATING */}
            {step === 'generating' && (
                <div className="h-full flex flex-col items-center justify-center p-8 relative z-10">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl">✨</span>
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 animate-pulse">{loadingMsg}</h3>
                    <p className="text-white/50 text-sm">Orchestrating AI agents (Designer, Pattern Maker, Engineer)...</p>
                </div>
            )}

            {/* STEP 3: RESULTS */}
            {step === 'results' && result && (
                <div className="h-full overflow-y-auto custom-scrollbar p-8 relative z-10">
                    <div className="text-center mb-12">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-[0.3em] mb-2 block">{result.theme}</span>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight font-display">"{result.story}"</h2>
                        {result.sources && result.sources.length > 0 && (
                             <div className="flex flex-wrap justify-center gap-2 mb-4">
                                {result.sources.slice(0, 3).map((s, i) => (
                                    <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-white/60 border border-white/5 truncate max-w-[200px]">
                                        Ref: {s.title}
                                    </a>
                                ))}
                             </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                        {result.garments.map((garment, idx) => (
                            <div key={garment.id} className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20">
                                {/* Image Area */}
                                <div className="aspect-[3/4] relative bg-black">
                                    {garment.conceptImage ? (
                                        <img src={`data:image/png;base64,${garment.conceptImage}`} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt={garment.name} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/30">No Image</div>
                                    )}
                                    
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-black/50 backdrop-blur border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                            Look 0{idx + 1}
                                        </span>
                                    </div>

                                    {/* Quick Actions Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <button 
                                            onClick={() => { onLoadLook(garment); onClose(); }}
                                            className="bg-white text-black font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg hover:scale-105 transition-transform shadow-xl"
                                        >
                                            Edit in Studio
                                        </button>
                                    </div>
                                </div>

                                {/* Info Area */}
                                <div className="p-6">
                                    <h4 className="text-white font-bold text-lg mb-2 font-display">{garment.name}</h4>
                                    <p className="text-white/60 text-xs leading-relaxed line-clamp-3 mb-4">{garment.description}</p>
                                    
                                    <div className="flex gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${garment.cadImage ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/30 border-white/10'}`}>
                                            {garment.cadImage ? 'CAD Ready' : 'No CAD'}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${garment.bomMarkdown ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-white/30 border-white/10'}`}>
                                            {garment.bomMarkdown ? 'BOM Included' : 'No BOM'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};