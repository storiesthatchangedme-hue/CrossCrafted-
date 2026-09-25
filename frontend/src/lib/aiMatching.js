/**
 * @module lib/aiMatching
 * @description AI-powered match explanation generator for CrossCrafted.
 *
 * Provides a client-side compatibility scoring algorithm that computes a
 * weighted 0-100 score based on multiple profile dimensions, and
 * optionally enriches the result with a Gemini-generated explanation via
 * the server-side `/api/bff/ai-match` endpoint.
 */

import api from '@/lib/api';

// ═══════════════════════════════════════════════════════════════════════════
// Matching weights (must sum to ~100 for the base score)
// ═══════════════════════════════════════════════════════════════════════════

/** @type {Record<string, number>} Weight configuration per factor. */
const WEIGHTS = {
  faith_journey_status: 15,
  denomination: 15,
  interests: 20,
  personality_profile: 10,
  church_attendance: 10,
  languages: 5,
  location: 10,
  relationship_goals: 10,
  occupation: 5,
};

// ═══════════════════════════════════════════════════════════════════════════
// Helper: safe array intersection
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Return the intersection of two arrays (case-insensitive for strings).
 * @param {any[]} a
 * @param {any[]} b
 * @returns {any[]}
 */
function intersect(a, b) {
  const setA = new Set((a || []).map(v => (typeof v === 'string' ? v.toLowerCase() : v)));
  return (b || []).filter(v => setA.has(typeof v === 'string' ? v.toLowerCase() : v));
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper: personality distance (Euclidean on numeric fields)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute a normalised 0-1 personality distance between two profiles.
 * Compares numeric / semi-numeric fields (age is the main one).
 * A distance of 0 = identical, 1 = maximally different.
 *
 * @param {object} a - User profile
 * @param {object} b - Other user profile
 * @returns {number} 0-1
 */
function personalityDistance(a, b) {
  const ageA = Number(a.age) || 25;
  const ageB = Number(b.age) || 25;
  // Normalise age difference: 0 diff = 0 distance, 30+ years = 1 distance
  const ageDiff = Math.abs(ageA - ageB);
  return Math.min(ageDiff / 30, 1);
}

// ═══════════════════════════════════════════════════════════════════════════
// Core: local compatibility scoring
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute a local 0-100 compatibility score and factor breakdown between
 * two user profiles without calling the server.
 *
 * @param {object} userProfile - The active user's profile.
 * @param {object} otherProfile - The candidate's profile.
 * @returns {{ score: number, explanation: string, factors: Array<{name:string, matched:boolean, weight:number, detail:string}> }}
 */
function computeLocalMatch(userProfile, otherProfile) {
  const factors = [];

  // ── 1. Faith Journey Status (15) ──
  const faithJourneyA = (userProfile.faith_journey_status || userProfile.faith_journey || '').toLowerCase();
  const faithJourneyB = (otherProfile.faith_journey_status || otherProfile.faith_journey || '').toLowerCase();
  const faithMatch = faithJourneyA && faithJourneyB && faithJourneyA === faithJourneyB;
  factors.push({
    name: 'Faith Journey',
    matched: faithMatch,
    weight: WEIGHTS.faith_journey_status,
    detail: faithMatch
      ? `Both share the "${faithJourneyA}" faith journey.`
      : `Different faith journeys: "${faithJourneyA || 'unknown'}" vs "${faithJourneyB || 'unknown'}".`,
  });

  // ── 2. Denomination (15) ──
  const denomA = (userProfile.denomination || '').toLowerCase();
  const denomB = (otherProfile.denomination || '').toLowerCase();
  const denomMatch = denomA && denomB && denomA === denomB;
  factors.push({
    name: 'Denomination',
    matched: denomMatch,
    weight: WEIGHTS.denomination,
    detail: denomMatch
      ? `Both belong to the ${userProfile.denomination} denomination.`
      : denomA && denomB
        ? `Different denominations: ${userProfile.denomination} vs ${otherProfile.denomination}.`
        : 'Denomination not specified for one or both profiles.',
  });

  // ── 3. Interests (20) ──
  const interestsA = userProfile.interests || [];
  const interestsB = otherProfile.interests || [];
  const commonInterests = intersect(interestsA, interestsB);
  const maxPossible = Math.max(interestsA.length, interestsB.length, 1);
  const interestRatio = commonInterests.length / maxPossible;
  const interestMatch = interestRatio >= 0.3; // At least 30% overlap
  factors.push({
    name: 'Interests',
    matched: interestMatch,
    weight: WEIGHTS.interests,
    detail: commonInterests.length > 0
      ? `Share ${commonInterests.length} interest${commonInterests.length > 1 ? 's' : ''}: ${commonInterests.join(', ')}.`
      : 'No shared interests found.',
  });

  // ── 4. Personality Profile / Age proximity (10) ──
  const dist = personalityDistance(userProfile, otherProfile);
  const personalityMatch = dist <= 0.33; // Within ~10 years
  factors.push({
    name: 'Personality Profile',
    matched: personalityMatch,
    weight: WEIGHTS.personality_profile,
    detail: `Age proximity: ${Math.abs((Number(userProfile.age) || 25) - (Number(otherProfile.age) || 25))} years apart.`,
  });

  // ── 5. Church Attendance (10) ──
  const attendA = (userProfile.church_attendance || '').toLowerCase();
  const attendB = (otherProfile.church_attendance || '').toLowerCase();
  const attendMatch = attendA && attendB && attendA === attendB;
  factors.push({
    name: 'Church Attendance',
    matched: attendMatch,
    weight: WEIGHTS.church_attendance,
    detail: attendMatch
      ? `Both attend church "${attendA}".`
      : attendA && attendB
        ? `Different attendance patterns: ${attendA} vs ${attendB}.`
        : 'Church attendance not specified.',
  });

  // ── 6. Languages (5) ──
  const langA = userProfile.languages || [];
  const langB = otherProfile.languages || [];
  const commonLangs = intersect(langA, langB);
  const langMatch = commonLangs.length > 0;
  factors.push({
    name: 'Languages',
    matched: langMatch,
    weight: WEIGHTS.languages,
    detail: commonLangs.length > 0
      ? `Common language${commonLangs.length > 1 ? 's' : ''}: ${commonLangs.join(', ')}.`
      : 'No shared languages.',
  });

  // ── 7. Location (10) ──
  const cityA = (userProfile.city || '').toLowerCase();
  const cityB = (otherProfile.city || '').toLowerCase();
  const stateA = (userProfile.state || '').toLowerCase();
  const stateB = (otherProfile.state || '').toLowerCase();
  const sameCity = cityA && cityB && cityA === cityB;
  const sameState = stateA && stateB && stateA === stateB;
  const locationMatch = sameCity || sameState;
  factors.push({
    name: 'Location',
    matched: locationMatch,
    weight: WEIGHTS.location,
    detail: sameCity
      ? `Same city: ${userProfile.city}.`
      : sameState
        ? `Same state: ${userProfile.state}.`
        : `Different locations: ${userProfile.city || 'N/A'}, ${userProfile.state || 'N/A'} vs ${otherProfile.city || 'N/A'}, ${otherProfile.state || 'N/A'}.`,
  });

  // ── 8. Relationship / Fellowship Goals (10) ──
  const goalsA = userProfile.looking_for || [];
  const goalsB = otherProfile.looking_for || [];
  const commonGoals = intersect(goalsA, goalsB);
  const goalMatch = commonGoals.length > 0;
  factors.push({
    name: 'Fellowship Goals',
    matched: goalMatch,
    weight: WEIGHTS.relationship_goals,
    detail: commonGoals.length > 0
      ? `Shared goals: ${commonGoals.join(', ')}.`
      : 'No overlapping fellowship goals.',
  });

  // ── 9. Occupation (5) ──
  const occA = (userProfile.occupation || '').toLowerCase();
  const occB = (otherProfile.occupation || '').toLowerCase();
  const occMatch = occA && occB && occA === occB;
  factors.push({
    name: 'Occupation',
    matched: occMatch,
    weight: WEIGHTS.occupation,
    detail: occMatch
      ? `Both work in ${userProfile.occupation}.`
      : occA || occB
        ? `${occA ? userProfile.occupation : 'Not specified'} vs ${occB ? otherProfile.occupation : 'Not specified'}.`
        : 'Occupation not specified.',
  });

  // ── Compute weighted score ──
  let score = 0;
  for (const factor of factors) {
    if (factor.name === 'Interests') {
      // For interests, score proportionally based on overlap ratio
      score += factor.weight * Math.min(interestRatio * 2, 1); // 2x to make 50% overlap = full score
    } else if (factor.name === 'Personality Profile') {
      // Score inversely proportional to distance
      score += factor.weight * (1 - dist);
    } else {
      score += factor.matched ? factor.weight : 0;
    }
  }

  // Clamp to 0-100
  score = Math.round(Math.min(100, Math.max(0, score)));

  // ── Generate explanation ──
  const matchedFactors = factors.filter(f => f.matched);
  const strongFactors = matchedFactors
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map(f => f.detail.replace(/\.$/, ''));

  const explanation = strongFactors.length > 0
    ? `You and ${otherProfile.name || 'this person'} are a great match! ${strongFactors.join(' ')}`
    : `There's potential for a meaningful connection with ${otherProfile.name || 'this person'} despite different backgrounds.`;

  return { score, explanation, factors };
}

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a structured match explanation between two user profiles.
 *
 * <p>First computes a local compatibility score with factor breakdown.
 * Then enriches the result by calling the server-side
 * {@code /api/bff/ai-match} endpoint (which may use Gemini for a richer
 * explanation). If the server call fails, the local result is returned
 * as-is.</p>
 *
 * @param {object} userProfile - The active user's profile object.
 * @param {object} otherProfile - The candidate match's profile object.
 *   Must contain an `_id` field for the server call.
 * @returns {Promise<{score: number, explanation: string, factors: Array<{name:string, matched:boolean, weight:number, detail:string}>, ai_enhanced: boolean, server_data?: object}>}
 *
 * @example
 * const result = await generateMatchExplanation(myProfile, candidateProfile);
 * console.log(result.score);       // 0-100
 * console.log(result.explanation); // Human-readable string
 * console.log(result.factors);     // Array of factor details
 */
export async function generateMatchExplanation(userProfile, otherProfile) {
  // Step 1: Local scoring (always available, no network)
  const localResult = computeLocalMatch(userProfile, otherProfile);

  // Step 2: Try server-side AI enrichment
  if (!otherProfile._id) {
    return { ...localResult, ai_enhanced: false };
  }

  try {
    const { data: serverData } = await api.get(`/api/bff/ai-match?target_id=${encodeURIComponent(otherProfile._id)}`);

    // Merge server score if available, otherwise keep local
    const mergedScore = serverData.match_score ?? localResult.score;

    // Build a richer explanation from server data if AI-generated
    const mergedExplanation = serverData.is_ai_generated
      ? serverData.match_explanation || localResult.explanation
      : localResult.explanation;

    return {
      score: mergedScore,
      explanation: mergedExplanation,
      factors: localResult.factors, // Always use the detailed local factor breakdown
      ai_enhanced: !!serverData.is_ai_generated,
      server_data: serverData,
    };
  } catch {
    // Server call failed — return local result
    return { ...localResult, ai_enhanced: false };
  }
}

/**
 * Compute a local compatibility score without any server call.
 * Useful for quick client-side sorting and preview.
 *
 * @param {object} userProfile
 * @param {object} otherProfile
 * @returns {{ score: number, explanation: string, factors: Array<{name:string, matched:boolean, weight:number, detail:string}> }}
 */
export function computeLocalCompatibility(userProfile, otherProfile) {
  return computeLocalMatch(userProfile, otherProfile);
}