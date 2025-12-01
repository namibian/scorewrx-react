/**
 * Stroke Calculation Tests
 * 
 * Tests for all stroke calculation functions
 */

import { describe, it, expect } from 'vitest'
import {
  calculatePlayerHandicap,
  getLowestHandicap,
  capStrokes,
  calculateTotalStrokes,
  distributeSixesGameStrokes,
  distributeDotsStrokes,
  preserveImmutablePlayerFields,
} from '../stroke-calculation'
import type { Player, Course } from '@/types'

// Mock data
const createMockPlayer = (
  id: string,
  tournamentHandicap: number
): Partial<Player> => ({
  id,
  firstName: 'Test',
  lastName: 'Player',
  shortName: id,
  tournamentHandicap,
  handicapIndex: tournamentHandicap,
  score: Array(18).fill(null),
  dots: Array(18).fill(0),
  dnf: Array(18).fill(false),
  greenies: [],
  sandies: [],
  skinsPool: 'None',
  affiliation: 'Test',
})

const createMockCourse = (): Course => ({
  id: 'test-course',
  name: 'Test Course',
  affiliation: 'Test',
  location: 'Test Location',
  description: 'Test course description',
  createdBy: 'test-user',
  createdAt: new Date(),
  lastUpdated: new Date(),
  teeboxes: [
    {
      name: 'Test Tees',
      rating: 72.0,
      slope: 113,
      holes: Array(18)
        .fill(null)
        .map((_, i) => ({
          par: (i % 9 < 3 ? 4 : i % 9 < 7 ? 5 : 3) as 3 | 4 | 5,
          handicap: ((i * 2) % 18) + 1, // Distribute handicaps 1-18
        })),
    },
  ],
})

describe('Stroke Calculation', () => {
  describe('calculatePlayerHandicap', () => {
    it('should return floor for Custom format', () => {
      const player = createMockPlayer('p1', 15.8) as Player
      expect(calculatePlayerHandicap(player, 'Custom')).toBe(15)
    })

    it('should return exact value for Standard format', () => {
      const player = createMockPlayer('p1', 15.8) as Player
      expect(calculatePlayerHandicap(player, 'Standard')).toBe(15.8)
    })

    it('should return 0 for undefined player', () => {
      expect(calculatePlayerHandicap(undefined, 'Standard')).toBe(0)
    })
  })

  describe('getLowestHandicap', () => {
    it('should return lowest handicap from group', () => {
      const players = [
        createMockPlayer('p1', 10),
        createMockPlayer('p2', 5),
        createMockPlayer('p3', 15),
      ] as Player[]
      expect(getLowestHandicap(players, 'Standard')).toBe(5)
    })

    it('should apply format when finding lowest', () => {
      const players = [
        createMockPlayer('p1', 10.8),
        createMockPlayer('p2', 11.2),
      ] as Player[]
      expect(getLowestHandicap(players, 'Custom')).toBe(10)
    })
  })

  describe('capStrokes', () => {
    it('should cap strokes at MAX_STROKES (18)', () => {
      expect(capStrokes(20)).toBe(18)
    })

    it('should not allow negative strokes', () => {
      expect(capStrokes(-5)).toBe(0)
    })

    it('should allow valid stroke values', () => {
      expect(capStrokes(10)).toBe(10)
    })
  })

  describe('calculateTotalStrokes', () => {
    it('should calculate differential strokes', () => {
      const players = [
        createMockPlayer('p1', 15),
        createMockPlayer('p2', 5),
        createMockPlayer('p3', 10),
      ] as Player[]
      const player1 = players[0]
      
      // Player with 15 handicap gets 15-5=10 strokes
      expect(calculateTotalStrokes(player1, players, true, 'Standard')).toBe(10)
    })

    it('should calculate non-differential strokes', () => {
      const players = [
        createMockPlayer('p1', 15),
        createMockPlayer('p2', 5),
      ] as Player[]
      const player1 = players[0]
      
      // Player gets their full handicap
      expect(calculateTotalStrokes(player1, players, false, 'Standard')).toBe(15)
    })

    it('should apply format when calculating strokes', () => {
      const players = [
        createMockPlayer('p1', 15.8),
        createMockPlayer('p2', 5.3),
      ] as Player[]
      const player1 = players[0]
      
      // Custom format: floor(15.8) - floor(5.3) = 15 - 5 = 10
      expect(calculateTotalStrokes(player1, players, true, 'Custom')).toBe(10)
      
      // Standard format: 15.8 - 5.3 = 10.5, then floor = 10
      expect(calculateTotalStrokes(player1, players, true, 'Standard')).toBe(10)
    })
  })

  describe('distributeSixesGameStrokes', () => {
    const course = createMockCourse()
    const players = [
      createMockPlayer('p1', 12),
      createMockPlayer('p2', 6),
    ] as Player[]

    it('should distribute strokes across three games', () => {
      const result = distributeSixesGameStrokes(
        players[0],
        players,
        true,
        'Standard',
        course,
        1,
        6
      )

      expect(result.firstGame).toHaveLength(2)
      expect(result.secondGame).toHaveLength(2)
      expect(result.thirdGame).toHaveLength(2)
      expect(result.firstGame.length + result.secondGame.length + result.thirdGame.length).toBe(6)
    })

    it('should handle uneven stroke distribution', () => {
      const result = distributeSixesGameStrokes(
        players[0],
        players,
        true,
        'Standard',
        course,
        1,
        7
      )

      const totalStrokes = result.firstGame.length + result.secondGame.length + result.thirdGame.length
      expect(totalStrokes).toBe(7)
    })

    it('should handle shotgun starts', () => {
      const result = distributeSixesGameStrokes(
        players[0],
        players,
        true,
        'Standard',
        course,
        10, // Start at hole 10
        6
      )

      // Should still get 6 total strokes distributed across games
      const totalStrokes = result.firstGame.length + result.secondGame.length + result.thirdGame.length
      expect(totalStrokes).toBe(6)
      
      // Games should wrap around course
      expect(result.firstGame.every(h => h >= 1 && h <= 18)).toBe(true)
    })
  })

  describe('distributeDotsStrokes', () => {
    const course = createMockCourse()
    const players = [createMockPlayer('p1', 9)] as Player[]

    it('should distribute strokes by hole handicap', () => {
      const result = distributeDotsStrokes(
        players[0],
        players,
        false,
        'Standard',
        course,
        9
      )

      expect(result).toHaveLength(9)
      // Should be sorted by hole number
      const sorted = [...result].sort((a, b) => a - b)
      expect(result).toEqual(sorted)
    })

    it('should return empty array for 0 strokes', () => {
      const result = distributeDotsStrokes(
        players[0],
        players,
        false,
        'Standard',
        course,
        0
      )

      expect(result).toHaveLength(0)
    })
  })

  describe('preserveImmutablePlayerFields', () => {
    it('should preserve strokeHoles when updating player', () => {
      const player: Player = {
        ...createMockPlayer('p1', 10),
        strokeHoles: {
          sixes: {
            firstGame: [1, 2],
            secondGame: [3, 4],
            thirdGame: [5, 6],
          },
          nines: [1, 2, 3],
          dots: [1, 2, 3],
          nassau: [1, 2, 3],
        },
      } as Player

      const updated = preserveImmutablePlayerFields(player, {
        score: Array(18).fill(4),
      })

      expect(updated.strokeHoles).toEqual(player.strokeHoles)
      expect(updated.score).toEqual(Array(18).fill(4))
    })
  })
})

