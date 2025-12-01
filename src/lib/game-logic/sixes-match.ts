/**
 * Sixes Match Logic
 * 
 * Ported from: src/composables/useSixesMatch.js
 * 
 * This module handles all Sixes game calculations:
 * - Team formation for three games (Cart vs Cart, Cross-cart, Drivers vs Riders)
 * - Point calculation (1 or 2 points per hole)
 * - Net score calculation with stroke allocation
 * - Game result determination
 */

import type { Player, Course, Tournament } from '@/types'

// ============================================
// TEAM FORMATION
// ============================================

/**
 * Get teams for a specific Sixes game
 * Game 1: Cart partners (Cart1 vs Cart2)
 * Game 2: Cross-cart (Cart1 Driver + Cart2 Rider vs Cart2 Driver + Cart1 Rider)
 * Game 3: All Drivers vs All Riders
 * 
 * @param gameNumber - Game number (1, 2, or 3)
 * @param players - All players in the group
 * @returns Object with team1 and team2 arrays
 */
export function getTeamsForGame(
  gameNumber: 1 | 2 | 3,
  players: Player[]
): { team1: Player[]; team2: Player[] } {
  let team1: Player[] = []
  let team2: Player[] = []

  switch (gameNumber) {
    case 1: // Cart partners (Cart1 vs Cart2)
      team1 = players.filter((p) => p.cart === '1')
      team2 = players.filter((p) => p.cart === '2')
      break
    case 2: // Cross-cart: Cart1 Driver + Cart2 Rider vs Cart2 Driver + Cart1 Rider
      // Team 1: Cart1 Driver + Cart2 Rider
      team1 = players.filter(
        (p) =>
          (p.cart === '1' && p.position === 'driver') ||
          (p.cart === '2' && p.position === 'rider')
      )
      // Team 2: Cart2 Driver + Cart1 Rider
      team2 = players.filter(
        (p) =>
          (p.cart === '2' && p.position === 'driver') ||
          (p.cart === '1' && p.position === 'rider')
      )
      break
    case 3: // All Drivers vs All Riders
      team1 = players.filter((p) => p.position === 'driver')
      team2 = players.filter((p) => p.position === 'rider')
      break
  }

  return { team1, team2 }
}

/**
 * Get team names for display
 * @param gameNumber - Game number (1, 2, or 3)
 * @param players - All players in the group
 * @returns Formatted team names string
 */
export function getTeamNames(gameNumber: 1 | 2 | 3, players: Player[]): string {
  const { team1, team2 } = getTeamsForGame(gameNumber, players)
  const team1Names = team1.map((p) => p.shortName).join('/')
  const team2Names = team2.map((p) => p.shortName).join('/')
  return `${team1Names} vs ${team2Names}`
}

// ============================================
// HOLE RANGE CALCULATION
// ============================================

/**
 * Get the hole range for a specific game
 * @param gameNumber - Game number (1, 2, or 3)
 * @param startingTee - Starting hole (for shotgun starts)
 * @returns Object with startHole and endHole
 */
export function getGameHoleRange(
  gameNumber: 1 | 2 | 3,
  startingTee: number
): { startHole: number; endHole: number } {
  // Convert game number and starting tee to hole range
  const gameHoles = 6
  const startOffset = (gameNumber - 1) * gameHoles
  const startHole = ((startingTee - 1 + startOffset) % 18) + 1
  let endHole = startHole + gameHoles - 1

  // Handle wrap around for holes > 18
  if (endHole > 18) {
    endHole = endHole - 18
  }

  return { startHole, endHole }
}

/**
 * Determine which game a hole belongs to
 * @param hole - Hole number (1-18)
 * @param startingTee - Starting hole
 * @returns Game number (1, 2, or 3)
 */
export function getGameNumber(hole: number, startingTee: number): 1 | 2 | 3 {
  // Adjust hole number based on starting hole
  const adjustedHole = ((hole - startingTee + 18) % 18) + 1
  if (adjustedHole <= 6) return 1
  if (adjustedHole <= 12) return 2
  return 3
}

// ============================================
// SCORE CALCULATION
// ============================================

