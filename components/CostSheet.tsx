
import React, { useState, useEffect } from 'react';
import { estimateProductionCosts } from '../services/geminiService';
import { CostBreakdown } from '../types';

interface CostSheetProps {
  bom: string;
  initialCosts?: CostBreakdown | null;
}

export const CostSheet: React.FC<CostSheetProps> = ({ bom, initialCosts }) => {
  const [costs, setCosts] = useState<CostBreakdown | null>(initialCosts || null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (initialCosts) {
      setCosts(initialCosts);
    }
  }, [initialCosts]);

  const handleEstimate = async () => {
    setLoading(true);
    try {
      const data = await estimateProductionCosts(bom);
      setCosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateCost = (category: 'materials' | 'labor' | 'overhead', item: string, value: number) => {
      if (!costs) return;
      
      const newCosts = { ...costs };
      
      // Update specific field - we know the structure now
      if (newCosts[category] && typeof newCosts[category] === 'object') {
          // @ts-ignore
          newCosts[category][item] = value;
      }

      // Recalculate totals
      const materialsTotal = (Object.values(newCosts.materials) as number[]).reduce((a, b) => a + b, 0);
      const laborTotal = (Object.values(newCosts.labor) as number[]).reduce((a, b) => a + b, 0);
      const overheadTotal = (Object.values(newCosts.overhead) as number[]).reduce((a, b) => a + b, 0);
      
      newCosts.total = materialsTotal + laborTotal + overheadTotal;
      
      // Keep retail/wholesale fixed or recalculate? Let's fix margins
      const currentRetail = newCosts.margin.suggestedRetailPrice;
      // Recalculate margin % based on new cost vs existing retail
      const newMargin = ((currentRetail - newCosts.total) / currentRetail) * 100;
      newCosts.margin.profitMargin = newMargin;

      setCosts(newCosts);
  };

  const renderRow = (category: 'materials' | 'labor' | 'overhead', label: string, key: string, value: number) => (
      <div className="flex justify-between items-center text-xs text-gray-600">
          <span>{label}</span>
          {isEditing ? (
              <div className="flex items-center gap-1">
                  <span className="text-gray-400">$</span>
                  <input 
                      type="number" 
                      value={value}
                      step="0.01"
                      onChange={(e) => updateCost(category, key, parseFloat(e.target.value) || 0)}
                      className="w-16 text-right bg-gray-50 border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
              </div>
          ) : (
              <span className="font-mono">${value.toFixed(2)}</span>
          )}
      </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 break-inside-avoid shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-900">Estimated Cost Sheet (COGS)</h3>
        <div className="flex gap-2">
            {costs && (
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`text-[10px] px-3 py-1.5 rounded uppercase font-bold transition-colors ${isEditing ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    {isEditing ? 'Done' : 'Edit'}
                </button>
            )}
            {!costs && (
            <button 
                onClick={handleEstimate} 
                disabled={loading}
                className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded uppercase font-bold transition-colors"
            >
                {loading ? 'Calculating...' : 'Auto-Calculate'}
            </button>
            )}
        </div>
      </div>

      {costs ? (
        <div className="space-y-4">
          <div className="space-y-2 pb-3 border-b border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Materials</span>
            {renderRow('materials', 'Main Fabric', 'fabric', costs.materials.fabric)}
            {renderRow('materials', 'Trims & Hardware', 'trims', costs.materials.trims)}
          </div>

          <div className="space-y-2 pb-3 border-b border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Labor</span>
            {renderRow('labor', 'Cut & Sew', 'sewing', costs.labor.sewing)} 
             <div className="flex justify-between items-center text-xs text-gray-600">
                <span>Total Direct Labor</span>
                {/* Display total labor which is sum of cutting, sewing, finishing, qc */}
                <span className="font-mono">${(costs.labor.cutting + costs.labor.sewing + costs.labor.finishing + (costs.labor.qc || 0)).toFixed(2)}</span>
            </div>
          </div>
          
          <div className="space-y-2">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Overhead</span>
             {renderRow('overhead', 'Factory Overhead', 'miscellaneous', costs.overhead.miscellaneous)}
          </div>
          
          <div className="border-t border-gray-300 pt-3 mt-2">
            <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-gray-900">Total Unit Cost</span>
                <span className="font-bold text-lg text-emerald-600 font-mono">${costs.total.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center mt-2 text-xs">
                <span className="text-gray-500">Suggested Retail</span>
                <span className="font-mono text-gray-700">${costs.margin.suggestedRetailPrice.toFixed(2)}</span>
            </div>
             <div className="flex justify-between items-center mt-1 text-xs">
                <span className="text-gray-500">Margin</span>
                <span className={`font-bold font-mono ${costs.margin.profitMargin < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {costs.margin.profitMargin.toFixed(1)}%
                </span>
            </div>
          </div>
          
          <p className="text-[9px] text-gray-400 mt-2 italic">*Estimates based on small batch production. Adjust values to reflect actual supplier quotes.</p>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400 text-xs italic bg-gray-50 rounded border border-dashed border-gray-200">
          Click Auto-Calculate to generate a preliminary cost estimate based on the BOM.
        </div>
      )}
    </div>
  );
};
