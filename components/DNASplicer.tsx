import React, { useState, useEffect } from 'react';
import { 
  DesignDNA, 
  SpliceConfig, 
  SpliceResult,
  extractDesignDNA, 
  spliceDesignDNA,
  generateDNAVisualization,
  getQuickDNASummary
} from '../services/designDNAService';

interface DNASplicerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadResult: (image: string, dna: DesignDNA) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
  initialImage?: string | null; // Optional starting image
}

type SplicerStep = 'select-parents' | 'configure-genes' | 'preview' | 'result';

export const DNASplicer: React.FC<DNASplicerProps> = ({
  isOpen,
  onClose,
  onLoadResult,
  onShowToast,
  initialImage
}) => {
  const [step, setStep] = useState<SplicerStep>('select-parents');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Parent DNAs
  const [parentA, setParentA] = useState<{ image: string; dna: DesignDNA | null; visualization: string | null }>({
    image: '', dna: null, visualization: null
  });
  const [parentB, setParentB] = useState<{ image: string; dna: DesignDNA | null; visualization: string | null }>({
    image: '', dna: null, visualization: null
  });
  
  // Gene selection
  const [geneSelection, setGeneSelection] = useState<SpliceConfig['geneSelection']>({
    silhouette: 'A',
    colorway: 'B',
    texture: 'blend',
    construction: 'A',
    aesthetic: 'blend'
  });
  
  // Mutation parameters
  const [mutationStrength, setMutationStrength] = useState(0.3);
  const [creativityBias, setCreativityBias] = useState(0.5);
  const [targetAesthetic, setTargetAesthetic] = useState('');
  
  // Result
  const [spliceResult, setSpliceResult] = useState<SpliceResult | null>(null);

  // Initialize with initial image if provided
  useEffect(() => {
    if (initialImage && !parentA.image) {
      handleImageUpload('A', initialImage);
    }
  }, [initialImage]);

  const handleImageUpload = async (parent: 'A' | 'B', imageBase64: string) => {
    setIsLoading(true);
    setLoadingMessage(`Extracting DNA from Parent ${parent}...`);
    
    try {
      const dna = await extractDesignDNA(imageBase64, `parent-${parent}`);
      
      setLoadingMessage(`Generating DNA visualization...`);
      const visualization = await generateDNAVisualization(dna);
      
      if (parent === 'A') {
        setParentA({ image: imageBase64, dna, visualization });
      } else {
        setParentB({ image: imageBase64, dna, visualization });
      }
      
      onShowToast('success', `Parent ${parent} DNA extracted successfully`);
    } catch (e: any) {
      onShowToast('error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (parent: 'A' | 'B') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      handleImageUpload(parent, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSplice = async () => {
    if (!parentA.dna || !parentB.dna) {
      onShowToast('error', 'Both parent DNAs are required');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Splicing genetic material...');
    
    try {
      const config: SpliceConfig = {
        parentA: parentA.dna,
        parentB: parentB.dna,
        geneSelection,
        mutationStrength,
        creativityBias,
        targetAesthetic: targetAesthetic || undefined,
        avoidElements: []
      };
      
      const result = await spliceDesignDNA(config);
      setSpliceResult(result);
      setStep('result');
      
      onShowToast('success', 'DNA splice successful!');
    } catch (e: any) {
      onShowToast('error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadToStudio = () => {
    if (spliceResult) {
      onLoadResult(spliceResult.conceptImage, spliceResult.childDNA);
      onClose();
    }
  };

  const renderGeneSelector = (
    gene: keyof SpliceConfig['geneSelection'], 
    labelA: string, 
    labelB: string
  ) => (
    <div className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg">
      <span className="text-xs text-slate-400 w-24 uppercase tracking-wider font-bold">{gene}</span>
      <div className="flex-1 flex gap-1">
        <button
          onClick={() => setGeneSelection(prev => ({ ...prev, [gene]: 'A' }))}
          className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${
            geneSelection[gene] === 'A' 
              ? 'bg-violet-600 text-white' 
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          {labelA}
        </button>
        <button
          onClick={() => setGeneSelection(prev => ({ ...prev, [gene]: 'blend' }))}
          className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${
            geneSelection[gene] === 'blend' 
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white' 
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          BLEND
        </button>
        <button
          onClick={() => setGeneSelection(prev => ({ ...prev, [gene]: 'B' }))}
          className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${
            geneSelection[gene] === 'B' 
              ? 'bg-fuchsia-600 text-white' 
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          {labelB}
        </button>
      </div>
    </div>
  );

  const renderDNACard = (
    parent: 'A' | 'B',
    data: typeof parentA,
    color: string
  ) => {
    const summary = data.dna ? getQuickDNASummary(data.dna) : null;
    
    return (
      <div className={`flex-1 bg-slate-800/50 rounded-xl border-2 ${
        parent === 'A' ? 'border-violet-500/30' : 'border-fuchsia-500/30'
      } p-4 transition-all hover:border-opacity-60`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm ${
            parent === 'A' ? 'bg-violet-600' : 'bg-fuchsia-600'
          }`}>
            {parent}
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Parent {parent}</h4>
            <p className="text-slate-500 text-[10px]">{data.dna?.overallStyle || 'No DNA loaded'}</p>
          </div>
        </div>
        
        {data.image ? (
          <div className="space-y-3">
            {/* Image Preview */}
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-slate-900">
              <img 
                src={`data:image/png;base64,${data.image}`} 
                alt={`Parent ${parent}`}
                className="w-full h-full object-cover"
              />
              {/* DNA Visualization Overlay */}
              {data.visualization && (
                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <img 
                    src={`data:image/png;base64,${data.visualization}`}
                    alt="DNA Visualization"
                    className="w-3/4 h-3/4 object-contain"
                  />
                </div>
              )}
            </div>
            
            {/* DNA Summary */}
            {summary && (
              <div className="space-y-2">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Dominant Traits</div>
                <div className="flex flex-wrap gap-1">
                  {summary.dominantTraits.map((trait, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[9px] rounded-full">
                      {trait}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-1 mt-2">
                  <div className="text-center p-1 bg-slate-900 rounded">
                    <div className="text-[9px] text-slate-500">Formal</div>
                    <div className="text-xs font-bold text-white">{summary.styleScore.formal}%</div>
                  </div>
                  <div className="text-center p-1 bg-slate-900 rounded">
                    <div className="text-[9px] text-slate-500">Experimental</div>
                    <div className="text-xs font-bold text-white">{summary.styleScore.experimental}%</div>
                  </div>
                  <div className="text-center p-1 bg-slate-900 rounded">
                    <div className="text-[9px] text-slate-500">Wearability</div>
                    <div className="text-xs font-bold text-white">{summary.styleScore.wearability}%</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Replace button */}
            <label className="block">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload(parent)}
                className="hidden"
              />
              <span className="block text-center py-1.5 text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer transition-colors">
                Replace Image
              </span>
            </label>
          </div>
        ) : (
          <label className="block aspect-[3/4] rounded-lg border-2 border-dashed border-slate-600 hover:border-slate-500 cursor-pointer transition-colors flex flex-col items-center justify-center">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload(parent)}
              className="hidden"
            />
            <svg className="w-10 h-10 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-slate-500">Upload Design</span>
            <span className="text-[10px] text-slate-600 mt-1">or drag & drop</span>
          </label>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/10 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold">DesignDNA Splicer</h2>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest">
                {step === 'select-parents' && 'Step 1: Select Parent Designs'}
                {step === 'configure-genes' && 'Step 2: Configure Gene Selection'}
                {step === 'result' && 'Splice Complete'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
              <div className="relative w-20 h-20 mb-4">
                <div className="absolute inset-0 border-4 border-violet-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-violet-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-transparent border-t-fuchsia-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <p className="text-white font-bold">{loadingMessage}</p>
            </div>
          )}

          {/* Step 1: Select Parents */}
          {(step === 'select-parents' || step === 'configure-genes') && (
            <div className="space-y-6">
              {/* Parent Cards */}
              <div className="flex gap-6">
                {renderDNACard('A', parentA, 'violet')}
                
                {/* Splice Symbol */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <span className="text-white text-xl font-black">×</span>
                  </div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-2">SPLICE</span>
                </div>
                
                {renderDNACard('B', parentB, 'fuchsia')}
              </div>
              
              {/* Gene Configuration (when both parents loaded) */}
              {parentA.dna && parentB.dna && (
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700 animate-fade-in-up">
                  <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Gene Selection
                  </h3>
                  
                  <div className="space-y-2">
                    {renderGeneSelector('silhouette', parentA.dna.silhouette.name, parentB.dna.silhouette.name)}
                    {renderGeneSelector('colorway', parentA.dna.colorway.name, parentB.dna.colorway.name)}
                    {renderGeneSelector('texture', parentA.dna.texture.name, parentB.dna.texture.name)}
                    {renderGeneSelector('construction', parentA.dna.construction.name, parentB.dna.construction.name)}
                    {renderGeneSelector('aesthetic', parentA.dna.aesthetic.name, parentB.dna.aesthetic.name)}
                  </div>
                  
                  {/* Mutation Controls */}
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2">
                        Mutation Strength: {Math.round(mutationStrength * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={mutationStrength}
                        onChange={(e) => setMutationStrength(parseFloat(e.target.value))}
                        className="w-full accent-violet-500"
                      />
                      <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                        <span>Conservative</span>
                        <span>Wild</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2">
                        Creativity Bias: {Math.round(creativityBias * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={creativityBias}
                        onChange={(e) => setCreativityBias(parseFloat(e.target.value))}
                        className="w-full accent-fuchsia-500"
                      />
                      <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                        <span>Wearable</span>
                        <span>Avant-Garde</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Target Aesthetic */}
                  <div className="mt-4">
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2">
                      Target Direction (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 'more streetwear', 'high fashion evening'"
                      value={targetAesthetic}
                      onChange={(e) => setTargetAesthetic(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Result */}
          {step === 'result' && spliceResult && (
            <div className="space-y-6 animate-fade-in">
              {/* Result Header */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 rounded-full mb-4">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white font-bold text-sm">Splice Successful</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">{spliceResult.childDNA.overallStyle}</h3>
                <p className="text-slate-400 text-sm">{spliceResult.childDNA.mood} • {spliceResult.childDNA.era}</p>
              </div>
              
              {/* Result Image & DNA */}
              <div className="flex gap-6">
                {/* Generated Image */}
                <div className="flex-1">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shadow-2xl">
                    <img 
                      src={`data:image/png;base64,${spliceResult.conceptImage}`}
                      alt="Spliced Design"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                {/* Inheritance Report */}
                <div className="flex-1 space-y-4">
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                    <h4 className="text-violet-400 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center text-[10px] text-white">A</div>
                      Inherited from Parent A
                    </h4>
                    <ul className="space-y-1">
                      {spliceResult.inheritanceReport.fromParentA.map((item, i) => (
                        <li key={i} className="text-slate-300 text-xs flex items-center gap-2">
                          <span className="text-violet-500">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl p-4">
                    <h4 className="text-fuchsia-400 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-fuchsia-600 flex items-center justify-center text-[10px] text-white">B</div>
                      Inherited from Parent B
                    </h4>
                    <ul className="space-y-1">
                      {spliceResult.inheritanceReport.fromParentB.map((item, i) => (
                        <li key={i} className="text-slate-300 text-xs flex items-center gap-2">
                          <span className="text-fuchsia-500">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {spliceResult.inheritanceReport.mutations.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                      <h4 className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-3">
                        ⚡ Mutations & Blends
                      </h4>
                      <ul className="space-y-1">
                        {spliceResult.inheritanceReport.mutations.map((item, i) => (
                          <li key={i} className="text-slate-300 text-xs flex items-center gap-2">
                            <span className="text-amber-500">★</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Child DNA Summary */}
                  {(() => {
                    const summary = getQuickDNASummary(spliceResult.childDNA);
                    return (
                      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-3">
                          Child DNA Profile
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-slate-900 rounded-lg">
                            <div className="text-[9px] text-slate-500 uppercase">Formal</div>
                            <div className="text-lg font-black text-white">{summary.styleScore.formal}%</div>
                          </div>
                          <div className="text-center p-2 bg-slate-900 rounded-lg">
                            <div className="text-[9px] text-slate-500 uppercase">Experimental</div>
                            <div className="text-lg font-black text-white">{summary.styleScore.experimental}%</div>
                          </div>
                          <div className="text-center p-2 bg-slate-900 rounded-lg">
                            <div className="text-[9px] text-slate-500 uppercase">Wearability</div>
                            <div className="text-lg font-black text-white">{summary.styleScore.wearability}%</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-between items-center">
          {step !== 'result' ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSplice}
                disabled={!parentA.dna || !parentB.dna || isLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm rounded-xl hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Splice DNA
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setSpliceResult(null);
                  setStep('select-parents');
                }}
                className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Splice Again
              </button>
              <button
                onClick={handleLoadToStudio}
                className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Load to Studio
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};