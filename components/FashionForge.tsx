
import React, { useState } from 'react';
import { CostBreakdown, ProductionTimeline } from '../types';
import {
  ProductionMatch,
  SupplyChainMap,
  FactoryTechPack,
  matchManufacturers,
  mapSupplyChain,
  generateFactoryTechPack
} from '../services/fashionForgeService';

interface FashionForgeProps {
  isOpen: boolean;
  onClose: () => void;
  conceptImage: string | null;
  cadImage: string | null;
  bomMarkdown: string;
  designName: string;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

type ForgeTab = 'match' | 'costs' | 'timeline' | 'supply-chain' | 'tech-pack';

// New Visual Component for Map
const SupplyChainVisualizer: React.FC<{ map: SupplyChainMap }> = ({ map }) => {
    const nodes = map.nodes.map((node, i) => {
        let x = 100;
        if (node.type === 'processing') x = 250;
        if (node.type === 'manufacturing') x = 400;
        if (node.type === 'distribution') x = 550;
        const y = 150 + (i % 2 === 0 ? -1 : 1) * (i * 30);
        return { ...node, x, y };
    });

    return (
        <div className="bg-[#0F172A] rounded-xl overflow-hidden shadow-inner border border-slate-700 relative h-[320px] w-full">
            <svg width="100%" height="100%" viewBox="0 0 650 300" className="absolute inset-0">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="22" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#64748B" />
                    </marker>
                </defs>
                {nodes.map((source, i) => {
                    const relevantConnections = map.connections.filter(c => c.from === source.id);
                    return relevantConnections.map((conn, j) => {
                        const target = nodes.find(n => n.id === conn.to);
                        if (!target) return null;
                        return (
                            <g key={`${i}-${j}`}>
                                <path 
                                    d={`M${source.x},${source.y} C${(source.x + target.x)/2},${source.y} ${(source.x + target.x)/2},${target.y} ${target.x},${target.y}`}
                                    fill="none"
                                    stroke="#334155"
                                    strokeWidth="2"
                                    markerEnd="url(#arrowhead)"
                                    strokeDasharray="5,5"
                                    className="animate-dash"
                                />
                                <text x={(source.x + target.x)/2} y={(source.y + target.y)/2 - 10} fill="#94A3B8" fontSize="8" textAnchor="middle">
                                    {conn.distanceKm}km
                                </text>
                            </g>
                        );
                    });
                })}
                {nodes.map((node) => (
                    <g key={node.id} className="cursor-pointer group">
                        <circle 
                            cx={node.x} 
                            cy={node.y} 
                            r="12" 
                            fill={
                                node.type === 'raw_material' ? '#F59E0B' : 
                                node.type === 'processing' ? '#3B82F6' : 
                                node.type === 'manufacturing' ? '#A855FF' : '#10B981'
                            }
                            className="transition-all duration-300 group-hover:r-14 shadow-glow"
                        />
                        <circle cx={node.x} cy={node.y} r="16" stroke="white" strokeOpacity="0.1" fill="none" />
                        <text x={node.x} y={node.y + 25} fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">{node.location.country}</text>
                        <text x={node.x} y={node.y + 35} fill="#94A3B8" fontSize="8" textAnchor="middle">{node.type.replace('_', ' ')}</text>
                    </g>
                ))}
            </svg>
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur px-3 py-2 rounded-lg border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Network Stats</div>
                <div className="text-emerald-400 font-mono text-sm">{map.totalCarbonFootprint.toFixed(0)} kg CO2</div>
            </div>
        </div>
    );
};

export const FashionForge: React.FC<FashionForgeProps> = ({
  isOpen,
  onClose,
  conceptImage,
  cadImage,
  bomMarkdown,
  designName,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<ForgeTab>('match');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const [matches, setMatches] = useState<ProductionMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<ProductionMatch | null>(null);
  const [matchPreferences] = useState({
    quantity: 100,
    budget: 'any' as const,
    prioritizeSustainability: true,
    preferredRegions: [] as string[],
    maxLeadDays: 45
  });
  
  const [supplyChain, setSupplyChain] = useState<SupplyChainMap | null>(null);
  const [techPack, setTechPack] = useState<FactoryTechPack | null>(null);
  const [techPackLanguage] = useState('English');

  const handleFindManufacturers = async () => {
    if (!conceptImage || !bomMarkdown) {
      onShowToast('error', 'Generate a design and tech pack first');
      return;
    }
    setIsLoading(true);
    setLoadingMessage('Analyzing design complexity...');
    try {
      const results = await matchManufacturers(conceptImage, cadImage, bomMarkdown, matchPreferences);
      setMatches(results);
      if (results.length > 0) setSelectedMatch(results[0]);
      onShowToast('success', `Found ${results.length} manufacturer matches`);
    } catch (e: any) {
      onShowToast('error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapSupplyChain = async () => {
    if (!selectedMatch || !bomMarkdown) {
      onShowToast('error', 'Select a manufacturer first');
      return;
    }
    setIsLoading(true);
    setLoadingMessage('Mapping supply chain...');
    try {
      const chain = await mapSupplyChain(bomMarkdown, selectedMatch.manufacturer.location);
      setSupplyChain(chain);
      setActiveTab('supply-chain');
      onShowToast('success', 'Supply chain mapped');
    } catch (e: any) {
      onShowToast('error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTechPack = async () => {
    if (!conceptImage || !bomMarkdown) {
      onShowToast('error', 'Generate a design and BOM first');
      return;
    }
    setIsLoading(true);
    setLoadingMessage(`Generating tech pack in ${techPackLanguage}...`);
    try {
      const pack = await generateFactoryTechPack(conceptImage, cadImage, bomMarkdown, techPackLanguage, designName || 'Untitled Design');
      setTechPack(pack);
      setActiveTab('tech-pack');
      onShowToast('success', 'Factory tech pack generated');
    } catch (e: any) {
      onShowToast('error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMatchCard = (match: ProductionMatch) => (
    <div 
      key={match.manufacturer.id}
      onClick={() => setSelectedMatch(match)}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        selectedMatch?.manufacturer.id === match.manufacturer.id
          ? 'border-nc-accent bg-nc-accent-soft/30'
          : 'border-nc-border-subtle hover:border-nc-border-strong bg-nc-bg-elevated'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-nc-ink font-display">{match.manufacturer.name}</h4>
          <p className="text-xs text-nc-ink-subtle">{match.manufacturer.location.city}, {match.manufacturer.location.country}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${match.matchScore >= 80 ? 'bg-emerald-100 text-emerald-700' : match.matchScore >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-nc-bg-soft text-nc-ink-soft'}`}>
          {Math.round(match.matchScore)}% Match
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {match.manufacturer.certifications.slice(0, 3).map((cert, i) => (
          <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] rounded-full font-medium border border-emerald-100">{cert}</span>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-nc-bg-soft rounded-lg p-2"><div className="text-[10px] text-nc-ink-subtle uppercase">Cost</div><div className="text-sm font-bold text-nc-ink">${match.estimatedCost.perUnit.toFixed(2)}/u</div></div>
        <div className="bg-nc-bg-soft rounded-lg p-2"><div className="text-[10px] text-nc-ink-subtle uppercase">Lead Time</div><div className="text-sm font-bold text-nc-ink">{match.estimatedTimeline.totalDays || '?'}d</div></div>
        <div className="bg-nc-bg-soft rounded-lg p-2"><div className="text-[10px] text-nc-ink-subtle uppercase">Eco</div><div className="text-sm font-bold text-emerald-600">{match.manufacturer.sustainabilityScore}/100</div></div>
      </div>
    </div>
  );

  const renderCostBreakdown = (costs: CostBreakdown) => (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-nc-bg-elevated rounded-xl p-4 border border-nc-border-subtle text-center">
          <div className="text-[10px] text-nc-ink-subtle uppercase mb-1">Total Cost</div>
          <div className="text-2xl font-black text-nc-ink font-display">${costs.total.toFixed(0)}</div>
        </div>
        <div className="bg-nc-bg-elevated rounded-xl p-4 border border-nc-border-subtle text-center">
          <div className="text-[10px] text-nc-ink-subtle uppercase mb-1">Per Unit</div>
          <div className="text-2xl font-black text-nc-accent font-display">${costs.perUnit.toFixed(2)}</div>
        </div>
        <div className="bg-nc-bg-elevated rounded-xl p-4 border border-nc-border-subtle text-center">
          <div className="text-[10px] text-nc-ink-subtle uppercase mb-1">Wholesale</div>
          <div className="text-2xl font-black text-emerald-600 font-display">${costs.margin.wholesalePrice.toFixed(2)}</div>
        </div>
        <div className="bg-nc-bg-elevated rounded-xl p-4 border border-nc-border-subtle text-center">
          <div className="text-[10px] text-nc-ink-subtle uppercase mb-1">Retail</div>
          <div className="text-2xl font-black text-nc-rose font-display">${costs.margin.suggestedRetailPrice.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );

  const renderTimeline = (timeline: ProductionTimeline) => (
    <div className="bg-nc-bg-elevated rounded-xl p-4 border border-nc-border-subtle">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xs font-bold text-nc-ink-subtle uppercase tracking-widest">Production Timeline</h4>
        <div className="text-sm font-bold text-nc-accent">Est. Delivery: {timeline.estimatedDeliveryDate || 'TBD'}</div>
      </div>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-nc-border-strong"></div>
        <div className="space-y-4">
          {timeline.phases?.map((phase, idx) => (
            <div key={idx} className="relative pl-10">
              <div className={`absolute left-2 w-4 h-4 rounded-full border-2 ${idx === 0 ? 'bg-nc-accent border-nc-accent' : 'bg-nc-bg-elevated border-nc-border-strong'}`}></div>
              <div className="bg-nc-bg-soft rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-nc-ink">{phase.name}</span>
                  <span className="text-xs text-nc-ink-soft">Day {phase.startDay} - {phase.endDay}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-nc-border-subtle rounded-full overflow-hidden">
                    <div className="h-full bg-nc-accent rounded-full" style={{ width: `${(phase.durationDays / (timeline.totalDays || 1)) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-nc-ink-subtle">{phase.durationDays} days</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSupplyChain = () => {
    if (!supplyChain) return null;
    return (
      <div className="space-y-6">
        <SupplyChainVisualizer map={supplyChain} />
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs opacity-80 uppercase tracking-widest">Supply Chain Sustainability</div>
              <div className="text-3xl font-black font-display">{supplyChain.sustainabilityGrade}</div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-80 uppercase tracking-widest">Carbon Footprint</div>
              <div className="text-xl font-bold font-mono">{supplyChain.totalCarbonFootprint.toFixed(1)} kg CO2</div>
            </div>
          </div>
        </div>
        <div className="bg-nc-bg-elevated rounded-xl p-4 border border-nc-border-subtle">
          <h4 className="text-xs font-bold text-nc-ink-subtle uppercase mb-4 tracking-widest">Detailed Logistics</h4>
          <div className="space-y-3">
            {supplyChain.nodes.map((node, idx) => (
              <div key={node.id} className="flex items-center gap-4 p-3 bg-nc-bg-soft rounded-lg">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${node.type === 'raw_material' ? 'bg-amber-500' : node.type === 'processing' ? 'bg-blue-500' : node.type === 'manufacturing' ? 'bg-purple-500' : 'bg-emerald-500'}`}>{idx + 1}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div><div className="text-sm font-bold text-nc-ink">{node.name}</div><div className="text-xs text-nc-ink-soft">{node.location.city || ''} {node.location.country}</div></div>
                    <div className="text-right"><div className="text-xs text-nc-ink-subtle">{node.sustainabilityMetrics.carbonFootprint} kg CO2</div><div className="text-xs text-blue-500">{node.sustainabilityMetrics.waterUsage} L water</div></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTechPack = () => (
      <div className="bg-nc-bg-elevated rounded-xl p-4 border border-nc-border-subtle">
          <h4 className="text-xs font-bold text-nc-ink-subtle uppercase tracking-widest mb-4">Tech Pack</h4>
          {techPack ? <div className="text-sm">Generated for {techPack.designTitle}</div> : <div>Generating...</div>}
      </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-nc-ink/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-nc-bg rounded-2xl shadow-2xl border border-nc-border-subtle w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-nc-bg-elevated border-b border-nc-border-subtle p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nc-ink to-nc-ink-soft flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            </div>
            <div><h2 className="text-lg font-bold text-nc-ink font-display">FashionForge</h2><p className="text-xs text-nc-ink-subtle tracking-wide">AI-Powered Production Pipeline</p></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-nc-bg-soft hover:bg-nc-border-strong text-nc-ink-subtle hover:text-nc-ink flex items-center justify-center transition-all"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="bg-nc-bg-elevated border-b border-nc-border-subtle px-4">
          <div className="flex gap-1 overflow-x-auto custom-scrollbar">
            {[
              { id: 'match', label: 'Manufacturers', icon: '🏭' },
              { id: 'costs', label: 'Cost Analysis', icon: '💰' },
              { id: 'timeline', label: 'Timeline', icon: '📅' },
              { id: 'supply-chain', label: 'Supply Chain', icon: '🌍' },
              { id: 'tech-pack', label: 'Tech Pack', icon: '📋' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as ForgeTab)} className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-nc-accent text-nc-accent-strong bg-nc-bg-soft/50' : 'border-transparent text-nc-ink-subtle hover:text-nc-ink hover:bg-nc-bg-soft'}`}><span className="mr-2 opacity-70">{tab.icon}</span> {tab.label}</button>
            ))}
          </div>
        </div>
        {isLoading && (<div className="absolute inset-0 bg-nc-bg-elevated/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center"><div className="w-12 h-12 border-4 border-nc-border-strong border-t-nc-accent rounded-full animate-spin mb-4"></div><p className="text-sm font-medium text-nc-ink-soft animate-pulse">{loadingMessage}</p></div>)}
        <div className="flex-1 overflow-y-auto p-6 bg-nc-bg">
          {activeTab === 'match' && (
            <div className="space-y-6">
                <div className="bg-nc-bg-elevated rounded-xl p-6 border border-nc-border-subtle shadow-sm"><button onClick={handleFindManufacturers} disabled={isLoading} className="w-full py-3 bg-nc-ink text-white font-bold rounded-xl">Find Manufacturers</button></div>
                {matches.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">{matches.map(renderMatchCard)}</div>
                        {selectedMatch && (<div className="bg-nc-bg-elevated rounded-xl p-6 border border-nc-border-subtle shadow-md"><h3 className="font-bold mb-2">{selectedMatch.manufacturer.name}</h3><button onClick={handleMapSupplyChain} className="w-full py-2 bg-emerald-600 text-white rounded-lg mb-2">Map Supply Chain</button></div>)}
                    </div>
                )}
            </div>
          )}
          {activeTab === 'costs' && selectedMatch && renderCostBreakdown(selectedMatch.estimatedCost)}
          {activeTab === 'timeline' && selectedMatch && renderTimeline(selectedMatch.estimatedTimeline)}
          {activeTab === 'supply-chain' && renderSupplyChain()}
          {activeTab === 'tech-pack' && (<div className="space-y-6">{!techPack ? (<div className="text-center p-8"><button onClick={handleGenerateTechPack} className="px-8 py-3 bg-nc-accent text-white font-bold rounded-xl">Generate Tech Pack</button></div>) : renderTechPack()}</div>)}
        </div>
      </div>
    </div>
  );
};
