
import React from 'react';
import { Product } from '../types';
import { LazyImage } from './LazyImage';

interface DesignGenealogyProps {
  product: Product;
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
}

export const DesignGenealogy: React.FC<DesignGenealogyProps> = ({ product, allProducts, onSelectProduct }) => {
  // Find Parent
  const parent = product.remixedFrom 
    ? allProducts.find(p => p.id === product.remixedFrom!.id) 
    : null;

  // Find Children
  const children = allProducts.filter(p => p.remixedFrom?.id === product.id);

  if (!parent && children.length === 0) return null;

  const renderNode = (p: Product, type: 'parent' | 'current' | 'child') => (
    <div 
        onClick={() => type !== 'current' && onSelectProduct(p)}
        className={`relative flex flex-col items-center group ${type !== 'current' ? 'cursor-pointer' : ''}`}
    >
        <div className={`w-16 h-16 rounded-xl overflow-hidden border-2 shadow-sm transition-all duration-300 ${
            type === 'current' 
                ? 'border-nc-accent ring-2 ring-nc-accent/30 scale-110 z-10' 
                : 'border-white hover:border-nc-accent hover:scale-105 opacity-80 hover:opacity-100'
        }`}>
            <LazyImage 
                src={p.imageUrl.startsWith('http') ? p.imageUrl : `data:image/png;base64,${p.imageUrl}`} 
                className="w-full h-full object-cover"
            />
        </div>
        <div className="mt-2 text-center">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                type === 'current' ? 'bg-nc-accent text-white' : 'bg-nc-bg-soft text-nc-ink-subtle'
            }`}>
                {type === 'parent' ? 'Original' : type === 'current' ? 'Current' : 'Remix'}
            </span>
            <p className="text-[9px] font-bold text-nc-ink mt-1 truncate max-w-[80px]">{p.creator}</p>
        </div>
        
        {/* Connector Line (Vertical) */}
        {type === 'parent' && (
            <div className="absolute top-full left-1/2 w-0.5 h-8 bg-nc-border-strong -translate-x-1/2 z-0"></div>
        )}
        {type === 'current' && children.length > 0 && (
            <div className="absolute top-full left-1/2 w-0.5 h-8 bg-nc-border-strong -translate-x-1/2 z-0"></div>
        )}
    </div>
  );

  return (
    <div className="w-full py-6">
        <h3 className="text-xs font-bold text-nc-ink-subtle uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <span className="w-1 h-1 bg-nc-ink rounded-full"></span>
            Design Lineage
        </h3>
        
        <div className="flex flex-col items-center gap-2">
            {/* Parent Level */}
            {parent ? (
                renderNode(parent, 'parent')
            ) : (
                <div className="text-[9px] text-nc-ink-subtle italic mb-4">Original Design</div>
            )}

            {/* Current Level */}
            <div className="py-2">
                {renderNode(product, 'current')}
            </div>

            {/* Children Level */}
            {children.length > 0 && (
                <div className="relative pt-6">
                    {/* Horizontal Connector Bar if multiple children */}
                    {children.length > 1 && (
                        <div className="absolute top-0 left-8 right-8 h-0.5 bg-nc-border-strong"></div>
                    )}
                    {/* Vertical connectors from bar to children */}
                    <div className="flex gap-4 justify-center">
                        {children.map(child => (
                            <div key={child.id} className="relative pt-4">
                                {children.length > 1 && (
                                    <div className="absolute top-0 left-1/2 w-0.5 h-4 bg-nc-border-strong -translate-x-1/2"></div>
                                )}
                                {renderNode(child, 'child')}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
