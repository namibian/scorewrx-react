import { create } from 'zustand'

interface GameResultsState {
  // Store sixes game results for each player
  // Format: { groupId: { playerId: { game1: 1, game2: 0, game3: -1 } } }
  sixesResults: Record<string, Record<string, Record<string, number>>>

  // Actions
  setSixesGameResult: (groupId: string, playerId: string, gameNumber: number, result: number) => void
  getSixesGameResults: (groupId: string, playerId: string) => Record<string, number>
  clearGroupResults: (groupId: string) => void
}

export const useGameResultsStore = create<GameResultsState>((set, get) => ({
  sixesResults: {},

  setSixesGameResult: (groupId: string, playerId: string, gameNumber: number, result: number) => {
    set((state) => {
      const newSixesResults = { ...state.sixesResults }
      
      if (!newSixesResults[groupId]) {
        newSixesResults[groupId] = {}
      }
      if (!newSixesResults[groupId][playerId]) {
        newSixesResults[groupId][playerId] = {}
      }
      
      newSixesResults[groupId][playerId][`game${gameNumber}`] = result
      
      return { sixesResults: newSixesResults }
    })
  },

  getSixesGameResults: (groupId: string, playerId: string) => {
    const state = get()
    return state.sixesResults[groupId]?.[playerId] || {}
  },

  clearGroupResults: (groupId: string) => {
    set((state) => {
      const newSixesResults = { ...state.sixesResults }
      newSixesResults[groupId] = {}
      return { sixesResults: newSixesResults }
    })
  }
}))




