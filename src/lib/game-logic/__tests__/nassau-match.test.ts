/**
 * Nassau Match Tests
 */

import { describe, it, expect } from 'vitest'
import {
  calculateMatchStanding,
  getMatchStandings,
} from '../nassau-match'
import type { Player } from '@/types'

const createMockPlayer = (id: string): Player =>
  ({
    id,
    firstName: 'Test',
    lastName: 'Player',
    shortName: id,
    tournamentHandicap: 10,
    handicapIndex: 10,
    score: Array(18).fill(null),
    dots: Array(18).fill(0),
    dnf: Array(18).fill(false),
    greenies: [],
    sandies: [],
    skinsPool: 'None',
    affiliation: 'Test',
  }) as Player

describe('Nassau Match', () => {
  describe('calculateMatchStanding', () => {
    const player1 = createMockPlayer('p1')
    const player2 = createMockPlayer('p2')

    it('should calculate match standing correctly', () => {
      const scores = new Map([
        [
          'p1',
          { score: [4, 5, 3, ...Array(15).fill(null)], dnf: Array(18).fill(false) },
        ],
        [
          'p2',
          { score: [5, 4, 3, ...Array(15).fill(null)], dnf: Array(18).fill(false) },
        ],
      ])

      const getNetScore = (playerId: string, hole: number) => {
        return scores.get(playerId)!.score[hole - 1]!
      }

      const standing = calculateMatchStanding(
        player1,
        player2,
        scores,
        1,
        3,
        getNetScore
      )

      // Hole 1: p1 wins (4<5), standing = +1
      // Hole 2: p2 wins (4<5), standing = 0
      // Hole 3: tied (3=3), standing = 0
      expect(standing).toBe(0)
    })

    it('should handle player1 being up', () => {
      const scores = new Map([
        [
          'p1',
          { score: [3, 3, 3, ...Array(15).fill(null)], dnf: Array(18).fill(false) },
        ],
        [
          'p2',
          { score: [4, 4, 4, ...Array(15).fill(null)], dnf: Array(18).fill(false) },
        ],
      ])

      const getNetScore = (playerId: string, hole: number) => {
        return scores.get(playerId)!.score[hole - 1]!
      }

      const standing = calculateMatchStanding(
        player1,
        player2,
        scores,
        1,
        3,
        getNetScore
      )

      expect(standing).toBe(3) // p1 up 3
    })

    it('should skip holes with DNF', () => {
      const scores = new Map([
        [
          'p1',
          { score: [3, 3, ...Array(16).fill(null)], dnf: [true, false, ...Array(16).fill(false)] },
        ],
        [
          'p2',
          { score: [4, 4, ...Array(16).fill(null)], dnf: Array(18).fill(false) },
        ],
      ])

      const getNetScore = (playerId: string, hole: number) => {
        const playerScores = scores.get(playerId)!
        if (playerScores.dnf[hole - 1]) return null
        return playerScores.score[hole - 1]!
      }

      const standing = calculateMatchStanding(
        player1,
        player2,
        scores,
        1,
        2,
        getNetScore
      )

      // Hole 1 skipped (DNF), Hole 2: p1 wins
      expect(standing).toBe(1)
    })
  })

  describe('getMatchStandings', () => {
    const player1 = createMockPlayer('p1')
    const player2 = createMockPlayer('p2')

    it('should calculate front, back, and overall', () => {
      const scores = new Map([
        [
          'p1',
          {
            score: [
              // Front 9: p1 wins all
              3, 3, 3, 3, 3, 3, 3, 3, 3,
              // Back 9: p2 wins all
              5, 5, 5, 5, 5, 5, 5, 5, 5,
            ],
            dnf: Array(18).fill(false),
          },
        ],
        [
          'p2',
          {
            score: [
              // Front 9: p2 loses all
              4, 4, 4, 4, 4, 4, 4, 4, 4,
              // Back 9: p2 wins all
              4, 4, 4, 4, 4, 4, 4, 4, 4,
            ],
            dnf: Array(18).fill(false),
          },
        ],
      ])

      const getNetScore = (playerId: string, hole: number) => {
        return scores.get(playerId)!.score[hole - 1]!
      }

      const standings = getMatchStandings(
        player1,
        player2,
        scores,
        'all',
        getNetScore
      )

      expect(standings.front).toBe(9) // p1 up 9 on front
      expect(standings.back).toBe(-9) // p2 up 9 on back
      expect(standings.overall).toBe(0) // Tied overall
    })

    it('should calculate frontback match type', () => {
      const scores = new Map([
        ['p1', { score: Array(18).fill(3), dnf: Array(18).fill(false) }],
        ['p2', { score: Array(18).fill(4), dnf: Array(18).fill(false) }],
      ])

      const getNetScore = (playerId: string, hole: number) => {
        return scores.get(playerId)!.score[hole - 1]!
      }

      const standings = getMatchStandings(
        player1,
        player2,
        scores,
        'frontback',
        getNetScore
      )

      expect(standings.front).toBe(9)
      expect(standings.back).toBe(9)
      expect(standings.overall).toBe(18) // Sum of front and back
    })
  })
})

