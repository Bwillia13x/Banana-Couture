
// ... existing imports ...
import { GoogleGenAI, Type } from "@google/genai";
import { 
  CapsuleCollectionResult, 
  DesignCritique, 
  BomValidationResult, 
  CadReadabilityReview, 
  ManufacturingAnalysis,
  StructuredBOM,
  ColorSwatch,
  FabricPhysics,
  Product,
  LookbookContent,
  BrandIdentity,
  CapsuleGarment,
  CostBreakdown // Ensure this type is imported
} from "../types";
import { getGeminiApiKey, MISSING_API_KEY_MESSAGE, promptForApiKeySelection } from "./apiKey";

// ... existing helper functions (getAiClient, ensurePaidApiKey, extractImage, etc.) ...
// Helper to get fresh client with latest API key (critical for Veo billing flow)
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: getGeminiApiKey() });
};

// Helper to ensure user has selected a Paid API key (Required for Veo)
export const ensurePaidApiKey = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    const aistudio = (window as any).aistudio;
    try {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await aistudio.openSelectKey();
        return true; 
      }
      return true;
    } catch (e) {
      console.warn("AI Studio plugin interaction failed", e);
      return false;
    }
  }
  return true; 
};

export const openApiKeySelection = async () => {
    promptForApiKeySelection();
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

// Helper to extract text from response
const extractText = (response: any): string => {
  if (!response.candidates?.[0]?.content?.parts) return '';
  return response.candidates[0].content.parts
    .filter((p: any) => p.text)
    .map((p: any) => p.text)
    .join('');
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
    return "Design blocked by safety filters. Please modify your prompt.";
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
        openApiKeySelection().catch(console.error);
    }
    throw new Error(msg);
  }
};

