
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Studio } from './components/Studio';
import { Marketplace } from './components/Marketplace';
import { ProfileView } from './components/ProfileView';
import { ChallengesView } from './components/ChallengesView';
import { ToastContainer } from './components/Toast';
import { LevelUpModal } from './components/LevelUpModal';
import { LandingPage } from './components/LandingPage';
import { VideoRecorder } from './components/VideoRecorder';
import { GuidedTour } from './components/GuidedTour';
import { AboutModal } from './components/AboutModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SplashScreen } from './components/SplashScreen';
import {
  AppView,
  Product,
  Notification,
  NotificationType,
  DesignDraft,
  SavedDraft,
  Challenge,
  UserStats,
} from './types';
import { openApiKeySelection } from './services/geminiService';
import { hasGeminiApiKey } from './services/apiKey';

// Mock active challenges
const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    title: 'Bioluminescent Gala',
    description:
      'Design a haute couture gown using fabrics that emit natural light. Inspiration: Deep sea creatures and fiber optics.',
    promptHint:
      'A majestic bioluminescent gown, glowing translucent silk media, pulsating light veins, deep ocean blue and neon cyan, runway lighting...',
    difficulty: 'Hard',
    xpReward: 800,
    timeLeft: '12h 45m',
    participants: 1240,
    coverImage:
      'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?q=80&w=1000&auto=format&fit=crop',
    requirements: ['Must glow', 'Organic shapes', 'Ethereal vibe'],
  },
  {
    id: 'c2',
    title: 'Zero-Gravity Streetwear',
    description:
      'Create a functional streetwear outfit designed for life on a space station. Magnetic boots, floating accessories, and velcro.',
    promptHint:
      'Futuristic zero-gravity streetwear, magnetic utility straps, floating fabric panels, metallic silver and safety orange, cinematic lighting...',
    difficulty: 'Medium',
    xpReward: 500,
    timeLeft: '4h 20m',
    participants: 856,
    coverImage:
      'https://images.unsplash.com/photo-1485230405346-71acb9518d9c?q=80&w=1000&auto=format&fit=crop',
    requirements: ['Utility focus', 'Modular parts', 'Space-age materials'],
  },
  {
    id: 'c3',
    title: 'Upcycled Denim 2.0',
    description:
      'Reimagine vintage denim using Sashiko stitching and digital printing. Blend old-school craft with new-school tech.',
    promptHint:
      'Patchwork denim jacket, intricate sashiko stitching, digital glitch prints overlaid, raw hems, studio photography...',
    difficulty: 'Easy',
    xpReward: 300,
    timeLeft: '2d 10h',
    participants: 342,
    coverImage:
      'https://images.unsplash.com/photo-1582552938357-32b906df40cb?q=80&w=1000&auto=format&fit=crop',
    requirements: ['Visible texture', 'Sustainable focus', 'Blue tones'],
  },
];

