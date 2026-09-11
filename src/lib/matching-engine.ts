import {
  RecyclerRequirement,
  MatchingScoreResult,
  RecyclerMaterial,
} from '@/types';

export interface CollectorScrapInput {
  material: RecyclerMaterial;
  quantityKg: number;
  city?: string;
  collectorRequiresPickup?: boolean;
}

/**
 * Deterministic Matching Engine for ScrapMax.
 * Calculates compatibility score (0 - 100%) between collector scrap supply and active recycler demand.
 *
 * Scoring Breakdown:
 * 1. Material compatibility:   30%
 * 2. Quantity compatibility:   15%
 * 3. Price competitiveness:    20%
 * 4. Location compatibility:   15%
 * 5. Pickup availability:      10%
 * 6. Recycler verification:    10%
 * Total:                      100%
 */
export function calculateMatchScore(
  input: CollectorScrapInput,
  req: RecyclerRequirement
): MatchingScoreResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. Material Compatibility (30 points max)
  if (req.material.toLowerCase() === input.material.toLowerCase()) {
    score += 30;
    reasons.push('Material required by facility');
  } else if (
    (input.material === 'PCB' && req.material === 'Mixed E-Waste') ||
    (input.material === 'LCD' && req.material === 'Mixed E-Waste') ||
    (input.material === 'CRT' && req.material === 'Mixed E-Waste') ||
    (input.material === 'Motors' && req.material === 'Ferrous Metal') ||
    (input.material === 'Copper Cable' && req.material === 'Non-ferrous Metal')
  ) {
    score += 18;
    reasons.push('Material accepted under broader category');
  } else {
    // Material does not match
    return {
      score: 0,
      requirement: req,
      estimatedValue: Math.round(input.quantityKg * req.offered_price_per_kg),
      reasons: ['Material not accepted for this requirement'],
      isBestMatch: false,
    };
  }

  // Calculate remaining requirement capacity
  const remaining = Math.max(0, req.quantity_required_kg - req.quantity_fulfilled_kg);

  // 2. Quantity Compatibility (15 points max)
  const minLot = req.minimum_lot_kg || 1;
  if (input.quantityKg >= minLot && input.quantityKg <= remaining) {
    score += 15;
    reasons.push('Your quantity fits target demand perfectly');
  } else if (input.quantityKg >= minLot && input.quantityKg > remaining && remaining > 0) {
    score += 10;
    reasons.push(`Can partially fulfill remaining demand (${remaining} KG)`);
  } else if (input.quantityKg < minLot) {
    const lotRatio = Math.max(0, input.quantityKg / minLot);
    score += Math.round(lotRatio * 8);
    reasons.push(`Below minimum lot size (${minLot} KG)`);
  } else {
    score += 5;
  }

  // 3. Price Competitiveness (20 points max)
  // Base expectation benchmarks
  const price = Number(req.offered_price_per_kg) || 0;
  if (price >= 500) {
    // High-value metals (e.g. Copper)
    score += 20;
    reasons.push('High-value procurement rate');
  } else if (price >= 140) {
    score += 20;
    reasons.push('Highly competitive market price');
  } else if (price >= 90) {
    score += 17;
    reasons.push('Above average scrap value');
  } else if (price >= 40) {
    score += 14;
    reasons.push('Fair standard rate');
  } else {
    score += 10;
    reasons.push('Standard benchmark rate');
  }

  // 4. Location Compatibility (15 points max)
  const inputCity = (input.city || '').trim().toLowerCase();
  const reqCity = (req.city || '').trim().toLowerCase();

  if (inputCity && reqCity && (inputCity === reqCity || reqCity.includes(inputCity) || inputCity.includes(reqCity))) {
    score += 15;
    reasons.push(`Preferred location match (${req.city})`);
  } else if (!inputCity || req.collection_method === 'Both' || req.collection_method === 'Recycler Pickup') {
    score += 10;
    reasons.push('Regional facility coverage');
  } else {
    score += 5;
  }

  // 5. Pickup Availability (10 points max)
  if (req.collection_method === 'Recycler Pickup' || req.collection_method === 'Both') {
    score += 10;
    reasons.push('Doorstep recycler pickup available');
  } else {
    score += 6;
    reasons.push('Collector delivery to facility');
  }

  // 6. Recycler Verification (10 points max)
  if (req.recycler?.verification_status === 'verified') {
    score += 10;
    reasons.push('ScrapMax Verified Recycler');
  } else if (req.recycler?.verification_status === 'pending') {
    score += 6;
    reasons.push('Facility undergoing compliance review');
  } else {
    score += 5;
  }

  // Clamp score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, score));
  const estimatedValue = Math.round(input.quantityKg * req.offered_price_per_kg);

  return {
    score: finalScore,
    requirement: req,
    estimatedValue,
    reasons,
    isBestMatch: false,
  };
}

/**
 * Finds and ranks matching recycler requirements for a collector's scrap item.
 */
export function matchScrapRequirements(
  input: CollectorScrapInput,
  requirements: RecyclerRequirement[]
): MatchingScoreResult[] {
  if (!requirements || requirements.length === 0) return [];

  // Filter active and unfulfilled requirements
  const activeReqs = requirements.filter(
    (r) => r.status === 'Active' && r.quantity_fulfilled_kg < r.quantity_required_kg
  );

  const results: MatchingScoreResult[] = activeReqs
    .map((req) => calculateMatchScore(input, req))
    .filter((res) => res.score > 0)
    .sort((a, b) => b.score - a.score || b.requirement.offered_price_per_kg - a.requirement.offered_price_per_kg);

  if (results.length > 0) {
    results[0].isBestMatch = true;
  }

  return results;
}
