
import { GoogleGenAI, Type } from "@google/genai";
import { getGeminiApiKey } from "./apiKey";
import { 
  generateConcept, 
  generateEngineeringPack, 
  estimateProductionCosts,
  findMaterialSources,
  analyzeManufacturingFeasibility,
  generateSizingChart
} from "./geminiService";
import { 
  FashionGPTInput, 
  FashionGPTStage, 
  DesignBrief, 
  SupplierRecommendation, 
  ProductionReadyPack,
  ManufacturingAnalysis
} from "../types";

export interface FashionGPTResult {
  id: string;
  input: FashionGPTInput;
  stages: FashionGPTStage[];
  output: ProductionReadyPack | null;
  totalDuration: number;
  completedAt?: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: getGeminiApiKey() });
};

// ============================================
// STAGE 1: DESIGN BRIEF GENERATION
// ============================================

export const generateDesignBrief = async (input: FashionGPTInput): Promise<DesignBrief> => {
  const ai = getAiClient();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are a Senior Fashion Designer and Creative Director. Based on this brief, create a comprehensive design specification.

User Input: "${input.prompt}"
Target Audience: ${input.targetAudience || 'General'}
Budget Tier: ${input.budgetTier || 'mid-range'}
Sustainability Priority: ${input.sustainabilityPriority || 'medium'}
Production Scale: ${input.productionScale || 'small-batch'}

Create a detailed design brief with market positioning and technical guidance.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          garmentType: { type: Type.STRING, description: "Type of garment (e.g., 'Oversized Bomber Jacket')" },
          style: { type: Type.STRING, description: "Style category (e.g., 'Streetwear', 'Minimalist', 'Avant-Garde')" },
          targetDemographic: { type: Type.STRING, description: "Target customer profile" },
          keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 key design features" },
          colorPalette: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Primary colors with hex codes or descriptions" },
          fabricSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Recommended fabrics with weights/compositions" },
          constructionNotes: { type: Type.STRING, description: "Key construction considerations" },
          marketPositioning: { type: Type.STRING, description: "Where this fits in the market" },
          estimatedRetailPrice: { type: Type.STRING, description: "Suggested retail price range" },
          sustainabilityConsiderations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Eco-friendly options" }
        },
        required: ["garmentType", "style", "targetDemographic", "keyFeatures", "colorPalette", "fabricSuggestions", "constructionNotes", "marketPositioning", "estimatedRetailPrice", "sustainabilityConsiderations"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as DesignBrief;
};

// ============================================
// STAGE 2: ENHANCED PROMPT GENERATION
// ============================================

