import React from 'react';
import { DesignDNA, getQuickDNASummary } from '../services/designDNAService';

interface DNABadgeProps {
  dna: DesignDNA;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  onClick?: () => void;
}

export const DNABadge: React.FC<DNABadgeProps> = ({ 
  dna, 
  size = 'md',
  showDetails = false,
  onClick 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-[8px]',
    md: 'w-8 h-8 text-[10px]',
    lg: 'w-10 h-10 text-xs'
  };
  
  // Generate a color based on the aesthetic
  const getAestheticColor = () => {
    const aesthetic = dna.aesthetic.name.toLowerCase();
    if (aesthetic.includes('minimal')) return 'from-gray-400 to-gray-600';
    if (aesthetic.includes('avant') || aesthetic.includes('experimental')) return 'from-violet-500 to-fuchsia-500';
    if (aesthetic.includes('classic') || aesthetic.includes('formal')) return 'from-slate-600 to-slate-800';
    if (aesthetic.includes('street') || aesthetic.includes('urban')) return 'from-orange-500 to-red-500';
    if (aesthetic.includes('romantic') || aesthetic.includes('soft')) return 'from-pink-400 to-rose-500';
    if (aesthetic.includes('futur') || aesthetic.includes('tech')) return 'from-cyan-400 to-blue-500';
    return 'from-emerald-500 to-teal-500';
  };
  
  return (
    <div 
      className={`inline-flex items-center gap-2 ${onClick ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}
      onClick={onClick}
    >
      {/* DNA Icon */}
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${getAestheticColor()} flex items-center justify-center shadow-lg`}>
        <svg className="w-1/2 h-1/2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      </div>
      
      {showDetails && (
        <div className="flex flex-col">
          <span className="text-white font-bold text-xs leading-tight">{dna.overallStyle}</span>
          <span className="text-slate-500 text-[9px]">{dna.aesthetic.name}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Compact DNA Strand visualization for cards
 */
export const DNAStrand: React.FC<{ dna: DesignDNA }> = ({ dna }) => {
  // Create visual representation of genes
  const genes = [
    { label: 'S', value: dna.silhouette.confidence, color: 'bg-violet-500' },
    { label: 'C', value: dna.colorway.confidence, color: 'bg-fuchsia-500' },
    { label: 'T', value: dna.texture.confidence, color: 'bg-pink-500' },
    { label: 'X', value: dna.construction.confidence, color: 'bg-rose-500' },
    { label: 'A', value: dna.aesthetic.confidence, color: 'bg-red-500' }
  ];
  
  return (
    <div className="flex items-center gap-0.5">
      {genes.map((gene, i) => (
        <div 
          key={i}
          className={`w-3 rounded-sm ${gene.color}`}
          style={{ height: `${8 + gene.value * 12}px`, opacity: 0.5 + gene.value * 0.5 }}
          title={`${gene.label}: ${Math.round(gene.value * 100)}%`}
        />
      ))}
    </div>
  );
};

/**
 * Full DNA Card for detailed view
 */
export const DNACard: React.FC<{ 
  dna: DesignDNA; 
  onSplice?: () => void;
  onViewDetails?: () => void;
}> = ({ dna, onSplice, onViewDetails }) => {
  const summary = getQuickDNASummary(dna);
  
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <DNABadge dna={dna} size="lg" />
          <div>
            <h4 className="text-white font-bold text-sm">{dna.overallStyle}</h4>
            <p className="text-slate-500 text-[10px]">{dna.era} • {dna.mood}</p>
          </div>
        </div>
        <DNAStrand dna={dna} />
      </div>
      
      {/* Traits */}
      <div className="flex flex-wrap gap-1 mb-3">
        {summary.dominantTraits.map((trait, i) => (
          <span key={i} className="px-2 py-0.5 bg-slate-900 text-slate-400 text-[9px] rounded-full">
            {trait}
          </span>
        ))}
      </div>
      
      {/* Style Scores */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <div className="text-[9px] text-slate-600 uppercase">Formal</div>
          <div className="text-xs font-bold text-white">{summary.styleScore.formal}%</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-slate-600 uppercase">Expmt.</div>
          <div className="text-xs font-bold text-white">{summary.styleScore.experimental}%</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-slate-600 uppercase">Wear</div>
          <div className="text-xs font-bold text-white">{summary.styleScore.wearability}%</div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        {onSplice && (
          <button
            onClick={onSplice}
            className="flex-1 py-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:from-violet-500 hover:to-fuchsia-500 transition-all"
          >
            Splice
          </button>
        )}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="flex-1 py-1.5 bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-slate-600 transition-all"
          >
            Details
          </button>
        )}
      </div>
    </div>
  );
};