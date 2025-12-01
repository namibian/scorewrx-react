/**
 * Skins Calculation Logic
 * 
 * Ported from: src/components/scorecard/SkinsPanel.vue
 * 
 * This module handles all Skins competition calculations:
 * - Skin winner determination (scratch and handicap pools)
 * - Pot calculation and residual distribution
 * - Payout calculation with strategic residual allocation
 * - Net score calculation for handicap skins
 */

import type { Player, Tournament, Course } from '@/types'

// ============================================
// TYPES
// ============================================

export interface SkinResult {
  hole: number
  score: number
}

export interface SkinsPoolResult {
  [playerId: string]: SkinResult[]
}

export interface PotStats {
  totalSkins: number
  baseSkinValue: number
  residualAmount: number
}

export interface PlayerEarnings {
  playerId: string
  earnings: number
  skins: SkinResult[]
}

// ============================================
// POT CALCULATION
// ============================================

/**
 * Calculate pot size for a skins pool
 * @param participants - Array of participant info
 * @param buyIn - Buy-in amount per player
 * @param manualPot - Optional manual pot override
 * @returns Total pot size
 */
export function calculatePotSize(
  participants: Array<{ playerId: string; firstName: string; lastName: string }>,
  buyIn: number,
  manualPot?: { enabled: boolean; amount: number }
): number {
  // Use manual pot if enabled
  if (manualPot?.enabled) {
    return manualPot.amount || 0
  }

  // Calculate from participants
  return participants.length * buyIn
}

/**
 * Calculate pot statistics (total skins, base value, residual)
 * @param potSize - Total pot size
 * @param totalSkins - Total number of skins won
 * @returns Pot statistics
 */
export function calculatePotStats(potSize: number, totalSkins: number): PotStats {
  if (totalSkins === 0) {
    return { totalSkins: 0, baseSkinValue: 0, residualAmount: 0 }
  }

  const baseSkinValue = Math.floor(potSize / totalSkins)
  const residualAmount = potSize - baseSkinValue * totalSkins

  return { totalSkins, baseSkinValue, residualAmount }
}

/**
 * Calculate an array of skin values with residual distributed
 * Higher-value skins are created by upgrading individual skins by $1
 * 
 * @param totalPot - Total pot size
 * @param totalSkins - Total number of skins
 * @returns Sorted array of skin values (high to low)
 */
export function calculateSkinValues(totalPot: number, totalSkins: number): number[] {
  if (totalSkins === 0) return []

  const baseValue = Math.floor(totalPot / totalSkins)
  const residual = totalPot - baseValue * totalSkins

  // Create array of skin values
  const skinValues = Array(totalSkins).fill(baseValue)

  // Upgrade 'residual' number of skins by $1
  for (let i = 0; i < residual; i++) {
    skinValues[i] = baseValue + 1
  }

  // Sort so higher values come first
  return skinValues.sort((a, b) => b - a)
}

// ============================================
// RESIDUAL DISTRIBUTION
// ============================================

/**
 * Distribute skin values to players strategically
 * Players with fewer skins get higher-value skins first
 * This evens out payouts across winners
 * 
 * @param playersWithSkins - Array of players and their skin counts
 * @param skinValues - Sorted array of skin values
 * @returns Map of player ID to total earnings
 */
export function distributeSkinValues(
  playersWithSkins: Array<{ playerId: string; skinCount: number }>,
  skinValues: number[]
): Map<string, number> {
  // Sort players by skin count (fewest skins first)
  const sortedPlayers = [...playersWithSkins].sort(
    (a, b) => a.skinCount - b.skinCount
  )

  const playerEarnings = new Map<string, number>()
  let valueIndex = 0

  // Distribute skin values - players with fewer skins get higher-value skins first
  for (const player of sortedPlayers) {
    let playerTotal = 0

    for (let i = 0; i < player.skinCount; i++) {
      const skinValue = skinValues[valueIndex]
      playerTotal += skinValue
      valueIndex++
    }

    playerEarnings.set(player.playerId, playerTotal)
  }

  return playerEarnings
}

/**
 * Calculate earnings for all players in a pool
 * @param skins - Pool skins results
 * @param potSize - Total pot size
 * @returns Map of player ID to earnings
 */
export function calculatePlayerEarnings(
  skins: SkinsPoolResult,
  potSize: number
): Map<string, number> {
  // Create players with skin counts
  const playersWithSkins = Object.entries(skins)
    .map(([playerId, playerSkins]) => {
      const skinCount = Array.isArray(playerSkins)
        ? playerSkins.filter((skin) => typeof skin === 'object').length
        : 0
      return { playerId, skinCount }
    })
    .filter((player) => player.skinCount > 0)

  // Get total skins
  const totalSkins = playersWithSkins.reduce(
    (sum, player) => sum + player.skinCount,
    0
  )

  // Get skin values and distribute them
  const skinValues = calculateSkinValues(potSize, totalSkins)
  return distributeSkinValues(playersWithSkins, skinValues)
}

