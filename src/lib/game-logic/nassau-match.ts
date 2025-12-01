/**
 * Nassau Match Logic
 * 
 * Ported from: src/composables/useNassauMatch.js
 * 
 * This module handles all Nassau match play calculations:
 * - Match play scoring (hole-by-hole match)
 * - Front nine, back nine, and overall match standings
 * - Net score comparisons
 * - Stroke application
 */

import type { Player } from '@/types'

// ============================================
// MATCH STANDING CALCULATION
// ============================================

/**
 * Calculate the match standing between two players over a range of holes
 * @param player1 - First player
 * @param player2 - Second player
 * @param scores - Map of player scores
 * @param startHole - First hole (1-based)
 * @param endHole - Last hole (1-based)
 * @param getNetScore - Function to get net score for a player on a hole
 * @returns Match score (positive = player1 up, negative = player2 up)
 */
export function calculateMatchStanding(
  player1: Player,
  player2: Player,
  scores: Map<string, { score: (number | null)[]; dnf?: boolean[] }>,
  startHole: number,
  endHole: number,
  getNetScore: (playerId: string, hole: number) => number | null
): number {
  let matchScore = 0 // positive = player1 up, negative = player2 is up

  // Calculate cumulative standing from startHole to endHole
  for (let hole = startHole; hole <= endHole; hole++) {
    const player1Scores = scores.get(player1.id)
    const player2Scores = scores.get(player2.id)

    // Skip if either player hasn't entered a score or has DNF
    if (
      !player1Scores?.score ||
      !player2Scores?.score ||
      player1Scores.score[hole - 1] === null ||
      player2Scores.score[hole - 1] === null ||
      player1Scores.dnf?.[hole - 1] ||
      player2Scores.dnf?.[hole - 1]
    ) {
      continue
    }

    // Get net scores using the provided getNetScore function
    const player1Net = getNetScore(player1.id, hole)
    const player2Net = getNetScore(player2.id, hole)

    // Skip if either net score is null (no score or DNF)
    if (player1Net === null || player2Net === null) {
      continue
    }

    // Update match score - positive means player1 is up, negative means player2 is up
    // In golf, LOWER score wins the hole
    if (player1Net < player2Net) {
      matchScore++ // player1 wins hole (has lower score)
    } else if (player2Net < player1Net) {
      matchScore-- // player2 wins hole (has lower score)
    }
  }
  
  return matchScore
}

// ============================================
// MATCH STANDINGS (FRONT, BACK, OVERALL)
// ============================================

export interface NassauMatchStandings {
  front: number
  back: number
  overall: number
}

/**
 * Get match standings for front nine, back nine, and overall
 * @param player1 - First player
 * @param player2 - Second player
 * @param scores - Map of player scores
 * @param matchType - Type of Nassau match ('all', 'frontback', or 'Overall')
 * @param getNetScore - Function to get net score for a player on a hole
 * @returns Object with front, back, and overall standings
 */
export function getMatchStandings(
  player1: Player,
  player2: Player,
  scores: Map<string, { score: (number | null)[]; dnf?: boolean[] }>,
  matchType: 'all' | 'frontback' | 'overall' | 'Overall',
  getNetScore: (playerId: string, hole: number) => number | null
): NassauMatchStandings {
  // Calculate front and back standings for all match types
  const front = calculateMatchStanding(player1, player2, scores, 1, 9, getNetScore)
  const back = calculateMatchStanding(player1, player2, scores, 10, 18, getNetScore)

  // For overall match type, calculate overall standing
  const overall =
    matchType === 'Overall' || matchType === 'all'
      ? calculateMatchStanding(player1, player2, scores, 1, 18, getNetScore)
      : front + back // For front/back matches, overall is just the sum

  return { front, back, overall }
}

