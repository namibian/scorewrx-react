import { create } from 'zustand'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore'
import { useAuthStore } from './auth-store'
import type { Player } from '@/types'

interface PlayersState {
  players: Player[]
  loading: boolean
  error: string | null

  // Actions
  fetchPlayers: () => Promise<void>
  fetchPlayersByAffiliation: (affiliation: string) => Promise<Player[]>
  getPlayer: (id: string) => Promise<Player>
  createPlayer: (playerData: Partial<Player>) => Promise<Player>
  updatePlayer: (id: string, playerData: Partial<Player>) => Promise<void>
  deletePlayer: (id: string) => Promise<void>
  deletePlayers: (ids: string[]) => Promise<void>
}

// Ensure authentication for protected operations
const ensureAuth = () => {
  const authStore = useAuthStore.getState()
  if (!authStore.user) {
    throw new Error('Authentication required')
  }
}

export const usePlayersStore = create<PlayersState>((set, get) => ({
  players: [],
  loading: false,
  error: null,

  // Get all players (filtered by affiliation) - requires authentication
  fetchPlayers: async () => {
    set({ loading: true, error: null })
    try {
      const playersRef = collection(db, 'players')
      const authStore = useAuthStore.getState()
      const userAffiliation = authStore.userProfile?.affiliation

      if (!userAffiliation) {
        console.warn('User affiliation not found in profile:', authStore.userProfile)
        set({ error: 'User affiliation not found' })
        return
      }

      // Get only players with matching affiliation
      const snapshot = await getDocs(query(playersRef, where('affiliation', '==', userAffiliation)))
      const playersData = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          shortName: data.shortName || '',
          email: data.email || '',
          handicapIndex: data.handicapIndex || 0,
          tournamentHandicap: data.tournamentHandicap || 0,
          skinsPool: data.skinsPool || 'None',
          affiliation: data.affiliation,
          createdBy: data.createdBy || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          creatorEmail: data.creatorEmail || '',
          score: data.score || Array(18).fill(null),
          dots: data.dots || Array(18).fill(0),
          dnf: data.dnf || Array(18).fill(false),
          greenies: data.greenies || [],
          sandies: data.sandies || []
        } as Player
      })
      
      set({ players: playersData })
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Public method to fetch players by affiliation (for registration page - no auth required)
  fetchPlayersByAffiliation: async (affiliation: string) => {
    set({ loading: true, error: null })
    try {
      if (!affiliation) {
        throw new Error('Affiliation is required')
      }

      const playersRef = collection(db, 'players')
      const snapshot = await getDocs(query(playersRef, where('affiliation', '==', affiliation)))
      const fetchedPlayers = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          shortName: data.shortName || '',
          email: data.email || '',
          handicapIndex: data.handicapIndex || 0,
          tournamentHandicap: data.tournamentHandicap || 0,
          skinsPool: data.skinsPool || 'None',
          affiliation: data.affiliation,
          createdBy: data.createdBy || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          creatorEmail: data.creatorEmail || '',
          score: data.score || Array(18).fill(null),
          dots: data.dots || Array(18).fill(0),
          dnf: data.dnf || Array(18).fill(false),
          greenies: data.greenies || [],
          sandies: data.sandies || []
        } as Player
      })
      
      return fetchedPlayers
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Get a single player (public access)
  getPlayer: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const playerDoc = await getDoc(doc(db, 'players', id))
      if (!playerDoc.exists()) {
        throw new Error('Player not found')
      }
      const data = playerDoc.data()
      const player: Player = {
        id: playerDoc.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        shortName: data.shortName || '',
        email: data.email || '',
        handicapIndex: data.handicapIndex || 0,
        tournamentHandicap: data.tournamentHandicap || 0,
        skinsPool: data.skinsPool || 'None',
        affiliation: data.affiliation,
        createdBy: data.createdBy || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
        creatorEmail: data.creatorEmail || '',
        score: data.score || Array(18).fill(null),
        dots: data.dots || Array(18).fill(0),
        dnf: data.dnf || Array(18).fill(false),
        greenies: data.greenies || [],
        sandies: data.sandies || []
      }
      
      return player
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Create player (protected)
  createPlayer: async (playerData: Partial<Player>) => {
    set({ loading: true, error: null })
    try {
      ensureAuth()
      const authStore = useAuthStore.getState()
      const playersRef = collection(db, 'players')

      // Use provided affiliation or get from auth store
      const affiliation = playerData.affiliation || authStore.userProfile?.affiliation
      if (!affiliation) {
        throw new Error('Affiliation is required')
      }

      // Add metadata and defaults
      const timestamp = new Date()
      const playerWithDefaults = {
        ...playerData,
        affiliation,
        skinsPool: playerData.skinsPool || 'None',
        createdBy: authStore.user!.uid,
        createdAt: timestamp,
        lastUpdated: timestamp,
        creatorEmail: authStore.user!.email || '',
        score: Array(18).fill(null),
        dots: Array(18).fill(0),
        dnf: Array(18).fill(false),
        greenies: [],
        sandies: []
      }

      const docRef = await addDoc(playersRef, playerWithDefaults)
      const newPlayer: Player = { 
        id: docRef.id, 
        ...playerWithDefaults,
        firstName: playerWithDefaults.firstName || '',
        lastName: playerWithDefaults.lastName || '',
        shortName: playerWithDefaults.shortName || '',
        handicapIndex: playerWithDefaults.handicapIndex || 0,
        tournamentHandicap: playerWithDefaults.tournamentHandicap || 0
      } as Player
      
      set((state) => ({ players: [...state.players, newPlayer] }))
      
      return newPlayer
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Update player (protected)
  updatePlayer: async (id: string, playerData: Partial<Player>) => {
    set({ loading: true, error: null })
    try {
      ensureAuth()
      const playerRef = doc(db, 'players', id)

      // Get current player data
      const currentPlayer = get().players.find((p) => p.id === id)
      if (!currentPlayer) {
        throw new Error('Player not found')
      }

      // Merge updates with current data, preserving existing fields
      const updatedData = { 
        ...currentPlayer, 
        ...playerData, 
        lastUpdated: new Date() 
      }

      await updateDoc(playerRef, updatedData as any)
      
      set((state) => {
        const index = state.players.findIndex((p) => p.id === id)
        if (index !== -1) {
          const updated = [...state.players]
          updated[index] = updatedData
          return { players: updated }
        }
        return state
      })
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Delete player (protected)
  deletePlayer: async (id: string) => {
    set({ loading: true, error: null })
    try {
      ensureAuth()
      await deleteDoc(doc(db, 'players', id))
      
      set((state) => ({
        players: state.players.filter((p) => p.id !== id)
      }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Delete multiple players (protected)
  deletePlayers: async (ids: string[]) => {
    set({ loading: true, error: null })
    try {
      ensureAuth()
      await Promise.all(ids.map((id) => deleteDoc(doc(db, 'players', id))))
      
      set((state) => ({
        players: state.players.filter((p) => !ids.includes(p.id))
      }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  }
}))


