
import { GoogleGenAI, Type } from "@google/genai";
import { getGeminiApiKey, MISSING_API_KEY_MESSAGE, promptForApiKeySelection } from "./apiKey";
import { CostBreakdown, ProductionTimeline } from "../types";

// Helper to get fresh client
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: getGeminiApiKey() });
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
// TYPES
// ============================================

export interface ManufacturerProfile {
  id: string;
  name: string;
  location: {
    country: string;
    city: string;
    region: string;
  };
  specializations: string[];
  certifications: string[];
  minOrderQty: number;
  maxComplexity: 'basic' | 'intermediate' | 'advanced' | 'couture';
  avgLeadTimeDays: number;
  sustainabilityScore: number; // 0-100
  costTier: 'budget' | 'mid-range' | 'premium' | 'luxury';
  rating: number; // 0-5
  reviewCount: number;
  capabilities: {
    fabricTypes: string[];
    techniques: string[];
    finishes: string[];
  };
  contactInfo: {
    email: string;
    website?: string;
  };
}

export interface ProductionMatch {
  manufacturer: ManufacturerProfile;
  matchScore: number; // 0-100
  matchReasons: string[];
  estimatedCost: CostBreakdown;
  estimatedTimeline: ProductionTimeline;
  risks: string[];
  recommendations: string[];
}

export interface SupplyChainNode {
  id: string;
  type: 'raw_material' | 'processing' | 'manufacturing' | 'distribution';
  name: string;
  location: {
    country: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  sustainabilityMetrics: {
    carbonFootprint: number; // kg CO2
    waterUsage: number; // liters
    wasteScore: number; // 0-100 (higher is better)
    certifications: string[];
  };
  material?: string;
  supplier?: string;
}

export interface SupplyChainMap {
  nodes: SupplyChainNode[];
  connections: {
    from: string;
    to: string;
    transportMethod: string;
    distanceKm: number;
    carbonFootprint: number;
  }[];
  totalCarbonFootprint: number;
  sustainabilityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  suggestions: string[];
}

export interface FactoryTechPack {
  language: string;
  designTitle: string;
  styleNumber: string;
  season: string;
  
  measurements: {
    size: string;
    measurements: { point: string; value: number; tolerance: number }[];
  }[];
  
  construction: {
    step: number;
    description: string;
    stitchType: string;
    seamAllowance: string;
    notes: string;
  }[];
  
  materialSpecs: {
    component: string;
    material: string;
    color: string;
    supplier?: string;
    quantity: string;
    notes: string;
  }[];
  
  qualityStandards: {
    checkpoint: string;
    requirement: string;
    tolerance: string;
  }[];
  
