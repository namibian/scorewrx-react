/**
 * Dots Game Logic
 * 
 * Ported from: src/components/scorecard/ScorerEntryContent.vue (dots calculation logic)
 * 
 * This module handles all Dots game calculations:
 * - Dots calculation based on score vs par
 * - Greenie tracking (Par 3 holes)
 * - Sandy tracking (bunker saves)
 * - Carry-over logic for Par 3s when no greenie is awarded
 * - Dots payout calculation
 */

import type { Player, Course } from '@/types'

// ============================================
// DOTS CALCULATION
// ============================================

/**
 * Calculate dots for a player based on their score
 * Formula: dots = (par - score) + greenie + sandy
 * If score > par, dots = 0 (no negative dots)
 * DNF = 0 dots
 * 
 * @param score - Player's gross score on the hole
 * @param par - Par for the hole
 * @param hasGreenie - Whether player achieved a greenie (Par 3 only)
 * @param hasSandy - Whether player achieved a sandy (bunker save)
 * @param isDNF - Whether player DNF'd the hole
 * @param carryOverCount - Number of carry-overs from previous Par 3s without greenies
 * @returns Dots earned
 */
export function calculateDots(
  score: number | null,
  par: number,
  hasGreenie: boolean,
  hasSandy: boolean,
  isDNF: boolean,
  carryOverCount = 0
): number {
  // DNF = 0 dots
  if (isDNF || score === null) {
    return 0
  }

  // Score dots: par - score (minimum 0)
  let scoreDots = 0
  if (score <= par) {
    scoreDots = par - score
  }

  // Add greenie bonus (includes carry-overs for Par 3s)
  let totalDots = scoreDots
  if (hasGreenie) {
    totalDots += 1 + carryOverCount
  }

  // Add sandy bonus
  if (hasSandy) {
    totalDots += 1
  }

  return totalDots
}

// ============================================
// CARRY-OVER CALCULATION
// ============================================

/**
 * Calculate carry-over count for a Par 3 hole
 * Carry-overs accumulate when previous Par 3s had no greenie
 * 
 * @param currentHole - Current hole number (1-18)
 * @param course - Course data
 * @param players - All players in the group
 * @returns Number of carry-overs
 */
export function calculateCarryOver(
  currentHole: number,
  course: Course,
  players: Player[]
): number {
  const holes = course.teeboxes?.[0]?.holes
  if (!holes) return 0

  const currentHolePar = holes[currentHole - 1]?.par
  
  // Only Par 3s can have carry-overs
  if (currentHolePar !== 3) {
    return 0
  }

  let carryOverCount = 0

  // Look backwards through previous Par 3s
  for (let hole = currentHole - 1; hole >= 1; hole--) {
    const holePar = holes[hole - 1]?.par
    
    // Only check Par 3s
    if (holePar !== 3) {
      continue
    }

    // Check if any player has a greenie on this hole
    const hasGreenie = players.some((player) =>
      Array.isArray(player.greenies) && player.greenies.includes(hole)
    )

    if (!hasGreenie) {
      // No greenie on this Par 3, add to carry-over
      carryOverCount++
    } else {
      // Found a greenie, stop counting (carry-over chain breaks)
      break
    }
  }

  return carryOverCount
}

// ============================================
// GREENIE VALIDATION
// ============================================

/**
 * Get eligible players for greenie on a Par 3
 * Eligible if: scored 3 or better, not DNF
 * 
 * @param players - All players in the group
 * @param hole - Hole index (0-based)
 * @param scores - Map of player scores
 * @returns Array of eligible players with their scores
 */
export function getEligiblePlayersForGreenie(
  players: Player[],
  hole: number,
  scores: Map<string, { score: (number | null)[]; dnf: boolean[] }>
): Array<{ id: string; firstName: string; lastName: string; score: number }> {
  return players
    .filter((player) => {
      const playerScores = scores.get(player.id)
      const score = playerScores?.score[hole]
      const isDnf = playerScores?.dnf[hole]
      return !isDnf && score !== null && score !== undefined && score <= 3
    })
    .map((player) => ({
      id: player.id,
      firstName: player.firstName,
      lastName: player.lastName,
      score: scores.get(player.id)!.score[hole]!,
    }))
}

// ============================================
// DOTS PAYOUT CALCULATION
// ============================================

/**
 * Calculate dots payout for a player
 * Each player pays/receives based on dot differential vs other participants
 * 
 * @param playerId - Player to calculate payout for
 * @param players - All players in the group
 * @param participants - Players participating in dots game
 * @param amountPerDot - Dollar amount per dot
 * @returns Total payout (positive = win, negative = loss)
 */
export function calculateDotsPayout(
  playerId: string,
  players: Player[],
  participants: Array<{ playerId: string; selected: boolean }>,
  amountPerDot: number
): number {
  const player = players.find((p) => p.id === playerId)
  if (!player || !Array.isArray(player.dots)) {
    return 0
  }

  // Check if player is participating
  const isParticipating = participants.some(
    (p) => p.playerId === playerId && p.selected
  )
  if (!isParticipating) {
    return 0
  }

  // Calculate player's total dots
  const playerDots = player.dots.reduce((sum, dot) => sum + dot, 0)

  // Get all participating players
  const participatingPlayers = participants
    .filter((p) => p.selected)
    .map((p) => players.find((pl) => pl.id === p.playerId))
    .filter((p): p is Player => p !== undefined)

  // Calculate payout vs each other participant
  let totalPayout = 0
  participatingPlayers.forEach((otherPlayer) => {
    if (otherPlayer.id !== playerId) {
      const otherPlayerDots =
        otherPlayer.dots?.reduce((sum, dot) => sum + dot, 0) || 0
      const dotDiff = playerDots - otherPlayerDots
      totalPayout += dotDiff * amountPerDot
    }
  })

  return totalPayout
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate that score and toggles are consistent
 * - Greenie/Sandy not allowed if score > par
 * - Greenie and Sandy mutually exclusive on Par 3s
 * 
 * @param score - Player's score
 * @param par - Par for the hole
 * @param hasGreenie - Greenie toggle state
 * @param hasSandy - Sandy toggle state
 * @returns Object with isValid and error message if invalid
 */
export function validateDotsEntry(
  score: number | null,
  par: number,
  hasGreenie: boolean,
  hasSandy: boolean
): { isValid: boolean; error?: string } {
  // Can't have greenie or sandy if score > par
  if (score !== null && score > par) {
    if (hasGreenie) {
      return { isValid: false, error: 'Greenie not allowed when score > par' }
    }
    if (hasSandy) {
      return { isValid: false, error: 'Sandy not allowed when score > par' }
    }
  }

  // On Par 3s, greenie and sandy are mutually exclusive
  if (par === 3 && hasGreenie && hasSandy) {
    return {
      isValid: false,
      error: 'Cannot have both greenie and sandy on Par 3',
    }
  }

  return { isValid: true }
}

/**
 * Get maximum allowed score for a player on a hole
 * Used for DNF default score
 * 
 * @param par - Par for the hole
 * @param playerHandicap - Player's tournament handicap
 * @param holeHandicap - Hole handicap (1-18)
 * @returns Maximum score
 */
export function getMaxScore(
  par: number,
  playerHandicap: number,
  holeHandicap: number
): number {
  const baseStrokes = Math.floor(playerHandicap / 18)
  const additionalStroke = (playerHandicap % 18) >= holeHandicap ? 1 : 0
  const totalStrokes = baseStrokes + additionalStroke
  return par + 2 + totalStrokes
}

