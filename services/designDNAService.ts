
import { GoogleGenAI, Type } from "@google/genai";
import { getGeminiApiKey, MISSING_API_KEY_MESSAGE, promptForApiKeySelection } from "./apiKey";

// Helper to get fresh client
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: getGeminiApiKey() });
};

// Helper to extract image from response
const extractImage = (response: any): string | null => {
  if (!response.candidates?.[0]?.content?.parts) return null;
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData && part.inlineData.data) {
      return part.inlineData.data;
    }
  }
  return null;
};

// Centralized Error Handling
const normalizeGeminiError = (error: any): string => {
  console.error("Gemini API Error:", error);
  const msg = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
  const lowerMsg = msg.toLowerCase();
  
  if (msg.includes(MISSING_API_KEY_MESSAGE) || lowerMsg.includes('gemini_api_key') || lowerMsg.includes('api key')) {
    return MISSING_API_KEY_MESSAGE;
  }
  if (msg.includes('429') || msg.includes('quota') || msg.includes('resource exhausted')) {
    return "Service busy (Rate Limit). Please wait a moment.";
  }
  if (msg.includes('500') || msg.includes('503') || msg.includes('network')) {
    return "Network/Service error. Please check connection.";
  }
  if (msg.includes('safety') || msg.includes('blocked') || msg.includes('finishReason')) {
    return "Content blocked by safety filters. Please modify your input.";
  }
  if (msg.includes('Requested entity was not found') || msg.includes('403') || msg.includes('PERMISSION_DENIED') || lowerMsg.includes('permission_denied') || lowerMsg.includes('permission denied')) {
      return "API Key Error. Access denied. Please re-select your API Key.";
  }
  return "AI processing failed. Please try again.";
};

const safeCall = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    const msg = normalizeGeminiError(error);
    if (msg.includes("API Key Error")) {
        promptForApiKeySelection();
    }
    throw new Error(msg);
  }
};

// ============================================
// DESIGN DNA TYPES
// ============================================

export interface StyleGene {
  category: 'silhouette' | 'colorway' | 'texture' | 'construction' | 'aesthetic' | 'detail';
  name: string;
  value: string;
  confidence: number; // 0-1
  visualDescriptor: string;
}

export interface DesignDNA {
  id: string;
  extractedFrom: string; // Image source identifier
  timestamp: number;
  
  // Core Genome
  silhouette: StyleGene;
  colorway: StyleGene;
  texture: StyleGene;
  construction: StyleGene;
  aesthetic: StyleGene;
  details: StyleGene[];
  
  // Meta
  overallStyle: string;
  era: string;
  mood: string;
  targetDemographic: string;
  
  // Compatibility scores for splicing
  compatibilityProfile: {
    formal: number;
    casual: number;
    avant_garde: number;
    minimalist: number;
    maximalist: number;
  };
  
  // Raw embedding for similarity matching
  styleVector: number[];
}

export interface SpliceConfig {
  parentA: DesignDNA;
  parentB: DesignDNA;
  
  // Gene selection (which parent to take each gene from)
  geneSelection: {
    silhouette: 'A' | 'B' | 'blend';
    colorway: 'A' | 'B' | 'blend';
    texture: 'A' | 'B' | 'blend';
    construction: 'A' | 'B' | 'blend';
    aesthetic: 'A' | 'B' | 'blend';
  };
  
  // Mutation parameters
  mutationStrength: number; // 0-1, how much to deviate from parents
  creativityBias: number; // 0-1, conservative to experimental
  
  // Constraints
  targetAesthetic?: string;
  avoidElements?: string[];
}

export interface SpliceResult {
  childDNA: DesignDNA;
  conceptImage: string;
  inheritanceReport: {
    fromParentA: string[];
    fromParentB: string[];
    mutations: string[];
  };
  generationPrompt: string;
}

export interface DNAMatchResult {
  dna: DesignDNA;
  similarity: number;
  compatibilityScore: number;
  spliceRecommendation: string;
}

// ============================================
// DNA EXTRACTION
// ============================================

/**
 * Extracts the complete Style DNA from a fashion image
 */
