/**
 * Nines Match Tests
 */

import { describe, it, expect } from 'vitest'
import { calculatePoints } from '../nines-match'
import type { Player } from '@/types'

const createMockPlayer = (id: string, strokeHoles: number[] = []): Player => ({
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
  strokeHoles: { nines: strokeHoles },
})

describe('Nines Match', () => {
  describe('calculatePoints', () => {
    it('should return null if not all scores entered', () => {
      const players = [
        createMockPlayer('p1'),
        createMockPlayer('p2'),
        createMockPlayer('p3'),
      ]
      const scores = new Map([
        ['p1', { score: [4, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
        ['p2', { score: [null, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
        ['p3', { score: [6, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
      ])

      const result = calculatePoints(players, scores, 0)
      expect(result).toBeNull()
    })

    it('should distribute 5-3-1 for three different scores', () => {
      const players = [
        createMockPlayer('p1'),
        createMockPlayer('p2'),
        createMockPlayer('p3'),
      ]
      const scores = new Map([
        ['p1', { score: [3, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
        ['p2', { score: [4, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
        ['p3', { score: [5, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
      ])

      const result = calculatePoints(players, scores, 0)
      expect(result).toBeTruthy()
      
      const p1Points = result!.find((r) => r.playerId === 'p1')?.points
      const p2Points = result!.find((r) => r.playerId === 'p2')?.points
      const p3Points = result!.find((r) => r.playerId === 'p3')?.points

      expect(p1Points).toBe(5)
      expect(p2Points).toBe(3)
      expect(p3Points).toBe(1)
    })

    it('should split points evenly when all tied', () => {
      const players = [
        createMockPlayer('p1'),
        createMockPlayer('p2'),
        createMockPlayer('p3'),
      ]
      const scores = new Map([
        ['p1', { score: [4, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
        ['p2', { score: [4, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
        ['p3', { score: [4, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
      ])

      const result = calculatePoints(players, scores, 0)
      expect(result).toBeTruthy()
      
      // All should get 3 points (9/3)
      result!.forEach((r) => {
        expect(r.points).toBe(3)
      })
    })

    it('should handle DNF players (get 1 point)', () => {
      const players = [
        createMockPlayer('p1'),
        createMockPlayer('p2'),
        createMockPlayer('p3'),
      ]
      const scores = new Map([
        ['p1', { score: [3, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
        ['p2', { score: [4, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
        ['p3', { score: [10, ...Array(17).fill(null)], dnf: [true, ...Array(17).fill(false)] }],
      ])

      const result = calculatePoints(players, scores, 0)
      expect(result).toBeTruthy()
      
      const p3Points = result!.find((r) => r.playerId === 'p3')?.points
      expect(p3Points).toBe(1)
    })

    it('should apply strokes correctly', () => {
      const players = [
        createMockPlayer('p1', [1]), // Gets stroke on hole 1
        createMockPlayer('p2'),
        createMockPlayer('p3'),
      ]
      const scores = new Map([
        ['p1', { score: [5, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
        ['p2', { score: [4, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
        ['p3', { score: [5, ...Array(17).fill(null)], dnf: Array(18).fill(false) }],
      ])

      const result = calculatePoints(players, scores, 0)
      expect(result).toBeTruthy()
      
      // p1 and p3 tied with net 4, p2 wins with 4
      // In a 3-way scenario with two tied: p2 gets 5, p1/p3 split remaining 4 points = 2 each
      const p1Points = result!.find((r) => r.playerId === 'p1')?.points
      expect(p1Points).toBe(4) // Two players tied for best
    })
  })
})