const DATA_VERSION = 'v7';

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Aero-Lattice Sneaker 3000',
    description:
      'Generatively designed footwear featuring a 3D-printed breathable lattice sole. Optimized for parkour and urban movement.',
    price: 950,
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop',
    cadImageUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
    materials: [
      '## Bill of Materials',
      '- **Upper**: Recycled Ocean Plastic Knit',
      '- **Sole**: Carbon-infused TPU Lattice',
      '- **Laces**: Self-tightening smart wires',
    ],
    creator: 'Step_Future',
    likes: 275,
    runwayVideoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 
  },
  {
    id: '2',
    name: 'Neo-Tokyo Ballistic Parka',
    description:
      'A high-concept outerwear piece merging traditional kimono silhouettes with modern ballistic nylon. Features programmable LED trim.',
    price: 2450,
    imageUrl:
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=800&auto=format&fit=crop',
    materials: [
      '## Bill of Materials',
      '- **Shell**: 1000D Cordura Nylon (Matte Black)',
      '- **Lining**: Heat-reflective foil',
      '- **Tech**: Blue EL Wire piping',
    ],
    creator: 'Kaito_Design',
    likes: 420,
  },
  {
    id: '3',
    name: 'Holographic Data-Moshed Dress',
    description:
      'A stunning evening gown made from light-refracting polymer. The fabric pattern appears to "glitch" as the wearer moves.',
    price: 4500,
    imageUrl:
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=800&auto=format&fit=crop',
    materials: [
      '## Bill of Materials',
      '- **Fabric**: Prismatic Polymer Mesh',
      '- **Underlayer**: Nude Silk Chiffon',
      '- **Structure**: 3D Printed Corsetry',
    ],
    creator: 'Glitch_Vogue',
    likes: 890,
    runwayVideoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  },
  {
    id: '4',
    name: 'Reactive Smart-Knit Sweater',
    description:
      'Knitwear that changes porosity based on body temperature. Keeps you perfectly comfortable in any climate.',
    price: 650,
    imageUrl:
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=800&auto=format&fit=crop',
    materials: [
      '## Bill of Materials',
      '- **Yarn**: Merino / Shape Memory Alloy Blend',
      '- **Gauge**: 14gg seamless knit',
      '- **Pattern**: Voronoi cellular diagram',
    ],
    creator: 'Knit_Lab',
    likes: 156,
  },
  {
    id: '5',
    name: 'Modular Utility Vest System',
    description:
      'The ultimate urban survival gear. Magnetic Fidlock buckles allow for 12 different pocket configurations.',
    price: 850,
    imageUrl:
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop',
    materials: [
      '## Bill of Materials',
      '- **Base**: Waxed Canvas (Charcoal)',
      '- **Hardware**: Fidlock V-Buckles',
      '- **Webbing**: 2" Nylon Mil-Spec',
    ],
    creator: 'Urban_Nomad',
    likes: 215,
  },
  {
    id: '6',
    name: 'Liquid Metal Slip Dress',
    description:
      'Looks like molten mercury. Feels like silk. The ultimate statement piece for the digital age.',
    price: 3200,
    imageUrl:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop',
    materials: [
      '## Bill of Materials',
      '- **Fabric**: Silver Lamé with Nano-Coating',
      '- **Drape**: Bias cut',
      '- **Finish**: Mirror polish',
    ],
    creator: 'Studio_V',
    likes: 342,
  },
];