/**
 * Get net score for a player on a specific hole
 * @param player - Player object
 * @param hole - Hole number (1-18)
 * @param scores - Map of player scores
 * @param gameNumber - Game number for stroke lookup
 * @param course - Course data
 * @param tournament - Tournament data
 * @returns Net score (or 99 for DNF/no score)
 */
export function getNetScore(
  player: Player,
  hole: number,
  scores: Map<string, { score: (number | null)[]; dnf: boolean[] }>,
  gameNumber: 1 | 2 | 3,
  course: Course | undefined,
  tournament: Tournament | undefined
): number {
  const playerScores = scores.get(player.id)
  const grossScore = playerScores?.score[hole - 1]
  
  if (!grossScore || grossScore === 0 || playerScores?.dnf[hole - 1]) {
    return 99
  }

  // Check if player gets a stroke on this hole from their strokeHoles
  const gameKey = ['firstGame', 'secondGame', 'thirdGame'][gameNumber - 1] as
    | 'firstGame'
    | 'secondGame'
    | 'thirdGame'
  const getsStroke = player.strokeHoles?.sixes?.[gameKey]?.includes(hole)

  // If no stroke, return gross score
  if (!getsStroke) {
    return grossScore
  }

  // Check if this is a Par 3 hole and half-strokes are enabled
  const isPar3 = hole <= 18 && course?.teeboxes?.[0]?.holes[hole - 1]?.par === 3
  const useHalfStroke =
    isPar3 && tournament?.competitions?.skins?.useHalfStrokeOnPar3

  // Apply half-stroke for Par 3s if enabled, otherwise full stroke
  return grossScore - (useHalfStroke ? 0.5 : 1)
}

// ============================================
// POINT CALCULATION
// ============================================

export interface SixesHoleResult {
  team1: number
  team2: number
  details: {
    team1: {
      players: Array<{ player: string; gross: number; score: number }>
      lowest: number
      combined: number
    }
    team2: {
      players: Array<{ player: string; gross: number; score: number }>
      lowest: number
      combined: number
    }
    lowestWinner?: 'team1' | 'team2' | 'tie'
    combinedWinner?: 'team1' | 'team2' | 'tie'
    winner?: 'team1' | 'team2' | 'tie'
    winReason?: 'lowest' | 'combined'
  }
}

/**
 * Calculate points for a single hole in Sixes
 * @param team1Players - Team 1 players
 * @param team2Players - Team 2 players
 * @param hole - Hole number
 * @param scores - Map of player scores
 * @param gameNumber - Game number
 * @param use2PointsPerGame - Whether to use 2-point system
 * @param course - Course data
 * @param tournament - Tournament data
 * @returns Points object with team1, team2, and details
 */
