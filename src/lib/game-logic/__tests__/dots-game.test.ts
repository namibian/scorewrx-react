/**
 * Dots Game Tests
 */

import { describe, it, expect } from 'vitest'
import {
  calculateDots,
  getEligiblePlayersForGreenie,
  validateDotsEntry,
  getMaxScore,
} from '../dots-game'
import type { Player } from '@/types'

describe('Dots Game', () => {
  describe('calculateDots', () => {
    it('should calculate dots for birdie', () => {
      expect(calculateDots(3, 4, false, false, false)).toBe(1)
    })

    it('should calculate dots for eagle', () => {
      expect(calculateDots(3, 5, false, false, false)).toBe(2)
    })

    it('should return 0 for over par', () => {
      expect(calculateDots(5, 4, false, false, false)).toBe(0)
    })

    it('should add 1 for greenie', () => {
      expect(calculateDots(3, 3, true, false, false)).toBe(1)
    })

    it('should add 1 for sandy', () => {
      expect(calculateDots(4, 4, false, true, false)).toBe(1)
    })

    it('should add greenie and sandy together', () => {
      expect(calculateDots(3, 5, true, true, false)).toBe(4) // 2 + 1 + 1
    })

    it('should add carry-over to greenie', () => {
      expect(calculateDots(3, 3, true, false, false, 2)).toBe(3) // 0 + 1 + 2
    })

    it('should return 0 for DNF', () => {
      expect(calculateDots(10, 4, true, true, true)).toBe(0)
    })

    it('should return 0 for null score', () => {
      expect(calculateDots(null, 4, false, false, false)).toBe(0)
    })
  })

  describe('validateDotsEntry', () => {
    it('should not allow greenie when score > par', () => {
      const result = validateDotsEntry(5, 4, true, false)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Greenie')
    })

    it('should not allow sandy when score > par', () => {
      const result = validateDotsEntry(5, 4, false, true)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Sandy')
    })

    it('should not allow both greenie and sandy on Par 3', () => {
      const result = validateDotsEntry(3, 3, true, true)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('both')
    })

    it('should allow greenie at par or better', () => {
      const result = validateDotsEntry(3, 4, true, false)
      expect(result.isValid).toBe(true)
    })

    it('should allow both greenie and sandy on non-Par 3', () => {
      const result = validateDotsEntry(4, 5, true, true)
      expect(result.isValid).toBe(true)
    })
  })

  describe('getMaxScore', () => {
    it('should calculate max score based on handicap', () => {
      const result = getMaxScore(4, 18, 1)
      // Par 4 + 2 + (1 base stroke) = 7
      expect(result).toBe(7)
    })

    it('should handle player with 0 handicap', () => {
      const result = getMaxScore(4, 0, 1)
      // Par 4 + 2 = 6
      expect(result).toBe(6)
    })
  })

  describe('getEligiblePlayersForGreenie', () => {
    const players: Player[] = [
      {
        id: 'p1',
        firstName: 'Player',
        lastName: 'One',
        shortName: 'P1',
      } as Player,
      {
        id: 'p2',
        firstName: 'Player',
        lastName: 'Two',
        shortName: 'P2',
      } as Player,
      {
        id: 'p3',
        firstName: 'Player',
        lastName: 'Three',
        shortName: 'P3',
      } as Player,
    ]

    it('should include players with score 3 or better', () => {
      const scores = new Map([
        ['p1', { score: [2, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
        ['p2', { score: [3, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
        ['p3', { score: [4, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
      ])

      const eligible = getEligiblePlayersForGreenie(players, 0, scores)
      expect(eligible).toHaveLength(2)
      expect(eligible.map((p) => p.id)).toEqual(['p1', 'p2'])
    })

    it('should exclude DNF players', () => {
      const scores = new Map([
        ['p1', { score: [2, ...Array(17).fill(null)], dnf: [true, ...Array(17).fill(false)] }],
        ['p2', { score: [3, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
      ])

      const eligible = getEligiblePlayersForGreenie(
        [players[0], players[1]],
        0,
        scores
      )
      expect(eligible).toHaveLength(1)
      expect(eligible[0].id).toBe('p2')
    })
  })
})

