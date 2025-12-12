
import React, { useRef } from 'react';
import { DesignDraft, ManufacturingAnalysis, CostBreakdown, ProductionTimeline } from '../types';
import { BomParser } from './BomParser';
import { CostSheet } from './CostSheet';
import { bomToString } from '../utils/bomUtils';

interface TechPackModalProps {
  draft: DesignDraft;
  prompt: string;
  manufacturingData: ManufacturingAnalysis | null;
  costData?: CostBreakdown | null;
  timelineData?: ProductionTimeline | null;
  onClose: () => void;
  onPrint: () => void;
  onSendToProduction: () => void;
}

export const TechPackModal: React.FC<TechPackModalProps> = ({ 
  draft, 
  prompt, 
  manufacturingData, 
  costData,
  timelineData,
  onClose, 
  onPrint,
  onSendToProduction
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Helper to ensure BOM is string for simple text inputs
  const bomString = bomToString(draft.materials);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-md overflow-hidden animate-fade-in">
      
      {/* Close Button (Absolute Top Right) */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md group"
        title="Close Tech Pack"
        aria-label="Close Tech Pack"
      >
        <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      {/* Floating Control Island */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 bg-slate-900/90 border border-white/10 rounded-full shadow-2xl backdrop-blur-xl print:hidden">
          <div className="px-4 flex items-center gap-2 border-r border-white/10 mr-1">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-xs font-bold text-white uppercase tracking-widest">Tech Pack Generated</span>
          </div>
          
          <button onClick={onPrint} className="px-4 py-2 hover:bg-white/10 rounded-full text-xs font-bold text-slate-300 hover:text-white uppercase tracking-wider transition-all flex items-center gap-2">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
             Print PDF
          </button>
          
          <button onClick={onSendToProduction} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-xs font-bold text-white uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
             Send to Factory
          </button>
      </div>

      {/* Scrollable Document Area */}
      <div className="w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar py-24 flex justify-center">
          <div 
            ref={printRef}
            className="w-full max-w-[210mm] bg-white min-h-[297mm] shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-transform print:shadow-none print:transform-none"
          >
                {/* Document Content */}
                <div className="p-4 sm:p-8 md:p-16 flex flex-col h-full relative overflow-x-hidden">
                    
                    {/* Watermark / Brand */}
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <h1 className="text-8xl font-black text-slate-900 tracking-tighter uppercase">NANO</h1>
                    </div>

                    {/* Header */}
                    <div className="flex justify-between items-end border-b-4 border-black pb-6 mb-12">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tight mb-1 text-slate-900">Production Specification</h1>
                            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">ID: {draft.conceptImage ? draft.conceptImage.substring(0, 8) : 'UNK'}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Collection</div>
                            <div className="text-sm font-bold text-slate-900 max-w-[200px] truncate">{prompt}</div>
                            <div className="text-[10px] font-mono text-slate-400 mt-1">{new Date().toLocaleDateString()}</div>
                        </div>
                    </div>

                    {/* Visuals Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-12">
                         <div className="flex flex-col gap-3">
                             <div className="aspect-[3/4] border border-slate-200 bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
                                 {draft.conceptImage ? (
                                     <img src={`data:image/png;base64,${draft.conceptImage}`} alt="Design concept" className="max-w-full max-h-full object-contain mix-blend-multiply" />
                                 ) : <span className="text-gray-300 font-mono text-xs">NO ASSET</span>}
                                 <div className="absolute top-2 left-2 text-[8px] font-mono text-slate-400">FIG 1.0</div>
                             </div>
                             <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Concept</span>
                                <span className="text-[8px] font-mono text-slate-400">Front View</span>
                             </div>
                         </div>
                         <div className="flex flex-col gap-3">
                             <div className="aspect-[3/4] border border-slate-200 bg-white flex items-center justify-center p-6 relative overflow-hidden">
                                 {draft.cadImage ? (
                                     <img src={`data:image/png;base64,${draft.cadImage}`} alt="Technical CAD drawing" className="max-w-full max-h-full object-contain" />
                                 ) : <span className="text-gray-300 font-mono text-xs">NO ASSET</span>}
                                 <div className="absolute top-2 left-2 text-[8px] font-mono text-slate-400">FIG 1.1</div>
                             </div>
                             <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Technical Flat</span>
                                <span className="text-[8px] font-mono text-slate-400">Vector Lineart</span>
                             </div>
                         </div>
                    </div>

                    {/* Sizing Table */}
                    {draft.sizingChart && (
                        <div className="mb-12 break-inside-avoid">
                            <h3 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-2 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-black"></span>
                                Measurement Spec (CM)
                            </h3>
                            <div className="border border-slate-200 rounded-sm overflow-hidden">
                                <table className="w-full text-left text-[10px] font-mono">
                                    <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider">
                                        {/* Assuming first row is header based on simple parsing logic */}
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                       {draft.sizingChart.split('\n').filter(l => l.includes('|') && !l.includes('---')).map((row, i) => (
                                           <tr key={i} className={i === 0 ? "bg-slate-50 font-bold" : ""}>
                                               {row.split('|').filter(c => c.trim()).map((cell, j) => (
                                                   <td key={j} className="p-3 border-r border-slate-100 last:border-0">{cell.trim()}</td>
                                               ))}
                                           </tr>
                                       ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="print:break-before-page"></div>

                    {/* BOM */}
                    <div className="mb-12 break-inside-avoid">
                         <h3 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-2 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-black"></span>
                            Bill of Materials
                         </h3>
                         <div className="bg-slate-50 p-8 border border-slate-100 text-xs text-slate-700 leading-loose font-mono">
                             <BomParser markdown={draft.materials} />
                         </div>
                    </div>

                    {/* Analysis, Cost & Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 break-inside-avoid">
                        <div className="space-y-8">
                            {manufacturingData && (
                                <div className="border border-slate-200 p-6 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">Analysis</h3>
                                        <span className={`text-[10px] font-bold px-2 py-1 border rounded uppercase ${
                                            manufacturingData.costRating === 'Low' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 
                                            manufacturingData.costRating === 'High' ? 'border-red-200 bg-red-50 text-red-700' : 
                                            'border-amber-200 bg-amber-50 text-amber-700'
                                        }`}>
                                            {manufacturingData.costRating} Cost
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-2">Production Risks</h4>
                                            <ul className="list-none space-y-2">
                                                {manufacturingData.productionRisks.map((r, i) => (
                                                    <li key={i} className="text-[10px] text-red-600 flex gap-2 items-start font-mono">
                                                        <span className="mt-0.5">⚠️</span> {r}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-2">Suggestions</h4>
                                            <ul className="list-none space-y-2">
                                                {manufacturingData.manufacturingSuggestions.map((s, i) => (
                                                    <li key={i} className="text-[10px] text-emerald-600 flex gap-2 items-start font-mono">
                                                        <span className="mt-0.5">💡</span> {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {timelineData && (
                                <div className="border border-slate-200 p-6 shadow-sm">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-4">Estimated Timeline</h3>
                                    <div className="space-y-2 text-xs font-mono">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Sampling</span>
                                            <span>{timelineData.sampling}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Production</span>
                                            <span>{timelineData.production}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Shipping</span>
                                            <span>{timelineData.shipping}</span>
                                        </div>
                                        <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between font-bold">
                                            <span>Total Lead Time</span>
                                            <span className="text-indigo-600">{timelineData.totalLeadTime}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Pass bomString instead of structured object for estimating if needed, though CostSheet can handle both via its service, passing string is safer for simple estimation */}
                        <CostSheet bom={bomString} initialCosts={costData} />
                    </div>

                    {/* Document Footer */}
                    <div className="border-t-4 border-black pt-6 mt-auto flex justify-between items-start">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">NanoFashion Studio</span>
                            <span className="text-[8px] text-slate-400 font-mono mt-1">Generated by Gemini 2.5 Flash</span>
                        </div>
                        <div className="w-32 h-12 border border-slate-200 bg-slate-50 flex items-center justify-center">
                            <span className="text-[8px] text-slate-300 font-mono uppercase">Factory Stamp</span>
                        </div>
                    </div>
                </div>
          </div>
      </div>
    </div>
  );
};
