/**
 * Stroke Calculation Logic
 * 
 * Ported from: src/composables/useStrokeCalculation.js
 * 
 * This module handles all handicap stroke calculations for golf games including:
 * - Player handicap calculations (Standard vs Custom format)
 * - Stroke distribution across holes based on hole handicap
 * - Sixes game stroke allocation (3 games of 6 holes each)
 * - Dots game stroke allocation (18 holes)
 * - Nassau stroke allocation (front 9, back 9)
 * - Nines stroke allocation (18 holes)
 */

import type { Player, Course, HandicapFormat } from '@/types'
import { MAX_STROKES } from '@/lib/constants/game-defaults'

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate a player's handicap based on the handicap format
 * @param player - Player object
 * @param format - 'Custom' (floor) or 'Standard' (exact)
 * @returns Calculated handicap
 */
export function calculatePlayerHandicap(
  player: Player | undefined,
  format: HandicapFormat
): number {
  const handicap = player?.tournamentHandicap || 0
  return format === 'Custom' ? Math.floor(handicap) : handicap
}

/**
 * Get the lowest handicap from a group of players
 * @param players - Array of players
 * @param format - Handicap format
 * @returns Lowest handicap value
 */
export function getLowestHandicap(
  players: Player[],
  format: HandicapFormat
): number {
  return Math.min(...players.map((p) => calculatePlayerHandicap(p, format)))
}

/**
 * Cap strokes to valid range (0 to MAX_STROKES)
 * @param strokes - Number of strokes
 * @returns Capped strokes value
 */
export function capStrokes(strokes: number): number {
  return Math.min(Math.max(strokes, 0), MAX_STROKES)
}

// ============================================
// STROKE CALCULATION
// ============================================

/**
 * Calculate total strokes for a player
 * @param player - Player object
 * @param players - All players in the group (for differential calculation)
 * @param useDifferential - Whether to use differential handicap
 * @param format - Handicap format
 * @returns Total strokes for the player
 */
export function calculateTotalStrokes(
  player: Player,
  players: Player[],
  useDifferential: boolean,
  format: HandicapFormat
): number {
  const playerHandicap = calculatePlayerHandicap(player, format)

  if (useDifferential) {
    const lowestHandicap = getLowestHandicap(players, format)
    const strokes = playerHandicap - lowestHandicap
    const cappedStrokes = capStrokes(Math.floor(strokes))
    return cappedStrokes
  }

  const strokes = playerHandicap
  const cappedStrokes = capStrokes(Math.floor(strokes))
  return cappedStrokes
}

// ============================================
// SIXES GAME STROKE DISTRIBUTION
// ============================================

/**
 * Distribute strokes across three 6-hole games for Sixes
 * Uses hole handicap to distribute strokes fairly across games
 * 
 * @param player - Player object
 * @param players - All players in the group
 * @param useDifferentialHandicap - Whether to use differential handicap
 * @param handicapFormat - Handicap format
 * @param courseData - Course data with hole handicaps
 * @param startingTee - Starting hole (for shotgun starts)
 * @param totalStrokes - Total strokes to distribute
 * @returns Object with stroke holes for each of three games
 */
