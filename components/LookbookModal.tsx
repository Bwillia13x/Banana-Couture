
import React, { useRef } from 'react';
import { Product, LookbookContent } from '../types';
import { LazyImage } from './LazyImage';
import { bomToString } from '../utils/bomUtils';

interface LookbookModalProps {
  content: LookbookContent;
  products: Product[];
  onClose: () => void;
}

export const LookbookModal: React.FC<LookbookModalProps> = ({ content, products, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  // Helper to get product by ID
  const getProduct = (id: string) => products.find(p => p.id === id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-md overflow-hidden animate-fade-in">
      
      {/* Controls */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-white/5 border-b border-white/10 flex items-center justify-between px-6 z-50 backdrop-blur-xl print:hidden">
         <div className="flex items-center gap-4">
             <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
             <h2 className="text-white font-bold text-sm uppercase tracking-widest">Lookbook Preview</h2>
         </div>
         <button 
            onClick={handlePrint}
            className="px-6 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2"
         >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
             Export PDF
         </button>
      </div>

      {/* Document Viewer */}
      <div className="w-full h-full overflow-y-auto custom-scrollbar pt-24 pb-12 flex justify-center bg-[#1a1a1a]">
          <div ref={printRef} className="w-full max-w-[210mm] bg-white min-h-[297mm] shadow-2xl print:shadow-none print:w-full print:max-w-none">
              
              {/* PAGE 1: COVER */}
              <div className="w-full h-[297mm] relative flex flex-col p-12 break-after-page print:break-after-page">
                  {/* Hero Image Background */}
                  <div className="absolute inset-0 z-0">
                      {products[0] && (
                          <img 
                            src={products[0].imageUrl.startsWith('http') ? products[0].imageUrl : `data:image/png;base64,${products[0].imageUrl}`} 
                            className="w-full h-full object-cover opacity-90"
                            alt="Cover"
                          />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>
                  </div>

                  {/* Brand Mark */}
                  <div className="relative z-10 flex justify-between items-start text-white mix-blend-difference">
                      <h1 className="text-4xl font-black tracking-tighter uppercase">NANO</h1>
                      <span className="text-sm font-mono tracking-widest">{new Date().getFullYear()}</span>
                  </div>

                  {/* Title Section */}
                  <div className="relative z-10 mt-auto">
                      <div className="flex flex-wrap gap-2 mb-6">
                          {content.themeTags.map(tag => (
                              <span key={tag} className="px-3 py-1 border border-white/30 text-white text-[10px] uppercase tracking-widest backdrop-blur-sm">
                                  {tag}
                              </span>
                          ))}
                      </div>
                      <h2 className="text-7xl font-display text-white mb-2 leading-none">{content.title}</h2>
                      <p className="text-xl text-white/80 font-light uppercase tracking-widest mb-12">{content.season} Collection</p>
                      
                      <div className="border-t border-white/30 pt-6 max-w-md">
                          <p className="text-sm text-white/90 leading-relaxed font-serif italic">
                              "{content.narrative}"
                          </p>
                      </div>
                  </div>
              </div>

              {/* LOOKS PAGES (2 Looks per page) */}
              <div className="bg-white text-black">
                  {content.looks.map((look, index) => {
                      const product = getProduct(look.productId);
                      if (!product) return null;
                      
                      const isEven = index % 2 === 0;
                      
                      return (
                          <div key={look.productId} className={`flex flex-col h-[148mm] relative overflow-hidden ${index > 0 && index % 2 === 0 ? 'break-before-page print:break-before-page' : ''} border-b border-gray-100`}>
                              <div className="flex h-full">
                                  {/* Image Side */}
                                  <div className={`w-1/2 h-full relative ${isEven ? 'order-1' : 'order-2'}`}>
                                      <img 
                                        src={product.imageUrl.startsWith('http') ? product.imageUrl : `data:image/png;base64,${product.imageUrl}`} 
                                        className="w-full h-full object-cover"
                                        alt={product.name}
                                      />
                                      {/* Look Number */}
                                      <div className="absolute bottom-6 left-6 text-8xl font-black text-white/20 leading-none">
                                          {String(index + 1).padStart(2, '0')}
                                      </div>
                                  </div>

                                  {/* Text Side */}
                                  <div className={`w-1/2 h-full p-12 flex flex-col justify-center ${isEven ? 'order-2' : 'order-1'} bg-white`}>
                                      <div className="mb-auto text-[10px] text-gray-400 font-bold uppercase tracking-widest flex justify-between">
                                          <span>Look {index + 1}</span>
                                          <span>{product.id.substring(0, 6)}</span>
                                      </div>
                                      
                                      <h3 className="text-3xl font-display text-gray-900 mb-4">{product.name}</h3>
                                      <p className="text-lg text-gray-500 font-serif italic mb-8 leading-relaxed">
                                          "{look.caption}"
                                      </p>
                                      
                                      <div className="space-y-6">
                                          <div>
                                              <h4 className="text-[10px] font-bold text-black uppercase tracking-widest mb-2 border-b border-black pb-1 inline-block">Stylist Note</h4>
                                              <p className="text-xs text-gray-600 leading-relaxed">
                                                  {look.stylingNotes}
                                              </p>
                                          </div>
                                          
                                          {product.materials && (
                                              <div>
                                                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Key Materials</h4>
                                                  <p className="text-xs text-gray-500 font-mono">
                                                      {/* Safely convert BOM to string, filter for key items */}
                                                      {bomToString(product.materials)
                                                          .split('\n')
                                                          .filter(l => l.includes('**') || l.includes('-'))
                                                          .slice(0, 2)
                                                          .map(l => l.replace(/[*#-]/g, '').trim())
                                                          .join(', ')
                                                      }
                                                  </p>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      );
                  })}
              </div>

              {/* BACK COVER */}
              <div className="w-full h-[297mm] flex flex-col items-center justify-center bg-black text-white p-12 break-before-page print:break-before-page">
                  <h2 className="text-6xl font-black tracking-tighter uppercase mb-4">NANO</h2>
                  <p className="text-xs uppercase tracking-[0.3em] opacity-60">The Future of Fashion</p>
                  
                  <div className="mt-24 text-center space-y-2 opacity-40 text-xs font-mono">
                      <p>Generated by Banana Couture AI</p>
                      <p>Design & Engineering by Gemini 3.0</p>
                      <p>{new Date().toLocaleDateString()}</p>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};