// ... existing exports ...
export const getFashionTrends = async (topic: string): Promise<{ text: string, sources: { title: string, uri: string }[] }> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Act as a professional fashion trend forecaster.
      
      User Query: "${topic}"

      Task:
      1. Use Google Search to find the latest, real-world fashion trends, emerging aesthetics, and material innovations related to the query.
      2. Provide a concise, high-impact summary of the key visual elements, color palettes, and fabrics.
      3. Focus on actionable design details that can be used in a generative AI prompt.
      
      Output:
      - A short, dense paragraph summarizing the trend.`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "No trend data found.";
    
    const sources: { title: string, uri: string }[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    return { text, sources };
  });
};

export const generateConcept = async (prompt: string): Promise<string> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: `Create a professional fashion design concept for: "${prompt}".
                   Style: Photorealistic, high-fashion studio photography.
                   Lighting: Soft, neutral studio lighting.
                   Background: Clean, neutral grey or white background to focus on the garment.
                   Details: Ensure high fidelity on fabric textures (denim, silk, wool, etc.) and construction details.` }
        ]
      },
      config: {
        imageConfig: {
          imageSize: "1K",
          aspectRatio: "3:4"
        }
      }
    });

    const base64 = extractImage(response);
    if (!base64) throw new Error("No image generated.");
    return base64;
  });
};

export const editConceptWithMask = async (imageBase64: string, maskBase64: string, instruction: string): Promise<string> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: imageBase64
            }
          },
          {
            inlineData: {
              mimeType: 'image/png',
              data: maskBase64
            }
          },
          { text: `Task: Edit the first image based on the instruction, applying changes primarily to the white area shown in the second image (mask).
                   
                   Instruction: "${instruction}"
                   
                   Role: Expert Fashion Retoucher.
                   Constraints:
                   - The second image provided is a MASK. White pixels = area to edit. Black pixels = keep unchanged.
                   - Blend the edits seamlessly into the original garment structure.
                   - Maintain lighting and fabric realism.` }
        ]
      },
      config: {
        imageConfig: {
          imageSize: "1K",
          aspectRatio: "3:4" // Maintain aspect
        }
      }
    });

    const base64 = extractImage(response);
    if (!base64) throw new Error("No edited image generated.");
    return base64;
  });
};

export const generateEngineeringPack = async (imageBase64: string, simplify: boolean = false): Promise<{ cadImage: string | null, materials: StructuredBOM }> => {
  return safeCall(async () => {
    const ai = getAiClient();
    
    // 1. Generate CAD
    const styleInstruction = simplify 
      ? "Simplify layout for clarity. Use clean leaders." 
      : "Include specific details on seam allowances (e.g. 1cm), stitching types (ISO standards preferred), and material transitions.";

    const imageResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: imageBase64 } },
          { text: `Generate a professional technical flat sketch (CAD) for fashion production.
                   Style: High-contrast black and white vector-style line drawing.
                   Requirements: 
                   1. Explicitly render seam lines and construction details.
                   2. ${styleInstruction}
                   3. Ensure lines are clean and continuous against a pure white background.` }
        ]
      },
      config: {
        imageConfig: {
          imageSize: "1K",
          aspectRatio: "3:4"
        }
      }
    });
    const cadImage = extractImage(imageResponse);

    // 2. Generate Structured BOM
    const bomResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: imageBase64 } },
          { text: "Analyze garment. Create comprehensive Bill of Materials. Return JSON." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, enum: ["Main Fabric", "Lining", "Hardware", "Trim", "Thread"] },
                  name: { type: Type.STRING },
                  composition: { type: Type.STRING },
                  placement: { type: Type.STRING },
                  estimatedQty: { type: Type.STRING }
                },
                required: ["category", "name", "composition", "placement", "estimatedQty"]
              }
            },
            productionNotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["items", "productionNotes"]
        }
      }
    });

    const materials = JSON.parse(bomResponse.text || '{"items":[], "productionNotes":[]}');
    return { cadImage, materials };
  });
};

export const generateSizingChart = async (description: string): Promise<string> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a Technical Fashion Pattern Maker.
      Based on this garment description: "${description}"
      
      Task: Create a standard sizing chart with estimated measurements (S, M, L, XL) in cm.
      Identify key measurement points relevant to this specific garment type (e.g., Chest, Waist, Hips, Inseam, Sleeve Length, High Point Shoulder).
      
      Output: A clean Markdown Table ONLY. No intro/outro text.
      Example:
      | Point of Measure | S | M | L | XL |
      |---|---|---|---|---|
      | Chest | 92 | 96 | 100 | 104 |
      ...`
    });

    return response.text || "| Point of Measure | S | M | L | XL |\n|---|---|---|---|---|\n| Chest | - | - | - | - |";
  });
};

export const generateFabricTexture = async (materialName: string): Promise<string> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: `Generate a high-resolution, photorealistic close-up macro shot of this fabric texture: "${materialName}".
                   Lighting: Neutral, showing weave details and surface texture.
                   View: Top-down flat lay.
                   No text, no labels, just the pattern/texture.` }
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
    if (!base64) throw new Error("No texture generated.");
    return base64;
  });
};

