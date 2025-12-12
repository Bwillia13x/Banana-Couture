
import React, { useState } from 'react';
import { validateAndRepairBom, reviewEngineeringImage } from '../services/geminiService';
import { BomValidationResult, CadReadabilityReview } from '../types';

interface QualityMonitorProps {
  bom: string;
  cadImage: string | null;
  onUpdateBom: (newBom: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const QualityMonitor: React.FC<QualityMonitorProps> = ({ bom, cadImage, onUpdateBom, onShowToast }) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [bomResult, setBomResult] = useState<BomValidationResult | null>(null);
  const [cadResult, setCadResult] = useState<CadReadabilityReview | null>(null);

  const runAudit = async () => {
    setIsAuditing(true);
    setBomResult(null);
    setCadResult(null);
    
    try {
      // Run checks in parallel
      const promises: Promise<any>[] = [];
      
      if (bom) {
        promises.push(validateAndRepairBom(bom).then(setBomResult));
      }
      
      if (cadImage) {
        promises.push(reviewEngineeringImage(cadImage).then(setCadResult));
      }

      await Promise.all(promises);
      onShowToast('success', 'Design audit complete');
    } catch (e) {
      console.error(e);
      onShowToast('error', 'Audit failed');
    } finally {
      setIsAuditing(false);
    }
  };

  const applyBomFix = () => {
    if (bomResult?.repairedMarkdown) {
      onUpdateBom(bomResult.repairedMarkdown);
      setBomResult(prev => prev ? ({ ...prev, isComplete: true, issues: [] }) : null);
      onShowToast('success', 'BOM repaired automatically');
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Design Integrity Check</h3>
        <button 
          onClick={runAudit}
          disabled={isAuditing || (!bom && !cadImage)}
          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors ${isAuditing ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
          {isAuditing ? 'Auditing...' : 'Run Audit'}
        </button>
      </div>

      {!bomResult && !cadResult && !isAuditing && (
        <p className="text-[10px] text-slate-500 italic">Run an audit to validate BOM completeness and CAD readability before export.</p>
      )}

      {/* BOM Section */}
      {bomResult && (
        <div className="animate-fade-in">
           <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${bomResult.isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
              <span className="text-xs font-bold text-slate-700">Bill of Materials</span>
           </div>
           
           {bomResult.isComplete ? (
             <div className="text-[10px] text-emerald-600 flex items-center gap-1">
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               Pass: Materials & Hardware defined.
             </div>
           ) : (
             <div className="space-y-2">
               <ul className="list-disc pl-4 text-[10px] text-amber-600 space-y-1">
                 {bomResult.issues.map((issue, i) => <li key={i}>{issue}</li>)}
               </ul>
               <button 
                 onClick={applyBomFix}
                 className="w-full text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 py-1.5 rounded transition-colors flex items-center justify-center gap-2"
               >
                 <span>Auto-Repair with AI</span>
                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               </button>
             </div>
           )}
        </div>
      )}

      {/* CAD Section */}
      {cadResult && (
         <div className="animate-fade-in border-t border-slate-200 pt-3">
            <div className="flex items-center gap-2 mb-2">
               <div className={`w-2 h-2 rounded-full ${cadResult.isReadable ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
               <span className="text-xs font-bold text-slate-700">CAD Legibility</span>
            </div>
            
            {cadResult.isReadable ? (
              <div className="text-[10px] text-emerald-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Pass: Vector lines are clear.
              </div>
            ) : (
               <div className="space-y-2">
                 <ul className="list-disc pl-4 text-[10px] text-red-600 space-y-1">
                   {cadResult.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                 </ul>
                 {cadResult.recommendation && (
                   <p className="text-[10px] text-slate-500 italic">Tip: {cadResult.recommendation}</p>
                 )}
               </div>
            )}
         </div>
      )}
    </div>
  );
};