  packingInstructions: string;
  labelingRequirements: string;
}

export interface RealTimeCostUpdate {
  triggeredBy: string; // What change triggered this
  previousTotal: number;
  newTotal: number;
  delta: number;
  deltaPercent: number;
  breakdown: CostBreakdown;
  warnings: string[];
}

// ============================================
// GENERATIVE MANUFACTURER MATCHING
// ============================================

export const matchManufacturers = async (
  conceptImage: string,
  cadImage: string | null,
  bomMarkdown: string,
  preferences: {
    quantity: number;
    budget: 'any' | 'budget' | 'mid-range' | 'premium' | 'luxury';
    prioritizeSustainability: boolean;
    preferredRegions?: string[];
    maxLeadDays?: number;
  }
): Promise<ProductionMatch[]> => {
  return safeCall(async () => {
    // 1. Analyze Design Complexity first
    const analysisResponse = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: conceptImage } },
          { text: `Analyze this fashion design for manufacturing.
          BOM: ${bomMarkdown}
          
          Identify:
          1. Complexity Level (basic/intermediate/advanced/couture)
          2. Specific fabrication techniques needed (e.g. bonding, hand-embroidery)
          3. Material handling requirements
          
          Return JSON.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            complexityLevel: { type: Type.STRING },
            keyTechniques: { type: Type.ARRAY, items: { type: Type.STRING } },
            materialRequirements: { type: Type.STRING }
          },
          required: ["complexityLevel", "keyTechniques", "materialRequirements"]
        }
      }
    });

    const analysis = JSON.parse(analysisResponse.text || "{}");

    // 2. Generate specialized manufacturer profiles
    const matchResponse = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Act as a Global Sourcing Expert.
      
      Design Analysis:
      - Complexity: ${analysis.complexityLevel}
      - Techniques: ${analysis.keyTechniques.join(', ')}
      - Material Req: ${analysis.materialRequirements}
      
      User Preferences:
      - Order Qty: ${preferences.quantity} units
      - Budget Tier: ${preferences.budget}
      - Sustainability Priority: ${preferences.prioritizeSustainability ? 'High' : 'Standard'}
      ${preferences.preferredRegions?.length ? `- Preferred Regions: ${preferences.preferredRegions.join(', ')}` : ''}
      
      Task:
      Generate 3 highly realistic, specific manufacturer profiles.
      
      Return JSON data matching the ProductionMatch structure. Note: 'suggestedRetailPrice' is used instead of 'suggestedRetail'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  manufacturer: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      location: {
                        type: Type.OBJECT,
                        properties: {
                          country: { type: Type.STRING },
                          city: { type: Type.STRING },
                          region: { type: Type.STRING }
                        }
                      },
                      specializations: { type: Type.ARRAY, items: { type: Type.STRING } },
                      certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
                      minOrderQty: { type: Type.NUMBER },
                      maxComplexity: { type: Type.STRING },
                      avgLeadTimeDays: { type: Type.NUMBER },
                      sustainabilityScore: { type: Type.NUMBER },
                      costTier: { type: Type.STRING },
                      rating: { type: Type.NUMBER },
                      reviewCount: { type: Type.NUMBER },
                      capabilities: {
                        type: Type.OBJECT,
                        properties: {
                          fabricTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
                          techniques: { type: Type.ARRAY, items: { type: Type.STRING } },
                          finishes: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                      },
                      contactInfo: {
                        type: Type.OBJECT,
                        properties: {
                          email: { type: Type.STRING },
                          website: { type: Type.STRING }
                        }
                      }
                    }
                  },
                  matchScore: { type: Type.NUMBER },
                  matchReasons: { type: Type.ARRAY, items: { type: Type.STRING } },
                  estimatedCost: {
                    type: Type.OBJECT,
                    properties: {
                      materials: {
                        type: Type.OBJECT,
                        properties: {
                          fabric: { type: Type.NUMBER },
                          trims: { type: Type.NUMBER },
                          hardware: { type: Type.NUMBER },
                          packaging: { type: Type.NUMBER }
                        }
                      },
                      labor: {
                        type: Type.OBJECT,
                        properties: {
                          cutting: { type: Type.NUMBER },
                          sewing: { type: Type.NUMBER },
                          finishing: { type: Type.NUMBER },
                          qc: { type: Type.NUMBER }
                        }
                      },
                      overhead: {
                        type: Type.OBJECT,
                        properties: {
                          sampling: { type: Type.NUMBER },
                          shipping: { type: Type.NUMBER },
                          duties: { type: Type.NUMBER },
                          miscellaneous: { type: Type.NUMBER }
                        }
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
                        }
                      }
                    }
                  },
                  estimatedTimeline: {
                    type: Type.OBJECT,
                    properties: {
                      phases: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            durationDays: { type: Type.NUMBER },
                            startDay: { type: Type.NUMBER },
                            endDay: { type: Type.NUMBER },
                            dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
                            risks: { type: Type.ARRAY, items: { type: Type.STRING } }
                          }
                        }
                      },
                      totalDays: { type: Type.NUMBER },
                      criticalPath: { type: Type.ARRAY, items: { type: Type.STRING } },
                      bufferDays: { type: Type.NUMBER },
                      estimatedDeliveryDate: { type: Type.STRING }
                    }
                  },
                  risks: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(matchResponse.text || "{}");
    return result.matches || [];
  });
};

export const mapSupplyChain = async (
  bomMarkdown: string,
  manufacturerLocation: { country: string; city: string }
): Promise<SupplyChainMap> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a fashion supply chain analyst.

Given this BOM:
${bomMarkdown}

And manufacturer location: ${manufacturerLocation.city}, ${manufacturerLocation.country}

Create a realistic supply chain map. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  name: { type: Type.STRING },
                  location: {
                    type: Type.OBJECT,
                    properties: {
                      country: { type: Type.STRING },
                      city: { type: Type.STRING }
                    }
                  },
                  sustainabilityMetrics: {
                    type: Type.OBJECT,
                    properties: {
                      carbonFootprint: { type: Type.NUMBER },
                      waterUsage: { type: Type.NUMBER },
                      wasteScore: { type: Type.NUMBER },
                      certifications: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                  },
                  material: { type: Type.STRING },
                  supplier: { type: Type.STRING }
                }
              }
            },
            connections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  from: { type: Type.STRING },
                  to: { type: Type.STRING },
                  transportMethod: { type: Type.STRING },
                  distanceKm: { type: Type.NUMBER },
                  carbonFootprint: { type: Type.NUMBER }
                }
              }
            },
            totalCarbonFootprint: { type: Type.NUMBER },
            sustainabilityGrade: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}") as SupplyChainMap;
  });
};

export const generateFactoryTechPack = async (
  conceptImage: string,
  cadImage: string | null,
  bomMarkdown: string,
  targetLanguage: string,
  designName: string
): Promise<FactoryTechPack> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: conceptImage } },
          ...(cadImage ? [{ inlineData: { mimeType: 'image/png', data: cadImage } }] : []),
          { text: `Generate a factory-ready tech pack. Output MUST be in ${targetLanguage}. Return JSON.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            language: { type: Type.STRING },
            designTitle: { type: Type.STRING },
            styleNumber: { type: Type.STRING },
            season: { type: Type.STRING },
            measurements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  size: { type: Type.STRING },
                  measurements: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        point: { type: Type.STRING },
                        value: { type: Type.NUMBER },
                        tolerance: { type: Type.NUMBER }
                      }
                    }
                  }
                }
              }
            },
            construction: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.INTEGER },
                  description: { type: Type.STRING },
                  stitchType: { type: Type.STRING },
                  seamAllowance: { type: Type.STRING },
                  notes: { type: Type.STRING }
                }
              }
            },
            materialSpecs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  component: { type: Type.STRING },
                  material: { type: Type.STRING },
                  color: { type: Type.STRING },
                  supplier: { type: Type.STRING },
                  quantity: { type: Type.STRING },
                  notes: { type: Type.STRING }
                }
              }
            },
            qualityStandards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  checkpoint: { type: Type.STRING },
                  requirement: { type: Type.STRING },
                  tolerance: { type: Type.STRING }
                }
              }
            },
            packingInstructions: { type: Type.STRING },
            labelingRequirements: { type: Type.STRING }
          },
          required: ["language", "designTitle", "measurements", "construction", "materialSpecs", "qualityStandards"]
        }
      }
    });

    return JSON.parse(response.text || "{}") as FactoryTechPack;
  });
};