export const generateRunwayVideo = async (prompt: string, imageBase64: string): Promise<string> => {
  // Ensure we have a Paid API Key (Veo requirement)
  await ensurePaidApiKey();
  
  // Re-initialize client to ensure we pick up the latest key context
  const ai = getAiClient();
  
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic fashion runway shot of a model wearing: ${prompt}. Professional lighting, 4k, slow motion movement, high fashion walk, highly detailed fabric physics.`,
      image: {
        imageBytes: imageBase64,
        mimeType: 'image/png',
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    // Poll for completion with simple backoff
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5s poll
      operation = await ai.operations.getVideosOperation({ operation: operation });
      if (operation.error) {
          throw new Error((operation.error as any).message || "Video generation failed.");
      }
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No video URI returned.");

    // Fetch MP4 bytes with key
    const response = await fetch(`${downloadLink}&key=${getGeminiApiKey()}`);
    if (!response.ok) throw new Error("Failed to download video content");
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    throw new Error(normalizeGeminiError(error));
  }
};

export const validateAndRepairBom = async (bomMarkdown: string): Promise<BomValidationResult> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a Senior Technical Designer. Review the following Bill of Materials (BOM) Markdown for completeness.
      
      BOM:
      ${bomMarkdown}
      
      Requirements:
      1. Must list at least one Main Fabric.
      2. Must list basic Hardware (if applicable).
      3. Must have production notes.
      
      If incomplete or sparse, generate a "repaired" version that infers plausible details.
      
      Return JSON: { isComplete: boolean, issues: string[], repairedMarkdown: string }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isComplete: { type: Type.BOOLEAN },
            issues: { type: Type.ARRAY, items: { type: Type.STRING } },
            repairedMarkdown: { type: Type.STRING }
          },
          required: ["isComplete", "issues", "repairedMarkdown"]
        }
      }
    });

    return JSON.parse(response.text || "{}") as BomValidationResult;
  });
};

export const reviewEngineeringImage = async (cadImageBase64: string): Promise<CadReadabilityReview> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cadImageBase64 } },
          { text: `Analyze this technical fashion drawing (CAD).
           Check for:
           1. Visual Clutter (Are annotations overlapping?)
           2. Line Clarity (Is it a clean vector style?)
           
           Return JSON: { isReadable: boolean, issues: string[], recommendation: string }` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isReadable: { type: Type.BOOLEAN },
            issues: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING }
          },
          required: ["isReadable", "issues"]
        }
      }
    });

    return JSON.parse(response.text || "{}") as CadReadabilityReview;
  });
};

export const analyzeManufacturingFeasibility = async (cadImageBase64: string, bomMarkdown: string): Promise<ManufacturingAnalysis> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cadImageBase64 } },
          { text: `Analyze this technical fashion drawing (CAD) and Bill of Materials (BOM) for manufacturing feasibility.
          
          BOM:
          ${bomMarkdown}

          Task:
          1. Estimate production feasibility score (0-100), where 100 is standard mass-market ready.
          2. Estimate cost rating (Low/Medium/High).
          3. Identify specific production risks (e.g., complex seams, expensive materials, difficult assembly).
          4. Suggest manufacturing improvements.

          Return JSON.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feasibilityScore: { type: Type.INTEGER },
            costRating: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            productionRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
            manufacturingSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["feasibilityScore", "costRating", "productionRisks", "manufacturingSuggestions"]
        }
      }
    });
    return JSON.parse(response.text || "{}") as ManufacturingAnalysis;
  });
};

export const critiqueDesign = async (params: {
  conceptImage?: string | null;
  cadImage?: string | null;
  bomMarkdown?: string;
}): Promise<DesignCritique> => {
  return safeCall(async () => {
    const parts: any[] = [];
    
    if (params.conceptImage) {
      parts.push({
        inlineData: { mimeType: 'image/png', data: params.conceptImage }
      });
      parts.push({ text: "Reference Image: Concept Design\n" });
    }
    
    if (params.cadImage) {
       parts.push({
        inlineData: { mimeType: 'image/png', data: params.cadImage }
      });
      parts.push({ text: "Reference Image: Technical CAD\n" });
    }

    if (params.bomMarkdown) {
      parts.push({ text: `Bill of Materials / Notes:\n${params.bomMarkdown}\n` });
    }

    parts.push({
      text: `Act as a Senior Apparel Developer. Critique the design.
      
      Provide:
      1. Executive summary.
      2. Pros.
      3. Risks.
      4. Suggestions (actionable).

      Return JSON.`
    });

    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["summary", "pros", "risks", "suggestions"]
        }
      }
    });

    return JSON.parse(response.text || "{}") as DesignCritique;
  });
};

