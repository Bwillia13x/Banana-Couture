
import React, { useMemo } from 'react';
import { estimateImpact } from '../utils/bomUtils';
import { StructuredBOM } from '../types';

interface BomParserProps {
  markdown: string | string[] | StructuredBOM;
  onMaterialClick?: (materialName: string) => void;
}

export const BomParser: React.FC<BomParserProps> = ({ markdown, onMaterialClick }) => {
  const isStructured = typeof markdown === 'object' && !Array.isArray(markdown);
  const isArray = Array.isArray(markdown);
  
  // Calculate impact based on string representation
  const impact = useMemo(() => {
      const text = isStructured 
        ? JSON.stringify(markdown) 
        : isArray 
          ? (markdown as string[]).join('\n')
          : (markdown as string);
      return estimateImpact(text);
  }, [markdown, isArray, isStructured]);
  
  const handleItemClick = (text: string) => {
      if (onMaterialClick) {
          // Clean up text to get just the material name roughly
          const cleanName = text.replace(/^-\s*/, '').split(':')[0].replace(/\*\*/g, '').trim();
          onMaterialClick(cleanName);
      }
  };

  const renderStructured = (bom: StructuredBOM) => {
    const items = bom?.items || [];
    const productionNotes = bom?.productionNotes || [];
    return (
      <div className="w-full">
          <h3 className="text-emerald-600 font-bold text-xs uppercase tracking-widest mt-6 mb-3 border-b border-emerald-100 pb-2">
              Materials List
          </h3>
          <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 font-mono uppercase tracking-wider">
                      <tr>
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2">Spec</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {items.map((item, i) => (
                          <tr 
                            key={i} 
                            onClick={() => handleItemClick(item.name)}
                            className={`group hover:bg-indigo-50 transition-colors ${onMaterialClick ? 'cursor-pointer' : ''}`}
                          >
                              <td className="px-3 py-2 font-bold text-indigo-600 font-mono">{item.category}</td>
                              <td className="px-3 py-2 text-gray-900">{item.name}</td>
                              <td className="px-3 py-2 text-gray-500 font-mono text-[10px]">{item.composition}</td>
                              <td className="px-3 py-2 text-right font-mono">{item.estimatedQty}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          
          {productionNotes.length > 0 && (
              <>
                <h3 className="text-emerald-600 font-bold text-xs uppercase tracking-widest mt-6 mb-3 border-b border-emerald-100 pb-2">
                    Production Notes
                </h3>
                <ul className="list-disc pl-4 space-y-1">
                    {productionNotes.map((note, i) => (
                        <li key={i} className="text-gray-600 text-xs">{note}</li>
                    ))}
                </ul>
              </>
          )}
      </div>
    );
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    return (
        <div className="group/list">
            {lines.map((line, index) => {
                // Header
                if (line.startsWith('##')) {
                return (
                    <h3 key={index} className="text-emerald-600 font-bold text-xs uppercase tracking-widest mt-6 mb-3 border-b border-emerald-100 pb-2">
                    {line.replace(/^#+\s*/, '')}
                    </h3>
                );
                }
                
                // List item with bold key
                const match = line.match(/^\s*-\s*\*\*(.*?)\*\*:\s*(.*)/);
                if (match) {
                return (
                    <div 
                    key={index} 
                    onClick={() => handleItemClick(match[1])}
                    className={`flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 py-2 border-b border-gray-100 px-3 rounded-md transition-all ${onMaterialClick ? 'cursor-pointer hover:bg-indigo-50 hover:border-indigo-100' : 'hover:bg-gray-50'}`}
                    title={onMaterialClick ? "Click to generate texture" : ""}
                    >
                    <span className="text-indigo-600 font-mono text-[10px] uppercase font-bold sm:w-36 flex-shrink-0 tracking-tight group-hover:text-indigo-700">
                        {match[1]}
                    </span>
                    <span className="text-gray-700 font-mono text-xs leading-relaxed">
                        {match[2]}
                    </span>
                    {onMaterialClick && <span className="sm:ml-auto text-[9px] text-gray-400 uppercase font-bold opacity-0 hover:opacity-100 sm:group-hover:opacity-100 transition-opacity">👁 View</span>}
                    </div>
                );
                }

                // Standard list item
                if (line.startsWith('-')) {
                return (
                    <div key={index} className="flex gap-3 py-1.5 px-3">
                        <span className="text-emerald-500 text-xs mt-0.5">▹</span>
                        <span className="text-gray-600 text-xs font-mono leading-relaxed">{line.replace(/^-\s*/, '')}</span>
                    </div>
                )
                }

                // Fallback paragraph
                return <p key={index} className="text-gray-500 text-xs py-1.5 px-3 leading-relaxed">{line}</p>;
            })}
        </div>
    );
  };

  return (
    <div className="w-full pb-4">
      {/* P3.2 Impact Panel */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-col">
              <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-1">Est. Material Cost</span>
              <div className="flex items-baseline gap-1">
                  <span className={`text-lg font-bold ${impact.costBand === '$$$' ? 'text-gray-900' : 'text-gray-600'}`}>{impact.costBand}</span>
                  <span className="text-[10px] text-gray-400 font-medium">/ unit</span>
              </div>
          </div>
          
          <div className="h-8 w-px bg-gray-100"></div>
          
          <div className="flex flex-col items-end">
              <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-1">Sustainability</span>
              <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      impact.sustainabilityRating === 'Eco-focused' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      impact.sustainabilityRating === 'Better' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                      {impact.sustainabilityRating}
                  </span>
              </div>
          </div>
      </div>

      {isStructured 
        ? renderStructured(markdown as StructuredBOM) 
        : renderMarkdown(isArray ? (markdown as string[]).join('\n') : (markdown as string))
      }
      
      {!markdown && (
        <div className="text-center text-gray-500 text-xs py-4 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
          No materials provided for this design yet.
        </div>
      )}
      
      {onMaterialClick && <div className="text-center mt-2 text-[9px] text-gray-400 italic">Tip: Click on a material to generate a texture preview.</div>}
    </div>
  );
};