export const generateEnhancedPrompt = async (brief: DesignBrief): Promise<string> => {
  const ai = getAiClient();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Convert this design brief into a detailed image generation prompt for Gemini Image.

Design Brief:
- Garment: ${brief.garmentType}
- Style: ${brief.style}
- Key Features: ${brief.keyFeatures.join(', ')}
- Colors: ${brief.colorPalette.join(', ')}
- Fabrics: ${brief.fabricSuggestions.join(', ')}
- Construction: ${brief.constructionNotes}

Create a single, detailed prompt (max 200 words) optimized for AI image generation.
Focus on: silhouette, fabric texture, color accuracy, construction details.
Include: "professional fashion photography, studio lighting, ghost mannequin presentation, high detail"

Return ONLY the prompt text, no explanations.`
  });

  return response.text || `${brief.garmentType} in ${brief.style} style, ${brief.colorPalette[0]}, professional fashion photography`;
};

// ============================================
// STAGE 5: SUPPLIER SOURCING
// ============================================

export const findSupplierRecommendations = async (materials: string[]): Promise<SupplierRecommendation[]> => {
  const recommendations: SupplierRecommendation[] = [];
  
  // Process top 3 materials to avoid rate limits
  for (const material of materials.slice(0, 3)) {
    try {
      const { text, links } = await findMaterialSources(material);
      
      // Parse the response into structured format
      const ai = getAiClient();
      const parseResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Parse this supplier information into structured data:
        
Material: ${material}
Raw Data: ${text}
Links: ${JSON.stringify(links)}

Return JSON with suppliers array.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suppliers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    location: { type: Type.STRING },
                    sustainability: { type: Type.STRING },
                    priceRange: { type: Type.STRING },
                    minimumOrder: { type: Type.STRING }
                  },
                  required: ["name", "location"]
                }
              }
            },
            required: ["suppliers"]
          }
        }
      });
      
      const parsed = JSON.parse(parseResponse.text || '{"suppliers":[]}');
      
      recommendations.push({
        material,
        suppliers: parsed.suppliers.map((s: any, idx: number) => ({
          ...s,
          url: links[idx]?.uri
        }))
      });
    } catch (e) {
      console.error(`Failed to find suppliers for ${material}`, e);
      recommendations.push({
        material,
        suppliers: []
      });
    }
  }
  
  return recommendations;
};

// ============================================
// STAGE 6: PRODUCTION TIMELINE ESTIMATION
// ============================================

export const estimateProductionTimeline = async (
  bomMarkdown: string, 
  productionScale: string
): Promise<{ sampling: string; production: string; shipping: string; totalLeadTime: string }> => {
  const ai = getAiClient();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Estimate production timeline for this garment.

BOM Summary: ${bomMarkdown.substring(0, 500)}
Production Scale: ${productionScale}

Consider: sampling, material sourcing, production, quality control, shipping.

Return JSON with realistic timeframes.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sampling: { type: Type.STRING, description: "Time for sampling (e.g., '2-3 weeks')" },
          production: { type: Type.STRING, description: "Production time" },
          shipping: { type: Type.STRING, description: "Shipping time" },
          totalLeadTime: { type: Type.STRING, description: "Total lead time" }
        },
        required: ["sampling", "production", "shipping", "totalLeadTime"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

// ============================================
// MAIN PIPELINE ORCHESTRATOR
// ============================================

export type PipelineProgressCallback = (stage: FashionGPTStage) => void;

export const runFashionGPTPipeline = async (
  input: FashionGPTInput,
  onProgress: PipelineProgressCallback
): Promise<FashionGPTResult> => {
  const resultId = `fgpt-${Date.now()}`;
  const startTime = Date.now();
  
  const stages: FashionGPTStage[] = [
    { id: 'brief', name: 'Design Brief', status: 'pending', progress: 0 },
    { id: 'prompt', name: 'AI Prompt', status: 'pending', progress: 0 },
    { id: 'concept', name: 'Concept Image', status: 'pending', progress: 0 },
    { id: 'engineering', name: 'Tech Pack', status: 'pending', progress: 0 },
    { id: 'sizing', name: 'Size Grading', status: 'pending', progress: 0 },
    { id: 'costing', name: 'Cost Analysis', status: 'pending', progress: 0 },
    { id: 'manufacturing', name: 'Feasibility', status: 'pending', progress: 0 },
    { id: 'sourcing', name: 'Suppliers', status: 'pending', progress: 0 },
    { id: 'timeline', name: 'Timeline', status: 'pending', progress: 0 }
  ];

  const updateStage = (id: string, updates: Partial<FashionGPTStage>) => {
    const idx = stages.findIndex(s => s.id === id);
    if (idx !== -1) {
      stages[idx] = { ...stages[idx], ...updates };
      onProgress(stages[idx]);
    }
  };

  let output: ProductionReadyPack | null = null;

  try {
    // STAGE 1: Design Brief
    updateStage('brief', { status: 'in-progress', progress: 10, startTime: Date.now() });
    const designBrief = await generateDesignBrief(input);
    updateStage('brief', { status: 'completed', progress: 100, result: designBrief, endTime: Date.now() });

    // STAGE 2: Enhanced Prompt
    updateStage('prompt', { status: 'in-progress', progress: 10, startTime: Date.now() });
    const enhancedPrompt = await generateEnhancedPrompt(designBrief);
    updateStage('prompt', { status: 'completed', progress: 100, result: enhancedPrompt, endTime: Date.now() });

    // STAGE 3: Concept Image
    updateStage('concept', { status: 'in-progress', progress: 10, startTime: Date.now() });
    const conceptImage = await generateConcept(enhancedPrompt);
    updateStage('concept', { status: 'completed', progress: 100, result: '(image generated)', endTime: Date.now() });

    // STAGE 4: Engineering Pack (CAD + BOM)
    updateStage('engineering', { status: 'in-progress', progress: 10, startTime: Date.now() });
    const { cadImage, materials: structuredBOM } = await generateEngineeringPack(conceptImage, true);
    
    // Convert StructuredBOM to Markdown string for downstream usage
    let bomMarkdown = `## Bill of Materials\n\n`;
    if (structuredBOM && typeof structuredBOM === 'object' && 'items' in structuredBOM) {
        structuredBOM.items.forEach((item: any) => {
            bomMarkdown += `- **${item.category}**: ${item.name} (${item.composition}) - ${item.placement}\n`;
        });
        if (structuredBOM.productionNotes && structuredBOM.productionNotes.length > 0) {
            bomMarkdown += `\n### Production Notes\n`;
            structuredBOM.productionNotes.forEach((note: string) => {
                bomMarkdown += `- ${note}\n`;
            });
        }
    } else {
        // Safe fallback if it's a string or null
        bomMarkdown = typeof structuredBOM === 'string' ? structuredBOM : "No BOM data available.";
    }

    updateStage('engineering', { status: 'completed', progress: 100, result: '(tech pack generated)', endTime: Date.now() });

    // STAGE 5: Sizing Chart
    updateStage('sizing', { status: 'in-progress', progress: 10, startTime: Date.now() });
    const sizingChart = await generateSizingChart(designBrief.garmentType + ' ' + designBrief.constructionNotes);
    updateStage('sizing', { status: 'completed', progress: 100, result: sizingChart, endTime: Date.now() });

    // STAGE 6: Cost Analysis
    updateStage('costing', { status: 'in-progress', progress: 10, startTime: Date.now() });
    const costData = await estimateProductionCosts(bomMarkdown);
    const suggestedRetailPrice = Math.ceil(costData.total * 4); // ~4x markup
    const wholesalePrice = Math.ceil(costData.total * 2.2); // ~2.2x markup
    const profitMargin =
      suggestedRetailPrice > 0
        ? ((suggestedRetailPrice - costData.total) / suggestedRetailPrice) * 100
        : 0;
    const costBreakdown = {
      ...costData,
      margin: {
        suggestedRetailPrice,
        wholesalePrice,
        profitMargin,
      },
    };
    updateStage('costing', { status: 'completed', progress: 100, result: costBreakdown, endTime: Date.now() });

    // STAGE 7: Manufacturing Feasibility
    updateStage('manufacturing', { status: 'in-progress', progress: 10, startTime: Date.now() });
    let manufacturingAnalysis: ManufacturingAnalysis = { feasibilityScore: 75, costRating: 'Medium', productionRisks: [], manufacturingSuggestions: [] };
    if (cadImage) {
      manufacturingAnalysis = await analyzeManufacturingFeasibility(cadImage, bomMarkdown);
    }
    updateStage('manufacturing', { status: 'completed', progress: 100, result: manufacturingAnalysis, endTime: Date.now() });

    // STAGE 8: Supplier Sourcing
    updateStage('sourcing', { status: 'in-progress', progress: 10, startTime: Date.now() });
    const supplierRecommendations = await findSupplierRecommendations(designBrief.fabricSuggestions);
    updateStage('sourcing', { status: 'completed', progress: 100, result: supplierRecommendations, endTime: Date.now() });

    // STAGE 9: Production Timeline
    updateStage('timeline', { status: 'in-progress', progress: 10, startTime: Date.now() });
    const productionTimeline = await estimateProductionTimeline(bomMarkdown, input.productionScale || 'small-batch');
    updateStage('timeline', { status: 'completed', progress: 100, result: productionTimeline, endTime: Date.now() });

    // Assemble final output
    output = {
      designBrief,
      conceptImage,
      cadImage,
      bomMarkdown,
      sizingChart,
      costBreakdown,
      manufacturingAnalysis,
      supplierRecommendations,
      productionTimeline
    };

  } catch (error: any) {
    // Mark current in-progress stage as error
    const inProgressStage = stages.find(s => s.status === 'in-progress');
    if (inProgressStage) {
      updateStage(inProgressStage.id, { 
        status: 'error', 
        error: error.message || 'Unknown error',
        endTime: Date.now()
      });
    }
  }

  return {
    id: resultId,
    input,
    stages,
    output,
    totalDuration: Date.now() - startTime,
    completedAt: output ? Date.now() : undefined
  };
};