export const generateCapsuleCollection = async (
  options: {
    brandPersona: string;
    vibe: string;
    budgetBand: string;
    sustainabilityFocus: string;
    trendQuery?: string;
    garmentCount: number;
  },
  onProgress?: (msg: string) => void
): Promise<CapsuleCollectionResult> => {
  return safeCall(async () => {
    if (onProgress) onProgress("Ideating collection strategy...");
    const ai = getAiClient();
    
    const tools = options.trendQuery ? [{ googleSearch: {} }] : [];

    const textResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a Creative Director. Create a fashion capsule collection.
      
      Inputs:
      - Brand: ${options.brandPersona}
      - Vibe: ${options.vibe}
      - Budget: ${options.budgetBand}
      - Sustainability: ${options.sustainabilityFocus}
      - Trend: ${options.trendQuery || "None"}
      
      Requirements:
      1. Create a "Theme" and "Story".
      2. Define ${options.garmentCount} distinct garments.
      3. For each, provide a "conceptPrompt" (detailed for AI generation).
      
      Return JSON.`,
      config: {
        tools,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            theme: { type: Type.STRING },
            story: { type: Type.STRING },
            garments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  conceptPrompt: { type: Type.STRING }
                },
                required: ["name", "description", "conceptPrompt"]
              }
            }
          },
          required: ["theme", "story", "garments"]
        }
      }
    });

    const plan = JSON.parse(textResponse.text || "{}");
    
    const sources: { title: string, uri: string }[] = [];
    if (textResponse.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      textResponse.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    const garmentsWithAssets: CapsuleGarment[] = [];
    for (let i = 0; i < plan.garments.length; i++) {
      const g = plan.garments[i];
      if (onProgress) onProgress(`Designing Look ${i + 1}/${plan.garments.length}: ${g.name}...`);
      
      const conceptBase64 = await generateConcept(g.conceptPrompt);
      
      if (onProgress) onProgress(`Engineering Look ${i + 1}/${plan.garments.length}: ${g.name}...`);
      const { cadImage, materials } = await generateEngineeringPack(conceptBase64);

      // Convert StructuredBOM to string for CapsuleGarment type compatibility if needed
      let bomString = '';
      if (typeof materials === 'string') bomString = materials;
      else bomString = JSON.stringify(materials);

      garmentsWithAssets.push({
        id: `capsule-${Date.now()}-${i}`,
        name: g.name,
        description: g.description,
        conceptPrompt: g.conceptPrompt,
        conceptImage: conceptBase64,
        cadImage: cadImage,
        bomMarkdown: bomString
      });
    }

    return {
      theme: plan.theme,
      story: plan.story,
      garments: garmentsWithAssets,
      sources: sources
    };
  });
};

export const findMaterialSources = async (materialLine: string): Promise<{ text: string, links: {title: string, uri: string}[] }> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Find 3 wholesale/B2B suppliers for this textile/material: "${materialLine}".
      
      Task:
      1. Use Google Search to find real suppliers. Prioritize sustainable/ethical options (GOTS, recycled, deadstock).
      2. Provide a short summary list. For each, mention Name, Location, and key sustainable feature (if any).
      
      Output:
      - Plain text summary list.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "No suppliers found.";
    const links: { title: string, uri: string }[] = [];
    
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          links.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    return { text, links };
  });
};

export const findLocalSuppliers = async (material: string, lat: number, lng: number): Promise<{ places: { name: string, address: string, url: string }[] }> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Find physical fabric stores or textile suppliers near this location (${lat}, ${lng}) that might sell: "${material}".
      
      Use Google Maps grounding to find real places.
      Return a summary.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      }
    });

    const places: { name: string, address: string, url: string }[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web.title) {
           places.push({
             name: chunk.web.title,
             address: "View on Map",
             url: chunk.web.uri
           });
        }
      });
    }
    
    return { places };
  });
};

export const estimateProductionCosts = async (bom: string): Promise<CostBreakdown> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a fashion production manager. Estimate the detailed Cost of Goods Sold (COGS) for one unit based on this BOM.
      
      BOM:
      ${bom}
      
      Assumptions:
      - Small batch production (50-100 units).
      - Mid-range labor costs.
      
      Return JSON conforming to this structure:
      {
        "materials": {
          "fabric": number,
          "trims": number,
          "hardware": number,
          "packaging": number
        },
        "labor": {
          "cutting": number,
          "sewing": number,
          "finishing": number,
          "qc": number
        },
        "overhead": {
          "sampling": number,
          "shipping": number,
          "duties": number,
          "miscellaneous": number
        },
        "total": number,
        "perUnit": number,
        "currency": "USD",
        "margin": {
          "suggestedRetailPrice": number,
          "wholesalePrice": number,
          "profitMargin": number
        }
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            materials: {
              type: Type.OBJECT,
              properties: {
                fabric: { type: Type.NUMBER },
                trims: { type: Type.NUMBER },
                hardware: { type: Type.NUMBER },
                packaging: { type: Type.NUMBER }
              },
              required: ["fabric", "trims", "hardware", "packaging"]
            },
            labor: {
              type: Type.OBJECT,
              properties: {
                cutting: { type: Type.NUMBER },
                sewing: { type: Type.NUMBER },
                finishing: { type: Type.NUMBER },
                qc: { type: Type.NUMBER }
              },
              required: ["cutting", "sewing", "finishing", "qc"]
            },
            overhead: {
              type: Type.OBJECT,
              properties: {
                sampling: { type: Type.NUMBER },
                shipping: { type: Type.NUMBER },
                duties: { type: Type.NUMBER },
                miscellaneous: { type: Type.NUMBER }
              },
              required: ["sampling", "shipping", "duties", "miscellaneous"]
            },
            total: { type: Type.NUMBER },
            perUnit: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            margin: {
              type: Type.OBJECT,
              properties: {
                suggestedRetailPrice: { type: Type.NUMBER },
                wholesalePrice: { type: Type.NUMBER },
                profitMargin: { type: Type.NUMBER }
              },
              required: ["suggestedRetailPrice", "wholesalePrice", "profitMargin"]
            }
          },
          required: ["materials", "labor", "overhead", "total", "perUnit", "currency", "margin"]
        }
      }
    });
    
    return JSON.parse(response.text || "{}") as CostBreakdown;
  });
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// ... remaining functions (analyzeMultimodalInput, generateVirtualTryOn, etc.) remain unchanged ...
export const analyzeMultimodalInput = async (
  blob: Blob, 
  type: 'video' | 'audio', 
  context: string
): Promise<string> => {
  return safeCall(async () => {
    await ensurePaidApiKey();

    const base64Data = await blobToBase64(blob);
    const mimeType = type === 'video' ? 'video/webm' : 'audio/webm';
    
    // Updated to use gemini-3-pro-preview for multimodal reasoning
    const model = 'gemini-3-pro-preview'; 

    let promptText = "";
    if (type === 'video') {
      promptText = `Analyze this video of a person's gestures and movements.
      Context provided by user: "${context}".
      
      Task: Translate the movement, flow, and energy of the video into a high-fashion garment concept.
      - If gestures are sweeping/fluid -> suggest silk, chiffon, flowing gowns.
      - If gestures are sharp/rigid -> suggest structured tailoring, leather, architectural shapes.
      - If video is fast-paced -> suggest avant-garde, dynamic streetwear.
      
      Output: A detailed, artistic prompt for a text-to-image generator. Describe the garment, fabric, and mood. Start directly with the prompt.`;
    } else {
      promptText = `Analyze this audio processing (rhythm, beat, tone).
      Context provided by user: "${context}".
      
      Task: Translate the sound methodology into a fashion aesthetic (Synesthesia).
      - Heavy bass/beat -> Bold, dark, heavy fabrics, oversized silhouettes.
      - Light humming/melody -> Ethereal, pastel, delicate fabrics, lace.
      - Fast tempo -> Chaotic patterns, vibrant colors, eclectic mix.
      
      Output: A detailed, artistic prompt for a text-to-image generator. Describe the garment, fabric, and mood. Start directly with the prompt.`;
    }

    const response = await getAiClient().models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          { text: promptText }
        ]
      }
    });

    return response.text || "A unique fashion concept derived from sensory input.";
  });
};

export const generateVirtualTryOn = async (userImageBase64: string, garmentImageBase64: string | null, prompt: string): Promise<string> => {
  return safeCall(async () => {
    const parts: any[] = [
      { inlineData: { mimeType: 'image/png', data: userImageBase64 } }
    ];

    if (garmentImageBase64) {
      parts.push({ inlineData: { mimeType: 'image/png', data: garmentImageBase64 } });
    }

    parts.push({
      text: `Act as a professional virtual stylist and photo editor.
             
             Task: Digitally dress the person in the FIRST image.
             Target Outfit: ${prompt}
             ${garmentImageBase64 ? 'Reference the garment style, texture, and color from the SECOND image provided.' : ''}
             
             Constraints:
             - **CRITICAL: Retain the person's face, pose, body shape, and skin tone EXACTLY.**
             - **CRITICAL: Retain the original background EXACTLY.**
             - Replace only the original clothing with the new design.
             - Ensure lighting, shadows, and fabric physics match the original photo for a photorealistic composite.
             `
    });

    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        imageConfig: {
          imageSize: "1K",
          aspectRatio: "3:4"
        }
      }
    });

    const base64 = extractImage(response);
    if (!base64) throw new Error("Try-On generation failed.");
    return base64;
  });
};

export const generateSeamlessPattern = async (prompt: string): Promise<string> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: `Generate a high-quality seamless textile pattern based on: "${prompt}".
                   Style: Professional surface design, tileable, high-resolution.
                   View: Top-down flat lay texture. No perspective distortion.
                   Output: Square image, edge-to-edge pattern.` }
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
    if (!base64) throw new Error("Pattern generation failed.");
    return base64;
  });
};

export const applyTextureToDesign = async (designImageBase64: string, textureImageBase64: string, instruction?: string): Promise<string> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: designImageBase64
            }
          },
          {
            inlineData: {
              mimeType: 'image/png',
              data: textureImageBase64
            }
          },
          { text: `Task: Apply the textile pattern/texture from the SECOND image onto the garment in the FIRST image.
                   
                   Instruction: ${instruction || "Apply this print to the main fabric of the outfit."}
                   
                   Role: Expert Digital Fashion Retoucher.
                   Constraints:
                   - Wrap the texture realistically around the garment's folds and form.
                   - Maintain original lighting and shading.
                   - Do NOT change the model, background, or garment silhouette. Only change the surface pattern.` }
        ]
      },
      config: {
        imageConfig: {
          imageSize: "1K",
          aspectRatio: "3:4"
        }
      }
    });

    const base64 = extractImage(response);
    if (!base64) throw new Error("Texture application failed.");
    return base64;
  });
};

export const extractColorPalette = async (image: string): Promise<ColorSwatch[]> => {
  return safeCall(async () => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/png', data: image } },
                { text: "Extract the dominant color palette from this fashion image. Return JSON." }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        hex: { type: Type.STRING },
                        usage: { type: Type.STRING }
                    },
                    required: ["name", "hex", "usage"]
                }
            }
        }
    });
    return JSON.parse(response.text || "[]");
  });
};

export const analyzeFabricPhysics = async (image: string): Promise<FabricPhysics> => {
    return safeCall(async () => {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/png', data: image } },
                    { text: "Analyze the fabric physics visible in this garment. Return JSON." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        weightGSM: { type: Type.NUMBER },
                        drape: { type: Type.STRING, enum: ['High', 'Medium', 'Low', 'Stiff'] },
                        transparency: { type: Type.NUMBER },
                        textureDescription: { type: Type.STRING }
                    },
                    required: ["weightGSM", "drape", "transparency", "textureDescription"]
                }
            }
        });
        return JSON.parse(response.text || "{}");
    });
};

export const generateLookbookContent = async (products: Product[], collectionName: string): Promise<LookbookContent> => {
  return safeCall(async () => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { text: `Create a fashion lookbook narrative for a collection named "${collectionName}".
                   Products in collection: ${products.map(p => p.name).join(', ')}.
                   
                   Return JSON matching the LookbookContent interface.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                season: { type: Type.STRING },
                narrative: { type: Type.STRING },
                themeTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                looks: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            productId: { type: Type.STRING },
                            caption: { type: Type.STRING },
                            stylingNotes: { type: Type.STRING }
                        },
                        required: ["productId", "caption", "stylingNotes"]
                    }
                }
            },
            required: ["title", "season", "narrative", "themeTags", "looks"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  });
};

