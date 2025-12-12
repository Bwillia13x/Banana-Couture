
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  cadImageUrl?: string;
  runwayVideoUrl?: string; // New: Veo Video
  materials?: string[] | StructuredBOM; // Updated to allow structured data
  creator: string;
  likes: number;
  remixedFrom?: {
    id: string;
    name: string;
    creator: string;
  };
}

export enum AppView {
  HOME = 'HOME',
  STUDIO = 'STUDIO',
  MARKETPLACE = 'MARKETPLACE',
  PROFILE = 'PROFILE',
  CHALLENGES = 'CHALLENGES'
}

export interface GenerationState {
  isGenerating: boolean;
  stage: 'idle' | 'concept' | 'editing' | 'engineering' | 'publishing';
  error: string | null;
}

// New Structured Types
export interface ColorSwatch {
  name: string;
  hex: string;
  usage: string; // e.g., "Primary", "Accent", "Trim"
}

export interface FabricPhysics {
  weightGSM: number;
  drape: 'High' | 'Medium' | 'Low' | 'Stiff';
  transparency: number; // 0-100
  textureDescription: string;
}

export interface BOMItem {
  category: 'Main Fabric' | 'Lining' | 'Hardware' | 'Trim' | 'Thread';
  name: string;
  composition: string;
  placement: string;
  estimatedQty: string;
}

export interface StructuredBOM {
  items: BOMItem[];
  productionNotes: string[];
}

export interface CostBreakdown {
  materials: {
    fabric: number;
    trims: number;
    hardware: number;
    packaging: number;
  };
  labor: {
    cutting: number;
    sewing: number;
    finishing: number;
    qc: number;
  };
  overhead: {
    sampling: number;
    shipping: number;
    duties: number;
    miscellaneous: number;
  };
  total: number;
  perUnit: number;
  currency: string;
  margin: {
    suggestedRetailPrice: number; // Unified name
    wholesalePrice: number;
    profitMargin: number;
  };
}

export interface ProductionTimeline {
  sampling: string;
  production: string;
  shipping: string;
  totalLeadTime: string;
  // Extended fields for FashionForge
  phases?: {
    name: string;
    durationDays: number;
    startDay: number;
    endDay: number;
    dependencies: string[];
    risks: string[];
  }[];
  totalDays?: number;
  criticalPath?: string[];
  bufferDays?: number;
  estimatedDeliveryDate?: string;
}

export interface DesignBrief {
  garmentType: string;
  style: string;
  targetDemographic: string;
  keyFeatures: string[];
  colorPalette: string[];
  fabricSuggestions: string[];
  constructionNotes: string;
  marketPositioning: string;
  estimatedRetailPrice: string;
  sustainabilityConsiderations: string[];
}

export interface SupplierRecommendation {
  material: string;
  suppliers: {
    name: string;
    location: string;
    sustainability: string;
    priceRange: string;
    minimumOrder: string;
    url?: string;
  }[];
}

export interface ManufacturingAnalysis {
  feasibilityScore: number; // 0-100
  costRating: 'Low' | 'Medium' | 'High';
  productionRisks: string[];
  manufacturingSuggestions: string[];
}

export interface ProductionReadyPack {
  designBrief: DesignBrief;
  conceptImage: string;
  cadImage: string | null;
  bomMarkdown: string;
  sizingChart: string;
  costBreakdown: CostBreakdown;
  manufacturingAnalysis: ManufacturingAnalysis;
  supplierRecommendations: SupplierRecommendation[];
  productionTimeline: ProductionTimeline;
}

export interface DesignDraft {
  conceptImage: string | null; // Base64
  cadImage: string | null; // Base64
  runwayVideoUrl?: string; // Blob URL or Base64
  campaignImages?: string[]; // Array of Base64 marketing images
  materials: string | StructuredBOM; // Updated to support structured
  colorPalette?: ColorSwatch[]; // New
  fabricPhysics?: FabricPhysics; // New
  sizingChart?: string; // Markdown Table
  history: string[]; // History of images for undo potentially
  parentInfo?: {
    id: string;
    name: string;
    creator: string;
  };
  productionData?: ProductionReadyPack; // Persist FashionGPT data
}

export interface SavedDraft {
  id: string;
  name: string;
  timestamp: number;
  data: DesignDraft;
  prompt: string;
}

export type NotificationType = 'success' | 'error' | 'info' | 'level-up';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

// Phase 1: Capsule Collection Types
export interface CapsuleGarment {
  id: string;
  name: string;
  description: string;
  conceptPrompt: string;
  conceptImage: string | null;
  cadImage: string | null;
  bomMarkdown: string;
}

export interface CapsuleCollectionResult {
  theme: string;
  story: string;
  garments: CapsuleGarment[];
  sources?: { title: string, uri: string }[];
}

export interface SavedCapsule {
  id: string;
  name: string;
  timestamp: number;
  result: CapsuleCollectionResult;
}

// Phase 1: AI Critic Types
export interface DesignCritique {
  summary: string;
  pros: string[];
  risks: string[];
  suggestions: string[];
}

// Phase 2: Guardrails & Reliability Types
export interface BomValidationResult {
  isComplete: boolean;
  issues: string[];
  repairedMarkdown: string;
}

export interface CadReadabilityReview {
  isReadable: boolean;
  issues: string[];
  recommendation?: string;
}

// Phase 4: Gamification Types
export interface Challenge {
  id: string;
  title: string;
  description: string;
  promptHint: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xpReward: number;
  timeLeft: string; // e.g., "14h 30m"
  participants: number;
  coverImage: string; // URL
  requirements: string[];
}

export interface UserStats {
  xp: number;
  level: number;
  nextLevelXp: number;
  badges: string[]; // Badge IDs
  challengesCompleted: number;
  ownedItemIds: string[]; // Inventory of purchased Product IDs
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: string;
}

// ============================================
// BRAND IDENTITY TYPES
// ============================================

export interface BrandIdentity {
  name: string;
  tagline: string;
  story: string;
  archetype: string;
  colorPalette: { name: string; hex: string }[];
  logoImage?: string; // Base64
  typography: { primary: string; secondary: string };
  targetAudience: string;
}

// ============================================
// FASHIONGPT TYPES
// ============================================

export interface FashionGPTInput {
  prompt: string;
  targetAudience?: string;
  budgetTier?: 'budget' | 'mid-range' | 'premium' | 'luxury';
  sustainabilityPriority?: 'low' | 'medium' | 'high';
  productionScale?: 'sample' | 'small-batch' | 'mass-production';
}

export interface FashionGPTStage {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  progress: number;
  result?: any;
  error?: string;
  startTime?: number;
  endTime?: number;
}

// ============================================
// LOOKBOOK TYPES
// ============================================

export interface LookbookContent {
  title: string;
  season: string;
  narrative: string;
  themeTags: string[];
  looks: {
    productId: string;
    caption: string;
    stylingNotes: string;
  }[];
}
