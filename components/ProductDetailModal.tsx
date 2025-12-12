
import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { BomParser } from './BomParser';
import { LazyImage } from './LazyImage';
import { estimateImpact } from '../utils/bomUtils';
import { DesignGenealogy } from './DesignGenealogy';

interface ProductDetailModalProps {
  product: Product;
  relatedProducts?: Product[];
  onClose: () => void;
  onPurchase: (product: Product) => void;
  onRemix?: (product: Product) => void;
  isOwned?: boolean;
}

interface Comment {
  id: string;
  userName: string;
  text: string;
  timestamp: number;
}

const EcoGraph: React.FC<{ score: number }> = ({ score }) => {
    // Determine color based on score (0-5)
    let color = 'bg-red-500';
    if (score >= 2) color = 'bg-amber-500';
    if (score >= 4) color = 'bg-emerald-500';

    return (
        <div className="flex items-end gap-1 h-8 w-24">
            {[1, 2, 3, 4, 5].map(i => (
                <div 
                    key={i} 
                    className={`flex-1 rounded-t-sm transition-all duration-500 ${i <= score ? color : 'bg-nc-border-subtle'}`}
                    style={{ height: `${20 * i}%` }}
                ></div>
            ))}
        </div>
    );
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product: initialProduct, relatedProducts, onClose, onPurchase, onRemix, isOwned }) => {
  // Local state to handle navigation within modal via lineage
  const [product, setProduct] = useState(initialProduct);
  const [activeTab, setActiveTab] = useState<'concept' | 'cad' | 'video'>('concept');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Reset when initial prop changes
  useEffect(() => {
      setProduct(initialProduct);
  }, [initialProduct.id]);

  useEffect(() => {
    try {
        const stored = localStorage.getItem('nanoFashion_comments');
        if (stored) {
            const allComments = JSON.parse(stored);
            setComments(allComments[product.id] || []);
        }
    } catch (e) {
        console.error("Failed to load comments", e);
    }
  }, [product.id]);

  // Load all products for genealogy lookup
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  useEffect(() => {
      try {
          const stored = localStorage.getItem('nanoFashion_products');
          const localProducts = stored ? JSON.parse(stored) : [];
          setAllProducts([product, ...(relatedProducts || []), ...localProducts]); 
      } catch (e) {}
  }, [product, relatedProducts]);

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
        id: Date.now().toString(),
        userName: 'Felix Designer',
        text: newComment.trim(),
        timestamp: Date.now()
    };
    const updatedComments = [comment, ...comments];
    setComments(updatedComments);
    setNewComment('');
    try {
        const stored = JSON.parse(localStorage.getItem('nanoFashion_comments') || '{}');
        stored[product.id] = updatedComments;
        localStorage.setItem('nanoFashion_comments', JSON.stringify(stored));
    } catch (e) { console.error(e); }
  };

  const handlePurchaseClick = () => {
    setIsPurchasing(true);
    setTimeout(() => {
      setIsPurchasing(false);
      onPurchase(product);
    }, 1500);
  };

  // Safe conversion of materials to string for impact estimation
  const impact = React.useMemo(() => {
      return estimateImpact(product.materials);
  }, [product.materials]);
  
  const currentImage = activeTab === 'concept' ? product.imageUrl : product.cadImageUrl;
  const imageSrc = currentImage?.startsWith('http') ? currentImage : `data:image/png;base64,${currentImage}`;

  const formatTime = (timestamp: number) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diff = (timestamp - Date.now()) / 1000;
    if (diff > -60) return 'Just now';
    if (diff > -3600) return rtf.format(Math.ceil(diff / 60), 'minute');
    if (diff > -86400) return rtf.format(Math.ceil(diff / 3600), 'hour');
    return rtf.format(Math.ceil(diff / 86400), 'day');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-nc-ink/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-7xl bg-nc-bg-elevated rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] animate-scale-in border border-white/10 ring-1 ring-black/5">
        
        {/* Left Side: Visuals (Warm Dark Theme) */}
        <div className="w-full md:w-[55%] bg-[#1A0F0F] relative flex flex-col h-1/2 md:h-full group">
          {/* Top Controls */}
          <div className="absolute top-6 left-6 z-20 flex gap-1 bg-white/5 backdrop-blur-md p-1 rounded-full border border-white/10">
             <button 
                onClick={() => setActiveTab('concept')} 
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'concept' ? 'bg-white text-nc-ink shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
             >
                Concept
             </button>
             {product.cadImageUrl && (
                 <button 
                    onClick={() => setActiveTab('cad')} 
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'cad' ? 'bg-white text-nc-ink shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                 >
                    Technical
                 </button>
             )}
             {product.runwayVideoUrl && (
                 <button 
                    onClick={() => setActiveTab('video')} 
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'video' ? 'bg-white text-nc-ink shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                 >
                    Runway
                 </button>
             )}
          </div>

          <button onClick={onClose} className="absolute top-6 right-6 z-20 p-2 bg-white/5 hover:bg-white/20 text-white/70 hover:text-white rounded-full transition-colors backdrop-blur-md border border-white/10">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {/* Main Visual */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[radial-gradient(circle_at_center,_#2A1A1A_0%,_#0F0505_100%)]">
             {/* Decorative Grid */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-50"></div>
             
             {activeTab === 'video' && product.runwayVideoUrl ? (
                 <div className="w-full h-full flex items-center justify-center bg-black relative shadow-2xl">
                     <video src={product.runwayVideoUrl} className="w-full h-full object-cover" controls autoPlay loop />
                 </div>
             ) : (
                <div className="relative w-full h-full flex items-center justify-center p-12 transition-all duration-500">
                    <LazyImage 
                        src={imageSrc} 
                        alt={product.name} 
                        className={`max-w-full max-h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-700 ${activeTab === 'cad' ? 'invert filter brightness-0 contrast-200 opacity-90' : 'group-hover:scale-105'}`} 
                        containerClassName="w-full h-full flex items-center justify-center" 
                    />
                </div>
             )}
          </div>
        </div>

        {/* Right Side: Details (Warm Light Theme) */}
        <div className="w-full md:w-[45%] flex flex-col bg-nc-bg h-1/2 md:h-full relative text-nc-ink">
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10 pb-32">
              
              {/* Header Info */}
              <div className="mb-10 animate-slide-up-fade">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="bg-nc-ink text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md">
                            Collection 001
                        </span>
                        {impact && (
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${impact.sustainabilityRating === 'Eco-focused' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-nc-border-strong text-nc-ink-soft'}`}>
                                {impact.sustainabilityRating}
                            </span>
                        )}
                    </div>
                    {impact && <EcoGraph score={impact.ecoScore} />}
                </div>
                
                <h2 className="text-4xl md:text-5xl font-display font-medium text-nc-ink mb-4 leading-tight">
                    {product.name}
                </h2>
                
                <div className="flex items-center justify-between border-b border-nc-border-subtle pb-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nc-accent to-pink-400 p-[1px]">
                            <div className="w-full h-full rounded-full bg-nc-bg-elevated flex items-center justify-center text-xs font-bold text-nc-accent-strong">
                                {product.creator.charAt(0)}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-nc-ink-subtle uppercase tracking-wider">Designer</span>
                            <span className="text-xs font-bold text-nc-ink">{product.creator}</span>
                        </div>
                    </div>
                    {isOwned && (
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            <span className="text-[10px] font-bold uppercase tracking-wide">Authentic Owner</span>
                        </div>
                    )}
                </div>

                <p className="text-nc-ink-soft text-sm leading-7 font-light mb-6">
                    {product.description || "A revolutionary garment generated by the NanoFashion neural engine. Features parametric adaptability and sustainable virtual-to-physical workflows."}
                </p>

                {onRemix && (
                    <div className="flex justify-start">
                        <button 
                            onClick={() => onRemix(product)} 
                            className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-nc-accent hover:text-nc-accent-strong transition-colors border-b border-transparent hover:border-nc-accent pb-0.5"
                        >
                            <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Remix Genetic Code
                        </button>
                    </div>
                )}
              </div>

              {/* Design Genealogy */}
              <div className="mb-10 animate-slide-up-fade" style={{ animationDelay: '0.05s' }}>
                  <DesignGenealogy 
                    product={product} 
                    allProducts={allProducts} 
                    onSelectProduct={setProduct} 
                  />
              </div>

              {/* Material Composition */}
              {product.materials && (
                <div className="mb-10 animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
                   <h3 className="text-xs font-bold text-nc-ink-subtle uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                       <span className="w-1 h-1 bg-nc-ink rounded-full"></span>
                       Fabrication & BOM
                   </h3>
                   <div className="bg-nc-bg-elevated p-6 rounded-xl border border-nc-border-subtle shadow-sm hover:shadow-md transition-shadow">
                       <BomParser markdown={product.materials} />
                   </div>
                </div>
              )}

              {/* Related */}
              {relatedProducts && relatedProducts.length > 0 && (
                  <div className="mb-10 animate-slide-up-fade" style={{ animationDelay: '0.15s' }}>
                      <h3 className="text-xs font-bold text-nc-ink-subtle uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <span className="w-1 h-1 bg-nc-ink rounded-full"></span>
                          More from Collection
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                          {relatedProducts.map(rp => (
                              <div key={rp.id} className="group cursor-pointer" onClick={() => setProduct(rp)}>
                                  <div className="aspect-[4/5] rounded-lg overflow-hidden bg-nc-bg-soft mb-3 relative shadow-inner">
                                      <LazyImage 
                                        src={rp.imageUrl.startsWith('http') ? rp.imageUrl : `data:image/png;base64,${rp.imageUrl}`} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                  </div>
                                  <div className="text-[10px] font-bold text-nc-ink truncate font-display">{rp.name}</div>
                                  <div className="text-[9px] text-nc-ink-subtle">${rp.price}</div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* Discussion */}
              <div className="mb-8 animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
                  <h3 className="text-xs font-bold text-nc-ink-subtle uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <span className="w-1 h-1 bg-nc-ink rounded-full"></span>
                      Critique & Feedback
                  </h3>
                  
                  {/* New Comment Input */}
                  <div className="flex gap-3 mb-8">
                      <div className="w-8 h-8 rounded-full bg-nc-bg-soft flex items-center justify-center text-xs font-bold text-nc-ink-soft border border-nc-border-subtle">
                          FD
                      </div>
                      <div className="flex-1 relative">
                          <textarea 
                            value={newComment} 
                            onChange={(e) => setNewComment(e.target.value)} 
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }} 
                            placeholder="Add a design note..." 
                            className="w-full bg-nc-bg-elevated border border-nc-border-subtle rounded-xl p-4 text-xs text-nc-ink h-24 transition-all focus:ring-1 focus:ring-nc-ink focus:border-nc-ink outline-none resize-none placeholder:text-nc-ink-subtle shadow-sm" 
                          />
                          <button 
                            onClick={handlePostComment} 
                            disabled={!newComment.trim()} 
                            className="absolute bottom-3 right-3 bg-nc-ink text-white hover:bg-nc-ink-soft px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide disabled:opacity-50 transition-colors shadow-lg"
                          >
                            Post
                          </button>
                      </div>
                  </div>

                  <div className="space-y-6">
                      {comments.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-nc-border-subtle rounded-xl bg-nc-bg-soft/30">
                          <p className="text-xs text-nc-ink-subtle italic">No critiques yet. Start the conversation.</p>
                        </div>
                      ) : comments.map((comment) => (
                          <div key={comment.id} className="flex gap-4 animate-fade-in group">
                              <div className="w-8 h-8 rounded-full bg-nc-bg-elevated border border-nc-border-subtle overflow-hidden flex-shrink-0 shadow-sm">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userName}`} alt={comment.userName} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 bg-nc-bg-elevated p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-nc-border-subtle shadow-sm group-hover:shadow-md transition-shadow">
                                <div className="flex items-baseline justify-between mb-1">
                                    <span className="text-xs font-bold text-nc-ink">{comment.userName}</span>
                                    <span className="text-[9px] text-nc-ink-subtle uppercase tracking-wide">{formatTime(comment.timestamp)}</span>
                                </div>
                                <p className="text-xs text-nc-ink-soft leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                              </div>
                          </div>
                      ))}
                      <div ref={commentsEndRef}></div>
                  </div>
              </div>
          </div>

          {/* Sticky Purchase Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-nc-bg-elevated/90 backdrop-blur-xl border-t border-nc-border-subtle z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
             <div className="flex justify-between items-center mb-4">
                 <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-nc-ink-subtle uppercase tracking-widest mb-0.5">Commercial License</span>
                     <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Blockchain Verified
                     </span>
                 </div>
                 <div className="text-right">
                     <span className="text-3xl font-display text-nc-ink">${product.price}</span>
                 </div>
             </div>
             
             <button 
                onClick={handlePurchaseClick} 
                disabled={isPurchasing || isOwned}
                className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-[0.15em] shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-80 disabled:cursor-not-allowed group overflow-hidden relative ${
                    isOwned 
                    ? 'bg-emerald-600 text-white cursor-default' 
                    : 'bg-gradient-to-r from-nc-gold to-amber-500 text-white hover:shadow-amber-400/30'
                }`}
             >
               {/* Shine Effect */}
               {!isOwned && <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] group-hover:animate-[shimmer_1.5s_infinite]"></div>}
               
               {isOwned ? (
                   <>
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                       Asset in Wardrobe
                   </>
               ) : (
                   isPurchasing ? (
                       <span className="flex items-center gap-2">
                           <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                           Verifying Transaction...
                       </span>
                   ) : (
                       "Acquire License"
                   )
               )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
