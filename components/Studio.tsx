
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { generateConcept, editConceptWithMask, generateEngineeringPack, getFashionTrends, critiqueDesign, generateRunwayVideo, generateFabricTexture, analyzeManufacturingFeasibility, generateSizingChart, generateSeamlessPattern, applyTextureToDesign, analyzeMultimodalInput, extractColorPalette, analyzeFabricPhysics } from '../services/geminiService';
import { extractDesignDNA, DesignDNA } from '../services/designDNAService';
import { DesignDraft, Product, Challenge, DesignCritique, ManufacturingAnalysis, CapsuleGarment, CostBreakdown, ProductionTimeline, StructuredBOM, ColorSwatch, FabricPhysics } from '../types';
import { LoadingOverlay } from './LoadingOverlay';
import { BomParser } from './BomParser';
import { CompareSlider } from './CompareSlider';
import { VisualEditor } from './VisualEditor';
import { DismissiblePanel } from './DismissiblePanel';
import { TechPackModal } from './TechPackModal';
import { CapsuleWizard } from './CapsuleWizard';
import { QualityMonitor } from './QualityMonitor';
import { SourcingPanel } from './SourcingPanel';
import { VirtualTryOn } from './VirtualTryOn';
import { PatternGenerator } from './PatternGenerator';
import { DNASplicer } from './DNASplicer';
import { FashionForge } from './FashionForge';
import { useLiveAPIv2, AuraInsight } from '../hooks/useLiveAPIv2';
import { Aura2Panel } from './Aura2Panel';
import { Aura2Orb } from './Aura2Orb';
import { FashionGPTModal } from './FashionGPTModal';
import { SensoryInput } from './SensoryInput';
import { DNACard } from './DNABadge';
import { LazyImage } from './LazyImage';
import { CampaignStudio } from './CampaignStudio';
import { MaterialLibrary, saveMaterialToLibrary } from './MaterialLibrary';
import { bomToString } from '../utils/bomUtils';

interface StudioProps {
  onPublish: (product: Product) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
  initialDraft?: DesignDraft | null;
  readOnly?: boolean;
  activeChallenge?: Challenge | null;
}

type ModelType = 'Ghost' | 'Runway' | 'Street' | 'Curvy';

const MODEL_PROMPTS: Record<ModelType, string> = {
    'Ghost': "on a ghost mannequin, white background",
    'Runway': "worn by a tall female fashion model, runway pose, dramatic lighting",
    'Street': "worn by a male streetwear model, urban pose, studio lighting",
    'Curvy': "worn by a curvy female model, editorial pose, neutral background"
};

const INSPIRATION_STARTERS = [
    {
        title: "Vintage Polo",
        prompt: "1960s style menswear sweater polo, textured waffle knit, tipped collar, sage green and cream, retro aesthetic",
        icon: "👕"
    },
    {
        title: "Raw Denim",
        prompt: "Premium dark indigo selvedge jeans, straight leg cut, contrast stitching, rigid raw denim texture, cuffed hem",
        icon: "👖"
    },
    {
        title: "Floral Sundress",
        prompt: "Lightweight floral summer dress, linen blend, small daisy print on sunshine yellow, tiered skirt, breezy fit",
        icon: "👗"
    },
    {
        title: "Classic Trench",
        prompt: "Timeless beige trench coat, double breasted, storm flap, belted waist, water resistant gabardine fabric",
        icon: "🧥"
    }
];

// Heads Up Display for Fabric Physics
const PHYSICS_HUD = ({ physics }: { physics: FabricPhysics }) => (
  <div className="absolute top-24 left-6 z-20 pointer-events-none animate-fade-in hidden md:block">
    <div className="bg-nc-bg-elevated/80 backdrop-blur-md border border-nc-border-subtle p-3 rounded-lg shadow-sm text-[10px] text-nc-ink font-mono space-y-2 w-32">
      <div className="flex justify-between items-center border-b border-nc-border-subtle pb-1 mb-1">
        <span className="font-bold text-nc-ink-soft uppercase tracking-wider">Physics</span>
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
      </div>
      
      <div className="flex justify-between">
        <span className="text-nc-ink-subtle">GSM</span>
        <span className="font-bold">{physics.weightGSM}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-nc-ink-subtle">Drape</span>
        <span className="font-bold">{physics.drape}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-nc-ink-subtle">Opacity</span>
        <span className="font-bold">{100 - physics.transparency}%</span>
      </div>
      
      <div className="pt-1 border-t border-nc-border-subtle mt-1 text-[8px] leading-tight text-nc-ink-soft opacity-70 italic">
        {physics.textureDescription}
      </div>
    </div>
  </div>
);

