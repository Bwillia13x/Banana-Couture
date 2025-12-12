
import React, { useEffect, useRef, useState } from 'react';
import { Product } from '../types';

interface RunwayFeedProps {
  products: Product[];
  onRemix: (product: Product) => void;
  onPurchase: (product: Product) => void;
  onToggleLike: (id: string) => void;
  likedProducts: Set<string>;
}

export const RunwayFeed: React.FC<RunwayFeedProps> = ({
  products,
  onRemix,
  onPurchase,
  onToggleLike,
  likedProducts
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-id');
            setActiveId(id);
          }
        });
      },
      { threshold: 0.6 } // 60% visibility required to be "active"
    );

    const items = containerRef.current?.querySelectorAll('.runway-item');
    items?.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [products]);

  // Filter only products with video
  const videoProducts = products.filter(p => p.runwayVideoUrl);

  if (videoProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-nc-ink opacity-60">
        <div className="w-20 h-20 bg-nc-bg-elevated rounded-full flex items-center justify-center mb-4 shadow-sm border border-nc-border-subtle">
            <svg className="w-8 h-8 text-nc-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
        </div>
        <h3 className="text-xl font-bold font-display">No Runway Shows Yet</h3>
        <p className="text-sm mt-2">Generate videos in the Studio to appear here.</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full overflow-y-scroll snap-y snap-mandatory custom-scrollbar"
      style={{ scrollBehavior: 'smooth' }}
    >
      {videoProducts.map((product) => (
        <RunwayPost 
          key={product.id}
          product={product}
          isActive={activeId === product.id}
          isLiked={likedProducts.has(product.id)}
          onRemix={onRemix}
          onPurchase={onPurchase}
          onToggleLike={onToggleLike}
        />
      ))}
    </div>
  );
};

interface RunwayPostProps {
  product: Product;
  isActive: boolean;
  isLiked: boolean;
  onRemix: (product: Product) => void;
  onPurchase: (product: Product) => void;
  onToggleLike: (id: string) => void;
}

const RunwayPost: React.FC<RunwayPostProps> = ({
  product,
  isActive,
  isLiked,
  onRemix,
  onPurchase,
  onToggleLike
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(e => console.log('Autoplay blocked', e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  return (
    <div 
      data-id={product.id}
      className="runway-item w-full h-full snap-center relative bg-black flex items-center justify-center overflow-hidden"
    >
      {/* Video Content */}
      <div className="absolute inset-0">
         <video
            ref={videoRef}
            src={product.runwayVideoUrl}
            className="w-full h-full object-cover opacity-90"
            loop
            muted
            playsInline
         />
         {/* Vignette */}
         <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none"></div>
      </div>

      {/* Right Sidebar Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center z-20">
          <div className="flex flex-col items-center gap-1">
              <button 
                onClick={() => onToggleLike(product.id)}
                className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${isLiked ? 'bg-nc-rose text-white' : 'bg-black/40 text-white hover:bg-black/60'}`}
              >
                  <svg className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
              </button>
              <span className="text-xs font-bold text-white shadow-black drop-shadow-md">{product.likes + (isLiked ? 1 : 0)}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
              <button 
                onClick={() => onRemix(product)}
                className="w-12 h-12 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center backdrop-blur-md transition-all"
                title="Remix DNA"
              >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
              </button>
              <span className="text-xs font-bold text-white shadow-black drop-shadow-md">Remix</span>
          </div>

          <div className="flex flex-col items-center gap-1">
              <button className="w-12 h-12 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center backdrop-blur-md transition-all">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
              </button>
              <span className="text-xs font-bold text-white shadow-black drop-shadow-md">Share</span>
          </div>
      </div>

      {/* Bottom Info Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-black via-black/60 to-transparent pt-24">
          <div className="flex items-end justify-between max-w-2xl">
              <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${product.creator}`} 
                            className="w-full h-full object-cover bg-white"
                            alt={product.creator}
                          />
                      </div>
                      <div>
                          <h4 className="text-white font-bold text-sm drop-shadow-md">@{product.creator}</h4>
                          <span className="text-xs text-white/80 font-medium bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                              Original Design
                          </span>
                      </div>
                  </div>
                  
                  <h2 className="text-2xl font-black text-white mb-2 font-display drop-shadow-lg leading-none">
                      {product.name}
                  </h2>
                  <p className="text-sm text-white/90 line-clamp-2 mb-4 max-w-md drop-shadow-md font-light">
                      {product.description}
                  </p>
                  
                  {/* Music/Audio Indicator */}
                  <div className="flex items-center gap-2 text-xs text-white/70">
                      <svg className="w-3 h-3 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                      <span className="sliding-text-container w-32 overflow-hidden whitespace-nowrap">
                          <span className="inline-block animate-marquee">Original Audio • Fashion Week Mix • </span>
                      </span>
                  </div>
              </div>

              <button 
                onClick={() => onPurchase(product)}
                className="group flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-nc-accent hover:text-white transition-all shadow-xl hover:scale-105"
              >
                  <span>${product.price}</span>
                  <div className="w-px h-4 bg-current opacity-20"></div>
                  <span>Buy</span>
              </button>
          </div>
      </div>
    </div>
  );
};