// --- Confetti Component ---
const Confetti: React.FC<{ active: boolean; onComplete: () => void }> = ({
  active,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    // Branded colors: Accent (Violet), Rose, Gold, Ink, Paper
    const colors = ['#9747FF', '#F43F5E', '#DCA54A', '#201213', '#F9F5F1'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    let frame = 0;
    const maxFrames = 180;

    const animate = () => {
      if (frame >= maxFrames) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / maxFrames);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      frame++;
      requestAnimationFrame(animate);
    };

    animate();
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};

// --- Live Ticker Component ---
const LiveTicker = () => {
  return (
    <div className="bg-nc-bg-elevated text-nc-ink-subtle h-8 overflow-hidden flex items-center border-b border-nc-border-subtle relative z-50">
      <div className="animate-ticker whitespace-nowrap text-[10px] font-sans font-medium tracking-widest uppercase flex gap-12 opacity-80">
        <span>⚡ System: LIVE v2.0 Online</span>
        <span>🔥 Trending: "Neon Baroque" (+120% Search Vol)</span>
        <span>🛍️ New Sale: Aero-Lattice Sneaker sold for $950</span>
        <span>👗 User @Kaito just published "Cyber-Kimono"</span>
        <span>🌱 Eco-Impact: 142kg CO2 saved today via Digital Sampling</span>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentViewInternal] = useState<AppView>(AppView.HOME);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [apiKeyMissing, setApiKeyMissing] = useState(!hasGeminiApiKey());

  // Recheck API key availability periodically (for when user selects key in AI Studio)
  useEffect(() => {
    if (!apiKeyMissing) return;
    const interval = setInterval(() => {
      if (hasGeminiApiKey()) {
        setApiKeyMissing(false);
      }
    }, 1000); // Check every second
    return () => clearInterval(interval);
  }, [apiKeyMissing]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [sharedDraft, setSharedDraft] = useState<DesignDraft | null>(null);
  const [viewingShared, setViewingShared] = useState(false);

  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());

  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    xp: 120,
    level: 2,
    nextLevelXp: 500,
    badges: ['early-adopter'],
    challengesCompleted: 0,
    ownedItemIds: [],
  });

  // Tour State
  const [isTourActive, setIsTourActive] = useState(false);
  const [isTourAutoPlay, setIsTourAutoPlay] = useState(false);
  const [tourKey, setTourKey] = useState(0);

  // Debug Signature
  useEffect(() => {
    console.log('%c🍌 Banana Couture v3.0 Online', 'color: #F43F5E; font-weight: bold; font-size: 20px;');
    console.log('Orchestrating Gemini 2.5 Flash, Pro, Imagen, and Veo.');
  }, []);

  // --- Navigation Handling (History API) ---
  const navigateTo = useCallback((view: AppView, replace = false) => {
    setCurrentViewInternal(view);
    window.scrollTo(0, 0); // Reset scroll on view change
    
    try {
        const url = new URL(window.location.href);
        
        // Skip URL updates if running in a blob context (often used in sandboxes)
        if (url.protocol === 'blob:') return;

        url.searchParams.set('view', view);
        
        // Clean up share parameter when navigating away from Studio/Share flow
        if (view !== AppView.STUDIO) {
           url.searchParams.delete('share');
        }
        
        if (replace) {
          window.history.replaceState({ view }, '', url);
        } else {
          window.history.pushState({ view }, '', url);
        }
    } catch (e) {
        console.warn('Navigation state update failed (likely sandbox environment):', e);
    }
  }, []);

  // Handle Browser Back/Forward buttons
  useEffect(() => {
      const handlePopState = (event: PopStateEvent) => {
          if (event.state && event.state.view) {
              setCurrentViewInternal(event.state.view);
          } else {
              // Fallback for initial state or root
              setCurrentViewInternal(AppView.HOME);
          }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const addNotification = useCallback((type: NotificationType, message: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    if (apiKeyMissing) {
      addNotification(
        'error',
        'GEMINI_API_KEY missing. Running in demo mode until you pick a key in AI Studio.'
      );
    }
  }, [apiKeyMissing, addNotification]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only active in Studio view
      if (currentView !== AppView.STUDIO) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (!modifier) return;

      switch (e.key.toLowerCase()) {
        case 'g':
          e.preventDefault();
          // Dispatch custom event for Studio to catch
          window.dispatchEvent(new CustomEvent('studio:generate'));
          addNotification('info', '⌨️ Generate triggered');
          break;
        case 'e':
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('studio:engineer'));
          addNotification('info', '⌨️ Engineer triggered');
          break;
        case 'z':
          if (!e.shiftKey) {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('studio:undo'));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, addNotification]);

  // Load persistence
  useEffect(() => {
    // Check data version and clear stale cache if needed
    const cachedVersion = localStorage.getItem('nanoFashion_dataVersion');
    if (cachedVersion !== DATA_VERSION) {
      localStorage.removeItem('nanoFashion_products');
      localStorage.setItem('nanoFashion_dataVersion', DATA_VERSION);
    }

    // Load Products
    try {
      const savedProducts = localStorage.getItem('nanoFashion_products');
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts);
        // Keep only user-created products from local storage (those not in MOCK_PRODUCTS)
        const userProducts = parsed.filter(
          (p: Product) => !MOCK_PRODUCTS.find((mp) => mp.id === p.id),
        );
        setProducts([...MOCK_PRODUCTS, ...userProducts]);
      }
    } catch (e) {
      console.error('Load products error', e);
    }

    // Load Stats & Inventory
    try {
      const savedStats = localStorage.getItem('nanoFashion_stats');
      if (savedStats) {
        setUserStats(JSON.parse(savedStats));
      }
    } catch (e) {
      console.error(e);
    }

    // Load Theme
    try {
        const savedTheme = localStorage.getItem('nanoFashion_theme');
        if (savedTheme === 'dark') {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    } catch (e) { console.error(e); }

    // Initial Route / State Handling
    try {
        // Safe check for location access
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view') as AppView;
        const shareId = urlParams.get('share');
        const isBlob = window.location.protocol === 'blob:';

        if (shareId) {
          try {
            const sharedDb = JSON.parse(localStorage.getItem('nanoFashion_shared') || '{}');
            if (sharedDb[shareId]) {
              setSharedDraft(sharedDb[shareId]);
              setViewingShared(true);
              setCurrentViewInternal(AppView.STUDIO);
              
              if (!isBlob) {
                  window.history.replaceState({ view: AppView.STUDIO }, '', window.location.href);
              }
              setTimeout(() => addNotification('info', 'Viewing shared design'), 500);
            } else {
              addNotification('error', 'Shared design not found or expired');
              navigateTo(AppView.HOME, true); // Replace current history entry
            }
          } catch (e) {
            console.error('Failed to load share', e);
          }
        } else if (viewParam && Object.values(AppView).includes(viewParam)) {
            setCurrentViewInternal(viewParam);
            if (!isBlob) {
                window.history.replaceState({ view: viewParam }, '', window.location.href);
            }
        } else {
            // Default to HOME
            setCurrentViewInternal(AppView.HOME);
            if (!isBlob) {
                window.history.replaceState({ view: AppView.HOME }, '', window.location.href);
            }
        }
    } catch (e) {
        console.warn("Could not read URL params, defaulting to HOME", e);
        setCurrentViewInternal(AppView.HOME);
    }

    try {
      const savedLikes = localStorage.getItem('nanoFashion_likes');
      if (savedLikes) {
        setLikedProducts(new Set(JSON.parse(savedLikes)));
      }
    } catch (e) {
      console.error(e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen && !(event.target as Element).closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const toggleTheme = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      if (newMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('nanoFashion_theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('nanoFashion_theme', 'light');
      }
  };

  const addXp = (amount: number) => {
    setUserStats((prev) => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let newNextXp = prev.nextLevelXp;
      const newBadges = [...prev.badges];
      let leveledUp = false;

      while (newXp >= newNextXp) {
        newXp -= newNextXp;
        newLevel += 1;
        newNextXp = newLevel * 250 + 500;
        leveledUp = true;
      }

      if (leveledUp) {
        setLevelUpData({ level: newLevel });
      }

      if (
        products.filter((p) => p.creator === 'You').length >= 4 &&
        !newBadges.includes('prolific')
      ) {
        newBadges.push('prolific');
        addNotification('success', 'Badge Unlocked: Prolific!');
      }

      const newState = {
        ...prev,
        xp: newXp,
        level: newLevel,
        nextLevelXp: newNextXp,
        badges: newBadges,
      };
      localStorage.setItem('nanoFashion_stats', JSON.stringify(newState));
      return newState;
    });
  };

  const handlePublish = (newProduct: Product) => {
    const productWithUser = { ...newProduct, creator: 'You' };
    setProducts((prev) => {
      const updated = [productWithUser, ...prev];
      // Persist only user products to avoid duplicating mocks
      const userProducts = updated.filter((p) => p.creator === 'You');
      localStorage.setItem('nanoFashion_products', JSON.stringify(userProducts));
      return updated;
    });

    // 🎉 Trigger confetti!
    setShowConfetti(true);

    navigateTo(AppView.MARKETPLACE);

    if (activeChallenge) {
      addXp(activeChallenge.xpReward);
      addNotification(
        'success',
        `🎉 Challenge Completed! +${activeChallenge.xpReward} XP`,
      );

      setUserStats((prev) => {
        const newState = { ...prev };
        if (!newState.badges.includes('challenger')) {
          addNotification('success', 'Badge Unlocked: Challenger!');
          newState.badges = [...newState.badges, 'challenger'];
        }
        localStorage.setItem('nanoFashion_stats', JSON.stringify(newState));
        return newState;
      });

      setActiveChallenge(null);
    } else {
      addXp(50);
      addNotification('success', '🎉 Product published (+50 XP)');
    }
  };

  const handlePurchase = (product: Product) => {
    setUserStats((prev) => {
      if (prev.ownedItemIds.includes(product.id)) return prev;
      const newState = {
        ...prev,
        ownedItemIds: [...prev.ownedItemIds, product.id],
      };
      localStorage.setItem('nanoFashion_stats', JSON.stringify(newState));
      return newState;
    });
    addNotification('success', `Purchased "${product.name}"! Added to Wardrobe.`);
  };

  const handleEnterChallenge = (challenge: Challenge) => {
    setActiveChallenge(challenge);
    navigateTo(AppView.STUDIO);
    addNotification('info', `Entered challenge: ${challenge.title}`);
  };

  const handleRemix = (product: Product) => {
    const remixDraft: DesignDraft = {
      conceptImage: product.imageUrl.startsWith('http') ? null : product.imageUrl,
      cadImage: product.cadImageUrl?.startsWith('http')
        ? null
        : product.cadImageUrl || null,
      materials: Array.isArray(product.materials)
        ? product.materials.join('\n')
        : product.materials || '',
      history: [],
      parentInfo: {
        id: product.id,
        name: product.name,
        creator: product.creator,
      },
    };

    setSharedDraft(remixDraft);
    setViewingShared(false);
    navigateTo(AppView.STUDIO);
    setActiveChallenge(null);
    addNotification('info', `Remixing "${product.name}"`);
  };

  const handleRemixSavedDraft = (draft: SavedDraft) => {
    setSharedDraft(draft.data);
    setViewingShared(false);
    navigateTo(AppView.STUDIO);
    setActiveChallenge(null);
    addNotification('info', `Opened draft "${draft.name}"`);
  };

  const handleToggleLike = (id: string) => {
    const newSet = new Set(likedProducts);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setLikedProducts(newSet);
    localStorage.setItem('nanoFashion_likes', JSON.stringify(Array.from(newSet)));
  };

  const handleLogout = () => {
    addNotification('info', 'Logging out...');
    setIsUserMenuOpen(false);
  };

  // Robust tour starter
  const handleStartTour = useCallback(() => {
    setTourKey(prev => prev + 1); // Force remount to reset tour state
    setIsTourActive(true);
    setIsTourAutoPlay(false);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col font-sans overflow-hidden bg-nc-bg text-nc-ink transition-colors duration-500 animate-fade-in">
      {/* Splash Screen */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Confetti Overlay */}
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {apiKeyMissing && (
        <div className="bg-gradient-to-r from-nc-accent to-purple-600 text-white text-xs font-bold py-2 px-4 text-center z-[100] flex items-center justify-center gap-3">
          <span>
            DEMO MODE: No API Key found. Some AI features will use mock data or fail. Set
            GEMINI_API_KEY.
          </span>
          <button
            onClick={() => {
              openApiKeySelection();
              // Recheck after a short delay to allow AI Studio to update
              setTimeout(() => {
                if (hasGeminiApiKey()) {
                  setApiKeyMissing(false);
                }
              }, 500);
            }}
            className="bg-white text-nc-ink px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide shadow-sm hover:scale-105 transition"
          >
            Select Key
          </button>
        </div>
      )}

      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}

      <ToastContainer notifications={notifications} removeNotification={removeNotification} />

      {levelUpData && (
        <LevelUpModal level={levelUpData.level} onClose={() => setLevelUpData(null)} />
      )}

      <GuidedTour
        key={tourKey}
        isActive={isTourActive}
        autoPlay={isTourAutoPlay}
        onEnd={() => {
          setIsTourActive(false);
          setIsTourAutoPlay(false);
        }}
        onNavigate={navigateTo}
        currentView={currentView}
        onShowToast={addNotification}
      />

      <VideoRecorder onShowToast={addNotification} />

      <LiveTicker />

      {/* Conditionally Render App Header or Landing Page */}
      {currentView === AppView.HOME ? (
        <ErrorBoundary>
          <LandingPage
            onNavigate={navigateTo}
            onStartTour={handleStartTour}
          />
        </ErrorBoundary>
      ) : (
        <>
          <header className="sticky top-0 z-50 bg-nc-bg-elevated/95 backdrop-blur-xl border-b border-nc-border-subtle transition-colors duration-300 shadow-sm pt-safe-top">
            <div className="h-16 flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-8">
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => navigateTo(AppView.HOME)}
                >
                  <div className="flex flex-col justify-center">
                    <span className="font-bold text-lg leading-none tracking-tight text-nc-ink group-hover:text-nc-accent transition-colors font-display">
                      Banana
                      <span className="font-light">Couture</span>
                    </span>
                  </div>
                </div>

                <nav className="hidden md:flex items-center gap-1 rounded-full p-1 border border-nc-border-subtle bg-nc-bg-soft/50">
                  <button
                    onClick={() => navigateTo(AppView.STUDIO)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                      currentView === AppView.STUDIO
                        ? 'bg-nc-bg-elevated text-nc-accent-strong shadow-nc-soft'
                        : 'text-nc-ink-soft hover:text-nc-ink hover:bg-nc-bg-elevated/50'
                    }`}
                  >
                    Studio
                  </button>
                  <button
                    onClick={() => navigateTo(AppView.CHALLENGES)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                      currentView === AppView.CHALLENGES
                        ? 'bg-nc-bg-elevated text-nc-accent-strong shadow-nc-soft'
                        : 'text-nc-ink-soft hover:text-nc-ink hover:bg-nc-bg-elevated/50'
                    }`}
                  >
                    Challenges
                  </button>
                  <button
                    onClick={() => navigateTo(AppView.MARKETPLACE)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                      currentView === AppView.MARKETPLACE
                        ? 'bg-nc-bg-elevated text-nc-accent-strong shadow-nc-soft'
                        : 'text-nc-ink-soft hover:text-nc-ink hover:bg-nc-bg-elevated/50'
                    }`}
                  >
                    Marketplace
                  </button>
                  <button
                    onClick={() => navigateTo(AppView.PROFILE)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                      currentView === AppView.PROFILE
                        ? 'bg-nc-bg-elevated text-nc-accent-strong shadow-nc-soft'
                        : 'text-nc-ink-soft hover:text-nc-ink hover:bg-nc-bg-elevated/50'
                    }`}
                  >
                    Profile
                  </button>
                </nav>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleStartTour}
                  className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-nc-accent-soft border border-nc-accent text-nc-accent-strong text-xs font-bold hover:shadow-nc-soft hover:scale-105 active:scale-100 transition-all focus-ring"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Take Tour
                </button>

                {/* Theme Toggle */}
                <button 
                  onClick={toggleTheme}
                  className="w-8 h-8 rounded-full bg-nc-bg-soft flex items-center justify-center text-nc-ink-subtle hover:text-nc-ink transition-colors border border-nc-border-subtle"
                  title="Toggle Dark Mode"
                >
                    {isDarkMode ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    )}
                </button>

                {/* Keyboard Shortcuts Hint */}
                <div className="hidden xl:flex items-center gap-1 text-[9px] text-nc-ink-subtle font-mono">
                  <kbd className="px-1.5 py-0.5 bg-nc-bg-soft rounded border border-nc-border-subtle">
                    ⌘G
                  </kbd>
                  <span>Generate</span>
                </div>

                <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-full border border-nc-border-subtle bg-nc-bg-elevated shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold uppercase text-nc-ink-soft">
                      Lvl {userStats.level}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-nc-border-strong" />
                  <div className="w-20 h-1.5 rounded-full overflow-hidden bg-nc-bg-soft">
                    <div
                      className="h-full bg-gradient-to-r from-nc-accent to-purple-600 transition-all duration-500"
                      style={{
                        width: `${(userStats.xp / userStats.nextLevelXp) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="relative user-menu-container">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-xl transition-colors hover:bg-nc-bg-soft border border-transparent hover:border-nc-border-subtle focus-ring"
                  >
                    <div className="w-8 h-8 rounded-full bg-nc-bg-soft overflow-hidden border border-nc-border-subtle">
                      <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                        alt="User"
                      />
                    </div>
                    <div className="text-left hidden sm:block pr-2">
                      <span className="block text-xs font-bold text-nc-ink">
                        Felix Designer
                      </span>
                      <span className="block text-[10px] text-nc-ink-subtle">Pro Plan</span>
                    </div>
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-nc-bg-elevated rounded-nc-lg shadow-nc-card py-2 animate-scale-in z-50 text-nc-ink border border-nc-border-subtle">
                      <div className="px-4 py-2 border-b border-nc-border-subtle mb-2">
                        <p className="text-xs text-nc-ink-subtle">Signed in as</p>
                        <p className="text-sm font-bold text-nc-ink truncate">
                          felix@bananacouture.ai
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          navigateTo(AppView.PROFILE);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-nc-bg-soft font-medium transition-colors"
                      >
                        Your Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowAbout(true);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-nc-bg-soft font-medium transition-colors"
                      >
                        About App
                      </button>
                      <button
                        onClick={() => {
                          openApiKeySelection();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-nc-bg-soft font-medium text-nc-accent transition-colors"
                      >
                        Set API Key (Veo)
                      </button>
                      <div className="border-t border-nc-border-subtle my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-xs text-nc-rose hover:bg-red-50 font-bold transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-hidden relative bg-nc-bg">
            <div key={currentView} className="h-full w-full view-enter">
              {currentView === AppView.STUDIO && (
                <ErrorBoundary>
                  <Studio
                    onPublish={handlePublish}
                    onShowToast={addNotification}
                    initialDraft={sharedDraft}
                    readOnly={viewingShared}
                    activeChallenge={activeChallenge}
                  />
                </ErrorBoundary>
              )}
              {currentView === AppView.CHALLENGES && (
                <div className="h-full overflow-y-auto custom-scrollbar">
                  <ChallengesView
                    challenges={MOCK_CHALLENGES}
                    onEnterChallenge={handleEnterChallenge}
                    userStats={userStats}
                  />
                </div>
              )}
              {currentView === AppView.MARKETPLACE && (
                <div className="h-full overflow-y-auto custom-scrollbar">
                  <Marketplace
                    products={products}
                    onShowToast={addNotification}
                    onRemix={handleRemix}
                    likedProducts={likedProducts}
                    onToggleLike={handleToggleLike}
                    onPurchase={handlePurchase}
                    ownedItemIds={userStats.ownedItemIds}
                  />
                </div>
              )}
              {currentView === AppView.PROFILE && (
                <div className="h-full overflow-y-auto custom-scrollbar">
                  <ProfileView
                    products={products}
                    onRemixDraft={handleRemixSavedDraft}
                    onShowToast={addNotification}
                    likedProducts={likedProducts}
                    onToggleLike={handleToggleLike}
                    userStats={userStats}
                  />
                </div>
              )}
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-t border-nc-border-subtle z-50 flex items-center justify-around px-2 pb-safe-bottom box-content shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button
              onClick={() => navigateTo(AppView.STUDIO)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                currentView === AppView.STUDIO
                  ? 'text-nc-accent'
                  : 'text-nc-ink-subtle hover:text-nc-ink'
              }`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-wide">
                Studio
              </span>
            </button>
            <button
              onClick={() => navigateTo(AppView.CHALLENGES)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                currentView === AppView.CHALLENGES
                  ? 'text-nc-accent'
                  : 'text-nc-ink-subtle hover:text-nc-ink'
              }`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-wide">
                Challenges
              </span>
            </button>
            <button
              onClick={() => navigateTo(AppView.MARKETPLACE)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                currentView === AppView.MARKETPLACE
                  ? 'text-nc-accent'
                  : 'text-nc-ink-subtle hover:text-nc-ink'
              }`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-wide">
                Market
              </span>
            </button>
            <button
              onClick={() => navigateTo(AppView.PROFILE)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                currentView === AppView.PROFILE
                  ? 'text-nc-accent'
                  : 'text-nc-ink-subtle hover:text-nc-ink'
              }`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-wide">
                Profile
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};