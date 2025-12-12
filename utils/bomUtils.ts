
import { StructuredBOM } from '../types';

export interface ImpactEstimate {
  costBand: '$' | '$$' | '$$$';
  sustainabilityRating: 'Standard' | 'Better' | 'Eco-focused';
  ecoScore: number;
}

export const bomToString = (materials: string | string[] | StructuredBOM | undefined): string => {
  if (!materials) return '';
  if (typeof materials === 'string') return materials;
  if (Array.isArray(materials)) return materials.join('\n');
  
  if (typeof materials === 'object' && 'items' in materials) {
      let output = "## Bill of Materials\n\n";
      output += materials.items.map(i => `- **${i.category}**: ${i.name} (${i.composition}) [${i.estimatedQty}]`).join('\n');
      
      if (materials.productionNotes && materials.productionNotes.length > 0) {
          output += "\n\n### Production Notes\n";
          output += materials.productionNotes.map(n => `- ${n}`).join('\n');
      }
      return output;
  }
  
  return JSON.stringify(materials);
};

export const estimateImpact = (bomInput: string | string[] | StructuredBOM | undefined): ImpactEstimate => {
  const bomMarkdown = bomToString(bomInput);
  const lowerBom = bomMarkdown.toLowerCase();
  
  // Sustainability Scoring
  let ecoScore = 0;
  // Positives
  if (lowerBom.includes('recycled')) ecoScore += 2;
  if (lowerBom.includes('organic')) ecoScore += 2;
  if (lowerBom.includes('upcycled') || lowerBom.includes('deadstock')) ecoScore += 3;
  if (lowerBom.includes('biodegradable')) ecoScore += 2;
  if (lowerBom.includes('hemp') || lowerBom.includes('linen') || lowerBom.includes('tencel') || lowerBom.includes('lyocell')) ecoScore += 1;
  if (lowerBom.includes('vegetable tanned') || lowerBom.includes('vegan')) ecoScore += 1;
  
  // Negatives (Traditional Synthetics)
  if ((lowerBom.includes('polyester') || lowerBom.includes('nylon') || lowerBom.includes('acrylic')) && !lowerBom.includes('recycled')) {
      ecoScore -= 1;
  }
  
  let sustainabilityRating: ImpactEstimate['sustainabilityRating'] = 'Standard';
  if (ecoScore >= 3) sustainabilityRating = 'Eco-focused';
  else if (ecoScore >= 1) sustainabilityRating = 'Better';

  // Cost Scoring (Rough Heuristics)
  let costScore = 1;
  if (lowerBom.includes('silk') || lowerBom.includes('cashmere') || lowerBom.includes('leather')) costScore += 3;
  if (lowerBom.includes('wool') || lowerBom.includes('embroidery') || lowerBom.includes('technical') || lowerBom.includes('gore-tex')) costScore += 2;
  if (lowerBom.includes('gold') || lowerBom.includes('silver') || lowerBom.includes('titanium')) costScore += 3;
  if (lowerBom.includes('ykk') || lowerBom.includes('fidlock') || lowerBom.includes('cobra buckle')) costScore += 1;
  if (lowerBom.includes('denim') || lowerBom.includes('canvas') || lowerBom.includes('heavyweight')) costScore += 1;

  let costBand: ImpactEstimate['costBand'] = '$';
  if (costScore >= 5) costBand = '$$$';
  else if (costScore >= 3) costBand = '$$';

  return {
    costBand,
    sustainabilityRating,
    ecoScore
  };
};