export const extractDesignDNA = async (imageBase64: string, sourceId?: string): Promise<DesignDNA> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: imageBase64 } },
          { text: `You are a Fashion Genome Analyst. Extract the complete "Style DNA" from this garment image.

Analyze every design element and encode it into structured genome data.

For each gene category, provide:
- name: Specific term (e.g., "A-Line", "Oversized Boxy")
- value: Detailed description
- confidence: Your confidence in the assessment (0-1)
- visualDescriptor: How this manifests visually

Categories to analyze:
1. SILHOUETTE: Overall shape, fit, proportions
2. COLORWAY: Color palette, contrast levels, color relationships
3. TEXTURE: Surface quality, fabric appearance, tactile impression
4. CONSTRUCTION: Seams, structure, technical execution
5. AESTHETIC: Style movement, design philosophy
6. DETAILS: Individual design elements (buttons, collars, etc.)

Also determine:
- overallStyle: Single phrase describing the design
- era: Fashion era it belongs to or references
- mood: Emotional impression
- targetDemographic: Who this is designed for
- compatibilityProfile: Score (0-1) for mixing with different style categories

Return JSON.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            silhouette: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                visualDescriptor: { type: Type.STRING }
              },
              required: ["name", "value", "confidence", "visualDescriptor"]
            },
            colorway: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                visualDescriptor: { type: Type.STRING }
              },
              required: ["name", "value", "confidence", "visualDescriptor"]
            },
            texture: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                visualDescriptor: { type: Type.STRING }
              },
              required: ["name", "value", "confidence", "visualDescriptor"]
            },
            construction: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                visualDescriptor: { type: Type.STRING }
              },
              required: ["name", "value", "confidence", "visualDescriptor"]
            },
            aesthetic: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                visualDescriptor: { type: Type.STRING }
              },
              required: ["name", "value", "confidence", "visualDescriptor"]
            },
            details: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  name: { type: Type.STRING },
                  value: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  visualDescriptor: { type: Type.STRING }
                }
              }
            },
            overallStyle: { type: Type.STRING },
            era: { type: Type.STRING },
            mood: { type: Type.STRING },
            targetDemographic: { type: Type.STRING },
            compatibilityProfile: {
              type: Type.OBJECT,
              properties: {
                formal: { type: Type.NUMBER },
                casual: { type: Type.NUMBER },
                avant_garde: { type: Type.NUMBER },
                minimalist: { type: Type.NUMBER },
                maximalist: { type: Type.NUMBER }
              }
            }
          },
          required: ["silhouette", "colorway", "texture", "construction", "aesthetic", "details", "overallStyle", "era", "mood", "targetDemographic", "compatibilityProfile"]
        }
      }
    });

    const extracted = JSON.parse(response.text || "{}");
    
    // Add metadata and generate style vector
    const dna: DesignDNA = {
      id: `dna-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      extractedFrom: sourceId || 'upload',
      timestamp: Date.now(),
      ...extracted,
      // Generate a simple style vector for similarity matching
      styleVector: generateStyleVector(extracted)
    };

    return dna;
  });
};

/**
 * Generates a numerical style vector for similarity matching
 */
const generateStyleVector = (dna: any): number[] => {
  // Simple encoding based on compatibility profile and confidence values
  const vector: number[] = [];
  
  // Compatibility scores
  if (dna.compatibilityProfile) {
    vector.push(dna.compatibilityProfile.formal || 0);
    vector.push(dna.compatibilityProfile.casual || 0);
    vector.push(dna.compatibilityProfile.avant_garde || 0);
    vector.push(dna.compatibilityProfile.minimalist || 0);
    vector.push(dna.compatibilityProfile.maximalist || 0);
  }
  
  // Gene confidence values
  vector.push(dna.silhouette?.confidence || 0);
  vector.push(dna.colorway?.confidence || 0);
  vector.push(dna.texture?.confidence || 0);
  vector.push(dna.construction?.confidence || 0);
  vector.push(dna.aesthetic?.confidence || 0);
  
  return vector;
};

/**
 * Calculates cosine similarity between two style vectors
 */
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// ============================================
// DNA SPLICING (BREEDING)
// ============================================

/**
 * Splices two Design DNAs to create a new hybrid design
 */
export const spliceDesignDNA = async (config: SpliceConfig): Promise<SpliceResult> => {
  return safeCall(async () => {
    const ai = getAiClient();
    
    // Step 1: Generate the spliced DNA description
    const splicePrompt = buildSplicePrompt(config);
    
    // Step 2: Generate the concept image
    const imageResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: `Create a professional fashion design concept based on this genetic specification:

${splicePrompt}

Style: Photorealistic, high-fashion studio photography.
Lighting: Soft, neutral studio lighting.
Background: Clean, neutral grey or white background.
Quality: High fidelity on fabric textures and construction details.

This is a hybrid design that should visibly incorporate elements from both parent designs while feeling cohesive and wearable.` }
        ]
      },
      config: {
        imageConfig: {
          imageSize: "1K",
          aspectRatio: "3:4"
        }
      }
    });

    const conceptImage = extractImage(imageResponse);
    if (!conceptImage) throw new Error("Failed to generate spliced design image");

    // Step 3: Extract DNA from the generated image to get the child's actual DNA
    const childDNA = await extractDesignDNA(conceptImage, 'splice-result');
    
    // Step 4: Generate inheritance report
    const inheritanceReport = generateInheritanceReport(config, childDNA);

    return {
      childDNA,
      conceptImage,
      inheritanceReport,
      generationPrompt: splicePrompt
    };
  });
};

