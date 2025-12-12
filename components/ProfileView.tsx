
import React, { useState, useEffect } from 'react';
import { Product, SavedDraft, UserStats, Badge, LookbookContent, BrandIdentity } from '../types';
import { generateLookbookContent } from '../services/geminiService';
import { LazyImage } from './LazyImage';
import { LookbookModal } from './LookbookModal';
import { BrandBuilder } from './BrandBuilder';
import { StylingRoom } from './StylingRoom';

interface ProfileViewProps {
  products: Product[];
  onRemixDraft: (draft: SavedDraft) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
  likedProducts: Set<string>;
  onToggleLike: (id: string) => void;
  userStats: UserStats;
}

const BADGES: Record<string, Badge> = {
  'early-adopter': { id: 'early-adopter', name: 'Early Adopter', icon: '🚀', description: 'Joined during beta.', condition: 'Join early' },
  'trendsetter': { id: 'trendsetter', name: 'Trendsetter', icon: '🔥', description: 'Received 10+ likes on a design.', condition: '10 Likes' },
  'prolific': { id: 'prolific', name: 'Prolific', icon: '🎨', description: 'Published 5+ designs.', condition: '5 Designs' },
  'challenger': { id: 'challenger', name: 'Challenger', icon: '🏆', description: 'Won a daily design challenge.', condition: 'Win Challenge' }
};

// SVG Radar Chart Component
const StyleRadarChart: React.FC<{ products: Product[] }> = ({ products }) => {
    // Simple heuristic analysis based on description keywords
    const calculateScores = () => {
        const scores = { AvantGarde: 0, Minimalist: 0, Streetwear: 0, Vintage: 0, Tech: 0 };
        let count = 0;
        
        products.forEach(p => {
            const text = (p.name + p.description).toLowerCase();
            if (text.includes('future') || text.includes('neon') || text.includes('cyber') || text.includes('tech')) scores.Tech += 1;
            if (text.includes('minimal') || text.includes('clean') || text.includes('simple')) scores.Minimalist += 1;
            if (text.includes('street') || text.includes('urban') || text.includes('oversize')) scores.Streetwear += 1;
            if (text.includes('vintage') || text.includes('retro') || text.includes('classic')) scores.Vintage += 1;
            if (text.includes('avant') || text.includes('structure') || text.includes('art')) scores.AvantGarde += 1;
            count++;
        });

        if (count === 0) return { AvantGarde: 20, Minimalist: 20, Streetwear: 20, Vintage: 20, Tech: 20 };

        // Normalize to 100 max
        const max = Math.max(...Object.values(scores), 1);
        return {
            AvantGarde: (scores.AvantGarde / max) * 100,
            Minimalist: (scores.Minimalist / max) * 100,
            Streetwear: (scores.Streetwear / max) * 100,
            Vintage: (scores.Vintage / max) * 100,
            Tech: (scores.Tech / max) * 100
        };
    };

    const data = calculateScores();
    const size = 120;
    const center = size / 2;
    const radius = size * 0.4;
    
    // Coordinates
    const points = [
        [center, center - (data.AvantGarde/100) * radius], // Top
        [center + (data.Tech/100) * radius * 0.95, center - (data.Tech/100) * radius * 0.31], // Top Right
        [center + (data.Streetwear/100) * radius * 0.59, center + (data.Streetwear/100) * radius * 0.81], // Bottom Right
        [center - (data.Vintage/100) * radius * 0.59, center + (data.Vintage/100) * radius * 0.81], // Bottom Left
        [center - (data.Minimalist/100) * radius * 0.95, center - (data.Minimalist/100) * radius * 0.31] // Top Left
    ].map(p => p.join(',')).join(' ');

    return (
        <div className="relative w-[120px] h-[120px] flex items-center justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-0">
                {/* Background Web */}
                <polygon points={`${center},${center-radius} ${center+radius*0.95},${center-radius*0.31} ${center+radius*0.59},${center+radius*0.81} ${center-radius*0.59},${center+radius*0.81} ${center-radius*0.95},${center-radius*0.31}`} fill="none" stroke="#E2E8F0" strokeWidth="1" />
                <polygon points={`${center},${center-radius*0.5} ${center+radius*0.475},${center-radius*0.155} ${center+radius*0.295},${center+radius*0.405} ${center-radius*0.295},${center+radius*0.405} ${center-radius*0.475},${center-radius*0.155}`} fill="none" stroke="#E2E8F0" strokeWidth="1" />
                
                {/* Data Shape */}
                <polygon points={points} fill="rgba(151, 71, 255, 0.2)" stroke="#9747FF" strokeWidth="2" />
                
                {/* Points */}
                <circle cx={center} cy={center - (data.AvantGarde/100) * radius} r="2" fill="#DCA54A" />
            </svg>
            {/* Labels */}
            <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[8px] text-nc-ink-subtle uppercase font-bold">Avant</span>
            <span className="absolute top-[30%] right-[-5px] text-[8px] text-nc-ink-subtle uppercase font-bold">Tech</span>
            <span className="absolute bottom-[10%] right-0 text-[8px] text-nc-ink-subtle uppercase font-bold">Street</span>
            <span className="absolute bottom-[10%] left-0 text-[8px] text-nc-ink-subtle uppercase font-bold">Retro</span>
            <span className="absolute top-[30%] left-[-5px] text-[8px] text-nc-ink-subtle uppercase font-bold">Minim</span>
        </div>
    );
};