export function calculatePoints(
  team1Players: Player[],
  team2Players: Player[],
  hole: number,
  scores: Map<string, { score: (number | null)[]; dnf: boolean[] }>,
  gameNumber: 1 | 2 | 3,
  use2PointsPerGame: boolean,
  course?: Course,
  tournament?: Tournament
): SixesHoleResult | null {
  // Safety check - ensure we have arrays
  if (!Array.isArray(team1Players) || !Array.isArray(team2Players)) {
    return null
  }

  // Get net scores
  const team1Scores = team1Players.map((p) => {
    const playerScores = scores.get(p.id)
    const grossScore = playerScores?.score[hole - 1] || 0
    const netScore = getNetScore(p, hole, scores, gameNumber, course, tournament)
    return {
      player: p.shortName || p.id,
      gross: grossScore,
      score: netScore,
    }
  })

  const team2Scores = team2Players.map((p) => {
    const playerScores = scores.get(p.id)
    const grossScore = playerScores?.score[hole - 1] || 0
    const netScore = getNetScore(p, hole, scores, gameNumber, course, tournament)
    return {
      player: p.shortName || p.id,
      gross: grossScore,
      score: netScore,
    }
  })

  // Get lowest individual scores
  const team1Lowest = Math.min(...team1Scores.map((p) => p.score))
  const team2Lowest = Math.min(...team2Scores.map((p) => p.score))

  // Get combined scores
  const team1Combined = team1Scores.reduce((a, b) => a + b.score, 0)
  const team2Combined = team2Scores.reduce((a, b) => a + b.score, 0)

  let team1Points = 0

  const details: SixesHoleResult['details'] = {
    team1: {
      players: team1Scores,
      lowest: team1Lowest,
      combined: team1Combined,
    },
    team2: {
      players: team2Scores,
      lowest: team2Lowest,
      combined: team2Combined,
    },
  }

  if (use2PointsPerGame) {
    // Individual low score point
    if (team1Lowest < team2Lowest) {
      team1Points += 1
      details.lowestWinner = 'team1'
    } else if (team2Lowest < team1Lowest) {
      team1Points -= 1
      details.lowestWinner = 'team2'
    } else {
      details.lowestWinner = 'tie'
    }

    // Combined score point
    if (team1Combined < team2Combined) {
      team1Points += 1
      details.combinedWinner = 'team1'
    } else if (team2Combined < team1Combined) {
      team1Points -= 1
      details.combinedWinner = 'team2'
    } else {
      details.combinedWinner = 'tie'
    }
  } else {
    // Only one point available
    if (team1Lowest < team2Lowest) {
      team1Points = 1
      details.winner = 'team1'
      details.winReason = 'lowest'
    } else if (team2Lowest < team1Lowest) {
      team1Points = -1
      details.winner = 'team2'
      details.winReason = 'lowest'
    } else {
      // Tied individual scores, check combined
      if (team1Combined < team2Combined) {
        team1Points = 1
        details.winner = 'team1'
        details.winReason = 'combined'
      } else if (team2Combined < team1Combined) {
        team1Points = -1
        details.winner = 'team2'
        details.winReason = 'combined'
      } else {
        details.winner = 'tie'
      }
    }
  }

  return {
    team1: team1Points,
    team2: -team1Points,
    details,
  }
}

/**
 * Calculate game result (who won the game)
 * @param team1Players - Team 1 players
 * @param team2Players - Team 2 players
 * @param startHole - First hole of game
 * @param endHole - Last hole of game
 * @param scores - Map of player scores
 * @param gameNumber - Game number
 * @param course - Course data
 * @param tournament - Tournament data
 * @returns 1 for team1 win, -1 for team2 win, 0 for tie
 */
export function calculateGameResult(
  team1Players: Player[],
  team2Players: Player[],
  startHole: number,
  endHole: number,
  scores: Map<string, { score: (number | null)[]; dnf: boolean[] }>,
  gameNumber: 1 | 2 | 3,
  course?: Course,
  tournament?: Tournament
): number {
  let team1Total = 0
  let team2Total = 0

  // Handle wrap-around case (when endHole < startHole)
  const isWrapped = endHole < startHole

  // Calculate total points for each hole in this game
  if (isWrapped) {
    // First part: startHole to 18
    for (let hole = startHole; hole <= 18; hole++) {
      const result = calculatePoints(
        team1Players,
        team2Players,
        hole,
        scores,
        gameNumber,
        true, // use2PointsPerGame
        course,
        tournament
      )

      if (result) {
        team1Total += result.team1
        team2Total += result.team2
      }
    }

    // Second part: 1 to endHole
    for (let hole = 1; hole <= endHole; hole++) {
      const result = calculatePoints(
        team1Players,
        team2Players,
        hole,
        scores,
        gameNumber,
        true, // use2PointsPerGame
        course,
        tournament
      )

      if (result) {
        team1Total += result.team1
        team2Total += result.team2
      }
    }
  } else {
    // Normal case: startHole to endHole
    for (let hole = startHole; hole <= endHole; hole++) {
      const result = calculatePoints(
        team1Players,
        team2Players,
        hole,
        scores,
        gameNumber,
        true, // use2PointsPerGame
        course,
        tournament
      )

      if (result) {
        team1Total += result.team1
        team2Total += result.team2
      }
    }
  }

  // Return 1 for team1 win, -1 for team2 win, 0 for tie
  if (team1Total > team2Total) return 1
  if (team2Total > team1Total) return -1
  return 0
}

