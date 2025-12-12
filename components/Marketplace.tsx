
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product } from '../types';
import { ProductDetailModal } from './ProductDetailModal';
import { RunwayFeed } from './RunwayFeed';
import { ErrorBoundary } from './ErrorBoundary';

interface MarketplaceProps {
  products: Product[];
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onRemix: (product: Product) => void;
  likedProducts: Set<string>;
  onToggleLike: (id: string) => void;
  onPurchase: (product: Product) => void;
  ownedItemIds: string[];
}

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'likes';
type Category = 'All' | 'Trending' | 'Outerwear' | 'Dresses' | 'Tops' | 'Bottoms' | 'Avant-Garde';

// Product Card Component with Video Preview
const ProductCard: React.FC<{
    product: Product;
    index: number;
    isLiked: boolean;
    isOwned: boolean;
    onSelect: () => void;
    onRemix: () => void;
    onToggleLike: (e: React.MouseEvent) => void;
}> = ({ product, index, isLiked, isOwned, onSelect, onRemix, onToggleLike }) => {
    const [isHovered, setIsHovered] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoReady, setVideoReady] = useState(false);

    useEffect(() => {
        if (isHovered && videoRef.current && product.runwayVideoUrl) {
            videoRef.current.play().catch(() => {});
        } else if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [isHovered, product.runwayVideoUrl]);

    return (
        <div 
            className="group relative bg-nc-bg-elevated rounded-[1.5rem] overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-transparent hover:border-nc-accent/20 transition-all duration-500 cursor-pointer flex flex-col h-full card-lift"
            style={{ animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards ${index * 0.05}s`, opacity: 0 }}
            onClick={onSelect}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative aspect-[4/5] overflow-hidden bg-nc-bg-soft">
                {/* Main Image */}
                <img 
                    src={product.imageUrl.startsWith('http') ? product.imageUrl : `data:image/png;base64,${product.imageUrl}`} 
                    alt={product.name}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${isHovered && videoReady ? 'opacity-0' : 'opacity-100 group-hover:scale-105'}`}
                />
                
                {/* Video Preview */}
                {product.runwayVideoUrl && (
                    <video
                        ref={videoRef}
                        src={product.runwayVideoUrl}
                        muted
                        loop
                        playsInline
                        onLoadedData={() => setVideoReady(true)}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isHovered && videoReady ? 'opacity-100' : 'opacity-0'}`}
                    />
                )}
                
                {/* Technical Overlay (only if no video) */}
                {!product.runwayVideoUrl && product.cadImageUrl && isHovered && (
                    <div className="absolute inset-0 bg-white transition-opacity duration-500 flex items-center justify-center animate-fade-in">
                        <img 
                            src={product.cadImageUrl.startsWith('http') ? product.cadImageUrl : `data:image/png;base64,${product.cadImageUrl}`}
                            className="absolute inset-0 w-full h-full object-cover mix-blend-multiply"
                            alt="CAD"
                        />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-nc-ink text-white text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest opacity-90 z-10 shadow-lg">
                            Technical View
                        </div>
                    </div>
                )}
                
                {/* Quick Actions Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 flex items-end justify-center pb-6 gap-3 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRemix(); }}
                        className="bg-white/90 backdrop-blur-md text-nc-ink px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white hover:scale-105 transition-all flex items-center gap-2 shadow-xl border border-white/20"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Remix Design
                    </button>
                </div>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                    {product.runwayVideoUrl && (
                        <div className="bg-nc-ink/90 backdrop-blur-sm text-white text-[9px] font-bold px-2.5 py-1.5 rounded-md shadow-sm uppercase tracking-wide flex items-center gap-1.5 border border-white/10 animate-pulse">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Runway
                        </div>
                    )}
                    {product.cadImageUrl && (
                        <div className="bg-white/90 backdrop-blur-sm text-nc-ink text-[9px] font-bold px-2.5 py-1.5 rounded-md shadow-sm uppercase tracking-wide flex items-center gap-1.5 border border-white/50">
                            <div className="w-1.5 h-1.5 bg-nc-emerald rounded-full"></div>
                            Tech Pack
                        </div>
                    )}
                    {isOwned && (
                        <div className="bg-nc-emerald text-white text-[9px] font-bold px-2.5 py-1.5 rounded-md shadow-lg shadow-emerald-500/30 uppercase tracking-wide flex items-center gap-1 animate-fade-in">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Owned
                        </div>
                    )}
                </div>

                <button 
                    onClick={onToggleLike}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white flex items-center justify-center transition-all shadow-sm active:scale-90 z-20 group/like"
                    aria-label={isLiked ? 'Unlike' : 'Like'}
                >
                    <svg className={`w-5 h-5 transition-all ${isLiked ? 'text-nc-rose fill-nc-rose scale-110' : 'text-nc-ink-subtle group-hover/like:text-nc-rose'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </button>
            </div>
            
            <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-display font-bold text-base text-nc-ink leading-tight line-clamp-1 group-hover:text-nc-accent transition-colors">{product.name}</h3>
                    </div>
                    <p className="text-xs text-nc-ink-subtle line-clamp-2 leading-relaxed mb-4">{product.description}</p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-nc-border-subtle/50">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 border border-white flex items-center justify-center shadow-sm">
                            <span className="text-[9px] font-bold text-violet-600">{product.creator.charAt(0)}</span>
                        </div>
                        <span className="text-[10px] font-bold text-nc-ink-soft uppercase tracking-wide truncate max-w-[80px]">{product.creator}</span>
                    </div>
                    <span className="text-sm font-bold text-nc-ink font-mono">${product.price}</span>
                </div>
            </div>
        </div>
    );
};

export const Marketplace: React.FC<MarketplaceProps> = ({ 
    products, onShowToast, onRemix, likedProducts, onToggleLike, onPurchase, ownedItemIds 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'mine'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  
  const [viewMode, setViewMode] = useState<'grid' | 'runway'>('grid');

  const handlePurchase = (product: Product) => {
    onPurchase(product);
    setSelectedProduct(null);
  };

  const handleRemixAction = (product: Product) => {
    setSelectedProduct(null);
    onRemix(product);
  };

  const toggleLike = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    onToggleLike(productId);
  };

  const getCategory = (p: Product): Category => {
      const text = (p.name + p.description).toLowerCase();
      if (text.includes('jacket') || text.includes('coat') || text.includes('parka') || text.includes('vest')) return 'Outerwear';
      if (text.includes('dress') || text.includes('gown')) return 'Dresses';
      if (text.includes('shirt') || text.includes('top') || text.includes('blouse') || text.includes('sweater') || text.includes('knit')) return 'Tops';
      if (text.includes('pant') || text.includes('skirt') || text.includes('denim') || text.includes('jeans') || text.includes('legging')) return 'Bottoms';
      if (text.includes('glass') || text.includes('structure') || text.includes('sculptural') || text.includes('3d printed') || text.includes('cyber') || text.includes('tech')) return 'Avant-Garde';
      return 'All';
  };

  const filteredProducts = useMemo(() => {
    const result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterMode === 'all' ? true : p.creator === 'You';
      const matchesCategory = activeCategory === 'All' 
          ? true 
          : activeCategory === 'Trending' 
            ? p.likes >= 10
            : getCategory(p) === activeCategory;
      
      return matchesSearch && matchesFilter && matchesCategory;
    });

    result.sort((a, b) => {
        switch (sortOption) {
            case 'price-asc': return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            case 'likes': return b.likes - a.likes;
            case 'newest': 
            default:
                return parseInt(b.id) - parseInt(a.id);
        }
    });

    return result;
  }, [products, searchTerm, filterMode, sortOption, activeCategory]);

  const getRelatedProducts = (currentId: string) => {
      return products
        .filter(p => p.id !== currentId)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
  };

  const categories: Category[] = ['All', 'Trending', 'Outerwear', 'Dresses', 'Tops', 'Bottoms', 'Avant-Garde'];

  const handleSelectProduct = (product: Product) => {
    try {
      setSelectedProduct(product);
    } catch (e) {
      console.error('Failed to open product detail', e);
      onShowToast('error', 'Unable to open design. Please retry.');
    }
  };

  if (viewMode === 'runway') {
      return (
          <div className="h-full relative bg-black">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/50 backdrop-blur-md rounded-full p-1 border border-white/20 flex gap-1">
                  <button 
                      onClick={() => setViewMode('grid')}
                      className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors"
                  >
                      Catalog
                  </button>
                  <button 
                      onClick={() => setViewMode('runway')}
                      className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-black shadow-lg"
                  >
                      Runway Live
                  </button>
              </div>
              <RunwayFeed 
                  products={filteredProducts}
                  onRemix={onRemix}
                  onPurchase={onPurchase}
                  onToggleLike={onToggleLike}
                  likedProducts={likedProducts}
              />
          </div>
      );
  }

  return (
    <div className="min-h-full pb-32 bg-nc-bg">
      
      {selectedProduct && (
        <ErrorBoundary key={selectedProduct.id}>
          <ProductDetailModal 
            product={selectedProduct}
            relatedProducts={getRelatedProducts(selectedProduct.id)} 
            onClose={() => setSelectedProduct(null)} 
            onPurchase={handlePurchase}
            onRemix={handleRemixAction}
            isOwned={ownedItemIds.includes(selectedProduct.id)}
          />
        </ErrorBoundary>
      )}

      {/* Hero Header */}
      <div className="relative pt-24 pb-12 px-6 overflow-hidden bg-nc-bg-elevated border-b border-nc-border-subtle">
         <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--nc-bg-soft)_0%,_transparent_70%)]"></div>

         <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-end justify-between gap-10 relative z-10 mb-10">
            <div className="animate-fade-in-up">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-px w-8 bg-nc-gold"></div>
                    <span className="text-nc-ink-soft text-[10px] font-bold uppercase tracking-[0.25em]">Global Ecosystem</span>
                </div>
                <h2 className="text-6xl md:text-7xl font-display text-nc-ink tracking-tight leading-none mb-4">
                    The <span className="italic text-nc-ink-soft font-light">Atelier</span> Collection
                </h2>
                <p className="text-nc-ink-soft text-lg font-light max-w-lg leading-relaxed">
                    Discover production-ready designs generated by the Banana Couture community. From concept to CAD in seconds.
                </p>
            </div>

            {/* View Toggle & Search */}
            <div className="flex flex-col gap-4 items-end w-full md:w-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex bg-nc-bg-elevated shadow-nc-soft border border-nc-border-subtle rounded-full p-1 gap-1">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${(viewMode as string) === 'grid' ? 'bg-nc-ink text-white shadow-md' : 'text-nc-ink-subtle hover:text-nc-ink hover:bg-nc-bg-soft'}`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        Catalog
                    </button>
                    <button 
                        onClick={() => setViewMode('runway')}
                        className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${(viewMode as string) === 'runway' ? 'bg-nc-ink text-white shadow-md' : 'text-nc-ink-subtle hover:text-nc-ink hover:bg-nc-bg-soft'}`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                        Runway
                    </button>
                </div>

                <div className="flex bg-nc-bg-elevated shadow-nc-soft border border-nc-border-subtle rounded-full p-2 items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-nc-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input 
                            type="text" 
                            placeholder="Search materials, styles..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-transparent rounded-full text-base md:text-sm text-nc-ink placeholder-nc-ink-subtle outline-none font-medium"
                        />
                    </div>
                    <div className="w-px h-6 bg-nc-border-strong opacity-20"></div>
                    <button onClick={() => setFilterMode(filterMode === 'all' ? 'mine' : 'all')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filterMode === 'mine' ? 'bg-nc-accent-soft text-nc-accent-strong' : 'text-nc-ink-subtle hover:text-nc-ink'}`}>
                        {filterMode === 'all' ? 'All' : 'My Designs'}
                    </button>
                </div>
            </div>
         </div>

         {/* Category Pills */}
         <div className="max-w-[1400px] mx-auto overflow-x-auto custom-scrollbar pb-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
             <div className="flex gap-3">
                 {categories.map(cat => (
                     <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all whitespace-nowrap ${
                            activeCategory === cat 
                            ? 'bg-nc-ink text-nc-bg-elevated border-nc-ink shadow-lg shadow-nc-ink/10' 
                            : 'bg-transparent text-nc-ink-soft border-transparent hover:bg-nc-bg-elevated hover:border-nc-border-subtle hover:text-nc-ink'
                        }`}
                     >
                         {cat}
                     </button>
                 ))}
             </div>
         </div>
      </div>

      {/* Grid Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-12 relative z-20">
        <div className="flex justify-between items-end mb-8 border-b border-nc-border-subtle pb-4">
             <span className="text-xs font-bold text-nc-ink-subtle uppercase tracking-[0.15em]">
                 Showing {filteredProducts.length} Designs
             </span>
             
             <div className="relative group">
                <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="appearance-none bg-transparent text-xs font-bold text-nc-ink py-2 pr-8 cursor-pointer outline-none hover:text-nc-accent transition-colors text-right uppercase tracking-wider"
                    aria-label="Sort products"
                >
                    <option value="newest">Newest First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="likes">Most Popular</option>
                </select>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-nc-ink-subtle">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
             </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-40 flex flex-col items-center justify-center opacity-60">
             <div className="w-32 h-32 bg-nc-bg-elevated rounded-full flex items-center justify-center mb-6 shadow-nc-soft border border-nc-border-subtle">
                 <svg className="w-10 h-10 text-nc-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
             </div>
             <h3 className="text-xl font-display text-nc-ink mb-2">No designs found</h3>
             <p className="text-sm text-nc-ink-subtle">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product, index) => (
                <ProductCard 
                    key={product.id}
                    product={product}
                    index={index}
                    isLiked={likedProducts.has(product.id)}
                    isOwned={ownedItemIds.includes(product.id)}
                    onSelect={() => handleSelectProduct(product)}
                    onRemix={() => onRemix(product)}
                    onToggleLike={(e) => toggleLike(e, product.id)}
                />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