export const generateCampaignImage = async (garmentImage: string, prompt: string): Promise<string> => {
    return safeCall(async () => {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/png', data: garmentImage } },
                    { text: `Generate a high fashion campaign image featuring this garment. ${prompt}` }
                ]
            },
            config: {
                imageConfig: {
                    imageSize: "2K", // Higher quality for campaign
                    aspectRatio: "3:4"
                }
            }
        });
        const img = extractImage(response);
        if (!img) throw new Error("Failed to generate campaign image");
        return img;
    });
};

export const generateBrandIdentity = async (productImages: string[]): Promise<BrandIdentity> => {
    return safeCall(async () => {
        const ai = getAiClient();
        const parts: any[] = [{ text: "Analyze these fashion designs and create a brand identity. Return JSON." }];
        
        productImages.slice(0, 3).forEach(img => {
            parts.push({ inlineData: { mimeType: 'image/png', data: img } });
        });

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        tagline: { type: Type.STRING },
                        story: { type: Type.STRING },
                        archetype: { type: Type.STRING },
                        colorPalette: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } }
                            }
                        },
                        typography: {
                            type: Type.OBJECT,
                            properties: { primary: { type: Type.STRING }, secondary: { type: Type.STRING } }
                        },
                        targetAudience: { type: Type.STRING }
                    },
                    required: ["name", "tagline", "story", "archetype", "colorPalette", "typography", "targetAudience"]
                }
            }
        });
        return JSON.parse(response.text || "{}");
    });
};