export const ProfileView: React.FC<ProfileViewProps> = ({ products, onRemixDraft, onShowToast, likedProducts, onToggleLike, userStats }) => {
  const [activeTab, setActiveTab] = useState<'published' | 'drafts' | 'favorites' | 'wardrobe'>('published');
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [brandIdentity, setBrandIdentity] = useState<BrandIdentity | null>(null);
  const [showBrandBuilder, setShowBrandBuilder] = useState(false);
  const [showStylingRoom, setShowStylingRoom] = useState(false);
  
  // Selection State for Lookbook
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isGeneratingLookbook, setIsGeneratingLookbook] = useState(false);
  const [lookbookContent, setLookbookContent] = useState<LookbookContent | null>(null);
  
  const myProducts = products.filter(p => p.creator === 'You');
  const favoriteProducts = products.filter(p => likedProducts.has(p.id));
  const ownedProducts = products.filter(p => userStats.ownedItemIds.includes(p.id));

  const totalLikes = myProducts.reduce((sum, p) => sum + p.likes, 0);
  const totalRevenue = myProducts.reduce((sum, p) => sum + p.price * 0.1, 0);

  useEffect(() => {
    try {
        const saved = localStorage.getItem('nanoFashion_drafts');
        if (saved) {
            setSavedDrafts(JSON.parse(saved));
        }
        const savedIdentity = localStorage.getItem('nanoFashion_brandIdentity');
        if (savedIdentity) {
            setBrandIdentity(JSON.parse(savedIdentity));
        }
    } catch (e) {
        console.error("Failed to load profile data", e);
    }
  }, []);

  const handleBrandComplete = (identity: BrandIdentity) => {
      setBrandIdentity(identity);
      localStorage.setItem('nanoFashion_brandIdentity', JSON.stringify(identity));
      setShowBrandBuilder(false);
      onShowToast('success', 'Brand Identity Created');
  };

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedProductIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedProductIds(newSet);
  };

  const handleGenerateLookbook = async () => {
      if (selectedProductIds.size < 2) {
          onShowToast('error', 'Select at least 2 looks for a lookbook.');
          return;
      }
      
      setIsGeneratingLookbook(true);
      const selectedProducts = products.filter(p => selectedProductIds.has(p.id));
      
      try {
          const content = await generateLookbookContent(selectedProducts, brandIdentity?.name || "New Collection");
          setLookbookContent(content);
          setIsSelectionMode(false);
          setSelectedProductIds(new Set());
      } catch (e: any) {
          onShowToast('error', e.message);
      } finally {
          setIsGeneratingLookbook(false);
      }
  };

  const renderProductGrid = (items: Product[], allowSelection = false) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((product, index) => {
            const isLiked = likedProducts.has(product.id);
            const displayLikes = product.likes + (isLiked ? 1 : 0);
            const isSelected = selectedProductIds.has(product.id);

            return (
                <div 
                  key={product.id} 
                  className={`bg-nc-bg-elevated border rounded-nc-xl overflow-hidden group transition-all card-lift relative ${
                      isSelected ? 'border-nc-accent ring-2 ring-nc-accent shadow-nc-elevated' : 'border-nc-border-subtle hover:shadow-nc-card hover:border-nc-accent-soft'
                  }`}
                  style={{ animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards ${index * 0.05}s`, opacity: 0 }}
                  onClick={isSelectionMode && allowSelection ? () => toggleSelection(product.id) : undefined}
                >
                    <div className="aspect-[4/5] relative bg-nc-bg-soft">
                        <LazyImage src={product.imageUrl.startsWith('http') ? product.imageUrl : `data:image/png;base64,${product.imageUrl}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        
                        {/* Selection Checkbox */}
                        {isSelectionMode && allowSelection && (
                            <div className={`absolute top-3 left-3 z-30 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected ? 'bg-nc-accent border-nc-accent text-white' : 'bg-white/50 border-white text-transparent'
                            }`}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                        )}

                        <button 
                            onClick={(e) => { e.stopPropagation(); onToggleLike(product.id); }}
                            className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full glass hover:bg-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm focus-ring"
                        >
                            <svg className={`w-4 h-4 transition-colors ${isLiked ? 'text-nc-rose fill-nc-rose' : 'text-nc-ink-subtle'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>

                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <h3 className="text-nc-ink font-bold text-sm truncate">{product.name}</h3>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-nc-ink-soft">{displayLikes} Likes</span>
                                <span className="text-xs text-nc-emerald font-mono">${product.price}</span>
                            </div>
                            {product.remixedFrom && (
                                <p className="text-[9px] text-nc-accent mt-2">Remixed from {product.remixedFrom.creator}</p>
                            )}
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
  );

  return (
    <div className="min-h-full pb-32 pt-10 bg-nc-bg">
      
      {lookbookContent && (
          <LookbookModal 
            content={lookbookContent} 
            products={products.filter(p => selectedProductIds.has(p.id))} 
            onClose={() => setLookbookContent(null)} 
          />
      )}

      {showBrandBuilder && (
          <BrandBuilder 
              productImages={myProducts.map(p => p.imageUrl.startsWith('http') ? p.imageUrl : `data:image/png;base64,${p.imageUrl}`)}
              onComplete={handleBrandComplete}
              onClose={() => setShowBrandBuilder(false)}
              onShowToast={onShowToast}
          />
      )}

      {showStylingRoom && (
          <StylingRoom
              inventory={ownedProducts}
              onClose={() => setShowStylingRoom(false)}
              onShowToast={onShowToast}
          />
      )}

      {/* Header / Bio Section */}
      <div className="max-w-5xl mx-auto px-6 mb-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar Card */}
              <div className="w-full md:w-64 flex-shrink-0 glass rounded-nc-xl p-6 flex flex-col items-center text-center shadow-nc-card relative overflow-hidden z-10 animate-fade-in-up border border-nc-border-subtle bg-white/80">
                 
                 <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full z-20 shadow-lg shadow-amber-400/30">
                    Lvl {userStats.level}
                 </div>

                 <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg mb-4 relative z-10 ring-2 ring-nc-accent-soft overflow-hidden">
                     {brandIdentity?.logoImage ? (
                         <img src={`data:image/png;base64,${brandIdentity.logoImage}`} alt="Brand Logo" className="w-full h-full object-contain p-2 bg-white" />
                     ) : (
                         <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Felix" className="w-full h-full rounded-full bg-nc-bg-soft object-cover" />
                     )}
                 </div>
                 <h1 className="text-xl font-bold text-nc-ink mb-1 relative z-10 font-display">{brandIdentity?.name || "Felix Designer"}</h1>
                 <p className="text-xs gradient-text font-bold uppercase tracking-[0.2em] mb-4 relative z-10">{brandIdentity?.tagline || "Creative Director"}</p>
                 
                 <div className="w-full mb-6 relative z-10">
                    <div className="flex justify-between text-[9px] text-nc-ink-subtle mb-1 font-bold">
                        <span>XP</span>
                        <span>{userStats.xp} / {userStats.nextLevelXp}</span>
                    </div>
                    <div className="h-2 bg-nc-bg-soft rounded-full overflow-hidden border border-nc-border-subtle">
                        <div 
                           className="h-full bg-gradient-to-r from-nc-accent to-purple-600 transition-all duration-500"
                           style={{ width: `${Math.min(100, (userStats.xp / userStats.nextLevelXp) * 100)}%` }}
                        ></div>
                    </div>
                 </div>

                 <div className="w-full grid grid-cols-2 gap-2 text-center mb-2 relative z-10">
                     <div className="bg-white/50 p-2 rounded-nc-sm border border-nc-border-subtle hover:bg-white transition-colors">
                         <span className="block text-lg font-bold text-nc-ink">{myProducts.length}</span>
                         <span className="text-[9px] text-nc-ink-soft uppercase">Designs</span>
                     </div>
                     <div className="bg-white/50 p-2 rounded-nc-sm border border-nc-border-subtle hover:bg-white transition-colors">
                         <span className="block text-lg font-bold text-nc-ink">{totalLikes}</span>
                         <span className="text-[9px] text-nc-ink-soft uppercase">Likes</span>
                     </div>
                 </div>
                 <div className="w-full bg-emerald-50 p-2 rounded-nc-sm border border-emerald-100 text-center relative z-10 hover:bg-emerald-100/50 transition-colors">
                     <span className="block text-lg font-bold text-nc-emerald">${totalRevenue.toFixed(0)}</span>
                     <span className="text-[9px] text-emerald-600/70 uppercase">Est. Revenue</span>
                 </div>
              </div>

              {/* Brand Identity Panel */}
              <div className="flex-1 w-full glass rounded-nc-xl p-0 relative overflow-hidden group min-h-[400px] shadow-nc-card hover:shadow-nc-elevated transition-shadow animate-fade-in-up border border-nc-border-subtle bg-white/90" style={{ animationDelay: '0.1s' }}>
                  
                  <div className="relative z-10 p-8 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <h2 className="text-sm font-bold text-nc-ink uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                                  <svg className="w-4 h-4 text-nc-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                  Style DNA & Brand
                              </h2>
                              <div className="h-0.5 w-12 bg-gradient-to-r from-nc-accent to-purple-500 rounded-full"></div>
                          </div>
                          <button 
                             onClick={() => setShowBrandBuilder(true)}
                             className="text-[10px] font-bold uppercase tracking-wider glass hover:bg-white text-nc-ink hover:text-nc-accent px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm focus-ring"
                          >
                             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                             {brandIdentity ? 'Rebrand' : 'Launch Label'}
                          </button>
                      </div>

                      <div className="flex-1 flex flex-col md:flex-row gap-8 items-center mb-8">
                          {brandIdentity ? (
                              <div className="flex-1">
                                  <p className="text-lg text-nc-ink leading-relaxed italic animate-fade-in drop-shadow-sm font-display mb-4">
                                    "{brandIdentity.story}"
                                  </p>
                                  <div className="flex gap-4 items-center">
                                      <span className="text-xs font-bold uppercase tracking-wider text-nc-ink-subtle">{brandIdentity.archetype}</span>
                                      <div className="h-4 w-px bg-nc-border-strong"></div>
                                      <div className="flex gap-1">
                                          {brandIdentity.colorPalette.map((col, i) => (
                                              <div key={i} className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: col.hex }} title={col.name}></div>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          ) : (
                              <div className="text-nc-ink-soft text-sm italic flex-1">
                                  Publish designs to generate your AI Designer Biography & Visual Identity...
                              </div>
                          )}
                          
                          {/* DNA Radar Chart */}
                          {myProducts.length > 0 && (
                              <div className="glass rounded-xl p-4 flex flex-col items-center bg-white/60">
                                  <span className="text-[9px] font-bold text-nc-ink-soft uppercase tracking-wider mb-2">Aesthetic Profile</span>
                                  <StyleRadarChart products={myProducts} />
                              </div>
                          )}
                      </div>

                      {/* Badges Section */}
                      <div className="glass rounded-nc-lg p-4 bg-white/60">
                          <h2 className="text-xs font-bold text-nc-ink-soft uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                              <svg className="w-3 h-3 text-nc-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                              Achievements
                          </h2>
                          <div className="flex gap-4">
                              {userStats.badges.map(badgeId => {
                                  const badge = BADGES[badgeId];
                                  if (!badge) return null;
                                  return (
                                    <div key={badge.id} className="group/badge relative bg-white/60 border border-white/50 p-2 rounded-xl flex flex-col items-center justify-center w-16 h-20 hover:bg-white hover:shadow-md transition-all cursor-help">
                                        <div className="text-xl mb-1 filter drop-shadow-sm group-hover/badge:scale-110 transition-transform">{badge.icon}</div>
                                        <div className="text-[8px] font-bold text-center text-nc-ink leading-tight">{badge.name}</div>
                                        
                                        <div className="absolute bottom-full mb-2 bg-nc-ink text-white text-[10px] p-2 rounded-lg w-32 text-center opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                            {badge.description}
                                        </div>
                                    </div>
                                  );
                              })}
                              {userStats.badges.length < 4 && (
                                  <div className="border border-nc-border-strong border-dashed p-2 rounded-xl flex flex-col items-center justify-center w-16 h-20 opacity-50 hover:opacity-70 transition-opacity">
                                      <div className="text-lg mb-1 text-nc-ink-subtle">+</div>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex justify-between items-center mb-8 px-2 border-b border-nc-border-subtle">
              <div className="flex gap-6 overflow-x-auto">
                  <button 
                    onClick={() => { setActiveTab('published'); setIsSelectionMode(false); }}
                    className={`pb-4 text-xs font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap focus-ring ${activeTab === 'published' ? 'text-nc-accent border-b-2 border-nc-accent' : 'text-nc-ink-soft hover:text-nc-ink'}`}
                  >
                      Portfolio ({myProducts.length})
                  </button>
                  <button 
                    onClick={() => { setActiveTab('wardrobe'); setIsSelectionMode(false); }}
                    className={`pb-4 text-xs font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap focus-ring ${activeTab === 'wardrobe' ? 'text-nc-accent border-b-2 border-nc-accent' : 'text-nc-ink-soft hover:text-nc-ink'}`}
                  >
                      Wardrobe ({ownedProducts.length})
                  </button>
                  <button 
                    onClick={() => { setActiveTab('favorites'); setIsSelectionMode(false); }}
                    className={`pb-4 text-xs font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap focus-ring ${activeTab === 'favorites' ? 'text-nc-accent border-b-2 border-nc-accent' : 'text-nc-ink-soft hover:text-nc-ink'}`}
                  >
                      Favorites ({favoriteProducts.length})
                  </button>
                  <button 
                    onClick={() => { setActiveTab('drafts'); setIsSelectionMode(false); }}
                    className={`pb-4 text-xs font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap focus-ring ${activeTab === 'drafts' ? 'text-nc-accent border-b-2 border-nc-accent' : 'text-nc-ink-soft hover:text-nc-ink'}`}
                  >
                      The Atelier (Drafts {savedDrafts.length})
                  </button>
              </div>

              {/* Lookbook & Styling Controls */}
              {activeTab === 'published' && myProducts.length >= 2 && (
                  <div className="pb-2">
                      {!isSelectionMode ? (
                          <button 
                            onClick={() => setIsSelectionMode(true)}
                            className="text-[10px] font-bold uppercase tracking-wider text-nc-ink hover:text-nc-accent flex items-center gap-2 transition-colors"
                          >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              Create Lookbook
                          </button>
                      ) : (
                          <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-nc-ink-subtle">{selectedProductIds.size} Selected</span>
                              <button 
                                onClick={handleGenerateLookbook}
                                disabled={selectedProductIds.size < 2 || isGeneratingLookbook}
                                className="px-4 py-1.5 bg-nc-ink text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-nc-ink-soft transition-all disabled:opacity-50 flex items-center gap-2"
                              >
                                  {isGeneratingLookbook ? 'Generating...' : 'Generate PDF'}
                              </button>
                              <button 
                                onClick={() => { setIsSelectionMode(false); setSelectedProductIds(new Set()); }}
                                className="text-nc-rose text-[10px] font-bold uppercase hover:underline"
                              >
                                  Cancel
                              </button>
                          </div>
                      )}
                  </div>
              )}

              {activeTab === 'wardrobe' && ownedProducts.length > 0 && (
                  <div className="pb-2">
                      <button 
                        onClick={() => setShowStylingRoom(true)}
                        className="text-[10px] font-bold uppercase tracking-wider text-nc-accent hover:text-nc-accent-strong flex items-center gap-2 transition-colors bg-nc-accent-soft px-3 py-1.5 rounded-full"
                      >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                          AI Stylist
                      </button>
                  </div>
              )}
          </div>

          {activeTab === 'published' && renderProductGrid(myProducts, true)}
          
          {activeTab === 'published' && myProducts.length === 0 && (
              <div className="py-12 text-center text-nc-ink-subtle">
                  <p>No published designs yet.</p>
              </div>
          )}

          {activeTab === 'wardrobe' && renderProductGrid(ownedProducts)}
          
          {activeTab === 'wardrobe' && ownedProducts.length === 0 && (
              <div className="py-12 text-center text-nc-ink-subtle">
                  <p>No items purchased yet. Visit the Marketplace.</p>
              </div>
          )}

          {activeTab === 'favorites' && renderProductGrid(favoriteProducts)}
          
          {activeTab === 'favorites' && favoriteProducts.length === 0 && (
              <div className="py-12 text-center text-nc-ink-subtle">
                  <p>No favorite designs yet.</p>
              </div>
          )}

          {activeTab === 'drafts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {savedDrafts.map(draft => (
                      <div key={draft.id} className="bg-nc-bg-elevated border border-nc-border-subtle rounded-nc-xl overflow-hidden group hover:shadow-nc-card transition-all relative card-lift">
                          <div className="aspect-[4/5] relative bg-nc-bg-soft">
                              {draft.data.conceptImage && (
                                  <LazyImage src={`data:image/png;base64,${draft.data.conceptImage}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                              )}
                              <div className="absolute top-2 right-2 glass px-2.5 py-1 rounded-full text-[9px] text-nc-ink uppercase font-bold shadow-sm">Draft</div>
                          </div>
                          <div className="p-4 bg-white border-t border-nc-border-subtle">
                              <h3 className="text-nc-ink font-bold text-sm truncate mb-1">{draft.name}</h3>
                              <p className="text-nc-ink-soft text-[10px] mb-4">Last edited: {new Date(draft.timestamp).toLocaleDateString()}</p>
                              <button 
                                onClick={() => onRemixDraft(draft)}
                                className="w-full bg-nc-accent-soft text-nc-accent-strong text-xs font-bold uppercase tracking-wider py-2 rounded-nc-lg hover:bg-purple-100 transition-colors"
                              >
                                  Open in Studio
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          )}

          {activeTab === 'drafts' && savedDrafts.length === 0 && (
              <div className="col-span-full py-12 text-center text-nc-ink-subtle">
                  <p>No drafts saved.</p>
              </div>
          )}
      </div>
    </div>
  );
};