export const Studio: React.FC<StudioProps> = ({ onPublish, onShowToast, initialDraft, readOnly = false, activeChallenge }) => {
  // --- State ---
  const DEFAULT_PROMPT = 'Classic mens sweater polo, 1960s Mad Men style, textured knit fabric, charcoal grey with white piping, vintage studio lighting';
  const [prompt, setPrompt] = useState(activeChallenge ? activeChallenge.promptHint : DEFAULT_PROMPT);
  const [selectedModel, setSelectedModel] = useState<ModelType>('Ghost');
  
  const [draft, setDraft] = useState<DesignDraft>({
    conceptImage: null,
    cadImage: null,
    runwayVideoUrl: undefined,
    materials: '',
    sizingChart: undefined,
    history: [],
    campaignImages: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // View State
  const [viewMode, setViewMode] = useState<'concept' | 'engineering' | 'split' | 'xray' | 'runway' | 'compare_remix'>('concept');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  
  // Right Sidebar State
  const [activeRightTab, setActiveRightTab] = useState<'properties' | 'materials' | 'settings' | 'sourcing'>('properties');
  const [materialTab, setMaterialTab] = useState<'generate' | 'library'>('generate');
  const [simplifyCad, setSimplifyCad] = useState(true);

  // Tools State
  const [isVisualEditorOpen, setIsVisualEditorOpen] = useState(false);
  const [showTechPackModal, setShowTechPackModal] = useState(false);
  const [showCapsuleWizard, setShowCapsuleWizard] = useState(false);
  const [showTryOn, setShowTryOn] = useState(false);
  const [fabricModal, setFabricModal] = useState<{ isOpen: boolean, name: string, image: string | null, isLoading: boolean }>({ isOpen: false, name: '', image: null, isLoading: false });
  const [showDNASplicer, setShowDNASplicer] = useState(false);
  const [showFashionForge, setShowFashionForge] = useState(false);
  const [showFashionGPT, setShowFashionGPT] = useState(false);
  const [showSensoryInput, setShowSensoryInput] = useState(false);
  const [showCampaignStudio, setShowCampaignStudio] = useState(false);

  // Drag State
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Aura 2.0 State
  const [showAura2Panel, setShowAura2Panel] = useState(false);
  const [auraTranscript, setAuraTranscript] = useState<{ role: 'user' | 'aura'; text: string; timestamp: number }[]>([]);

  // Advanced Feature State
  const [criticResult, setCriticResult] = useState<DesignCritique | null>(null);
  const [showCritic, setShowCritic] = useState(false);
  const [manufacturingData, setManufacturingData] = useState<ManufacturingAnalysis | null>(null);
  const [costData, setCostData] = useState<CostBreakdown | null>(null);
  const [timelineData, setTimelineData] = useState<ProductionTimeline | null>(null);
  const [trendSources, setTrendSources] = useState<{ title: string, uri: string }[]>([]);
  
  // DNA State
  const [currentDesignDNA, setCurrentDesignDNA] = useState<DesignDNA | null>(null);
  const [showDnaCard, setShowDnaCard] = useState(false); // Collapsed by default

  // History for Undo/Redo
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [shouldTriggerGenerate, setShouldTriggerGenerate] = useState(false);
  const [patternToGenerate, setPatternToGenerate] = useState<string | null>(null); // For voice triggered patterns
  
  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<'canvas' | 'tools' | 'properties'>('canvas');

  // Tooltip State
  const [hoveredTool, setHoveredTool] = useState<{ label: string; description?: string; y: number; x: number } | null>(null);

  // Logic for smart CTA - Shows if we have a concept but no CAD yet
  const showEngineeringCTA = draft.conceptImage && !draft.cadImage;

  // Load saved draft from localStorage on mount
  useEffect(() => {
    if (!initialDraft) {
      try {
        const savedDraft = localStorage.getItem('bananaCouture_autosave');
        const savedPrompt = localStorage.getItem('bananaCouture_autosave_prompt');
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          setDraft(parsed);
          setHistoryIndex(parsed.history?.length - 1 || -1);
          if (savedPrompt) setPrompt(savedPrompt);
          onShowToast('info', 'Previous draft restored');
        }
      } catch (e) {
        console.error('Failed to load autosave', e);
      }
    }
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (readOnly || !draft.conceptImage) return;
    
    const saveTimer = setTimeout(() => {
      try {
        localStorage.setItem('bananaCouture_autosave', JSON.stringify(draft));
        localStorage.setItem('bananaCouture_autosave_prompt', prompt);
      } catch (e) {
        console.error('Auto-save failed', e);
      }
    }, 30000);

    return () => clearTimeout(saveTimer);
  }, [draft, prompt, readOnly]);
  
  // --- Effects ---
  useEffect(() => {
    if (initialDraft) {
        setDraft(initialDraft);
        setHistoryIndex(initialDraft.history.length - 1);
        if (initialDraft.runwayVideoUrl) setViewMode('runway');
        // Reset DNA for imported draft
        setCurrentDesignDNA(null);
        
        // Restore production data if available
        if (initialDraft.productionData) {
            setManufacturingData(initialDraft.productionData.manufacturingAnalysis);
            setCostData(initialDraft.productionData.costBreakdown);
            setTimelineData(initialDraft.productionData.productionTimeline);
        }
    }
  }, [initialDraft]);

  useEffect(() => {
    if (shouldTriggerGenerate) {
        setShouldTriggerGenerate(false);
        handleGenerate();
    }
  }, [shouldTriggerGenerate]);

  useEffect(() => {
      if (patternToGenerate) {
          onShowToast('info', `Aura suggests pattern: "${patternToGenerate}". Open Patterns tab to generate.`);
          setActiveRightTab('materials'); // Auto-switch to patterns tab
          setMaterialTab('generate');
      }
  }, [patternToGenerate]);

  // --- Keyboard Shortcut Event Listeners ---
  useEffect(() => {
    const handleGenerateEvent = () => {
      if (prompt.trim()) {
        setShouldTriggerGenerate(true);
      }
    };
    const handleEngineerEvent = () => {
      if (draft.conceptImage) {
        handleEngineer();
      }
    };
    const handleUndoEvent = () => {
      handleUndo();
    };

    window.addEventListener('studio:generate', handleGenerateEvent);
    window.addEventListener('studio:engineer', handleEngineerEvent);
    window.addEventListener('studio:undo', handleUndoEvent);

    return () => {
      window.removeEventListener('studio:generate', handleGenerateEvent);
      window.removeEventListener('studio:engineer', handleEngineerEvent);
      window.removeEventListener('studio:undo', handleUndoEvent);
    };
  }, [prompt, draft.conceptImage, historyIndex, draft.history]); // Added history dependencies

  // Auto-extract DNA, Color Palette, and Fabric Physics when concept image changes
  useEffect(() => {
    if (draft.conceptImage && !currentDesignDNA) {
      // Parallel execution for analysis
      Promise.all([
        extractDesignDNA(draft.conceptImage),
        extractColorPalette(draft.conceptImage),
        analyzeFabricPhysics(draft.conceptImage)
      ]).then(([dna, palette, physics]) => {
        setCurrentDesignDNA(dna);
        setDraft(prev => ({
          ...prev,
          colorPalette: palette,
          fabricPhysics: physics
        }));
      }).catch(err => console.error("Analysis failed", err));
    }
  }, [draft.conceptImage, currentDesignDNA]);


  // --- Actions ---

  const handleUndo = useCallback(() => {
      if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          const prevImage = draft.history[newIndex];
          setDraft(prev => ({ ...prev, conceptImage: prevImage }));
          setHistoryIndex(newIndex);
          setCurrentDesignDNA(null); // Invalidate DNA on change
          onShowToast('info', 'Undo');
      }
  }, [historyIndex, draft.history, onShowToast]);

  const handleRedo = useCallback(() => {
      if (historyIndex < draft.history.length - 1) {
          const newIndex = historyIndex + 1;
          const nextImage = draft.history[newIndex];
          setDraft(prev => ({ ...prev, conceptImage: nextImage }));
          setHistoryIndex(newIndex);
          setCurrentDesignDNA(null); // Invalidate DNA on change
          onShowToast('info', 'Redo');
      }
  }, [historyIndex, draft.history, onShowToast]);

  const handleHistorySelect = (index: number) => {
      const selectedImage = draft.history[index];
      setDraft(prev => ({ ...prev, conceptImage: selectedImage }));
      setHistoryIndex(index);
      setCurrentDesignDNA(null);
  };

  const handleClearCanvas = () => {
      setDraft({
        conceptImage: null,
        cadImage: null,
        runwayVideoUrl: undefined,
        materials: '',
        sizingChart: undefined,
        history: [],
        campaignImages: []
      });
      setHistoryIndex(-1);
      setViewMode('concept');
      setCriticResult(null);
      setManufacturingData(null);
      setCostData(null);
      setTimelineData(null);
      setCurrentDesignDNA(null);
      setPrompt('');
      setShowDnaCard(false);
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
      localStorage.removeItem('bananaCouture_autosave');
      localStorage.removeItem('bananaCouture_autosave_prompt');
      onShowToast('info', 'Canvas cleared');
  };

  const handleRandomPrompt = () => {
      const random = INSPIRATION_STARTERS[Math.floor(Math.random() * INSPIRATION_STARTERS.length)].prompt;
      setPrompt(random);
  };

  const handleInspirationClick = (text: string) => {
      setPrompt(text);
      setShouldTriggerGenerate(true);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setLoadingMessage('Designing your vision...');
    try {
      const fullPrompt = `${prompt}. Presented ${MODEL_PROMPTS[selectedModel]}.`;
      const base64 = await generateConcept(fullPrompt);
      const newDraft = {
        ...draft,
        conceptImage: base64,
        cadImage: null,
        materials: '',
        sizingChart: undefined,
        history: [...draft.history.slice(0, historyIndex + 1), base64] // Truncate forward history if branching
      };
      setDraft(newDraft);
      setHistoryIndex(newDraft.history.length - 1);
      setViewMode('concept');
      // Reset analysis
      setCriticResult(null);
      setManufacturingData(null);
      setCostData(null);
      setTimelineData(null);
      setCurrentDesignDNA(null);
    } catch (e: any) {
      onShowToast('error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEngineer = async () => {
      if (!draft.conceptImage) return;
      setIsLoading(true);
      setLoadingMessage('Drafting CAD & Structured BOM...');
      try {
          // Now returns StructuredBOM
          const { cadImage, materials } = await generateEngineeringPack(draft.conceptImage, simplifyCad);
          setDraft(prev => ({ ...prev, cadImage, materials }));
          setViewMode('split'); // Automatically switch to split/x-ray view to show off the result
          setActiveRightTab('settings'); // Switch to BOM view
          // If on mobile, switch to properties view
          if (window.innerWidth < 768) setMobileTab('properties');
      } catch (e: any) {
          onShowToast('error', e.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleOpenTechPack = async () => {
      if (!draft.conceptImage) return;
      
      // If we don't have engineering data, generate it first
      if (!draft.cadImage || !draft.materials) {
          await handleEngineer();
      }

      // If we don't have sizing chart, generate it
      if (!draft.sizingChart) {
          setIsLoading(true);
          setLoadingMessage('Calculating size grading...');
          try {
              // Convert structured BOM to string for context
              const matStr = bomToString(draft.materials);
              const sizing = await generateSizingChart(prompt + " " + matStr.substring(0, 100));
              setDraft(prev => ({ ...prev, sizingChart: sizing }));
              
              // Also auto-trigger manufacturing analysis if missing
              if (!manufacturingData && draft.cadImage) {
                  setLoadingMessage('Analyzing production risks...');
                  const analysis = await analyzeManufacturingFeasibility(draft.cadImage, matStr);
                  setManufacturingData(analysis);
              }

          } catch (e: any) {
              console.error("Failed to generate extras", e);
          } finally {
              setIsLoading(false);
          }
      }

      setShowTechPackModal(true);
  };

  const handlePrintTechPack = () => {
      window.print();
  };

  const handleSendToProduction = () => {
      setShowTechPackModal(false);
      onShowToast('success', 'Sent to Partner Factory! Estimate: 14 Days.');
  };

  const handleTrendForecast = async () => {
      if (!prompt.trim()) {
          onShowToast('info', 'Enter a basic topic first (e.g. "Spring Coats")');
          return;
      }
      setIsLoading(true);
      setLoadingMessage('Scouting global trends (Google Search)...');
      try {
          const { text, sources } = await getFashionTrends(prompt);
          setPrompt(prev => `${prev}\n\nTrend Insight: ${text}`);
          setTrendSources(sources);
          onShowToast('success', 'Trends applied to prompt');
      } catch (e: any) {
          onShowToast('error', e.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleCritic = async () => {
      if (!draft.conceptImage) return;
      setIsLoading(true);
      setLoadingMessage('AI Critic Analyzing...');
      try {
          const critique = await critiqueDesign({
              conceptImage: draft.conceptImage,
              cadImage: draft.cadImage,
              bomMarkdown: bomToString(draft.materials)
          });
          setCriticResult(critique);
          setShowCritic(true);
      } catch (e: any) {
          onShowToast('error', e.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleManufacturingAnalysis = async () => {
      if (!draft.cadImage || !draft.materials) {
          onShowToast('error', 'Generate Tech Pack first');
          return;
      }
      setIsLoading(true);
      setLoadingMessage('Analyzing feasibility...');
      try {
          const matStr = bomToString(draft.materials);
          const analysis = await analyzeManufacturingFeasibility(draft.cadImage, matStr);
          setManufacturingData(analysis);
      } catch (e: any) {
          onShowToast('error', e.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleRunwayVideo = async () => {
      if (!draft.conceptImage) return;
      setIsLoading(true);
      setLoadingMessage('Producing Runway Video (Veo)... this may take a moment.');
      try {
          const videoUrl = await generateRunwayVideo(prompt, draft.conceptImage);
          setDraft(prev => ({ ...prev, runwayVideoUrl: videoUrl }));
          setViewMode('runway');
          onShowToast('success', 'Runway video generated!');
      } catch (e: any) {
          onShowToast('error', e.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleVisualEditApply = async (maskBase64: string, instruction: string) => {
    if (!draft.conceptImage) return;
    setIsLoading(true);
    setLoadingMessage('Applying masked edit...');
    try {
        const base64 = await editConceptWithMask(draft.conceptImage, maskBase64, instruction);
        const newDraft = {
            ...draft,
            conceptImage: base64,
            cadImage: null,
            history: [...draft.history.slice(0, historyIndex + 1), base64]
        };
        setDraft(newDraft);
        setHistoryIndex(newDraft.history.length - 1);
        setIsVisualEditorOpen(false);
        setCurrentDesignDNA(null);
    } catch (e: any) {
        onShowToast('error', e.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleApplyTexture = async (patternBase64: string) => {
      if (!draft.conceptImage) {
          onShowToast('error', "No design to apply pattern to.");
          return;
      }
      setIsLoading(true);
      setLoadingMessage("Mapping texture to garment...");
      try {
          const resultBase64 = await applyTextureToDesign(draft.conceptImage, patternBase64);
          
          // Helper to safely append string
          const appendToMaterials = (current: string | StructuredBOM, append: string): string | StructuredBOM => {
              if (typeof current === 'string') return current + append;
              return current; // Don't append to structured object for now, just apply visual
          };

          const newDraft = {
              ...draft,
              conceptImage: resultBase64,
              cadImage: null,
              history: [...draft.history.slice(0, historyIndex + 1), resultBase64],
              materials: appendToMaterials(draft.materials, `\n- **Custom Print**: AI Generated Pattern`)
          };
          setDraft(newDraft);
          setHistoryIndex(newDraft.history.length - 1);
          setCurrentDesignDNA(null);
          onShowToast('success', 'Pattern applied successfully');
      } catch (e: any) {
          onShowToast('error', e.message);
      } finally {
          setIsLoading(false);
      }
  };

  // --- Drag and Drop Handlers ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draft.conceptImage) {
        setIsDraggingOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    if (!draft.conceptImage) {
        onShowToast('error', 'Generate a design first!');
        return;
    }

    try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.type === 'material' && data.image) {
            onShowToast('info', `Applying texture: ${data.name}...`);
            handleApplyTexture(data.image);
        }
    } catch (err) {
        console.error("Invalid drop data");
    }
  };

  const handleLoadCapsuleLook = (garment: CapsuleGarment) => {
    setDraft({
        conceptImage: garment.conceptImage,
        cadImage: garment.cadImage,
        materials: garment.bomMarkdown,
        history: garment.conceptImage ? [garment.conceptImage] : [],
        runwayVideoUrl: undefined,
        sizingChart: undefined,
        campaignImages: []
    });
    setHistoryIndex(0);
    setPrompt(garment.conceptPrompt);
    setViewMode('concept');
    setCurrentDesignDNA(null);
    onShowToast('success', `Loaded "${garment.name}" into Studio`);
  };

  const handleLoadSplicedDesign = (image: string, dna: DesignDNA) => {
    const newDraft = {
      ...draft,
      conceptImage: image,
      cadImage: null,
      materials: '',
      history: [...draft.history.slice(0, historyIndex + 1), image]
    };
    setDraft(newDraft);
    setHistoryIndex(newDraft.history.length - 1);
    setCurrentDesignDNA(dna);
    setViewMode('concept');
    onShowToast('success', 'Spliced design loaded to Studio');
  };

  const handleLoadFashionGPTResult = (newDraft: DesignDraft, newPrompt: string) => {
    setDraft(newDraft);
    setPrompt(newPrompt);
    setHistoryIndex(newDraft.history.length - 1);
    setViewMode('concept');
    
    // Extract and set production data if available
    if (newDraft.productionData) {
        setManufacturingData(newDraft.productionData.manufacturingAnalysis);
        setCostData(newDraft.productionData.costBreakdown);
        setTimelineData(newDraft.productionData.productionTimeline);
    }
    
    onShowToast('success', 'FashionGPT result loaded into Studio!');
  };

  const handleUpdateBom = (newBom: string | StructuredBOM) => {
    // Simply set it; types handle both string and structured
    setDraft(prev => ({ ...prev, materials: newBom }));
  };

  const handleSensoryAnalysis = async (blob: Blob, type: 'video' | 'audio', context: string) => {
      setIsLoading(true);
      setLoadingMessage("Interpreting sensory input with Gemini...");
      try {
          const generatedPrompt = await analyzeMultimodalInput(blob, type, context);
          setPrompt(generatedPrompt);
          setShowSensoryInput(false);
          onShowToast('success', 'Sensory input translated to prompt!');
          // Short delay to allow state to update before triggering generation
          setTimeout(() => setShouldTriggerGenerate(true), 100);
      } catch (e: any) {
          onShowToast('error', e.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleSetCampaignImage = (img: string) => {
    const newDraft = {
      ...draft,
      conceptImage: img,
      history: [...draft.history.slice(0, historyIndex + 1), img],
      campaignImages: [...(draft.campaignImages || []), img]
    };
    setDraft(newDraft);
    setHistoryIndex(newDraft.history.length - 1);
    setCurrentDesignDNA(null);
  };

  const handlePublishClick = () => {
      if (!draft.conceptImage) return;
      
      const materialsForProduct = typeof draft.materials === 'string'
          ? draft.materials.split('\n')
          : draft.materials;

      const newProduct: Product = {
          id: Date.now().toString(),
          name: prompt.split(',')[0].slice(0, 30) || 'Untitled Design',
          description: prompt,
          price: 150 + Math.floor(Math.random() * 500), // Mock pricing logic
          // PRIORITIZE CAMPAIGN IMAGE
          imageUrl: (draft.campaignImages && draft.campaignImages.length > 0) ? draft.campaignImages[0] : draft.conceptImage,
          cadImageUrl: draft.cadImage || undefined,
          runwayVideoUrl: draft.runwayVideoUrl,
          materials: materialsForProduct,
          creator: 'You',
          likes: 0,
          remixedFrom: draft.parentInfo // Pass genealogy info
      };
      
      onPublish(newProduct);
  };

  const downloadAsset = () => {
      if (viewMode === 'runway' && draft.runwayVideoUrl) {
          const link = document.createElement('a');
          link.href = draft.runwayVideoUrl;
          link.download = `runway-${Date.now()}.mp4`;
          link.click();
          return;
      }
      if (!draft.conceptImage) return;
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${viewMode === 'engineering' && draft.cadImage ? draft.cadImage : draft.conceptImage}`;
      link.download = `design-${viewMode}-${Date.now()}.png`;
      link.click();
      onShowToast('success', 'Asset downloaded');
  };

  // --- Material Visualization Handler ---
  const handleMaterialClick = async (materialName: string) => {
      setFabricModal({ isOpen: true, name: materialName, image: null, isLoading: true });
      try {
          const textureBase64 = await generateFabricTexture(materialName);
          setFabricModal(prev => ({ ...prev, image: textureBase64, isLoading: false }));
      } catch (e: any) {
          setFabricModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          onShowToast('error', `Failed to generate texture: ${e.message}`);
      }
  };

  const handleSaveFabric = () => {
      if (!fabricModal.image) return;
      saveMaterialToLibrary(fabricModal.name, fabricModal.image);
      onShowToast('success', 'Texture saved to library');
  };

  const handleApplyFabricToDesign = () => {
      if (fabricModal.image) {
          handleApplyTexture(fabricModal.image);
          setFabricModal(prev => ({...prev, isOpen: false}));
      }
  };

  // --- Aura 2.0 Integration ---

  // Canvas image getter for Aura vision
  const getCanvasImage = useCallback(() => {
    return draft.conceptImage;
  }, [draft.conceptImage]);

  // Aura insight handler
  const handleAuraInsight = useCallback((insight: AuraInsight) => {
    console.log('Aura Insight:', insight);
    onShowToast('info', `Aura: ${insight.title}`);
  }, [onShowToast]);

  // Transcript update handler
  const handleTranscriptUpdate = useCallback((role: 'user' | 'aura', text: string) => {
    setAuraTranscript(prev => [...prev, { role, text, timestamp: Date.now() }]);
  }, []);

  // Enhanced tool call handler for Aura 2.0
  const handleToolCallV2 = useCallback(async (name: string, args: any) => {
    // Original tools
    if (name === 'updatePrompt' && args.text) {
      setPrompt(args.text);
      return { result: "Prompt updated" };
    }
    if (name === 'triggerGenerate') {
      setShouldTriggerGenerate(true);
      return { result: "Generation started" };
    }
    if (name === 'setViewMode' && args.mode) {
      setViewMode(args.mode as any);
      return { result: `View mode switched to ${args.mode}` };
    }
    if (name === 'generatePattern' && args.description) {
      setPatternToGenerate(args.description);
      return { result: "Pattern generation triggered" };
    }
    
    // NEW Aura 2.0 tools
    if (name === 'analyzeCurrentDesign') {
      // This is handled implicitly - Aura has canvas vision
      return { result: `Analysis type: ${args.analysisType}` };
    }
    if (name === 'suggestImprovement') {
      onShowToast('info', `Aura suggests: ${args.suggestion}`);
      return { result: "Suggestion recorded" };
    }
    if (name === 'applyMaskEdit') {
      setIsVisualEditorOpen(true);
      onShowToast('info', `Open editor to edit ${args.targetArea}: ${args.editInstruction}`);
      return { result: "Mask editor opened" };
    }
    if (name === 'generateTechPack') {
      await handleEngineer();
      return { result: "Tech pack generated" };
    }
    if (name === 'compareWithTrend') {
      await handleTrendForecast();
      return { result: `Compared with ${args.trendCategory}` };
    }
    if (name === 'estimateCost') {
      onShowToast('info', 'Cost estimation requested');
      return { result: "Cost estimate requested" };
    }
    if (name === 'generateColorVariant') {
      setPrompt(prev => `${prev}. Color scheme: ${args.colorScheme}`);
      setShouldTriggerGenerate(true);
      return { result: `Generating ${args.colorScheme} variant` };
    }
    if (name === 'saveSnapshot') {
      onShowToast('success', 'Design snapshot saved');
      return { result: "Snapshot saved" };
    }
    if (name === 'undoLastChange') {
      handleUndo();
      return { result: "Undo completed" };
    }
    if (name === 'openTryOn') {
      setShowTryOn(true);
      return { result: "Try-on opened" };
    }
    if (name === 'generateRunwayVideo') {
      await handleRunwayVideo();
      return { result: "Runway video generation started" };
    }
    if (name === 'showAuraPanel') {
      setShowAura2Panel(args.show);
      return { result: `Panel ${args.show ? 'shown' : 'hidden'}` };
    }
    
    return { result: "Tool executed" };
  }, [handleEngineer, handleTrendForecast, handleUndo, handleRunwayVideo, onShowToast]);

  // Initialize Aura 2.0
  const { 
    isConnected, 
    isSpeaking, 
    isListening, 
    volume, 
    auraContext, 
    transcript,
    connect, 
    disconnect, 
    sendCanvasUpdate, 
    clearInsights
  } = useLiveAPIv2({ 
    onToolCall: handleToolCallV2,
    onAuraInsight: handleAuraInsight,
    onTranscriptUpdate: handleTranscriptUpdate
  });

  // Send canvas updates when design changes
  useEffect(() => {
    if (isConnected && draft.conceptImage) {
      sendCanvasUpdate(draft.conceptImage);
    }
  }, [isConnected, draft.conceptImage, sendCanvasUpdate]);

  // Handle Aura connection with error handling for user feedback
  const handleAuraConnect = useCallback(async () => {
    try {
      await connect(getCanvasImage);
    } catch (e: any) {
      onShowToast('error', e.message || 'Failed to connect Aura. Check mic permissions and API key.');
    }
  }, [connect, getCanvasImage, onShowToast]);

  // Handle insight action
  const handleInsightAction = useCallback((insight: AuraInsight) => {
    if (insight.actionable) {
      handleToolCallV2(insight.actionable.tool, insight.actionable.args);
    }
  }, [handleToolCallV2]);

  // --- Pan/Zoom Logic (Touch & Wheel) ---
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  
  // Touch refs
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastDistRef = useRef<number | null>(null);

  const handleWheel = (e: React.WheelEvent) => {
    // Zoom to pointer logic
    if (viewMode === 'split' || viewMode === 'xray') return; // Don't interfere with slider
    e.preventDefault();
    e.stopPropagation();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    
    const newZoom = Math.min(Math.max(0.5, zoomLevel + delta), 5); // Clamp zoom 0.5x to 5x
    
    // Calculate new position to keep mouse over same image point
    // Logic: (mouse - pos) / scale = (mouse - newPos) / newScale
    // newPos = mouse - (mouse - pos) * (newScale / scale)
    const newX = mouseX - (mouseX - panPosition.x) * (newZoom / zoomLevel);
    const newY = mouseY - (mouseY - panPosition.y) * (newZoom / zoomLevel);

    setZoomLevel(newZoom);
    setPanPosition({ x: newX, y: newY });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode === 'xray' || viewMode === 'split' || viewMode === 'compare_remix') return;
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    setPanPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const handleGlobalMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
        // Pinch start
        const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        lastDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (viewMode === 'xray' || viewMode === 'split') return;
    
    // Prevent scrolling
    e.preventDefault();

    if (e.touches.length === 1 && lastTouchRef.current) {
        // Pan
        const dx = e.touches[0].clientX - lastTouchRef.current.x;
        const dy = e.touches[0].clientY - lastTouchRef.current.y;
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setPanPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (e.touches.length === 2 && lastDistRef.current) {
        // Pinch Zoom
        const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        
        const delta = dist - lastDistRef.current;
        const zoomSensitivity = 0.005;
        const newZoom = Math.min(Math.max(0.5, zoomLevel + delta * zoomSensitivity), 5);
        
        // Simple center zoom for touch (could be improved to zoom to pinch center)
        setZoomLevel(newZoom);
        lastDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
      lastTouchRef.current = null;
      lastDistRef.current = null;
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  // --- Helper for Sidebar Icons ---
  const SidebarButton = ({ onClick, active, disabled, icon, label, description, accentColor = 'indigo', highlight = false }: any) => {
      const activeColors = {
          indigo: 'bg-nc-accent-soft text-nc-accent-strong border-r-2 border-nc-accent',
          purple: 'bg-nc-accent-soft text-nc-accent-strong border-r-2 border-nc-accent',
          pink: 'bg-pink-50 text-pink-600 border-r-2 border-pink-500',
          emerald: 'bg-emerald-50 text-emerald-600 border-r-2 border-emerald-500'
      };
      
      let buttonClass = 'text-nc-ink-subtle hover:bg-nc-bg-soft hover:text-nc-ink border-transparent border-r-2';
      if (active) {
          buttonClass = activeColors[accentColor as keyof typeof activeColors] || activeColors.indigo;
      } else if (highlight) {
          buttonClass = 'bg-emerald-50 text-emerald-600 animate-pulse border-emerald-300 border-r-2';
      }
      
      return (
          <div className="relative flex justify-center w-full my-1">
              <button 
                  onClick={onClick} 
                  disabled={disabled}
                  aria-label={label}
                  onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredTool({
                          label,
                          description,
                          y: rect.top + rect.height / 2,
                          x: rect.right + 12
                      });
                  }}
                  onMouseLeave={() => setHoveredTool(null)}
                  className={`w-12 h-12 flex items-center justify-center transition-all duration-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed mx-2 ${buttonClass}`}
              >
                  {icon}
              </button>
          </div>
      );
  };

  return (
    <div className="flex flex-col flex-grow h-[calc(100vh-64px)] overflow-hidden bg-nc-bg text-nc-ink font-sans">
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      
      {showTechPackModal && (
          <TechPackModal 
              draft={draft}
              prompt={prompt}
              manufacturingData={manufacturingData}
              costData={costData}
              timelineData={timelineData}
              onClose={() => setShowTechPackModal(false)}
              onPrint={handlePrintTechPack}
              onSendToProduction={handleSendToProduction}
          />
      )}

      {showCapsuleWizard && (
          <CapsuleWizard 
              onClose={() => setShowCapsuleWizard(false)}
              onLoadLook={handleLoadCapsuleLook}
          />
      )}

      {showFashionGPT && (
        <FashionGPTModal
          isOpen={showFashionGPT}
          onClose={() => setShowFashionGPT(false)}
          onLoadToStudio={handleLoadFashionGPTResult}
        />
      )}

      {showCampaignStudio && (
        <CampaignStudio
          isOpen={showCampaignStudio}
          onClose={() => setShowCampaignStudio(false)}
          garmentImage={draft.conceptImage}
          onSetCampaignImage={handleSetCampaignImage}
          onShowToast={onShowToast}
        />
      )}

      {showSensoryInput && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-nc-ink/60 backdrop-blur-sm p-6 animate-fade-in">
            <div className="bg-white rounded-nc-xl w-full max-w-2xl h-[600px] relative shadow-nc-elevated overflow-hidden flex flex-col">
                <button 
                    onClick={() => setShowSensoryInput(false)} 
                    className="absolute top-4 right-4 z-10 p-2 bg-white/50 hover:bg-white rounded-full transition-colors shadow-sm"
                    aria-label="Close sensory input"
                >
                    <svg className="w-5 h-5 text-nc-ink-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <SensoryInput onAnalyze={handleSensoryAnalysis} isProcessing={isLoading} />
            </div>
        </div>
      )}

      {showTryOn && (
          <VirtualTryOn 
              garmentImage={draft.conceptImage}
              garmentPrompt={prompt}
              onClose={() => setShowTryOn(false)}
              onSave={(img) => {
                  const link = document.createElement('a');
                  link.href = `data:image/png;base64,${img}`;
                  link.download = `try-on-${Date.now()}.png`;
                  link.click();
                  onShowToast('success', 'Look saved to device');
              }}
          />
      )}

      {isVisualEditorOpen && draft.conceptImage && (
          <VisualEditor 
              imageBase64={draft.conceptImage}
              onApply={handleVisualEditApply}
              onCancel={() => setIsVisualEditorOpen(false)}
              isLoading={isLoading}
          />
      )}

      {/* Aura 2.0 Panel */}
      <Aura2Panel
        isOpen={showAura2Panel}
        onClose={() => setShowAura2Panel(false)}
        isConnected={isConnected}
        isSpeaking={isSpeaking}
        isListening={isListening}
        volume={volume}
        auraContext={auraContext}
        transcript={transcript}
        onConnect={handleAuraConnect}
        onDisconnect={disconnect}
        onInsightAction={handleInsightAction}
        onClearInsights={clearInsights}
      />

      {showDNASplicer && (
        <DNASplicer
          isOpen={showDNASplicer}
          onClose={() => setShowDNASplicer(false)}
          onLoadResult={handleLoadSplicedDesign}
          onShowToast={onShowToast}
          initialImage={draft.conceptImage}
        />
      )}

      {showFashionForge && (
        <FashionForge
          isOpen={showFashionForge}
          onClose={() => setShowFashionForge(false)}
          conceptImage={draft.conceptImage}
          cadImage={draft.cadImage}
          bomMarkdown={bomToString(draft.materials)}
          designName={prompt.slice(0, 50)}
          onShowToast={onShowToast}
        />
      )}

      <DismissiblePanel 
          title="AI Design Critic" 
          isOpen={showCritic} 
          onClose={() => setShowCritic(false)}
          anchor="right"
      >
          {criticResult ? (
              <div className="space-y-6 p-2">
                  <div>
                      <h4 className="text-white font-bold text-sm mb-2 font-display">Executive Summary</h4>
                      <p className="text-slate-400 text-xs leading-relaxed">{criticResult.summary}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                          <h5 className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest mb-2">Strengths</h5>
                          <ul className="space-y-1">
                              {criticResult.pros.map((p, i) => <li key={i} className="text-slate-300 text-xs flex gap-2"><span className="text-emerald-500">✓</span> {p}</li>)}
                          </ul>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                          <h5 className="text-amber-400 font-bold text-[10px] uppercase tracking-widest mb-2">Risks</h5>
                          <ul className="space-y-1">
                              {criticResult.risks.map((r, i) => <li key={i} className="text-slate-300 text-xs flex gap-2"><span className="text-amber-500">⚠</span> {r}</li>)}
                          </ul>
                      </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                      <h5 className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest mb-2">Suggestions</h5>
                      <ul className="space-y-2">
                          {criticResult.suggestions.map((s, i) => <li key={i} className="text-slate-300 text-xs flex gap-2"><span className="text-indigo-500">➜</span> {s}</li>)}
                      </ul>
                  </div>
              </div>
          ) : <p className="text-slate-500 text-center py-10">No analysis available.</p>}
      </DismissiblePanel>

      {/* Fabric Texture Modal - Updated for Luxury Feel & Library Save */}
      {fabricModal.isOpen && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-nc-ink/80 backdrop-blur-md p-6" onClick={() => setFabricModal(prev => ({...prev, isOpen: false}))}>
              <div className="bg-white rounded-nc-xl p-0 max-w-sm w-full shadow-2xl relative overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-nc-accent to-purple-600"></div>
                  <button onClick={() => setFabricModal(prev => ({...prev, isOpen: false}))} className="absolute top-3 right-3 z-10 p-1.5 bg-white/80 hover:bg-white rounded-full text-nc-ink-subtle hover:text-nc-ink transition-colors shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  
                  <div className="relative aspect-square bg-nc-bg-soft overflow-hidden group">
                      {fabricModal.isLoading ? (
                          <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
                              <div className="w-12 h-12 border-4 border-nc-border-subtle border-t-nc-accent rounded-full animate-spin"></div>
                              <span className="text-xs font-bold text-nc-ink-soft uppercase tracking-widest animate-pulse">Weaving...</span>
                          </div>
                      ) : (
                          fabricModal.image && (
                              <>
                                <img src={`data:image/png;base64,${fabricModal.image}`} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Texture" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6 gap-2">
                                    <button 
                                        onClick={handleApplyFabricToDesign}
                                        className="flex-1 py-3 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                                    >
                                        Apply
                                    </button>
                                    <button 
                                        onClick={handleSaveFabric}
                                        className="flex-1 py-3 bg-nc-ink text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                                    >
                                        Save
                                    </button>
                                </div>
                              </>
                          )
                      )}
                  </div>
                  
                  <div className="p-6">
                      <h3 className="text-lg font-display font-bold text-nc-ink mb-1">{fabricModal.name}</h3>
                      <p className="text-xs text-nc-ink-soft mb-4">High-resolution physics-based texture generation.</p>
                  </div>
              </div>
          </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-b border-nc-border-subtle bg-nc-bg-elevated sticky top-0 z-40">
        <button 
          onClick={() => setMobileTab('canvas')}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors ${mobileTab === 'canvas' ? 'border-nc-accent text-nc-ink' : 'border-transparent text-nc-ink-subtle'}`}
        >
          Design Canvas
        </button>
        <button 
          onClick={() => setMobileTab('tools')}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors ${mobileTab === 'tools' ? 'border-nc-accent text-nc-ink' : 'border-transparent text-nc-ink-subtle'}`}
        >
          Tools
        </button>
        <button 
          onClick={() => setMobileTab('properties')}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors ${mobileTab === 'properties' ? 'border-nc-accent text-nc-ink' : 'border-transparent text-nc-ink-subtle'}`}
        >
          Settings
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-grow overflow-hidden relative">
        
        {/* LEFT TOOLBAR: Visible on desktop, or if mobile tab is 'tools' */}
        <aside 
            id="tour-studio-toolbar"
            className={`${mobileTab === 'tools' ? 'flex' : 'hidden'} md:flex w-full md:w-16 flex-shrink-0 z-10 flex-col items-center py-4 bg-nc-bg-elevated border-r border-nc-border-subtle shadow-sm overflow-y-auto custom-scrollbar pl-safe-left pr-safe-right`} 
            data-purpose="left-toolbar-container"
            onScroll={() => setHoveredTool(null)} // Hide tooltip on scroll to prevent misalignment
        >
            <SidebarButton 
                onClick={() => setIsVisualEditorOpen(true)}
                disabled={!draft.conceptImage}
                icon={<svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="22"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>}
                label="Draw / Mask Edit"
                description="Edit specific areas using AI masking"
            />
            
            {/* Divider */}
            <div className="w-8 h-px bg-nc-border-strong my-2 opacity-50"></div>
            
            <SidebarButton 
                onClick={() => setShowCapsuleWizard(true)}
                icon={<svg className="text-indigo-600" fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="22"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
                label="Collection Wizard"
                accentColor="indigo"
                description="Generate a cohesive line of garments"
            />
            
            <SidebarButton 
              onClick={() => setShowFashionGPT(true)}
              icon={<svg className="text-violet-600" fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="22"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              label="FashionGPT"
              accentColor="purple"
              description="Agentic collection planning & execution"
            />

            <SidebarButton 
              onClick={() => setShowSensoryInput(true)}
              icon={<svg className="text-pink-500" fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="22"><path d="M12 18.75a6 6 0 0 0 6-6c0-3.314-2.686-6-6-6a6 6 0 0 0-6 6c0 3.314 2.686 6 6 6Z" /><path d="M1.5 12.75a10.5 10.5 0 0 1 10.5-10.5" /><path d="M22.5 12.75a10.5 10.5 0 0 0-10.5-10.5" /><path d="M12 21.75a9.75 9.75 0 0 0 9.75-9.75" /><path d="M12 21.75a9.75 9.75 0 0 1-9.75-9.75" /></svg>}
              label="Sensory Translate"
              accentColor="pink"
              description="Convert video/audio into fashion concepts"
            />
            
            <SidebarButton 
                onClick={() => setShowDNASplicer(true)}
                icon={<svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="22"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>}
                label="DNA Splicer"
                accentColor="purple"
                description="Merge style genomes of two designs"
            />

            <SidebarButton 
              onClick={() => setShowFashionForge(true)}
              disabled={!draft.conceptImage || !draft.materials}
              icon={<svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="22"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>}
              label="FashionForge Pipeline"
              accentColor="emerald"
              description="Find manufacturers & estimate costs"
            />

            <div className="w-8 h-px bg-nc-border-strong my-2 opacity-50"></div>
            
            <SidebarButton 
                onClick={handleCritic}
                disabled={!draft.conceptImage}
                active={showCritic}
                icon={<svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="22"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1-3.8.9h.04zm-10 1.132a2.3 2.3 0 0 0-3.3 0l-6.1 6.1a2.3 2.3 0 0 0 0 3.3l6.1 6.1a2.3 2.3 0 0 0 3.3 0l6.1-6.1a2.3 2.3 0 0 0 0-3.3z"></path></svg>}
                label="AI Design Critic"
                accentColor="pink"
                description="Get professional design feedback"
            />
            
            <SidebarButton 
                onClick={() => setShowCampaignStudio(true)}
                disabled={!draft.conceptImage}
                active={showCampaignStudio}
                icon={<svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="22"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>}
                label="Campaign Studio"
                accentColor="pink"
                description="Generate editorial marketing assets"
            />

            <SidebarButton 
                onClick={() => setShowTryOn(true)}
                disabled={!draft.conceptImage}
                active={showTryOn}
                icon={<svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="22"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>}
                label="Magic Mirror (Try-On)"
                accentColor="pink"
                description="Virtually try on your design"
            />
        </aside>
        
        {/* CENTER: Canvas - Visible on desktop or if mobile tab is 'canvas' */}
        <div 
            ref={canvasRef}
            className={`${mobileTab === 'canvas' ? 'flex' : 'hidden'} md:flex flex-1 relative overflow-hidden bg-nc-bg cursor-grab active:cursor-grabbing items-center justify-center p-0 transition-all flex-col`}
            onMouseDown={handleMouseDown}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }} // Crucial for mobile pan/zoom
        >
            {/* Drag Overlay */}
            {isDraggingOver && (
                <div className="absolute inset-4 z-50 border-4 border-dashed border-nc-accent rounded-3xl bg-nc-accent-soft/20 backdrop-blur-sm flex items-center justify-center pointer-events-none animate-pulse">
                    <div className="bg-nc-bg-elevated px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
                        <svg className="w-6 h-6 text-nc-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                        <span className="text-sm font-bold text-nc-ink uppercase tracking-widest">Drop to Apply Texture</span>
                    </div>
                </div>
            )}

            {/* Top View Controller (Only if CAD exists) */}
            {draft.cadImage && (
              <div className="absolute top-6 mt-safe-top left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-lg rounded-full p-1 shadow-lg border border-nc-border-subtle flex gap-1 animate-slide-up">
                <button 
                  onClick={() => setViewMode('concept')}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'concept' ? 'bg-nc-ink text-white shadow-md' : 'text-nc-ink-subtle hover:text-nc-ink hover:bg-white/50'}`}
                >
                  Design
                </button>
                <button 
                  onClick={() => setViewMode('split')}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'split' ? 'bg-nc-ink text-white shadow-md' : 'text-nc-ink-subtle hover:text-nc-ink hover:bg-white/50'}`}
                >
                  X-Ray
                </button>
                <button 
                  onClick={() => setViewMode('engineering')}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'engineering' ? 'bg-nc-ink text-white shadow-md' : 'text-nc-ink-subtle hover:text-nc-ink hover:bg-white/50'}`}
                >
                  Tech Pack
                </button>
                {draft.runwayVideoUrl && (
                  <button 
                    onClick={() => setViewMode('runway')}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'runway' ? 'bg-nc-ink text-white shadow-md' : 'text-nc-ink-subtle hover:text-nc-ink hover:bg-white/50'}`}
                  >
                    Runway
                  </button>
                )}
              </div>
            )}

            {/* Canvas Content */}
            <div className="flex-1 flex items-center justify-center w-full relative h-full">
                <div 
                    className="relative transition-transform duration-75 ease-out will-change-transform max-w-full max-h-full flex items-center justify-center"
                    style={{ 
                        transform: `scale(${zoomLevel}) translate(${panPosition.x}px, ${panPosition.y}px)`,
                        width: '100%',
                        height: '100%',
                        padding: '80px', // More breathing room
                    }}
                >
                    {/* View Mode Switching */}
                    {viewMode === 'split' && draft.conceptImage && draft.cadImage ? (
                        <CompareSlider image1={draft.conceptImage} image2={draft.cadImage} zoom={1} />
                    ) : viewMode === 'compare_remix' && draft.conceptImage && draft.history[0] ? (
                        // Compare current with original remix source (history[0])
                        <CompareSlider image1={draft.history[0]} image2={draft.conceptImage} zoom={1} />
                    ) : viewMode === 'engineering' && draft.cadImage ? (
                        <img src={`data:image/png;base64,${draft.cadImage}`} className="max-w-[85%] max-h-[85%] object-contain shadow-2xl rounded-sm" alt="CAD" draggable={false} />
                    ) : viewMode === 'runway' && draft.runwayVideoUrl ? (
                        <video src={draft.runwayVideoUrl} controls autoPlay loop className="max-w-[85%] max-h-[85%] object-contain shadow-2xl rounded-xl" />
                    ) : draft.conceptImage ? (
                        <div className="relative group flex items-center justify-center w-full h-full">
                            <img src={`data:image/png;base64,${draft.conceptImage}`} className="max-w-[85%] max-h-[85%] object-contain shadow-2xl rounded-sm" alt="Concept" draggable={false} />
                        </div>
                    ) : (
                        <div className="text-center opacity-100 select-none pointer-events-auto z-10 max-w-md p-6">
                            <div className="w-24 h-24 bg-nc-bg-elevated rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-nc-border-subtle animate-float">
                                <svg className="w-10 h-10 text-nc-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            </div>
                            <h2 className="text-3xl font-bold text-nc-ink mb-2 font-display tracking-tight">Atelier Canvas</h2>
                            <p className="text-sm text-nc-ink-soft mb-8">Start your collection. Describe a vision or choose a starting point.</p>
                            
                            <div className="grid grid-cols-2 gap-3">
                                {INSPIRATION_STARTERS.map((starter, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => handleInspirationClick(starter.prompt)}
                                        className="text-left p-3 rounded-xl bg-white/50 border border-nc-border-subtle hover:border-nc-accent hover:bg-white hover:shadow-md transition-all group"
                                    >
                                        <div className="text-lg mb-1 group-hover:scale-110 transition-transform origin-left">{starter.icon}</div>
                                        <div className="text-xs font-bold text-nc-ink">{starter.title}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Aura Orb (Top Left) - Moved out of canvas transform */}
            {draft.conceptImage && (
                <div className="absolute top-6 mt-safe-top left-6 z-30 pointer-events-auto">
                    <Aura2Orb 
                        isConnected={true} 
                        isSpeaking={false} 
                        isListening={false} 
                        volume={0} 
                        isAnalyzing={false} 
                        onClick={() => setShowAura2Panel(!showAura2Panel)} 
                    />
                </div>
            )}

            {/* Physics HUD Overlay */}
            {draft.fabricPhysics && <PHYSICS_HUD physics={draft.fabricPhysics} />}

            {/* DNA Card Toggle / Display (Top Right) */}
            {draft.conceptImage && currentDesignDNA && (
                <div className="absolute top-6 mt-safe-top right-6 z-30 pointer-events-auto flex flex-col items-end gap-2">
                    <button 
                        onClick={() => setShowDnaCard(!showDnaCard)}
                        className={`group flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all shadow-sm hover:shadow-md ${showDnaCard ? 'bg-nc-ink text-white border-nc-ink' : 'bg-white/90 hover:bg-white text-nc-ink border-nc-border-subtle'}`}
                    >
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[8px] text-white font-bold shadow-sm">🧬</div>
                        <span className="text-xs font-bold uppercase tracking-wider">{showDnaCard ? 'Hide DNA' : 'Style DNA'}</span>
                    </button>
                    
                    {showDnaCard && (
                        <div className="animate-scale-in origin-top-right">
                            <DNACard dna={currentDesignDNA} onViewDetails={() => {}} />
                        </div>
                    )}
                </div>
            )}

            {/* History Filmstrip */}
            {draft.history.length > 0 && (
              <div className="w-full h-20 flex items-center gap-2 overflow-x-auto custom-scrollbar p-2 bg-nc-bg-elevated/80 backdrop-blur rounded-xl border border-nc-border-subtle absolute bottom-4 left-24 right-24 max-w-2xl mx-auto z-30 shadow-lg justify-center">
                {draft.history.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); handleHistorySelect(idx); }}
                    className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      historyIndex === idx ? 'border-nc-accent ring-2 ring-nc-accent/30' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={`data:image/png;base64,${img}`} className="w-full h-full object-cover" alt={`Version ${idx}`} />
                  </button>
                ))}
              </div>
            )}

            {/* Floating Tools (Zoom & Undo/Redo) */}
            <div className="absolute bottom-32 left-8 flex flex-col gap-4 z-20 hidden md:flex">
                {/* Undo / Redo Group */}
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                        className="w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-full flex items-center justify-center text-nc-ink hover:bg-white transition-colors border border-nc-border-subtle disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Undo (Ctrl+Z)"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    </button>
                    <button 
                        onClick={handleRedo}
                        disabled={historyIndex >= draft.history.length - 1}
                        className="w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-full flex items-center justify-center text-nc-ink hover:bg-white transition-colors border border-nc-border-subtle disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                    </button>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-nc-border-strong/30"></div>

                {/* Zoom Group */}
                <div className="flex flex-col gap-2">
                    <button onClick={() => setZoomLevel(z => Math.min(z + 0.1, 3))} className="w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-full flex items-center justify-center text-nc-ink hover:bg-white transition-colors text-lg font-bold border border-nc-border-subtle">+</button>
                    <div className="w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-full flex items-center justify-center text-[10px] font-bold text-nc-ink-soft border border-nc-border-subtle">{Math.round(zoomLevel * 100)}%</div>
                    <button onClick={() => setZoomLevel(z => Math.max(z - 0.1, 0.5))} className="w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-full flex items-center justify-center text-nc-ink hover:bg-white transition-colors text-lg font-bold border border-nc-border-subtle">-</button>
                </div>
            </div>

            {/* Quick Action Bar (Bottom Center) - Context Aware */}
            {draft.conceptImage && (
                <div className="absolute bottom-24 md:bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 bg-white/90 backdrop-blur-lg shadow-2xl border border-nc-border-subtle rounded-full z-40 animate-slide-up max-w-[90vw] overflow-x-auto">
                    
                    {/* Primary Action State Switching */}
                    {showEngineeringCTA ? (
                        // STATE 1: Concept Generated, Needs Engineering
                        <button 
                            onClick={handleEngineer}
                            disabled={isLoading}
                            className="pl-6 pr-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:shadow-lg hover:scale-105 transition-all flex items-center gap-3 animate-pulse-slow shadow-emerald-500/30 whitespace-nowrap"
                        >
                            <div className="p-1 bg-white/20 rounded-full">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            </div>
                            Generate Tech Pack
                        </button>
                    ) : (
                        // STATE 2: Engineering Done, Primary is Publish/Share
                        <button onClick={handlePublishClick} className="pl-6 pr-8 py-3 bg-nc-ink text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-nc-ink-soft shadow-lg transition-all flex items-center gap-3">
                            <div className="p-1 bg-white/20 rounded-full">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </div>
                            Publish
                        </button>
                    )}

                    <div className="w-px h-8 bg-nc-border-strong mx-1 opacity-50"></div>

                    <button 
                        onClick={downloadAsset} 
                        className="w-10 h-10 flex-shrink-0 rounded-full bg-nc-bg-soft hover:bg-white text-nc-ink flex items-center justify-center transition-colors border border-transparent hover:border-nc-border-subtle"
                        title="Download Asset"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                    
                    <button 
                        onClick={handleRunwayVideo}
                        className="w-10 h-10 flex-shrink-0 rounded-full bg-nc-bg-soft hover:bg-white text-nc-ink flex items-center justify-center transition-colors border border-transparent hover:border-nc-border-subtle"
                        title="Generate Video"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                    </button>

                    <button 
                        onClick={handleClearCanvas} 
                        className="w-10 h-10 flex-shrink-0 rounded-full bg-nc-bg-soft hover:bg-red-50 text-nc-ink hover:text-nc-rose flex items-center justify-center transition-colors border border-transparent hover:border-red-100"
                        title="Clear Canvas"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            )}

            {/* Tooltip Portal */}
            {hoveredTool && createPortal(
                <div 
                    className="fixed z-[100] px-4 py-3 bg-nc-ink text-white rounded-lg shadow-xl border border-white/10 pointer-events-none animate-fade-in flex flex-col gap-1 min-w-[150px] max-w-[200px]"
                    style={{ top: hoveredTool.y, left: hoveredTool.x, transform: 'translateY(-50%)' }}
                >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white border-b border-white/20 pb-1 mb-1 block">
                        {hoveredTool.label}
                    </span>
                    {hoveredTool.description && (
                        <span className="text-[9px] text-white/70 leading-relaxed font-medium">
                            {hoveredTool.description}
                        </span>
                    )}
                    {/* Arrow */}
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-nc-ink rotate-45 border-l border-b border-white/10"></div>
                </div>,
                document.body
            )}
        </div>

        {/* RIGHT: Properties Panel - Visible on desktop or if mobile tab is 'properties' */}
        <div 
            id="tour-studio-properties"
            className={`${mobileTab === 'properties' ? 'flex' : 'hidden'} md:flex w-full md:w-80 bg-nc-bg-elevated border-l border-nc-border-subtle flex-col shadow-xl z-20`} 
            data-purpose="right-properties-panel"
        >
            <div className="flex border-b border-nc-border-subtle">
                <button 
                    onClick={() => setActiveRightTab('properties')}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors ${activeRightTab === 'properties' ? 'border-nc-accent text-nc-ink' : 'border-transparent text-nc-ink-subtle hover:text-nc-ink'}`}
                >
                    Design
                </button>
                <button 
                    onClick={() => setActiveRightTab('materials')}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors ${activeRightTab === 'materials' ? 'border-nc-accent text-nc-ink' : 'border-transparent text-nc-ink-subtle hover:text-nc-ink'}`}
                >
                    Materials
                </button>
                <button 
                    onClick={() => setActiveRightTab('sourcing')}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors ${activeRightTab === 'sourcing' ? 'border-nc-accent text-nc-ink' : 'border-transparent text-nc-ink-subtle hover:text-nc-ink'}`}
                >
                    Source
                </button>
                <button 
                    onClick={() => setActiveRightTab('settings')}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors ${activeRightTab === 'settings' ? 'border-nc-accent text-nc-ink' : 'border-transparent text-nc-ink-subtle hover:text-nc-ink'}`}
                >
                    Tech
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                
                {activeRightTab === 'properties' && (
                    <div className="space-y-6" data-purpose="ai-generation" id="tour-studio-ai-generation">
                        {/* Prompt Input */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-bold text-nc-ink-subtle uppercase tracking-widest">Prompt</label>
                                <button onClick={handleRandomPrompt} className="text-[10px] text-nc-accent font-bold hover:underline">Surprise Me</button>
                            </div>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe your garment..."
                                className="w-full h-32 p-3 text-base md:text-sm bg-nc-bg-soft border border-transparent focus:border-nc-accent rounded-lg resize-none outline-none transition-all placeholder:text-nc-ink-subtle text-nc-ink"
                                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                            />
                            <div className="flex gap-2 mt-2 overflow-x-auto pb-1 custom-scrollbar">
                                {INSPIRATION_STARTERS.map((starter, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleInspirationClick(starter.prompt)}
                                        className="flex-shrink-0 text-lg bg-nc-bg-soft hover:bg-white border border-transparent hover:border-nc-border-subtle rounded-full w-8 h-8 flex items-center justify-center transition-all"
                                        title={starter.title}
                                    >
                                        {starter.icon}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-3 space-y-2">
                                <p className="text-[11px] text-nc-ink-subtle">
                                    Hint: short, vivid prompts work best. Try layering material + silhouette + mood.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        'Cozy oversized cable knit sweater, cream wool, soft texture',
                                        'Tailored linen blazer in navy blue, unstructured fit, summer smart casual',
                                        'Black leather moto jacket, silver hardware, asymmetrical zipper, classic fit'
                                    ].map((sample) => (
                                        <button
                                            key={sample}
                                            onClick={() => setPrompt(sample)}
                                            className="text-[11px] bg-nc-bg-soft hover:bg-white border border-nc-border-subtle hover:border-nc-accent px-3 py-1 rounded-full text-nc-ink-soft hover:text-nc-ink transition-colors"
                                        >
                                            {sample}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Extracted Color Palette */}
                        {draft.colorPalette && (
                            <div className="bg-white/50 p-3 rounded-lg border border-nc-border-subtle">
                                <label className="text-[10px] font-bold text-nc-ink-subtle uppercase tracking-widest block mb-2">AI Palette</label>
                                <div className="flex gap-2 flex-wrap">
                                    {draft.colorPalette.map((color, i) => (
                                        <div key={i} className="group relative flex flex-col items-center">
                                            <div 
                                                className="w-8 h-8 rounded-full shadow-sm border border-black/10 cursor-pointer hover:scale-110 transition-transform"
                                                style={{ backgroundColor: color.hex }}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(color.hex);
                                                    onShowToast('info', `Copied ${color.hex}`);
                                                }}
                                            />
                                            <span className="text-[8px] text-nc-ink-subtle mt-1">{color.hex}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Fabric Physics - NOW ALSO IN HUD */}
                        {draft.fabricPhysics && (
                            <div className="bg-white/50 p-3 rounded-lg border border-nc-border-subtle md:hidden">
                                <label className="text-[10px] font-bold text-nc-ink-subtle uppercase tracking-widest block mb-2">Visual Physics</label>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-nc-bg-soft p-2 rounded">
                                        <span className="block text-[9px] text-nc-ink-subtle uppercase">Weight</span>
                                        <span className="font-bold">{draft.fabricPhysics.weightGSM} gsm</span>
                                    </div>
                                    <div className="bg-nc-bg-soft p-2 rounded">
                                        <span className="block text-[9px] text-nc-ink-subtle uppercase">Drape</span>
                                        <span className="font-bold">{draft.fabricPhysics.drape}</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-nc-ink-soft mt-2 italic">"{draft.fabricPhysics.textureDescription}"</p>
                            </div>
                        )}

                        {/* Model Selection */}
                        <div>
                            <label className="text-[10px] font-bold text-nc-ink-subtle uppercase tracking-widest block mb-2">Presentation</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(Object.keys(MODEL_PROMPTS) as ModelType[]).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setSelectedModel(m)}
                                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                                            selectedModel === m 
                                            ? 'bg-nc-ink text-white border-nc-ink' 
                                            : 'bg-white text-nc-ink-soft border-nc-border-subtle hover:border-nc-border-strong'
                                        }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || isLoading}
                            className="w-full py-4 bg-gradient-to-r from-nc-accent to-purple-600 text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Generating...' : 'Generate Concept'}
                        </button>
                        
                        <div className="pt-4 border-t border-nc-border-subtle">
                            <button 
                                onClick={handleTrendForecast}
                                className="w-full py-2 bg-emerald-50 text-emerald-700 font-bold text-xs uppercase tracking-wider rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                Apply Trend Forecast
                            </button>
                            {trendSources.length > 0 && (
                                <div className="mt-3 space-y-1">
                                    <p className="text-[9px] text-nc-ink-subtle uppercase font-bold">Sources</p>
                                    {trendSources.map((s, i) => (
                                        <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="block text-[10px] text-nc-accent hover:underline truncate">
                                            {s.title}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeRightTab === 'materials' && (
                    <>
                        <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                            <button 
                                onClick={() => setMaterialTab('generate')}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${materialTab === 'generate' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Generate
                            </button>
                            <button 
                                onClick={() => setMaterialTab('library')}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${materialTab === 'library' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Library
                            </button>
                        </div>
                        {materialTab === 'generate' ? (
                            <PatternGenerator 
                              onApplyTexture={handleApplyTexture} 
                              autoPrompt={patternToGenerate} 
                              onFeedback={onShowToast}
                            />
                        ) : (
                            <MaterialLibrary onApply={handleApplyTexture} />
                        )}
                    </>
                )}

                {activeRightTab === 'sourcing' && (
                    <div className="space-y-4">
                        <SourcingPanel bom={bomToString(draft.materials)} />
                        {draft.cadImage && draft.materials && (
                            <div className="pt-4 border-t border-nc-border-subtle">
                                <button 
                                    onClick={handleManufacturingAnalysis}
                                    disabled={isLoading}
                                    className="w-full py-2 bg-nc-bg-soft text-nc-ink font-bold text-xs uppercase tracking-wider rounded-lg border border-nc-border-subtle hover:bg-nc-border-subtle transition-colors"
                                >
                                    Analyze Feasibility
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeRightTab === 'settings' && (
                    <div className="space-y-6">
                        {/* BOM Editor */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-bold text-nc-ink-subtle uppercase tracking-widest">Bill of Materials</label>
                                <span className="text-[9px] text-nc-accent cursor-pointer hover:underline" onClick={() => setActiveRightTab('sourcing')}>Source Fabrics</span>
                            </div>
                            
                            {typeof draft.materials === 'string' ? (
                                <textarea
                                    value={draft.materials}
                                    onChange={(e) => handleUpdateBom(e.target.value)}
                                    placeholder="Materials will appear here..."
                                    className="w-full h-40 p-3 text-xs font-mono bg-nc-bg-soft border border-transparent focus:border-nc-accent rounded-lg resize-y outline-none transition-all text-nc-ink"
                                />
                            ) : (
                                <div className="bg-nc-bg-soft rounded-lg p-2 max-h-60 overflow-y-auto">
                                    <BomParser 
                                        markdown={draft.materials} 
                                        onMaterialClick={handleMaterialClick}
                                    />
                                    <button 
                                        onClick={() => setDraft(prev => ({...prev, materials: JSON.stringify(prev.materials, null, 2) }))}
                                        className="text-[9px] text-nc-accent mt-2 hover:underline block w-full text-right px-2 pb-1"
                                    >
                                        Edit Raw JSON
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Tech Pack Options */}
                        <div>
                            <label className="text-[10px] font-bold text-nc-ink-subtle uppercase tracking-widest block mb-2">Export Settings</label>
                            <div className="flex items-center justify-between p-2 bg-nc-bg-soft rounded-lg mb-2">
                                <span className="text-xs font-medium text-nc-ink">Simplify CAD Lines</span>
                                <input 
                                    type="checkbox" 
                                    checked={simplifyCad} 
                                    onChange={(e) => setSimplifyCad(e.target.checked)}
                                    className="accent-nc-accent"
                                />
                            </div>
                            <button 
                                onClick={handleOpenTechPack}
                                disabled={!draft.conceptImage}
                                className="w-full py-3 bg-nc-ink text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-nc-ink-soft transition-all disabled:opacity-50"
                            >
                                View Tech Pack
                            </button>
                        </div>

                        <QualityMonitor 
                            bom={bomToString(draft.materials)}
                            cadImage={draft.cadImage} 
                            onUpdateBom={(val) => handleUpdateBom(val)} // Only supports string updates for now from auto-repair
                            onShowToast={onShowToast}
                        />
                    </div>
                )}
            </div>
        </div>
        {/* END: Right Properties Panel */}
      </div>
    </div>
  );
};