// ============================================
// SKIN DETERMINATION
// ============================================

/**
 * Calculate net score for handicap skins
 * @param grossScore - Player's gross score
 * @param playerHandicap - Player's tournament handicap
 * @param lowestHandicap - Lowest handicap in the pool
 * @param holeHandicap - Hole handicap (1-18)
 * @param holePar - Par for the hole
 * @param useHalfStrokeOnPar3 - Whether to use half-strokes on Par 3s
 * @returns Net score
 */
export function calculateHandicapNetScore(
  grossScore: number,
  playerHandicap: number,
  lowestHandicap: number,
  holeHandicap: number,
  holePar: number,
  useHalfStrokeOnPar3: boolean
): number {
  // Calculate adjusted handicap (differential from lowest)
  const adjustedHandicap = playerHandicap - lowestHandicap

  // Check if player gets a stroke on this hole
  if (adjustedHandicap >= holeHandicap) {
    const strokeAmount = holePar === 3 && useHalfStrokeOnPar3 ? 0.5 : 1
    return grossScore - strokeAmount
  }

  return grossScore
}

/**
 * Calculate skins for a pool (scratch or handicap)
 * @param players - Players in the pool
 * @param course - Course data
 * @param isHandicap - Whether this is handicap pool (vs scratch)
 * @param useHalfStrokeOnPar3 - Whether to use half-strokes on Par 3s
 * @returns Skins results
 */
export function calculatePoolSkins(
  players: Player[],
  course: Course,
  isHandicap: boolean,
  useHalfStrokeOnPar3: boolean
): SkinsPoolResult {
  const skins: SkinsPoolResult = {}

  const holes = course.teeboxes?.[0]?.holes
  if (!holes) return skins
  // Calculate adjusted handicaps for handicap skins
  const adjustedHandicaps: Record<string, number> = {}
  if (isHandicap) {
    const lowestHandicap = Math.min(
      ...players.map((p) => p.tournamentHandicap || 0)
    )
    players.forEach((player) => {
      adjustedHandicaps[player.id] = (player.tournamentHandicap || 0) - lowestHandicap
    })
  }

  // Process each hole
  for (let holeIndex = 0; holeIndex < 18; holeIndex++) {
    const hole = holeIndex + 1
    const holeData = holes[holeIndex]
    if (!holeData) continue

    // Get scores for this hole
    const holeScores = players.map((player) => {
      const grossScore = player.score?.[holeIndex]
      const isDNF = player.dnf?.[holeIndex]

      // Skip if no score or DNF
      if (!grossScore || isDNF) {
        return { playerId: player.id, score: 999 }
      }

      // For scratch skins, just use gross score
      let netScore = grossScore
      
      // For handicap skins, apply strokes
      if (isHandicap) {
        netScore = calculateHandicapNetScore(
          grossScore,
          player.tournamentHandicap || 0,
          Math.min(...players.map((p) => p.tournamentHandicap || 0)),
          holeData.handicap || 0,
          holeData.par,
          useHalfStrokeOnPar3
        )
      }

      return { playerId: player.id, score: netScore }
    })

    // Find lowest score
    const lowestScore = Math.min(...holeScores.map((s) => s.score))
    if (lowestScore === 999) continue // No valid scores

    // Check if it's a skin (only one player with lowest score)
    const playersWithLowestScore = holeScores.filter((s) => s.score === lowestScore)
    if (playersWithLowestScore.length === 1) {
      // It's a skin!
      const winner = playersWithLowestScore[0].playerId
      if (!skins[winner]) {
        skins[winner] = []
      }
      skins[winner].push({ hole, score: lowestScore })
    }
  }

  return skins
}

/**
 * Calculate skins for both scratch and handicap pools
 * @param tournament - Tournament data
 * @param course - Course data
 * @param allPlayers - Map of all players (from all groups)
 * @returns Object with scratch and handicap skins
 */
export function calculateAllSkins(
  tournament: Tournament,
  course: Course,
  allPlayers: Map<string, Player>
): { scratch: SkinsPoolResult; handicap: SkinsPoolResult } {
  // Get players in each pool
  const scratchPlayers: Player[] = []
  const handicapPlayers: Player[] = []

  allPlayers.forEach((player) => {
    if (player.skinsPool === 'Scratch' || player.skinsPool === 'Both') {
      scratchPlayers.push(player)
    }
    if (player.skinsPool === 'Handicap' || player.skinsPool === 'Both') {
      handicapPlayers.push(player)
    }
  })

  const useHalfStrokeOnPar3 =
    tournament.competitions?.skins?.useHalfStrokeOnPar3 || false

  return {
    scratch:
      scratchPlayers.length > 0
        ? calculatePoolSkins(scratchPlayers, course, false, useHalfStrokeOnPar3)
        : {},
    handicap:
      handicapPlayers.length > 0
        ? calculatePoolSkins(handicapPlayers, course, true, useHalfStrokeOnPar3)
        : {},
  }
}