/**
 * Builds the generation prompt from splice configuration
 */
const buildSplicePrompt = (config: SpliceConfig): string => {
  const { parentA, parentB, geneSelection, mutationStrength, creativityBias, targetAesthetic, avoidElements } = config;
  
  let prompt = `DESIGN GENOME SPLICE SPECIFICATION:\n\n`;
  
  // Silhouette
  prompt += `SILHOUETTE: `;
  if (geneSelection.silhouette === 'A') {
    prompt += `${parentA.silhouette.value} (${parentA.silhouette.visualDescriptor})`;
  } else if (geneSelection.silhouette === 'B') {
    prompt += `${parentB.silhouette.value} (${parentB.silhouette.visualDescriptor})`;
  } else {
    prompt += `Blend of "${parentA.silhouette.name}" and "${parentB.silhouette.name}" - ${parentA.silhouette.visualDescriptor} merged with ${parentB.silhouette.visualDescriptor}`;
  }
  prompt += '\n';
  
  // Colorway
  prompt += `COLORWAY: `;
  if (geneSelection.colorway === 'A') {
    prompt += `${parentA.colorway.value} (${parentA.colorway.visualDescriptor})`;
  } else if (geneSelection.colorway === 'B') {
    prompt += `${parentB.colorway.value} (${parentB.colorway.visualDescriptor})`;
  } else {
    prompt += `Harmonized palette combining "${parentA.colorway.name}" with "${parentB.colorway.name}"`;
  }
  prompt += '\n';
  
  // Texture
  prompt += `TEXTURE: `;
  if (geneSelection.texture === 'A') {
    prompt += `${parentA.texture.value} (${parentA.texture.visualDescriptor})`;
  } else if (geneSelection.texture === 'B') {
    prompt += `${parentB.texture.value} (${parentB.texture.visualDescriptor})`;
  } else {
    prompt += `Material fusion: ${parentA.texture.name} meets ${parentB.texture.name}`;
  }
  prompt += '\n';
  
  // Construction
  prompt += `CONSTRUCTION: `;
  if (geneSelection.construction === 'A') {
    prompt += `${parentA.construction.value}`;
  } else if (geneSelection.construction === 'B') {
    prompt += `${parentB.construction.value}`;
  } else {
    prompt += `Hybrid construction combining ${parentA.construction.name} technique with ${parentB.construction.name}`;
  }
  prompt += '\n';
  
  // Aesthetic
  prompt += `AESTHETIC: `;
  if (geneSelection.aesthetic === 'A') {
    prompt += `${parentA.aesthetic.value}`;
  } else if (geneSelection.aesthetic === 'B') {
    prompt += `${parentB.aesthetic.value}`;
  } else {
    prompt += `Aesthetic crossover: ${parentA.aesthetic.name} x ${parentB.aesthetic.name}`;
  }
  prompt += '\n';
  
  // Mutation
  if (mutationStrength > 0.3) {
    prompt += `\nMUTATION FACTOR: ${Math.round(mutationStrength * 100)}% creative deviation allowed. `;
    if (creativityBias > 0.5) {
      prompt += `Push toward experimental and avant-garde interpretations.`;
    } else {
      prompt += `Keep mutations subtle and wearable.`;
    }
    prompt += '\n';
  }
  
  // Target aesthetic override
  if (targetAesthetic) {
    prompt += `\nTARGET DIRECTION: Lean the final design toward ${targetAesthetic} aesthetic.\n`;
  }
  
  // Elements to avoid
  if (avoidElements && avoidElements.length > 0) {
    prompt += `\nAVOID: ${avoidElements.join(', ')}\n`;
  }
  
  // Parent contexts
  prompt += `\nPARENT A CONTEXT: ${parentA.overallStyle} design from ${parentA.era}, ${parentA.mood} mood`;
  prompt += `\nPARENT B CONTEXT: ${parentB.overallStyle} design from ${parentB.era}, ${parentB.mood} mood`;
  
  return prompt;
};

/**
 * Generates a report of what was inherited from each parent
 */
