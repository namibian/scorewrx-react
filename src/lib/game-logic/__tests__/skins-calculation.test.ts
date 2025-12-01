/**
 * Skins Calculation Tests
 */

import { describe, it, expect } from 'vitest'
import {
  calculatePotSize,
  calculatePotStats,
  calculateSkinValues,
  distributeSkinValues,
  calculateHandicapNetScore,
  calculatePoolSkins,
} from '../skins-calculation'
import type { Player, Course } from '@/types'

describe('Skins Calculation', () => {
  describe('calculatePotSize', () => {
    it('should calculate pot from participants', () => {
      const participants = [
        { playerId: 'p1', firstName: 'Test', lastName: 'One' },
        { playerId: 'p2', firstName: 'Test', lastName: 'Two' },
        { playerId: 'p3', firstName: 'Test', lastName: 'Three' },
      ]
      expect(calculatePotSize(participants, 5)).toBe(15)
    })

    it('should use manual pot when enabled', () => {
      const participants = [
        { playerId: 'p1', firstName: 'Test', lastName: 'One' },
      ]
      const manualPot = { enabled: true, amount: 100 }
      expect(calculatePotSize(participants, 5, manualPot)).toBe(100)
    })

    it('should calculate normally when manual pot disabled', () => {
      const participants = [
        { playerId: 'p1', firstName: 'Test', lastName: 'One' },
        { playerId: 'p2', firstName: 'Test', lastName: 'Two' },
      ]
      const manualPot = { enabled: false, amount: 100 }
      expect(calculatePotSize(participants, 5, manualPot)).toBe(10)
    })
  })

  describe('calculatePotStats', () => {
    it('should calculate stats correctly', () => {
      const stats = calculatePotStats(100, 7)
      expect(stats.totalSkins).toBe(7)
      expect(stats.baseSkinValue).toBe(14)
      expect(stats.residualAmount).toBe(2)
    })

    it('should handle 0 skins', () => {
      const stats = calculatePotStats(100, 0)
      expect(stats.totalSkins).toBe(0)
      expect(stats.baseSkinValue).toBe(0)
      expect(stats.residualAmount).toBe(0)
    })
  })

  describe('calculateSkinValues', () => {
    it('should distribute residual by upgrading skins', () => {
      const values = calculateSkinValues(100, 7)
      // Base value is 14, residual is 2
      // So 2 skins get upgraded to 15, rest stay at 14
      expect(values.filter((v) => v === 15)).toHaveLength(2)
      expect(values.filter((v) => v === 14)).toHaveLength(5)
    })

    it('should sort values high to low', () => {
      const values = calculateSkinValues(100, 7)
      const sorted = [...values].sort((a, b) => b - a)
      expect(values).toEqual(sorted)
    })

    it('should handle no residual', () => {
      const values = calculateSkinValues(100, 10)
      expect(values.every((v) => v === 10)).toBe(true)
    })
  })

  describe('distributeSkinValues', () => {
    it('should give higher-value skins to players with fewer skins', () => {
      const players = [
        { playerId: 'p1', skinCount: 1 },
        { playerId: 'p2', skinCount: 3 },
      ]
      const skinValues = [16, 15, 15, 14] // $60 total

      const earnings = distributeSkinValues(players, skinValues)
      
      // Player with 1 skin should get the highest value (16)
      expect(earnings.get('p1')).toBe(16)
      // Player with 3 skins should get the remaining values (15+15+14=44)
      expect(earnings.get('p2')).toBe(44)
    })

    it('should distribute evenly when skin counts are equal', () => {
      const players = [
        { playerId: 'p1', skinCount: 2 },
        { playerId: 'p2', skinCount: 2 },
      ]
      const skinValues = [16, 15, 15, 14] // $60 total

      const earnings = distributeSkinValues(players, skinValues)
      
      // Players with same count get alternating values
      // p1 gets 16+15=31, p2 gets 15+14=29 (or vice versa)
      const total = earnings.get('p1')! + earnings.get('p2')!
      expect(total).toBe(60) // Total should be 60
    })
  })

  describe('calculateHandicapNetScore', () => {
    it('should apply full stroke when differential >= hole handicap', () => {
      const result = calculateHandicapNetScore(5, 10, 5, 3, 4, false)
      // Adjusted handicap: 10-5=5, hole hdcp: 3, so gets stroke
      expect(result).toBe(4)
    })

    it('should apply half-stroke on Par 3 when enabled', () => {
      const result = calculateHandicapNetScore(5, 10, 5, 3, 3, true)
      // Par 3 with half-strokes enabled
      expect(result).toBe(4.5)
    })

    it('should not apply stroke when differential < hole handicap', () => {
      const result = calculateHandicapNetScore(5, 10, 5, 8, 4, false)
      // Adjusted handicap: 10-5=5, hole hdcp: 8, so no stroke
      expect(result).toBe(5)
    })
  })

  describe('calculatePoolSkins', () => {
    const createMockPlayer = (
      id: string,
      scores: (number | null)[],
      dnf: boolean[] = Array(18).fill(false)
    ): Player =>
      ({
        id,
        firstName: 'Test',
        lastName: 'Player',
        shortName: id,
        tournamentHandicap: 10,
        score: scores,
        dnf,
      }) as Player

    const mockCourse: Course = {
      teeboxes: [
        {
          name: 'Test Tees',
          holes: Array(18)
            .fill(null)
            .map((_, i) => ({
              par: 4 as 3 | 4 | 5,
              handicap: i + 1,
            })),
        },
      ],
    } as Course

    it('should identify scratch skins', () => {
      const players = [
        createMockPlayer('p1', [3, 4, 4, ...Array(15).fill(null)]),
        createMockPlayer('p2', [4, 3, 4, ...Array(15).fill(null)]),
        createMockPlayer('p3', [5, 5, 4, ...Array(15).fill(null)]),
      ]

      const skins = calculatePoolSkins(players, mockCourse, false, false)

      // p1 wins hole 1 (3 < 4,5)
      expect(skins.p1).toBeTruthy()
      expect(skins.p1.some((s) => s.hole === 1)).toBe(true)

      // p2 wins hole 2 (3 < 4,5)
      expect(skins.p2).toBeTruthy()
      expect(skins.p2.some((s) => s.hole === 2)).toBe(true)

      // No winner on hole 3 (all tied at 4)
      const hole3Winners = Object.values(skins).filter((s) =>
        s.some((skin) => skin.hole === 3)
      )
      expect(hole3Winners).toHaveLength(0)
    })

    it('should skip holes with no scores', () => {
      const players = [
        createMockPlayer('p1', [null, ...Array(17).fill(null)]),
        createMockPlayer('p2', [null, ...Array(17).fill(null)]),
      ]

      const skins = calculatePoolSkins(players, mockCourse, false, false)
      expect(Object.keys(skins)).toHaveLength(0)
    })

    it('should skip holes with DNF', () => {
      const players = [
        createMockPlayer('p1', [3, ...Array(17).fill(null)], [
          true,
          ...Array(17).fill(false),
        ]),
        createMockPlayer('p2', [4, ...Array(17).fill(null)]),
      ]

      const skins = calculatePoolSkins(players, mockCourse, false, false)
      // p1 is DNF, but p2 still gets a skin since they're the only one with a valid score
      expect(Object.keys(skins)).toHaveLength(1)
      expect(skins.p2).toBeTruthy()
    })
  })
})