export const simulateCostChange = async (
  currentBom: string,
  proposedChange: string,
  currentCosts: CostBreakdown
): Promise<RealTimeCostUpdate> => {
  return safeCall(async () => {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a production cost estimator.
      
      Estimate how this change affects costs. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            triggeredBy: { type: Type.STRING },
            previousTotal: { type: Type.NUMBER },
            newTotal: { type: Type.NUMBER },
            delta: { type: Type.NUMBER },
            deltaPercent: { type: Type.NUMBER },
            breakdown: {
              type: Type.OBJECT,
              properties: {
                materials: {
                  type: Type.OBJECT,
                  properties: {
                    fabric: { type: Type.NUMBER },
                    trims: { type: Type.NUMBER },
                    hardware: { type: Type.NUMBER },
                    packaging: { type: Type.NUMBER }
                  }
                },
                labor: {
                  type: Type.OBJECT,
                  properties: {
                    cutting: { type: Type.NUMBER },
                    sewing: { type: Type.NUMBER },
                    finishing: { type: Type.NUMBER },
                    qc: { type: Type.NUMBER }
                  }
                },
                overhead: {
                  type: Type.OBJECT,
                  properties: {
                    sampling: { type: Type.NUMBER },
                    shipping: { type: Type.NUMBER },
                    duties: { type: Type.NUMBER },
                    miscellaneous: { type: Type.NUMBER }
                  }
                }
              }
            },
            warnings: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    return {
      triggeredBy: result.triggeredBy || proposedChange,
      previousTotal: currentCosts.total,
      newTotal: result.newTotal || currentCosts.total,
      delta: result.delta || 0,
      deltaPercent: result.deltaPercent || 0,
      breakdown: {
        ...currentCosts,
        ...result.breakdown,
        total: result.newTotal || currentCosts.total,
        perUnit: (result.newTotal || currentCosts.total) / 100,
        currency: 'USD',
        margin: currentCosts.margin
      },
      warnings: result.warnings || []
    };
  });
};
