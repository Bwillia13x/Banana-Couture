
import React, { useState, useEffect, useRef } from 'react';
import { useFashionGPT } from '../hooks/useFashionGPT';
import { generateTechPackData } from '../services/fashionGPTService';
import { DesignDraft, FashionGPTInput, FashionGPTStage } from '../types';

interface FashionGPTModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadToStudio: (draft: DesignDraft, prompt: string) => void;
}

const PRESET_PROMPTS = [
  "Sustainable oversized denim jacket with hidden tech pockets for Gen-Z",
  "Luxury minimalist cashmere coat in camel, architectural silhouette",
  "Streetwear cargo pants with modular pocket system, techwear aesthetic",
  "Elegant midi dress with asymmetric draping for cocktail events",
  "Athleisure hybrid blazer that transitions from gym to office"
];

export const FashionGPTModal: React.FC<FashionGPTModalProps> = ({
  isOpen,
  onClose,
  onLoadToStudio
}) => {
  const {
    isRunning,
    currentStage,
    stages,
    result,
    error,
    run,
    reset,
    overallProgress,
    completedStages,
    totalStages,
    estimatedTimeRemaining
  } = useFashionGPT();

  const [prompt, setPrompt] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [budgetTier, setBudgetTier] = useState<'budget' | 'mid-range' | 'premium' | 'luxury'>('mid-range');
  const [sustainabilityPriority, setSustainabilityPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [productionScale, setProductionScale] = useState<'sample' | 'small-batch' | 'mass-production'>('small-batch');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<'overview' | 'techpack' | 'costing' | 'suppliers'>('overview');
  
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [stages]);

  const handleRun = async () => {
    if (!prompt.trim()) return;
    
    const input: FashionGPTInput = {
      prompt: prompt.trim(),
      targetAudience: targetAudience || undefined,
      budgetTier,
      sustainabilityPriority,
      productionScale
    };
    
    await run(input);
  };

  const handleLoadToStudio = () => {
    if (!result?.output) return;
    
    const draft: DesignDraft = {
      conceptImage: result.output.conceptImage,
      cadImage: result.output.cadImage,
      materials: result.output.bomMarkdown,
      sizingChart: result.output.sizingChart,
      history: [result.output.conceptImage],
      runwayVideoUrl: undefined,
      productionData: result.output // Pass full rich data to Studio
    };
    
    const enhancedPrompt = `${result.output.designBrief.garmentType} - ${result.output.designBrief.style}`;
    onLoadToStudio(draft, enhancedPrompt);
    onClose();
  };

  const handleDownloadTechPack = () => {
    if (!result) return;
    
    const markdown = generateTechPackData(result);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `techpack-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStageIcon = (stage: FashionGPTStage) => {
    if (stage.status === 'completed') return '✓';
    if (stage.status === 'error') return '✕';
    if (stage.status === 'in-progress') return '⟳';
    return '○';
  };

  const getStageColor = (stage: FashionGPTStage) => {
    if (stage.status === 'completed') return 'text-emerald-500';
    if (stage.status === 'error') return 'text-red-500';
    if (stage.status === 'in-progress') return 'text-amber-500 animate-spin';
    return 'text-nc-ink-subtle';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nc-ink/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-nc-bg-elevated rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-nc-accent to-purple-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight font-display">FashionGPT</h2>
                  <p className="text-white/80 text-xs font-medium uppercase tracking-widest">Prompt → Production in Minutes</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => { reset(); onClose(); }}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors backdrop-blur-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Bar (when running) */}
          {isRunning && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2 text-white/90">
                <span className="text-xs font-bold uppercase tracking-wider">{currentStage?.name || 'Starting...'}</span>
                <span className="text-xs font-mono">{completedStages}/{totalStages} • {estimatedTimeRemaining}</span>
              </div>
              <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-grow overflow-hidden flex bg-nc-bg">
          
          {/* Left: Input / Progress */}
          <div className="w-2/5 border-r border-nc-border-subtle p-6 overflow-y-auto bg-nc-bg-elevated">
            
            {!result && !isRunning && (
              <>
                {/* Prompt Input */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-nc-ink-subtle uppercase tracking-wider mb-2">
                    Describe Your Vision
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., A sustainable oversized denim jacket with hidden tech pockets for Gen-Z streetwear..."
                    className="w-full h-32 p-4 bg-nc-bg-soft border border-nc-border-subtle rounded-xl text-base md:text-sm text-nc-ink resize-none focus:ring-2 focus:ring-nc-accent focus:border-transparent transition-all outline-none"
                    disabled={isRunning}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-nc-ink-subtle font-bold">{prompt.length} characters</span>
                  </div>
                </div>

                {/* Preset Prompts */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-nc-ink-subtle uppercase tracking-wider mb-2">
                    Quick Start
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_PROMPTS.slice(0, 3).map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setPrompt(p)}
                        className="px-3 py-1.5 bg-nc-accent-soft text-nc-accent-strong text-[10px] font-bold rounded-full hover:bg-purple-100 transition-colors truncate max-w-[200px] border border-transparent hover:border-nc-accent"
                      >
                        {p.substring(0, 40)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Options Toggle */}
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-xs font-bold text-nc-ink-soft hover:text-nc-ink mb-4 transition-colors"
                >
                  <svg className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Advanced Configuration
                </button>

                {showAdvanced && (
                  <div className="space-y-4 mb-6 animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-nc-ink-subtle uppercase tracking-wider mb-1">
                        Target Audience
                      </label>
                      <input
                        type="text"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        placeholder="E.g., Gen-Z urban professionals"
                        className="w-full p-2.5 bg-nc-bg-soft border border-nc-border-subtle rounded-lg text-base md:text-xs text-nc-ink focus:ring-1 focus:ring-nc-accent outline-none"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-nc-ink-subtle uppercase tracking-wider mb-1">
                          Budget
                        </label>
                        <select
                          value={budgetTier}
                          onChange={(e) => setBudgetTier(e.target.value as any)}
                          className="w-full p-2 bg-nc-bg-soft border border-nc-border-subtle rounded-lg text-base md:text-xs text-nc-ink focus:ring-1 focus:ring-nc-accent outline-none"
                        >
                          <option value="budget">Budget</option>
                          <option value="mid-range">Mid-Range</option>
                          <option value="premium">Premium</option>
                          <option value="luxury">Luxury</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-nc-ink-subtle uppercase tracking-wider mb-1">
                          Eco Priority
                        </label>
                        <select
                          value={sustainabilityPriority}
                          onChange={(e) => setSustainabilityPriority(e.target.value as any)}
                          className="w-full p-2 bg-nc-bg-soft border border-nc-border-subtle rounded-lg text-base md:text-xs text-nc-ink focus:ring-1 focus:ring-nc-accent outline-none"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-nc-ink-subtle uppercase tracking-wider mb-1">
                          Scale
                        </label>
                        <select
                          value={productionScale}
                          onChange={(e) => setProductionScale(e.target.value as any)}
                          className="w-full p-2 bg-nc-bg-soft border border-nc-border-subtle rounded-lg text-base md:text-xs text-nc-ink focus:ring-1 focus:ring-nc-accent outline-none"
                        >
                          <option value="sample">Sample</option>
                          <option value="small-batch">Small Batch</option>
                          <option value="mass-production">Mass Prod.</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Run Button */}
                <button
                  onClick={handleRun}
                  disabled={!prompt.trim() || isRunning}
                  className="w-full py-4 bg-nc-ink text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg hover:bg-nc-ink-soft hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isRunning ? 'Processing...' : 'Generate Production Pack'}
                </button>
              </>
            )}

            {/* Progress Log (when running or complete) */}
            {(isRunning || result) && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-nc-ink-subtle uppercase tracking-wider mb-3">Pipeline Log</h4>
                {stages.map((stage) => (
                  <div 
                    key={stage.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all border ${
                      stage.status === 'in-progress' ? 'bg-amber-50 border-amber-200' :
                      stage.status === 'completed' ? 'bg-emerald-50/30 border-emerald-100' :
                      stage.status === 'error' ? 'bg-red-50 border-red-200' :
                      'bg-nc-bg-soft border-transparent'
                    }`}
                  >
                    <span className={`text-lg ${getStageColor(stage)}`}>
                      {getStageIcon(stage)}
                    </span>
                    <div className="flex-grow">
                      <div className={`text-xs font-bold ${stage.status === 'in-progress' ? 'text-nc-ink' : 'text-nc-ink-soft'}`}>{stage.name}</div>
                      {stage.status === 'error' && (
                        <div className="text-[10px] text-red-500 mt-0.5">{stage.error}</div>
                      )}
                      {stage.endTime && stage.startTime && (
                        <div className="text-[10px] text-nc-ink-subtle mt-0.5 font-mono">
                          {((stage.endTime - stage.startTime) / 1000).toFixed(1)}s
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={logEndRef} />
                
                {result && (
                  <div className="mt-4 pt-4 border-t border-nc-border-subtle">
                    <div className="text-xs text-nc-ink-subtle text-center">
                      Total time: <span className="font-bold text-nc-ink font-mono">{(result.totalDuration / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div className="flex-grow p-6 overflow-y-auto">
            {!result && !isRunning && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                <div className="w-24 h-24 bg-nc-bg-soft rounded-full flex items-center justify-center mb-4 border border-nc-border-subtle">
                  <svg className="w-10 h-10 text-nc-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-nc-ink mb-2">Ready to Create</h3>
                <p className="text-sm text-nc-ink-soft max-w-xs">
                  Enter a design description and FashionGPT will generate a complete production-ready package.
                </p>
              </div>
            )}

            {isRunning && !result && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="relative w-32 h-32 mb-6">
                  <div className="absolute inset-0 border-4 border-nc-border-subtle rounded-full"></div>
                  <div 
                    className="absolute inset-0 border-4 border-nc-accent rounded-full border-t-transparent animate-spin"
                    style={{ animationDuration: '1.5s' }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-nc-accent font-display">{overallProgress}%</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-nc-ink mb-2">{currentStage?.name || 'Initializing...'}</h3>
                <p className="text-sm text-nc-ink-soft">
                  FashionGPT is processing...
                </p>
              </div>
            )}

            {result?.output && (
              <div className="animate-fade-in">
                {/* Result Tabs */}
                <div className="flex gap-2 mb-6">
                  {(['overview', 'techpack', 'costing', 'suppliers'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveResultTab(tab)}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                        activeResultTab === tab 
                          ? 'bg-nc-ink text-white shadow-md' 
                          : 'bg-nc-bg-elevated text-nc-ink-subtle hover:text-nc-ink border border-nc-border-subtle hover:border-nc-border-strong'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Overview Tab */}
                {activeResultTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Concept Image */}
                    <div className="bg-nc-bg-elevated rounded-2xl p-4 shadow-sm border border-nc-border-subtle">
                      <div className="flex gap-4">
                        <div className="w-48 h-48 bg-nc-bg-soft rounded-xl overflow-hidden flex-shrink-0 border border-nc-border-subtle">
                          <img 
                            src={`data:image/png;base64,${result.output.conceptImage}`}
                            alt="Concept"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-grow py-2">
                          <h3 className="text-xl font-bold text-nc-ink mb-2 font-display">
                            {result.output.designBrief.garmentType}
                          </h3>
                          <span className="inline-block px-2.5 py-1 bg-nc-accent-soft text-nc-accent-strong text-[10px] font-bold uppercase tracking-wider rounded-full mb-4">
                            {result.output.designBrief.style}
                          </span>
                          <p className="text-xs text-nc-ink-soft mb-4 leading-relaxed max-w-md">
                            {result.output.designBrief.marketPositioning}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {result.output.designBrief.keyFeatures.map((f, i) => (
                              <span key={i} className="px-2 py-1 bg-nc-bg-soft text-nc-ink-soft text-[10px] font-bold rounded border border-nc-border-subtle">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-nc-bg-elevated rounded-xl p-4 text-center shadow-sm border border-nc-border-subtle">
                        <div className="text-2xl font-black text-nc-emerald font-display">
                          ${result.output.costBreakdown.total.toFixed(0)}
                        </div>
                        <div className="text-[10px] text-nc-ink-subtle uppercase tracking-wider font-bold">COGS</div>
                      </div>
                      <div className="bg-nc-bg-elevated rounded-xl p-4 text-center shadow-sm border border-nc-border-subtle">
                        <div className="text-2xl font-black text-nc-accent font-display">
                          ${result.output.costBreakdown.margin.suggestedRetailPrice.toFixed(0)}
                        </div>
                        <div className="text-[10px] text-nc-ink-subtle uppercase tracking-wider font-bold">Retail</div>
                      </div>
                      <div className="bg-nc-bg-elevated rounded-xl p-4 text-center shadow-sm border border-nc-border-subtle">
                        <div className="text-2xl font-black text-amber-600 font-display">
                          {result.output.manufacturingAnalysis.feasibilityScore}
                        </div>
                        <div className="text-[10px] text-nc-ink-subtle uppercase tracking-wider font-bold">Feasibility</div>
                      </div>
                      <div className="bg-nc-bg-elevated rounded-xl p-4 text-center shadow-sm border border-nc-border-subtle">
                        <div className="text-xl font-black text-nc-ink font-display">
                          {result.output.productionTimeline.totalLeadTime}
                        </div>
                        <div className="text-[10px] text-nc-ink-subtle uppercase tracking-wider font-bold">Lead Time</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tech Pack Tab */}
                {activeResultTab === 'techpack' && (
                  <div className="space-y-4">
                    {result.output.cadImage && (
                      <div className="bg-nc-bg-elevated rounded-xl p-4 shadow-sm border border-nc-border-subtle">
                        <h4 className="text-xs font-bold text-nc-ink-subtle uppercase tracking-widest mb-3">Technical Drawing</h4>
                        <div className="bg-white rounded-lg border border-nc-border-subtle p-2">
                          <img 
                            src={`data:image/png;base64,${result.output.cadImage}`}
                            alt="CAD"
                            className="w-full mix-blend-multiply"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-nc-bg-elevated rounded-xl p-4 shadow-sm border border-nc-border-subtle">
                      <h4 className="text-xs font-bold text-nc-ink-subtle uppercase tracking-widest mb-3">Bill of Materials</h4>
                      <div className="prose prose-sm max-w-none text-nc-ink-soft">
                        <pre className="text-xs whitespace-pre-wrap bg-nc-bg-soft p-4 rounded-lg border border-nc-border-subtle font-mono">
                          {result.output.bomMarkdown}
                        </pre>
                      </div>
                    </div>

                    <div className="bg-nc-bg-elevated rounded-xl p-4 shadow-sm border border-nc-border-subtle">
                      <h4 className="text-xs font-bold text-nc-ink-subtle uppercase tracking-widest mb-3">Size Chart</h4>
                      <div className="overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap bg-nc-bg-soft p-4 rounded-lg border border-nc-border-subtle font-mono">
                          {result.output.sizingChart}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Costing Tab */}
                {activeResultTab === 'costing' && (
                  <div className="space-y-4">
                    <div className="bg-nc-bg-elevated rounded-xl p-4 shadow-sm border border-nc-border-subtle">
                      <h4 className="text-xs font-bold text-nc-ink-subtle uppercase tracking-widest mb-4">Cost Breakdown</h4>
                      <table className="w-full text-sm">
                        <tbody>
                          {[
                            { label: 'Fabric', value: result.output.costBreakdown.materials.fabric },
                            { label: 'Trims + Hardware', value: result.output.costBreakdown.materials.trims + result.output.costBreakdown.materials.hardware },
                            { label: 'Packaging', value: result.output.costBreakdown.materials.packaging },
                            { label: 'Labor', value: result.output.costBreakdown.labor.cutting + result.output.costBreakdown.labor.sewing + result.output.costBreakdown.labor.finishing + result.output.costBreakdown.labor.qc },
                            { label: 'Overhead', value: result.output.costBreakdown.overhead.sampling + result.output.costBreakdown.overhead.shipping + result.output.costBreakdown.overhead.duties + result.output.costBreakdown.overhead.miscellaneous },
                          ].map((row) => (
                            <tr key={row.label} className="border-b border-nc-border-subtle">
                              <td className="py-2 text-nc-ink-soft">{row.label}</td>
                              <td className="py-2 text-right font-mono text-nc-ink">${row.value.toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr className="font-bold">
                            <td className="py-3 text-nc-ink">Total COGS</td>
                            <td className="py-3 text-right font-mono text-emerald-600">
                              ${result.output.costBreakdown.total.toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-nc-accent to-purple-600 rounded-xl p-4 text-white shadow-md">
                        <div className="text-[10px] uppercase tracking-widest opacity-80 mb-1 font-bold">Wholesale Price</div>
                        <div className="text-3xl font-black font-display">${result.output.costBreakdown.margin.wholesalePrice.toFixed(0)}</div>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-md">
                        <div className="text-[10px] uppercase tracking-widest opacity-80 mb-1 font-bold">Retail Price</div>
                        <div className="text-3xl font-black font-display">${result.output.costBreakdown.margin.suggestedRetailPrice.toFixed(0)}</div>
                      </div>
                    </div>

                    <div className="bg-nc-bg-elevated rounded-xl p-4 shadow-sm border border-nc-border-subtle">
                      <h4 className="text-xs font-bold text-nc-ink-subtle uppercase tracking-widest mb-3">Production Timeline</h4>
                      <div className="space-y-2">
                        {Object.entries(result.output.productionTimeline).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-nc-ink-soft capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="font-mono text-nc-ink font-bold">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Suppliers Tab */}
                {activeResultTab === 'suppliers' && (
                  <div className="space-y-4">
                    {result.output.supplierRecommendations.map((rec, i) => (
                      <div key={i} className="bg-nc-bg-elevated rounded-xl p-4 shadow-sm border border-nc-border-subtle">
                        <h4 className="text-sm font-bold text-nc-ink mb-3 border-b border-nc-border-subtle pb-2">{rec.material}</h4>
                        {rec.suppliers.length > 0 ? (
                          <div className="space-y-2">
                            {rec.suppliers.map((s, j) => (
                              <div key={j} className="flex items-center justify-between p-3 bg-nc-bg-soft rounded-lg border border-nc-border-subtle">
                                <div>
                                  <div className="text-xs font-bold text-nc-ink">{s.name}</div>
                                  <div className="text-[10px] text-nc-ink-subtle">{s.location}</div>
                                  {s.sustainability && (
                                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] rounded font-bold border border-emerald-200">
                                      {s.sustainability}
                                    </span>
                                  )}
                                </div>
                                {s.url && (
                                  <a 
                                    href={s.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-nc-accent hover:text-nc-accent-strong"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-nc-ink-subtle italic">No suppliers found</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-nc-border-subtle">
                  <button
                    onClick={handleLoadToStudio}
                    className="flex-1 py-3 bg-nc-ink text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-nc-ink-soft transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    Open in Studio
                  </button>
                  <button
                    onClick={handleDownloadTechPack}
                    className="px-6 py-3 bg-nc-bg-elevated border border-nc-border-subtle text-nc-ink font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-nc-bg-soft transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={reset}
                    className="px-6 py-3 bg-nc-bg-elevated border border-nc-border-subtle text-nc-ink font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-nc-bg-soft transition-colors"
                  >
                    New Design
                  </button>
                </div>
              </div>
            )}

            {error && !result && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-red-700 mb-1">Pipeline Error</h3>
                <p className="text-xs text-red-600">{error}</p>
                <button
                  onClick={reset}
                  className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-500"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