export function distributeSixesGameStrokes(
  _player: Player,
  _players: Player[],
  _useDifferentialHandicap: boolean,
  _handicapFormat: HandicapFormat,
  courseData: Course,
  startingTee: number,
  totalStrokes: number
): { firstGame: number[]; secondGame: number[]; thirdGame: number[] } {
  if (!courseData?.teeboxes?.[0]?.holes) {
    throw new Error('No course data available for stroke distribution')
  }

  const holes = courseData.teeboxes[0].holes

  // Calculate game start positions based on starting tee
  const firstGameStart = startingTee
  const secondGameStart = ((firstGameStart + 5) % 18) + 1
  const thirdGameStart = ((secondGameStart + 5) % 18) + 1

  // Define function to get holes for each game
  const getGameHoles = (start: number) => {
    const gameHoles: Array<{ hole: number; handicap: number; game: string }> = []
    let current = start

    // Add 6 holes to the game
    for (let i = 0; i < 6; i++) {
      gameHoles.push({
        hole: current,
        handicap: holes[(current - 1) % 18].handicap,
        game:
          start === firstGameStart
            ? 'firstGame'
            : start === secondGameStart
              ? 'secondGame'
              : 'thirdGame',
      })
      current = (current % 18) + 1
    }

    return gameHoles
  }

  // Get holes for each game
  const firstGameHoles = getGameHoles(firstGameStart)
  const secondGameHoles = getGameHoles(secondGameStart)
  const thirdGameHoles = getGameHoles(thirdGameStart)

  // Sort holes within each game by handicap
  firstGameHoles.sort((a, b) => a.handicap - b.handicap)
  secondGameHoles.sort((a, b) => a.handicap - b.handicap)
  thirdGameHoles.sort((a, b) => a.handicap - b.handicap)

  // Calculate base strokes per game
  const baseStrokesPerGame = Math.floor(totalStrokes / 3)
  const residualStrokes = totalStrokes % 3

  // Initialize result with base strokes
  const result = {
    firstGame: firstGameHoles.slice(0, baseStrokesPerGame).map((h) => h.hole),
    secondGame: secondGameHoles.slice(0, baseStrokesPerGame).map((h) => h.hole),
    thirdGame: thirdGameHoles.slice(0, baseStrokesPerGame).map((h) => h.hole),
  }

  // Distribute residual strokes, alternating between games
  if (residualStrokes > 0) {
    // Get remaining holes sorted by handicap
    const remainingHoles = [
      ...firstGameHoles
        .slice(baseStrokesPerGame)
        .map((h) => ({ ...h, gameKey: 'firstGame' as const })),
      ...secondGameHoles
        .slice(baseStrokesPerGame)
        .map((h) => ({ ...h, gameKey: 'secondGame' as const })),
      ...thirdGameHoles
        .slice(baseStrokesPerGame)
        .map((h) => ({ ...h, gameKey: 'thirdGame' as const })),
    ].sort((a, b) => a.handicap - b.handicap)

    // Distribute residual strokes across games
    let lastUsedGame: 'firstGame' | 'secondGame' | 'thirdGame' | null = null
    let strokesAdded = 0

    while (strokesAdded < residualStrokes && remainingHoles.length > 0) {
      // Find the hole with the lowest handicap that's not in the last used game
      type GameHole = { hole: number; handicap: number; game: string; gameKey: 'firstGame' | 'secondGame' | 'thirdGame' }
      const validHoles: GameHole[] = lastUsedGame
        ? remainingHoles.filter((h) => h.gameKey !== lastUsedGame)
        : remainingHoles

      if (validHoles.length > 0) {
        // Take the hole with the lowest handicap
        const bestHole: GameHole = validHoles[0]
        const holeIndex = remainingHoles.indexOf(bestHole)

        const gameKey = bestHole.gameKey as 'firstGame' | 'secondGame' | 'thirdGame'
        result[gameKey].push(bestHole.hole)
        remainingHoles.splice(holeIndex, 1)
        lastUsedGame = bestHole.gameKey
        strokesAdded++
      } else if (remainingHoles.length > 0) {
        // If no valid holes in other games, reset lastUsedGame
        lastUsedGame = null
      } else {
        break
      }
    }
  }

  // Sort holes numerically within each game
  result.firstGame.sort((a, b) => a - b)
  result.secondGame.sort((a, b) => a - b)
  result.thirdGame.sort((a, b) => a - b)

  return result
}

// ============================================
// DOTS GAME STROKE DISTRIBUTION
// ============================================

/**
 * Distribute strokes for Dots game across all 18 holes
 * Uses hole handicap to determine which holes receive strokes
 * 
 * @param player - Player object
 * @param players - All players in the group
 * @param useDifferentialHandicap - Whether to use differential handicap
 * @param handicapFormat - Handicap format
 * @param courseData - Course data with hole handicaps
 * @param totalStrokes - Total strokes to distribute
 * @returns Array of hole numbers where player receives strokes
 */
export function distributeDotsStrokes(
  _player: Player,
  _players: Player[],
  _useDifferentialHandicap: boolean,
  _handicapFormat: HandicapFormat,
  courseData: Course,
  totalStrokes: number
): number[] {
  if (!courseData?.teeboxes?.[0]?.holes) {
    throw new Error('No course data available for stroke distribution')
  }

  const holes = courseData.teeboxes[0].holes

  return holes
    .map((hole, index) => ({ hole: index + 1, handicap: hole.handicap }))
    .sort((a, b) => a.handicap - b.handicap)
    .slice(0, totalStrokes)
    .map((h) => h.hole)
    .sort((a, b) => a - b)
}

// ============================================
// NINES & NASSAU STROKE DISTRIBUTION
// ============================================

/**
 * Distribute strokes for Nines or Nassau games (uses all 18 holes)
 * Same logic as Dots - uses hole handicap to determine stroke allocation
 * 
 * @param player - Player object
 * @param players - All players in the group
 * @param useDifferentialHandicap - Whether to use differential handicap
 * @param handicapFormat - Handicap format
 * @param courseData - Course data with hole handicaps
 * @param totalStrokes - Total strokes to distribute
 * @returns Array of hole numbers where player receives strokes
 */
export function distributeStrokesByHoleHandicap(
  player: Player,
  players: Player[],
  useDifferentialHandicap: boolean,
  handicapFormat: HandicapFormat,
  courseData: Course,
  totalStrokes: number
): number[] {
  // For Nines and Nassau, use the same distribution logic as Dots
  return distributeDotsStrokes(
    player,
    players,
    useDifferentialHandicap,
    handicapFormat,
    courseData,
    totalStrokes
  )
}

// ============================================
// IMMUTABLE FIELD PRESERVATION
// ============================================

/**
 * Helper function to preserve immutable player fields when updating
 * CRITICAL: Always use this when updating player data to preserve strokeHoles
 * 
 * @param player - Original player object
 * @param updates - Fields to update
 * @returns Updated player with strokeHoles preserved
 */
export function preserveImmutablePlayerFields(
  player: Player,
  updates: Partial<Player>
): Player {
  return {
    ...player,
    ...updates,
    strokeHoles: player.strokeHoles, // Explicitly preserve
  }
}