// ============================================
// UTILITY: EXPORT TO PDF DATA
// ============================================

export const generateTechPackData = (result: FashionGPTResult): string => {
  if (!result.output) return '';
  
  const { output } = result;
  
  return `
# TECH PACK - ${output.designBrief.garmentType.toUpperCase()}
Generated by FashionGPT | ${new Date().toLocaleDateString()}

## DESIGN BRIEF
- **Style:** ${output.designBrief.style}
- **Target:** ${output.designBrief.targetDemographic}
- **Market Position:** ${output.designBrief.marketPositioning}

## KEY FEATURES
${output.designBrief.keyFeatures.map(f => `- ${f}`).join('\n')}

## COLOR PALETTE
${output.designBrief.colorPalette.map(c => `- ${c}`).join('\n')}

## BILL OF MATERIALS
${output.bomMarkdown}

## SIZE CHART
${output.sizingChart}

## COST BREAKDOWN
| Component | Cost (USD) |
|-----------|-----------|
| Fabric | $${output.costBreakdown.materials.fabric.toFixed(2)} |
| Trims + Hardware | $${(output.costBreakdown.materials.trims + output.costBreakdown.materials.hardware).toFixed(2)} |
| Packaging | $${output.costBreakdown.materials.packaging.toFixed(2)} |
| Labor (Total) | $${(output.costBreakdown.labor.cutting + output.costBreakdown.labor.sewing + output.costBreakdown.labor.finishing + output.costBreakdown.labor.qc).toFixed(2)} |
| Overhead (Total) | $${(output.costBreakdown.overhead.sampling + output.costBreakdown.overhead.shipping + output.costBreakdown.overhead.duties + output.costBreakdown.overhead.miscellaneous).toFixed(2)} |
| **COGS** | **$${output.costBreakdown.total.toFixed(2)}** |
| Suggested Wholesale | $${output.costBreakdown.margin.wholesalePrice.toFixed(2)} |
| Suggested Retail | $${output.costBreakdown.margin.suggestedRetailPrice.toFixed(2)} |

## MANUFACTURING FEASIBILITY
- **Score:** ${output.manufacturingAnalysis.feasibilityScore}/100
- **Cost Rating:** ${output.manufacturingAnalysis.costRating}
- **Risks:** ${output.manufacturingAnalysis.productionRisks.join('; ')}

## PRODUCTION TIMELINE
- Sampling: ${output.productionTimeline.sampling}
- Production: ${output.productionTimeline.production}
- Shipping: ${output.productionTimeline.shipping}
- **Total Lead Time:** ${output.productionTimeline.totalLeadTime}
`;
};