const generateInheritanceReport = (config: SpliceConfig, childDNA: DesignDNA): SpliceResult['inheritanceReport'] => {
  const fromParentA: string[] = [];
  const fromParentB: string[] = [];
  const mutations: string[] = [];
  
  const { geneSelection, parentA, parentB } = config;
  
  // Track inheritance
  if (geneSelection.silhouette === 'A') {
    fromParentA.push(`Silhouette: ${parentA.silhouette.name}`);
  } else if (geneSelection.silhouette === 'B') {
    fromParentB.push(`Silhouette: ${parentB.silhouette.name}`);
  } else {
    mutations.push(`Silhouette: Blended from both parents`);
  }
  
  if (geneSelection.colorway === 'A') {
    fromParentA.push(`Colorway: ${parentA.colorway.name}`);
  } else if (geneSelection.colorway === 'B') {
    fromParentB.push(`Colorway: ${parentB.colorway.name}`);
  } else {
    mutations.push(`Colorway: Harmonized palette`);
  }
  
  if (geneSelection.texture === 'A') {
    fromParentA.push(`Texture: ${parentA.texture.name}`);
  } else if (geneSelection.texture === 'B') {
    fromParentB.push(`Texture: ${parentB.texture.name}`);
  } else {
    mutations.push(`Texture: Material fusion`);
  }
  
  if (geneSelection.construction === 'A') {
    fromParentA.push(`Construction: ${parentA.construction.name}`);
  } else if (geneSelection.construction === 'B') {
    fromParentB.push(`Construction: ${parentB.construction.name}`);
  } else {
    mutations.push(`Construction: Hybrid technique`);
  }
  
  if (geneSelection.aesthetic === 'A') {
    fromParentA.push(`Aesthetic: ${parentA.aesthetic.name}`);
  } else if (geneSelection.aesthetic === 'B') {
    fromParentB.push(`Aesthetic: ${parentB.aesthetic.name}`);
  } else {
    mutations.push(`Aesthetic: Crossover style`);
  }
  
  // Check for emergent mutations (child traits that differ significantly from both parents)
  if (childDNA.overallStyle !== parentA.overallStyle && childDNA.overallStyle !== parentB.overallStyle) {
    mutations.push(`Emergent Style: ${childDNA.overallStyle}`);
  }
  
  return { fromParentA, fromParentB, mutations };
};

// ============================================
// DNA VISUALIZATION HELPERS
// ============================================

/**
 * Generates a visual DNA strand representation
 */
export const generateDNAVisualization = async (dna: DesignDNA): Promise<string> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: `Create an abstract data visualization representing this fashion "Style DNA":

Silhouette: ${dna.silhouette.name} (${dna.silhouette.visualDescriptor})
Colorway: ${dna.colorway.name}
Texture: ${dna.texture.name}
Aesthetic: ${dna.aesthetic.name}
Era: ${dna.era}
Mood: ${dna.mood}

Style: Abstract, minimalist infographic design.
Format: A vertical "DNA strand" or "genome sequence" visualization.
Colors: Use colors that reflect the design's actual colorway.
Elements: Incorporate abstract shapes that suggest the silhouette and texture.
Background: Dark, sophisticated, tech-inspired.
No text labels, pure visual abstraction.` }
        ]
      },
      config: {
        imageConfig: {
          imageSize: "1K",
          aspectRatio: "1:1"
        }
      }
    });

    const base64 = extractImage(response);
    if (!base64) throw new Error("Failed to generate DNA visualization");
    return base64;
  });
};

/**
 * Quick DNA analysis for UI display
 */
export const getQuickDNASummary = (dna: DesignDNA): { 
  dominantTraits: string[], 
  styleScore: { formal: number, experimental: number, wearability: number }
} => {
  const dominantTraits: string[] = [];
  
  // Find highest confidence genes
  const genes = [
    { ...dna.silhouette, type: 'Silhouette' },
    { ...dna.colorway, type: 'Colorway' },
    { ...dna.texture, type: 'Texture' },
    { ...dna.construction, type: 'Construction' },
    { ...dna.aesthetic, type: 'Aesthetic' }
  ];
  
  genes
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)
    .forEach(g => {
      dominantTraits.push(`${g.type}: ${g.name}`);
    });
  
  // Calculate style scores
  const profile = dna.compatibilityProfile;
  const formal = profile.formal || 0;
  const experimental = (profile.avant_garde || 0) * 0.5 + (profile.maximalist || 0) * 0.5;
  const wearability = (profile.casual || 0) * 0.5 + (profile.minimalist || 0) * 0.3 + (1 - experimental) * 0.2;
  
  return {
    dominantTraits,
    styleScore: {
      formal: Math.round(formal * 100),
      experimental: Math.round(experimental * 100),
      wearability: Math.round(wearability * 100)
    }
  };
};
