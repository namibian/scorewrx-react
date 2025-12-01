/**
 * Match Panel Component Tests
 * 
 * Tests for the Sixes match panel logic
 */

import { describe, it, expect } from 'vitest'
import type { Player } from '@/types'
import { getTeamsForGame } from '@/lib/game-logic/sixes-match'

describe('MatchPanel Logic', () => {
  const mockPlayers: Player[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      shortName: 'J. Doe',
      tournamentHandicap: 10,
      score: [4, 5, 3, 4, 5, 4, 5, 4, 3, 4, 5, 3, 4, 5, 4, 5, 4, 3],
      dots: Array(18).fill(0),
      dnf: Array(18).fill(false),
      greenies: [],
      sandies: [],
      cart: '1',
      position: 'driver',
      skinsPool: 'Both',
      strokeHoles: {
        sixes: {
          firstGame: [1, 3, 5],
          secondGame: [7, 9, 11],
          thirdGame: [13, 15, 17],
        },
      },
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      shortName: 'J. Smith',
      tournamentHandicap: 15,
      score: [5, 6, 4, 5, 6, 5, 6, 5, 4, 5, 6, 4, 5, 6, 5, 6, 5, 4],
      dots: Array(18).fill(0),
      dnf: Array(18).fill(false),
      greenies: [],
      sandies: [],
      cart: '1',
      position: 'rider',
      skinsPool: 'Both',
      strokeHoles: {
        sixes: {
          firstGame: [2, 4, 6],
          secondGame: [8, 10, 12],
          thirdGame: [14, 16, 18],
        },
      },
    },
    {
      id: '3',
      firstName: 'Bob',
      lastName: 'Johnson',
      shortName: 'B. Johnson',
      tournamentHandicap: 8,
      score: [3, 4, 3, 4, 4, 3, 4, 4, 3, 3, 4, 3, 4, 4, 3, 4, 4, 3],
      dots: Array(18).fill(0),
      dnf: Array(18).fill(false),
      greenies: [],
      sandies: [],
      cart: '2',
      position: 'driver',
      skinsPool: 'Both',
      strokeHoles: {
        sixes: {
          firstGame: [1, 2],
          secondGame: [7, 8],
          thirdGame: [13, 14],
        },
      },
    },
    {
      id: '4',
      firstName: 'Alice',
      lastName: 'Williams',
      shortName: 'A. Williams',
      tournamentHandicap: 12,
      score: [4, 5, 4, 5, 5, 4, 5, 5, 4, 4, 5, 4, 5, 5, 4, 5, 5, 4],
      dots: Array(18).fill(0),
      dnf: Array(18).fill(false),
      greenies: [],
      sandies: [],
      cart: '2',
      position: 'rider',
      skinsPool: 'Both',
      strokeHoles: {
        sixes: {
          firstGame: [3, 4, 5],
          secondGame: [9, 10, 11],
          thirdGame: [15, 16, 17],
        },
      },
    },
  ]

  it('should form Game 1 teams correctly (Cart vs Cart)', () => {
    const { team1, team2 } = getTeamsForGame(1, mockPlayers)
    expect(team1.length).toBe(2)
    expect(team2.length).toBe(2)
    expect(team1.every((p) => p.cart === '1')).toBe(true)
    expect(team2.every((p) => p.cart === '2')).toBe(true)
  })

  it('should form Game 2 teams correctly (Cross-cart)', () => {
    const { team1, team2 } = getTeamsForGame(2, mockPlayers)
    expect(team1.length).toBe(2)
    expect(team2.length).toBe(2)
    // Team 1: Cart1 Driver + Cart2 Rider
    expect(
      team1.some((p) => p.cart === '1' && p.position === 'driver')
    ).toBe(true)
    expect(
      team1.some((p) => p.cart === '2' && p.position === 'rider')
    ).toBe(true)
  })

  it('should form Game 3 teams correctly (Drivers vs Riders)', () => {
    const { team1, team2 } = getTeamsForGame(3, mockPlayers)
    expect(team1.length).toBe(2)
    expect(team2.length).toBe(2)
    expect(team1.every((p) => p.position === 'driver')).toBe(true)
    expect(team2.every((p) => p.position === 'rider')).toBe(true)
  })

  it('should validate stroke holes are assigned', () => {
    mockPlayers.forEach((player) => {
      expect(player.strokeHoles?.sixes).toBeDefined()
      expect(player.strokeHoles?.sixes?.firstGame).toBeDefined()
      expect(player.strokeHoles?.sixes?.secondGame).toBeDefined()
      expect(player.strokeHoles?.sixes?.thirdGame).toBeDefined()
    })
  })

  it('should validate all players have scores', () => {
    mockPlayers.forEach((player) => {
      expect(player.score.length).toBe(18)
      expect(player.score.every((s) => s !== null)).toBe(true)
    })
  })
})

