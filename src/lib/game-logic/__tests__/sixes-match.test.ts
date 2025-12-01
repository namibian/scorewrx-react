/**
 * Sixes Match Tests
 */

import { describe, it, expect } from 'vitest'
import {
  getTeamsForGame,
  getGameHoleRange,
  getGameNumber,
  calculatePoints,
} from '../sixes-match'
import type { Player } from '@/types'

// Mock data helpers
const createMockPlayer = (
  id: string,
  cart: '1' | '2',
  position: 'driver' | 'rider',
  strokeHoles?: any
): Player => ({
  id,
  firstName: 'Test',
  lastName: 'Player',
  shortName: id,
  cart,
  position,
  tournamentHandicap: 10,
  handicapIndex: 10,
  score: Array(18).fill(null),
  dots: Array(18).fill(0),
  dnf: Array(18).fill(false),
  greenies: [],
  sandies: [],
  skinsPool: 'None',
  affiliation: 'Test',
  strokeHoles,
})

describe('Sixes Match', () => {
  describe('getTeamsForGame', () => {
    const players = [
      createMockPlayer('p1', '1', 'driver'),
      createMockPlayer('p2', '1', 'rider'),
      createMockPlayer('p3', '2', 'driver'),
      createMockPlayer('p4', '2', 'rider'),
    ]

    it('should form cart teams for game 1', () => {
      const { team1, team2 } = getTeamsForGame(1, players)
      expect(team1.map((p) => p.id)).toEqual(['p1', 'p2'])
      expect(team2.map((p) => p.id)).toEqual(['p3', 'p4'])
    })

    it('should form cross-cart teams for game 2', () => {
      const { team1, team2 } = getTeamsForGame(2, players)
      expect(team1.map((p) => p.id).sort()).toEqual(['p1', 'p4'].sort())
      expect(team2.map((p) => p.id).sort()).toEqual(['p2', 'p3'].sort())
    })

    it('should form position teams for game 3', () => {
      const { team1, team2 } = getTeamsForGame(3, players)
      expect(team1.map((p) => p.id)).toEqual(['p1', 'p3'])
      expect(team2.map((p) => p.id)).toEqual(['p2', 'p4'])
    })
  })

  describe('getGameHoleRange', () => {
    it('should return correct range for game 1 from tee 1', () => {
      const { startHole, endHole } = getGameHoleRange(1, 1)
      expect(startHole).toBe(1)
      expect(endHole).toBe(6)
    })

    it('should return correct range for game 2 from tee 1', () => {
      const { startHole, endHole } = getGameHoleRange(2, 1)
      expect(startHole).toBe(7)
      expect(endHole).toBe(12)
    })

    it('should handle wrap-around for shotgun start', () => {
      const { startHole, endHole } = getGameHoleRange(1, 16)
      expect(startHole).toBe(16)
      expect(endHole).toBe(3) // Wraps around
    })
  })

  describe('getGameNumber', () => {
    it('should identify game 1 holes', () => {
      expect(getGameNumber(1, 1)).toBe(1)
      expect(getGameNumber(6, 1)).toBe(1)
    })

    it('should identify game 2 holes', () => {
      expect(getGameNumber(7, 1)).toBe(2)
      expect(getGameNumber(12, 1)).toBe(2)
    })

    it('should identify game 3 holes', () => {
      expect(getGameNumber(13, 1)).toBe(3)
      expect(getGameNumber(18, 1)).toBe(3)
    })
  })

  describe('calculatePoints', () => {
    const players = [
      createMockPlayer('p1', '1', 'driver', {
        sixes: { firstGame: [1], secondGame: [], thirdGame: [] },
      }),
      createMockPlayer('p2', '1', 'rider'),
      createMockPlayer('p3', '2', 'driver'),
      createMockPlayer('p4', '2', 'rider'),
    ]

    const scores = new Map([
      ['p1', { score: [4, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
      ['p2', { score: [5, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
      ['p3', { score: [4, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
      ['p4', { score: [5, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
    ])

    it('should calculate points for a hole', () => {
      const { team1, team2 } = getTeamsForGame(1, players)
      const result = calculatePoints(team1, team2, 1, scores, 1, true)

      expect(result).toBeTruthy()
      expect(result!.team1).toBeDefined()
      expect(result!.team2).toBeDefined()
    })
  })
})

