/**
 * Nines Match Logic
 * 
 * Ported from: src/composables/useNinesMatch.js
 * 
 * This module handles all Nines game calculations:
 * - Point distribution (9 points total per hole)
 * - Scoring: 5-3-1, 4-4-1, 3-3-3, etc. based on net scores
 * - DNF handling (DNF players get 1 point)
 * - Stroke application with half-strokes on Par 3s
 */

import type { Player, Course, Tournament } from '@/types'

// ============================================
// POINT CALCULATION
// ============================================

interface PlayerResult {
  playerId: string
  net: number
  isDNF: boolean
}

export interface NinesPointResult {
  playerId: string
  points: number
}

/**
 * Calculate points for active (non-DNF) players
 * @param players - Array of player results
 * @param totalPoints - Total points to distribute (usually 9, or 9 minus DNF count)
 * @returns Array of point allocations
 */
function calculatePointsForActivePlayers(
  players: PlayerResult[],
  totalPoints: number
): NinesPointResult[] {
  // Sort players by net score (ascending = better score)
  const sortedPlayers = [...players].sort((a, b) => a.net - b.net)

  // Group players by their net scores
  const scoreGroups: PlayerResult[][] = []
  let currentGroup = [sortedPlayers[0]]

  for (let i = 1; i < sortedPlayers.length; i++) {
    if (sortedPlayers[i].net === currentGroup[0].net) {
      // Same score, add to current group
      currentGroup.push(sortedPlayers[i])
    } else {
      // Different score, start a new group
      scoreGroups.push(currentGroup)
      currentGroup = [sortedPlayers[i]]
    }
  }
  scoreGroups.push(currentGroup)

  // Calculate points based on the number of score groups
  if (scoreGroups.length === 1) {
    // All players tied - split points evenly
    const pointsEach = Math.floor(totalPoints / players.length)
    return players.map((player) => ({
      playerId: player.playerId,
      points: pointsEach,
    }))
  } else if (scoreGroups.length === 2) {
    // Two different scores - handle special cases
    const bestGroup = scoreGroups[0]
    const worstGroup = scoreGroups[1]

    if (bestGroup.length === 1) {
      // One player has best score (5 points), others split remaining
      const bestPlayer = bestGroup[0]
      const remainingPoints = totalPoints - 5
      const pointsEach = Math.floor(remainingPoints / worstGroup.length)

      return players.map((player) => ({
        playerId: player.playerId,
        points: player.playerId === bestPlayer.playerId ? 5 : pointsEach,
      }))
    } else if (bestGroup.length === 2 && worstGroup.length === 1) {
      // Two players tied for best, one worst
      // Best players get 4 points each, worst gets 1
      const bestPlayerIds = bestGroup.map((p) => p.playerId)

      return players.map((player) => ({
        playerId: player.playerId,
        points: bestPlayerIds.includes(player.playerId) ? 4 : 1,
      }))
    } else {
      // Other scenarios with two score groups
      // Distribute points based on group sizes
      const bestPoints = Math.floor(
        (totalPoints - worstGroup.length) / bestGroup.length
      )

      return players.map((player) => {
        const isInBestGroup = bestGroup.some((p) => p.playerId === player.playerId)
        return {
          playerId: player.playerId,
          points: isInBestGroup ? bestPoints : 1,
        }
      })
    }
  } else {
    // Three different scores (5-3-1 distribution)
    const bestPlayer = scoreGroups[0][0]
    const middlePlayer = scoreGroups[1][0]

    return players.map((player) => {
      if (player.playerId === bestPlayer.playerId)
        return { playerId: player.playerId, points: 5 }
      if (player.playerId === middlePlayer.playerId)
        return { playerId: player.playerId, points: 3 }
      return { playerId: player.playerId, points: 1 }
    })
  }
}

/**
 * Calculate Nines points for a hole
 * @param players - Array of players
 * @param scores - Map of player scores
 * @param hole - Hole index (0-based)
 * @param course - Course data
 * @param tournament - Tournament data
 * @returns Array of point allocations or null if not all scores entered
 */
export function calculatePoints(
  players: Player[],
  scores: Map<string, { score: (number | null)[]; dnf: boolean[] }>,
  hole: number,
  course?: Course,
  tournament?: Tournament
): NinesPointResult[] | null {
  // Validate input parameters
  if (!players?.length || !scores || hole === undefined) {
    return null
  }

  // Get net scores and DNF status for all players
  const playerResults: (PlayerResult | null)[] = players.map((player) => {
    if (!player?.id) {
      return null
    }

    // scores is a Map, so we need to use .get()
    const playerScores = scores.get(player.id)
    if (!playerScores?.score) {
      return null
    }

    const score = playerScores.score[hole]
    const isDNF = playerScores.dnf?.[hole] === true

    // Don't calculate points if any player hasn't entered a score
    if (score === null || score === undefined) {
      return null
    }

    // Check if player gets a stroke on this hole using strokeHoles.nines array
    // Adjust hole number since strokeHoles is 1-based but our hole param is 0-based
    const strokeHole = hole + 1
    const hasStroke = player.strokeHoles?.nines?.includes(strokeHole) ?? false

    // Check if this is a Par 3 hole and half-strokes are enabled
    const isPar3 = course?.teeboxes?.[0]?.holes?.[hole]?.par === 3
    const useHalfStroke =
      isPar3 && tournament?.competitions?.skins?.useHalfStrokeOnPar3

    // Apply half-stroke for Par 3s if enabled, otherwise full stroke
    const strokes = hasStroke ? (useHalfStroke ? 0.5 : 1) : 0
    const net = isDNF ? Infinity : score - strokes // Apply strokes to get net score

    return {
      playerId: player.id,
      net: net,
      isDNF: isDNF,
    }
  })

  // Remove any null results
  const validResults = playerResults.filter((r): r is PlayerResult => r !== null)

  // If we don't have scores for all players, return null
  if (validResults.length !== players.length) {
    return null
  }

  // Handle DNF players first - they get 1 point
  const dnfPlayers = validResults.filter((r) => r.isDNF)
  const activePlayers = validResults.filter((r) => !r.isDNF)

  // If all players DNF, everyone gets 1 point
  if (dnfPlayers.length === players.length) {
    return players.map((player) => ({
      playerId: player.id,
      points: 1,
    }))
  }

  // If some players DNF, calculate points for active players and assign 1 point to DNF players
  if (dnfPlayers.length > 0) {
    const activeResults = calculatePointsForActivePlayers(
      activePlayers,
      9 - dnfPlayers.length
    )

    return [
      ...activeResults,
      ...dnfPlayers.map((player) => ({
        playerId: player.playerId,
        points: 1,
      })),
    ]
  }

  // No DNF players, calculate points normally using net scores
  return calculatePointsForActivePlayers(validResults, 9)
}