export const generateBrandLogo = async (name: string, archetype: string, story: string): Promise<string> => {
    return safeCall(async () => {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [
                    { text: `Design a professional, minimalist fashion brand logo.
                             Brand Name: ${name}
                             Archetype: ${archetype}
                             Concept: ${story}
                             Style: Vector graphic, black on white background.` }
                ]
            },
            config: {
                imageConfig: {
                    imageSize: "1K",
                    aspectRatio: "1:1"
                }
            }
        });
        const img = extractImage(response);
        if (!img) throw new Error("Failed to generate logo");
        return img;
    });
};

export const generateOutfit = async (products: Product[], prompt: string): Promise<string> => {
    return safeCall(async () => {
        const ai = getAiClient();
        const parts: any[] = [{ text: `Create a styled outfit image combining these items. Context: ${prompt}` }];
        
        products.forEach(p => {
            const img = p.imageUrl.startsWith('http') ? null : p.imageUrl;
            if (img) parts.push({ inlineData: { mimeType: 'image/png', data: img } });
        });

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts },
            config: {
                imageConfig: {
                    imageSize: "1K",
                    aspectRatio: "3:4"
                }
            }
        });
        const img = extractImage(response);
        if (!img) throw new Error("Failed to generate outfit");
        return img;
    });
};
