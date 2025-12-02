import { create } from 'zustand'
import { db } from '@/lib/firebase/config'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
  runTransaction,
  query,
  orderBy,
  setDoc,
  where,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore'
import { useAuthStore } from './auth-store'
import type { 
  Tournament, 
  Group, 
  Player, 
  GameSettings,
  StrokeHoles,
  RegisteredPlayer,
  WaitingListPlayer,
  ParticipantInfo
} from '@/types'

interface TournamentsState {
  tournaments: Tournament[]
  tournament: Tournament | null
  currentGroup: Group | null
  groups: Record<string, Group[]>
  loading: boolean
  error: string | null

  // Tournaments
  fetchTournaments: () => Promise<void>
  getTournament: (id: string) => Promise<Tournament | null>
  getTournamentByCode: (code: string) => Promise<Tournament | null>
  createTournament: (tournamentData: Partial<Tournament>) => Promise<string>
  updateTournament: (id: string, updates: Partial<Tournament>) => Promise<void>
  updateTournamentCodeSent: (id: string, sentBy: string, sentByName: string) => Promise<void>
  deleteTournament: (id: string) => Promise<void>
  getTournamentById: (id: string) => Tournament | null
  fetchTournamentById: (id: string) => Promise<Tournament>
  updateTournamentData: (tournamentId: string, updateData: any) => Promise<Tournament>
  updateTournamentState: (tournamentId: string, newState: Tournament['state']) => Promise<void>

  // Groups
  fetchTournamentGroups: (tournamentId: string) => Promise<Group[]>
  saveGroups: (tournamentId: string, groups: Partial<Group>[]) => Promise<void>
  getGroup: (tournamentId: string, groupId: string) => Promise<Group | null>
  updateGroup: (tournamentId: string, group: Group) => Promise<boolean>
  getGroupPlayers: (tournamentId: string, groupId: string) => Promise<Player[]>

  // Game Setup
  saveGameSetup: (params: {
    tournamentId: string
    groupId: string
    gameSettings: GameSettings
    players: Player[]
    scorerId: string
  }) => Promise<string>

  // Scoring
  updateGroupScores: (
    tournamentId: string,
    groupId: string,
    hole: number,
    holePar: number,
    scorer: any,
    playersInGroup: Player[],
    scores: Record<string, any>,
    eventLog: any[]
  ) => Promise<void>

  // Real-time subscriptions
  subscribeToTournamentUpdates: (tournamentId: string, callback: (tournament: Tournament) => void) => Unsubscribe
  subscribeToGroupUpdates: (tournamentId: string, groupId: string, callback: (group: Group) => void) => Unsubscribe

  // Current group management
  setCurrentGroup: (group: Group | null) => void
  getCurrentGroup: () => Group | null
  clearCurrentGroup: () => void

  // Skins management
  updateSkinsParticipants: (tournamentId: string) => Promise<void>
  updateSkinsConfiguration: (tournamentId: string, configUpdate: any) => Promise<void>

  // Registration
  registerPlayerForTournament: (
    tournamentId: string,
    playerId: string,
    playerInfo: any,
    status?: 'accepted' | 'declined'
  ) => Promise<{ registration: RegisteredPlayer; promotedPlayer: RegisteredPlayer | null }>
  getPlayerRegistrationStatus: (tournamentId: string, playerId: string) => Promise<RegisteredPlayer | null>
  addPlayerToWaitingList: (tournamentId: string, playerId: string, playerInfo: any) => Promise<WaitingListPlayer>
  removePlayerFromWaitingList: (tournamentId: string, playerId: string) => Promise<boolean>

  // Verifier functions
  setGroupVerifier: (tournamentId: string, groupId: string, verifierId: string | null) => Promise<void>
  updateVerifierScores: (tournamentId: string, groupId: string, hole: number, verifierScores: any) => Promise<void>
  updateVerificationStatus: (tournamentId: string, groupId: string, hole: number, status: string | null) => Promise<void>
  getVerificationStatus: (group: Group, hole: number) => string | null
  checkHoleEntryStatus: (group: Group, hole: number) => { scorerEntered: boolean; verifierEntered: boolean }
  performVerificationCheck: (tournamentId: string, groupId: string, hole: number) => Promise<any>
  scorerOverrideVerification: (tournamentId: string, groupId: string, hole: number) => Promise<void>
  syncVerifierToScorerScores: (tournamentId: string, groupId: string, hole: number, scorerScores: any) => Promise<void>
}

// Helper function to remove undefined values from an object (Firebase rejects undefined)
const removeUndefinedValues = <T extends Record<string, any>>(obj: T): T => {
  const result = {} as T
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key]
    }
  }
  return result
}

// Helper function to normalize strokeHoles data structure
const normalizeStrokeHoles = (strokeHoles: any, _playerId = 'unknown'): StrokeHoles | null => {
  if (!strokeHoles) {
    // strokeHoles may not exist yet (before game setup) - this is expected
    return null
  }

  // Handle string parsing with improved error handling
  if (typeof strokeHoles === 'string') {
    try {
      strokeHoles = JSON.parse(strokeHoles)
      console.log(`[normalizeStrokeHoles] Successfully parsed string strokeHoles for player ${playerId}`)
    } catch (error) {
      console.error(`[normalizeStrokeHoles] Failed to parse strokeHoles for player ${playerId}:`, error)
      return null
    }
  }

  // Validate that parsed result is an object
  if (!strokeHoles || typeof strokeHoles !== 'object') {
    console.error(`[normalizeStrokeHoles] Invalid strokeHoles type for player ${playerId}:`, typeof strokeHoles)
    return null
  }

  // Ensure proper structure to prevent reactivity issues
  const normalized: StrokeHoles = {
    sixes: {
      firstGame: Array.isArray(strokeHoles.sixes?.firstGame) ? strokeHoles.sixes.firstGame : [],
      secondGame: Array.isArray(strokeHoles.sixes?.secondGame) ? strokeHoles.sixes.secondGame : [],
      thirdGame: Array.isArray(strokeHoles.sixes?.thirdGame) ? strokeHoles.sixes.thirdGame : []
    },
    nines: Array.isArray(strokeHoles.nines) ? strokeHoles.nines : [],
    dots: Array.isArray(strokeHoles.dots) ? strokeHoles.dots : [],
    nassau: Array.isArray(strokeHoles.nassau) ? strokeHoles.nassau : []
  }

  return normalized
}

// Helper function to process group data from Firestore
const processGroupData = (docData: any, docId: string, index: number): Group => {
  return {
    id: docId,
    index: index,
    number: docData.number || index + 1,
    startingTee: docData.startingTee || 1,
    teeTime: docData.teeTime || '08:00',
    scorerId: docData.scorerId || '',
    verifierId: docData.verifierId || null,
    verificationStatus: Array.isArray(docData.verificationStatus)
      ? docData.verificationStatus
      : Array(18).fill(null),
    lastUpdated: docData.lastUpdated?.toDate() || new Date(),
    gameSettings: docData.gameSettings || null,
    players: (docData.players || []).map((p: any) => ({
      id: p.id,
      firstName: p.firstName || '',
      lastName: p.lastName || '',
      shortName: p.shortName || '',
      email: p.email || '',
      handicapIndex: p.handicapIndex || 0,
      tournamentHandicap: parseInt(p.tournamentHandicap || 0),
      skinsPool: p.skinsPool || 'None',
      cart: p.cart || '',
      position: p.position || '',
      affiliation: p.affiliation || '',
      score: Array.isArray(p.score) ? p.score : Array(18).fill(null),
      dots: Array.isArray(p.dots) ? p.dots : Array(18).fill(0),
      dnf: Array.isArray(p.dnf) ? p.dnf : Array(18).fill(false),
      greenies: Array.isArray(p.greenies) ? p.greenies : [],
      sandies: Array.isArray(p.sandies) ? p.sandies : [],
      strokeHoles: normalizeStrokeHoles(p.strokeHoles, p.id) || undefined,
      verifierScore: Array.isArray(p.verifierScore) ? p.verifierScore : Array(18).fill(null),
      verifierDots: Array.isArray(p.verifierDots) ? p.verifierDots : Array(18).fill(0),
      verifierDnf: Array.isArray(p.verifierDnf) ? p.verifierDnf : Array(18).fill(false),
      verifierGreenies: Array.isArray(p.verifierGreenies) ? p.verifierGreenies : [],
      verifierSandies: Array.isArray(p.verifierSandies) ? p.verifierSandies : []
    })),
    par3ScoreLog: docData.par3ScoreLog || [],
    eventLog: docData.eventLog || []
  }
}

// Generate a unique tournament code
const generateUniqueTournamentCode = async (): Promise<string> => {
  const maxAttempts = 10
  for (let i = 0; i < maxAttempts; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000))

    const tournamentsRef = collection(db, 'tournaments')
    const q = query(tournamentsRef, where('code', '==', code))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return code
    }
  }
  throw new Error('Failed to generate unique tournament code')
}

export const useTournamentsStore = create<TournamentsState>((set, get) => ({
  tournaments: [],
  tournament: null,
  currentGroup: null,
  groups: {},
  loading: false,
  error: null,

  // Get all tournaments
  fetchTournaments: async () => {
    set({ loading: true, error: null })
    try {
      const tournamentsRef = collection(db, 'tournaments')
      const authStore = useAuthStore.getState()
      const userAffiliation = authStore.userProfile?.affiliation

      if (!userAffiliation) {
        console.warn('User affiliation not found. Please check your user profile.')
        set({ tournaments: [], loading: false, error: 'User affiliation not found. Please check your user profile.' })
        return
      }

      const q = query(tournamentsRef, where('affiliation', '==', userAffiliation))
      const snapshot = await getDocs(q)
      
      const tournamentDocs = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          // Normalize course field for backward compatibility
          course: data.course || data.courseId,
          courseId: data.course || data.courseId,
          date: data.date,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastUpdated: data.lastUpdated?.toDate() || new Date()
        }
      }) as Tournament[]

      set({ tournaments: tournamentDocs, loading: false })
    } catch (err: any) {
      console.error('Error fetching tournaments:', err)
      set({ error: err.message, loading: false })
      throw err
    }
  },

  // Get tournament by ID with groups
  getTournament: async (id: string) => {
    set({ error: null })
    try {
      const tournamentRef = doc(db, 'tournaments', id)
      const tournamentDoc = await getDoc(tournamentRef)

      if (!tournamentDoc.exists()) {
        set({ error: 'Tournament not found' })
        return null
      }

      const data = tournamentDoc.data()
      const tournamentData: Tournament = {
        id: tournamentDoc.id,
        ...data,
        // Normalize course field for backward compatibility
        course: data.course || data.courseId,
        courseId: data.course || data.courseId,
        date: data.date,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date()
      } as Tournament

      // Get groups from subcollection
      const groupsRef = collection(db, 'tournaments', id, 'groups')
      const groupsQuery = query(groupsRef, orderBy('index'))
      const groupsSnapshot = await getDocs(groupsQuery)
      const groupsList = groupsSnapshot.docs.map((doc, index) => 
        processGroupData(doc.data(), doc.id, index)
      )

      // Store groups separately
      set((state) => ({
        groups: { ...state.groups, [id]: groupsList }
      }))

      // Add groups to tournament data
      tournamentData.groups = groupsList

      // Update local state
      set({ tournament: tournamentData })

      // Also update the tournaments array to keep it in sync
      set((state) => {
        const index = state.tournaments.findIndex((t) => t.id === id)
        if (index !== -1) {
          const updated = [...state.tournaments]
          updated[index] = tournamentData
          return { tournaments: updated }
        }
        return state
      })

      return tournamentData
    } catch (err: any) {
      console.error('Error fetching tournament:', err)
      set({ error: err.message })
      throw err
    }
  },

  // Get tournament by code
  getTournamentByCode: async (code: string) => {
    set({ loading: true, error: null })
    try {
      const tournamentsRef = collection(db, 'tournaments')
      const q = query(tournamentsRef, where('code', '==', code))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        set({ error: 'Tournament not found with this code' })
        return null
      }

      const tournamentDoc = snapshot.docs[0]
      const data = tournamentDoc.data()
      const tournamentData: Tournament = {
        id: tournamentDoc.id,
        ...data,
        date: data.date,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date()
      } as Tournament

      // Get groups from subcollection
      const groupsRef = collection(db, 'tournaments', tournamentDoc.id, 'groups')
      const groupsQuery = query(groupsRef, orderBy('index'))
      const groupsSnapshot = await getDocs(groupsQuery)
      const groupsList = groupsSnapshot.docs.map((doc, index) =>
        processGroupData(doc.data(), doc.id, index)
      )

      // Store groups separately
      set((state) => ({
        groups: { ...state.groups, [tournamentDoc.id]: groupsList }
      }))

      tournamentData.groups = groupsList
      set({ tournament: tournamentData })

      return tournamentData
    } catch (err: any) {
      console.error('Error fetching tournament by code:', err)
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Create tournament
  createTournament: async (tournamentData: Partial<Tournament>) => {
    set({ loading: true, error: null })
    try {
      const code = await generateUniqueTournamentCode()
      const authStore = useAuthStore.getState()

      // Handle date conversion - if it's a string (from date input), use it directly
      // Firestore will handle the string format
      const dateValue = typeof tournamentData.date === 'string' 
        ? tournamentData.date 
        : tournamentData.date instanceof Date 
          ? tournamentData.date.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]

      // Build the tournament document, excluding undefined fields
      const tournamentDoc: any = {
        name: tournamentData.name,
        date: dateValue,
        course: tournamentData.courseId,
        code,
        affiliation: authStore.userProfile?.affiliation,
        createdAt: new Date(),
        createdBy: authStore.user?.uid || null,
        lastUpdated: new Date(),
        state: 'Created',
        
        // Registration settings
        useOnlineRegistration: tournamentData.useOnlineRegistration || false,
        maxRegistrations: tournamentData.maxRegistrations || null,
        registeredPlayers: [],
        waitingList: [],
        
        // Tournament configuration
        shotgunStart: tournamentData.shotgunStart ? {
          enabled: true,
          startTime: tournamentData.shotgunStartTime || '08:00'
        } : {
          enabled: false,
          startTime: '08:00'
        }
      }

      // Only add defaultStartingTee if shotgun start is disabled
      if (!tournamentData.shotgunStart) {
        tournamentDoc.defaultStartingTee = 1
      }

      // Only add competitions if they exist and have at least one enabled competition
      if (tournamentData.competitions && Object.keys(tournamentData.competitions).length > 0) {
        tournamentDoc.competitions = tournamentData.competitions
      } else {
        // Default: skins enabled
        tournamentDoc.competitions = {
          skins: {
            enabled: true,
            scratchBuyIn: 5.00,
            handicapBuyIn: 5.00,
            useHalfStrokeOnPar3: true
          }
        }
      }

      const tournamentRef = doc(collection(db, 'tournaments'))
      await setDoc(tournamentRef, tournamentDoc)

      await get().fetchTournaments()
      return tournamentRef.id
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Update tournament
  updateTournament: async (id: string, updates: Partial<Tournament>) => {
    set({ loading: true, error: null })
    try {
      const tournamentRef = doc(db, 'tournaments', id)
      await updateDoc(tournamentRef, {
        ...updates,
        lastUpdated: new Date()
      })
      await get().fetchTournaments()
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Update tournament code sent tracking
  updateTournamentCodeSent: async (id: string, sentBy: string, sentByName: string) => {
    set({ error: null })
    try {
      const tournamentRef = doc(db, 'tournaments', id)
      await updateDoc(tournamentRef, {
        codeSentBy: sentBy,
        codeSentByName: sentByName,
        codeSentAt: new Date(),
        lastUpdated: new Date()
      })
      await get().fetchTournaments()
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  // Delete tournament
  deleteTournament: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const batch = writeBatch(db)

      // First get and delete all groups in the subcollection
      const groupsRef = collection(db, 'tournaments', id, 'groups')
      const groupsSnapshot = await getDocs(groupsRef)
      groupsSnapshot.docs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref)
      })

      // Then delete the tournament document itself
      const tournamentRef = doc(db, 'tournaments', id)
      batch.delete(tournamentRef)

      await batch.commit()
      await get().fetchTournaments()
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Get tournament by ID from local state
  getTournamentById: (id: string) => {
    const found = get().tournaments.find((t) => t.id === id)
    return found || null
  },

  // Fetch single tournament and update local state
  fetchTournamentById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const tournamentDoc = await getDoc(doc(db, 'tournaments', id))
      if (!tournamentDoc.exists()) {
        throw new Error('Tournament not found')
      }
      const data = tournamentDoc.data()
      const tournamentData: Tournament = {
        id: tournamentDoc.id,
        ...data,
        date: data.date,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date()
      } as Tournament

      // Get groups from subcollection
      const groupsRef = collection(db, 'tournaments', id, 'groups')
      const groupsQuery = query(groupsRef, orderBy('index'))
      const groupsSnapshot = await getDocs(groupsQuery)
      const groupsList = groupsSnapshot.docs.map((doc, index) =>
        processGroupData(doc.data(), doc.id, index)
      )

      tournamentData.groups = groupsList

      set({ tournament: tournamentData })

      // Also update the tournaments array
      set((state) => {
        const index = state.tournaments.findIndex((t) => t.id === id)
        if (index !== -1) {
          const updated = [...state.tournaments]
          updated[index] = tournamentData
          return { tournaments: updated }
        }
        return state
      })

      return tournamentData
    } catch (err: any) {
      console.error('Error in fetchTournamentById:', err)
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Update tournament data
  updateTournamentData: async (tournamentId: string, updateData: any) => {
    set({ loading: true, error: null })
    try {
      const docRef = doc(db, 'tournaments', tournamentId)

      const currentDoc = await getDoc(docRef)
      if (!currentDoc.exists()) {
        throw new Error('Tournament not found')
      }
      const currentData = currentDoc.data()

      const updateObject = {
        ...updateData,
        lastUpdated: new Date()
      }

      await updateDoc(docRef, updateObject)

      const updatedTournament = {
        id: tournamentId,
        ...currentData,
        ...updateObject
      } as Tournament

      set((state) => {
        const index = state.tournaments.findIndex((t) => t.id === tournamentId)
        if (index !== -1) {
          const updated = [...state.tournaments]
          updated[index] = updatedTournament
          return { tournaments: updated }
        }
        return state
      })

      return updatedTournament
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Fetch groups for a tournament
  fetchTournamentGroups: async (tournamentId: string) => {
    set({ error: null })
    try {
      const groupsRef = collection(db, 'tournaments', tournamentId, 'groups')
      const groupsQuery = query(groupsRef, orderBy('index'))
      const groupsSnapshot = await getDocs(groupsQuery)

      const groupsList = groupsSnapshot.docs.map((doc, index) =>
        processGroupData(doc.data(), doc.id, index)
      )

      return groupsList
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  // Save groups (used by GroupManagerDialog)
  saveGroups: async (tournamentId: string, groups: Partial<Group>[]) => {
    set({ loading: true, error: null })
    try {
      const batch = writeBatch(db)
      const groupsRef = collection(db, 'tournaments', tournamentId, 'groups')

      // Get existing groups
      const existingGroups = await getDocs(groupsRef)

      // Track processed group IDs
      const processedGroupIds = new Set<string>()

      // Update or create groups
      for (const [index, group] of groups.entries()) {
        const groupId = group.id || doc(groupsRef).id
        processedGroupIds.add(groupId)

        const players = (group.players || []).map((player: any) => {
          if (!player.id) {
            throw new Error('Player missing ID')
          }
          return {
            id: player.id,
            firstName: player.firstName || '',
            lastName: player.lastName || '',
            shortName: player.shortName || '',
            email: player.email || '',
            handicapIndex: player.handicapIndex || 0,
            tournamentHandicap: player.tournamentHandicap ?? player.handicapIndex ?? 0,
            skinsPool: player.skinsPool || 'None',
            cart: player.cart || '',
            position: player.position || '',
            affiliation: player.affiliation || '',
            score: Array.isArray(player.score) ? player.score : Array(18).fill(null),
            dots: Array.isArray(player.dots) ? player.dots : Array(18).fill(0),
            dnf: Array.isArray(player.dnf) ? player.dnf : Array(18).fill(false),
            greenies: Array.isArray(player.greenies) ? player.greenies : [],
            sandies: Array.isArray(player.sandies) ? player.sandies : []
          }
        })

        const groupData = {
          id: groupId,
          index,
          number: group.number || index + 1,
          startingTee: group.startingTee || 1,
          teeTime: group.teeTime || '08:00',
          scorerId: group.scorerId || '',
          lastUpdated: serverTimestamp(),
          gameSettings: group.gameSettings || null,
          players
        }

        const groupRef = doc(db, 'tournaments', tournamentId, 'groups', groupId)
        batch.set(groupRef, groupData)
      }

      // Delete groups that no longer exist
      for (const docSnapshot of existingGroups.docs) {
        if (!processedGroupIds.has(docSnapshot.id)) {
          batch.delete(docSnapshot.ref)
        }
      }

      await batch.commit()

      // Auto-transition tournament state if needed
      const tournaments = get().tournaments
      const tournament = tournaments.find((t) => t.id === tournamentId)
      if (tournament && !tournament.useOnlineRegistration && tournament.state === 'Created' && groups.length > 0) {
        await get().updateTournamentState(tournamentId, 'Active')
      }
    } catch (error: any) {
      console.error('Error saving groups:', error)
      set({ error: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  // Get players for a specific group
  getGroupPlayers: async (tournamentId: string, groupId: string) => {
    try {
      const groupRef = doc(db, 'tournaments', tournamentId, 'groups', groupId)
      const groupDoc = await getDoc(groupRef)

      if (!groupDoc.exists()) {
        return []
      }

      const group = groupDoc.data()
      return group?.players || []
    } catch (err: any) {
      set({ error: err.message })
      return []
    }
  },

  // Save game setup for a tournament group
  saveGameSetup: async ({ tournamentId, groupId, gameSettings, players, scorerId }) => {
    set({ loading: true, error: null })
    try {
      const groupRef = doc(db, 'tournaments', tournamentId, 'groups', groupId)
      const tournamentRef = doc(db, 'tournaments', tournamentId)

      // Get existing group data
      const groupDoc = await getDoc(groupRef)
      if (!groupDoc.exists()) {
        throw new Error('Group not found')
      }
      const existingGroupData = groupDoc.data()

      // Get tournament data
      const tournamentDoc = await getDoc(tournamentRef)
      if (!tournamentDoc.exists()) {
        throw new Error('Tournament not found')
      }

      // Parse gameSettings if needed
      const parsedGameSettings =
        typeof gameSettings === 'string' ? JSON.parse(gameSettings) : gameSettings

      // Save players with their calculated strokes and cart assignments
      const playersWithScores = players.map((player) => {
        const existingPlayer = existingGroupData.players?.find((p: any) => p.id === player.id)

        // Parse strokeHoles if it's a string
        let parsedStrokeHoles: StrokeHoles | undefined
        try {
          parsedStrokeHoles =
            typeof player.strokeHoles === 'string'
              ? JSON.parse(player.strokeHoles)
              : player.strokeHoles
        } catch {
          throw new Error(`Invalid stroke calculations format for player ${player.id}`)
        }

        // Validate strokeHoles structure
        if (!parsedStrokeHoles || typeof parsedStrokeHoles !== 'object') {
          throw new Error(`Missing or invalid stroke calculations for player ${player.id}`)
        }

        // Ensure proper structure
        const strokeHoles: StrokeHoles = {
          sixes: {
            firstGame: Array.isArray(parsedStrokeHoles.sixes?.firstGame)
              ? parsedStrokeHoles.sixes.firstGame
              : [],
            secondGame: Array.isArray(parsedStrokeHoles.sixes?.secondGame)
              ? parsedStrokeHoles.sixes.secondGame
              : [],
            thirdGame: Array.isArray(parsedStrokeHoles.sixes?.thirdGame)
              ? parsedStrokeHoles.sixes.thirdGame
              : []
          },
          nines: Array.isArray(parsedStrokeHoles.nines) ? parsedStrokeHoles.nines : [],
          dots: Array.isArray(parsedStrokeHoles.dots) ? parsedStrokeHoles.dots : [],
          nassau: Array.isArray(parsedStrokeHoles.nassau) ? parsedStrokeHoles.nassau : []
        }

        // Only require cart assignments if Sixes game is enabled
        if (parsedGameSettings?.sixes?.enabled) {
          if (!player.cart || !player.position) {
            throw new Error(`Missing cart assignments for player ${player.id} in Sixes game`)
          }
        }

        // Preserve existing scores if they exist
        const score = existingPlayer?.score || Array(18).fill(null)
        const dots = existingPlayer?.dots || Array(18).fill(0)
        const dnf = existingPlayer?.dnf || Array(18).fill(false)
        const greenies = existingPlayer?.greenies || []
        const sandies = existingPlayer?.sandies || []

        return {
          id: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
          shortName: player.shortName,
          email: player.email,
          handicapIndex: player.handicapIndex,
          tournamentHandicap: parseInt(String(player.tournamentHandicap || 0)),
          strokeHoles,
          cart: parsedGameSettings?.sixes?.enabled ? player.cart || null : null,
          position: parsedGameSettings?.sixes?.enabled ? player.position || null : null,
          score,
          dots,
          dnf,
          greenies,
          sandies,
          skinsPool: player.skinsPool || 'None',
          affiliation: player.affiliation || ''
        }
      })

      const docData = {
        id: existingGroupData.id,
        index: existingGroupData.index,
        number: existingGroupData.number,
        startingTee: existingGroupData.startingTee,
        teeTime: existingGroupData.teeTime,
        scorerId: scorerId || existingGroupData.scorerId || '',
        gameSettings: parsedGameSettings,
        players: playersWithScores,
        lastUpdated: new Date()
      }

      await setDoc(groupRef, docData, { merge: true })
      
      // Update skins participants
      await get().updateSkinsParticipants(tournamentId)
      
      return groupId
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Update scores for a specific hole
  updateGroupScores: async (
    tournamentId: string,
    groupId: string,
    hole: number,
    holePar: number,
    _scorer: any,
    playersInGroup: Player[],
    scores: Record<string, any>,
    eventLog: any[]
  ) => {
    if (!tournamentId || !groupId || hole === undefined || !scores || holePar === undefined || !playersInGroup) {
      throw new Error('Invalid arguments for updating scores.')
    }

    const groupRef = doc(db, 'tournaments', tournamentId, 'groups', groupId)
    const scoreIndex = hole - 1

    try {
      await runTransaction(db, async (transaction) => {
        const groupDoc = await transaction.get(groupRef)
        if (!groupDoc.exists()) {
          throw new Error('Group document does not exist!')
        }

        const groupData = groupDoc.data()
        const players = groupData.players || []

        const updatedPlayers = players.map((player: any) => {
          const newScoreData = scores[player.id]
          if (newScoreData) {
            const updatedPlayer = { ...player }
            
            // Initialize arrays if needed
            if (!Array.isArray(updatedPlayer.score) || updatedPlayer.score.length !== 18)
              updatedPlayer.score = Array(18).fill(null)
            if (!Array.isArray(updatedPlayer.dots) || updatedPlayer.dots.length !== 18)
              updatedPlayer.dots = Array(18).fill(0)
            if (!Array.isArray(updatedPlayer.dnf) || updatedPlayer.dnf.length !== 18)
              updatedPlayer.dnf = Array(18).fill(false)
            if (!Array.isArray(updatedPlayer.greenies))
              updatedPlayer.greenies = []
            if (!Array.isArray(updatedPlayer.sandies))
              updatedPlayer.sandies = []

            // CRITICAL: Explicitly preserve strokeHoles
            if (player.strokeHoles && typeof player.strokeHoles === 'object') {
              updatedPlayer.strokeHoles = player.strokeHoles
            }

            // Preserve cart and position
            if (player.cart !== undefined) updatedPlayer.cart = player.cart
            if (player.position !== undefined) updatedPlayer.position = player.position
            if (player.tournamentHandicap !== undefined) updatedPlayer.tournamentHandicap = player.tournamentHandicap
            if (player.handicapIndex !== undefined) updatedPlayer.handicapIndex = player.handicapIndex
            if (player.skinsPool !== undefined) updatedPlayer.skinsPool = player.skinsPool

            // Update scores
            updatedPlayer.score[scoreIndex] = newScoreData.score ?? null
            updatedPlayer.dots[scoreIndex] = newScoreData.dots ?? 0
            updatedPlayer.dnf[scoreIndex] = Boolean(newScoreData.dnf ?? false)

            // Handle greenies
            if (Array.isArray(newScoreData.greenies)) {
              const hasGreenieForCurrentHole = newScoreData.greenies.includes(hole)
              if (hasGreenieForCurrentHole) {
                if (!updatedPlayer.greenies.includes(hole)) {
                  updatedPlayer.greenies.push(hole)
                }
              } else {
                updatedPlayer.greenies = updatedPlayer.greenies.filter((h: number) => h !== hole)
              }
            }

            // Handle sandies
            if (Array.isArray(newScoreData.sandies)) {
              const hasSandyForCurrentHole = newScoreData.sandies.includes(hole)
              if (hasSandyForCurrentHole) {
                if (!updatedPlayer.sandies.includes(hole)) {
                  updatedPlayer.sandies.push(hole)
                }
              } else {
                updatedPlayer.sandies = updatedPlayer.sandies.filter((h: number) => h !== hole)
              }
            }
            
            return updatedPlayer
          }
          return player
        })

        const updates: any = { players: updatedPlayers }

        // Handle event log
        const existingEventLog = groupData.eventLog || []
        const combinedEventLog = [...existingEventLog, ...(eventLog || [])]
        updates.eventLog = combinedEventLog

        transaction.update(groupRef, {
          ...updates,
          lastUpdated: serverTimestamp()
        })
      })
    } catch (error) {
      console.error(`Transaction failed for Hole ${hole}, Group ${groupId}:`, error)
      throw error
    }
  },

  // Subscribe to tournament updates
  subscribeToTournamentUpdates: (tournamentId: string, callback: (tournament: Tournament) => void) => {
    const tournamentRef = doc(db, 'tournaments', tournamentId)
    return onSnapshot(tournamentRef, (tournamentDoc) => {
      if (!tournamentDoc.exists()) return

      const data = tournamentDoc.data()
      const tournamentData: Tournament = {
        id: tournamentDoc.id,
        ...data,
        date: data.date,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
        groups: get().groups[tournamentId] || []
      } as Tournament

      if (callback) callback(tournamentData)
    })
  },

  // Subscribe to specific group updates
  subscribeToGroupUpdates: (tournamentId: string, groupId: string, callback: (group: Group) => void) => {
    const groupRef = doc(db, 'tournaments', tournamentId, 'groups', groupId)
    return onSnapshot(groupRef, (groupDoc) => {
      if (!groupDoc.exists()) return

      const groupData = processGroupData(groupDoc.data(), groupDoc.id, 0)

      // Update the group in our local groups store
      set((state) => {
        if (state.groups[tournamentId]) {
          const groups = [...state.groups[tournamentId]]
          const index = groups.findIndex((g) => g.id === groupId)
          if (index !== -1) {
            groups[index] = groupData
            return { groups: { ...state.groups, [tournamentId]: groups } }
          }
        }
        return state
      })

      // Update current group
      const currentGroup = get().currentGroup
      if (currentGroup?.id === groupId) {
        set({ currentGroup: groupData })
      }

      if (callback) callback(groupData)
    })
  },

  // Get a specific group from a tournament
  getGroup: async (tournamentId: string, groupId: string) => {
    try {
      const groupRef = doc(db, 'tournaments', tournamentId, 'groups', groupId)
      const groupDoc = await getDoc(groupRef)

      if (!groupDoc.exists()) {
        return null
      }

      return processGroupData(groupDoc.data(), groupDoc.id, 0)
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  // Set current group
  setCurrentGroup: (group: Group | null) => {
    set({ currentGroup: group })
  },

  // Get current group
  getCurrentGroup: () => {
    return get().currentGroup
  },

  // Clear current group
  clearCurrentGroup: () => {
    set({ currentGroup: null })
  },

  // Update a single group
  updateGroup: async (tournamentId: string, group: Group) => {
    set({ loading: true, error: null })
    try {
      const groupRef = doc(db, 'tournaments', tournamentId, 'groups', group.id)

      const groupDoc: Group = {
        id: group.id,
        index: group.index || 0,
        number: group.number || 1,
        startingTee: group.startingTee || 1,
        teeTime: group.teeTime || '08:00',
        scorerId: group.scorerId || '',
        verifierId: group.verifierId || null,
        verificationStatus: group.verificationStatus || Array(18).fill(null),
        lastUpdated: new Date(),
        gameSettings: group.gameSettings || null,
        players: group.players.map((p): Player => {
          const normalizedStrokeHoles = normalizeStrokeHoles(p.strokeHoles, p.id)
          // Build player object explicitly to avoid undefined values (Firebase rejects them)
          const player: Record<string, any> = {
            id: p.id,
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            handicapIndex: p.handicapIndex || 0,
            tournamentHandicap: parseInt(String(p.tournamentHandicap || 0)),
            skinsPool: p.skinsPool || 'None',
            score: Array.isArray(p.score) ? p.score : Array(18).fill(null),
            dots: Array.isArray(p.dots) ? p.dots : Array(18).fill(0),
            dnf: Array.isArray(p.dnf) ? p.dnf : Array(18).fill(false),
            greenies: Array.isArray(p.greenies) ? p.greenies : [],
            sandies: Array.isArray(p.sandies) ? p.sandies : [],
          }
          // Only add optional fields if they have valid values
          if (p.affiliation) player.affiliation = p.affiliation
          if (p.email) player.email = p.email
          if (p.cart === '1' || p.cart === '2') player.cart = p.cart
          if (p.position === 'driver' || p.position === 'rider') player.position = p.position
          if (normalizedStrokeHoles) player.strokeHoles = normalizedStrokeHoles
          if (p.verifierScore !== undefined) player.verifierScore = p.verifierScore
          if (p.verifierDots !== undefined) player.verifierDots = p.verifierDots
          if (p.verifierDnf !== undefined) player.verifierDnf = p.verifierDnf
          
          return player as Player
        }),
        par3ScoreLog: group.par3ScoreLog || [],
        eventLog: group.eventLog || []
      }

      await setDoc(groupRef, groupDoc)

      // Update skins participant arrays
      await get().updateSkinsParticipants(tournamentId)

      // Update local state
      const tournament = get().tournament
      if (tournament?.id === tournamentId) {
        const existingGroups = tournament.groups || []
        const groupIndex = existingGroups.findIndex((g) => g.id === group.id)
        if (groupIndex !== -1) {
          existingGroups[groupIndex] = groupDoc
        } else {
          existingGroups.push(groupDoc)
        }
        set({ tournament: { ...tournament, groups: existingGroups } })
      }

      return true
    } catch (err: any) {
      console.error('Error in updateGroup:', err)
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Update skins participants
  updateSkinsParticipants: async (tournamentId: string) => {
    try {
      const tournamentRef = doc(db, 'tournaments', tournamentId)
      const tournamentDoc = await getDoc(tournamentRef)

      if (!tournamentDoc.exists()) {
        throw new Error('Tournament not found')
      }

      const scratchParticipants: ParticipantInfo[] = []
      const handicapParticipants: ParticipantInfo[] = []

      // Get all current players across all groups
      const allGroups = await get().fetchTournamentGroups(tournamentId)
      const allCurrentPlayers = new Map<string, any>()

      allGroups.forEach((group) => {
        if (Array.isArray(group.players)) {
          group.players.forEach((player) => {
            allCurrentPlayers.set(player.id, {
              id: player.id,
              firstName: player.firstName,
              lastName: player.lastName,
              skinsPool: player.skinsPool
            })
          })
        }
      })

      // Build participant arrays
      allCurrentPlayers.forEach((player) => {
        const playerInfo: ParticipantInfo = {
          id: player.id,
          firstName: player.firstName,
          lastName: player.lastName
        }

        if (['Scratch', 'Both'].includes(player.skinsPool)) {
          scratchParticipants.push(playerInfo)
        }

        if (['Handicap', 'Both'].includes(player.skinsPool)) {
          handicapParticipants.push(playerInfo)
        }
      })

      await updateDoc(tournamentRef, {
        'competitions.skins.scratchParticipants': scratchParticipants,
        'competitions.skins.handicapParticipants': handicapParticipants,
        lastUpdated: new Date()
      })
    } catch (error) {
      console.error('Error updating skins participants:', error)
      throw error
    }
  },

  // Update skins configuration
  updateSkinsConfiguration: async (tournamentId: string, configUpdate: any) => {
    try {
      const tournamentRef = doc(db, 'tournaments', tournamentId)
      const updateData: any = {}

      Object.entries(configUpdate).forEach(([key, value]) => {
        updateData[`competitions.skins.${key}`] = value
      })

      updateData.lastUpdated = new Date()

      await updateDoc(tournamentRef, updateData)
      console.log('Skins configuration updated successfully')
    } catch (error) {
      console.error('Error updating skins configuration:', error)
      throw error
    }
  },

  // Update tournament state
  updateTournamentState: async (tournamentId: string, newState: Tournament['state']) => {
    set({ loading: true, error: null })
    try {
      const tournamentRef = doc(db, 'tournaments', tournamentId)
      await updateDoc(tournamentRef, {
        state: newState,
        lastUpdated: new Date()
      })
      await get().fetchTournaments()
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Register player for tournament
  registerPlayerForTournament: async (
    tournamentId: string,
    playerId: string,
    playerInfo: any,
    status = 'accepted' as 'accepted' | 'declined'
  ) => {
    set({ error: null })
    try {
      const tournamentRef = doc(db, 'tournaments', tournamentId)
      const tournamentDoc = await getDoc(tournamentRef)

      if (!tournamentDoc.exists()) {
        throw new Error('Tournament not found')
      }

      const tournamentData = tournamentDoc.data()
      const registeredPlayers = tournamentData.registeredPlayers || []
      const waitingList = tournamentData.waitingList || []

      const existingIndex = registeredPlayers.findIndex((p: any) => p.playerId === playerId)
      const previousRegistration = existingIndex !== -1 ? registeredPlayers[existingIndex] : null
      const wasAccepted = previousRegistration?.status === 'accepted'
      const isDeclining = status === 'declined'

      const maxRegistrations = tournamentData.maxRegistrations
      const acceptedCountBefore = registeredPlayers.filter((p: any) => p.status === 'accepted').length
      const wasFull = maxRegistrations && acceptedCountBefore >= maxRegistrations

      const shouldPromote = wasAccepted && isDeclining && wasFull && waitingList.length > 0

      const registration: RegisteredPlayer = {
        playerId,
        firstName: playerInfo.firstName,
        lastName: playerInfo.lastName,
        email: playerInfo.email || '',
        handicapIndex: playerInfo.handicapIndex || 0,
        status,
        registeredAt: previousRegistration?.registeredAt || new Date()
      }

      if (existingIndex !== -1) {
        registeredPlayers[existingIndex] = registration
      } else {
        registeredPlayers.push(registration)
      }

      let updatedWaitingList = waitingList
      let promotedPlayer: RegisteredPlayer | null = null

      if (shouldPromote) {
        const sortedWaitingList = [...waitingList].sort((a: any, b: any) => {
          const dateA = a.addedAt?.toDate ? a.addedAt.toDate() : new Date(a.addedAt)
          const dateB = b.addedAt?.toDate ? b.addedAt.toDate() : new Date(b.addedAt)
          return dateA.getTime() - dateB.getTime()
        })

        const firstWaitingListPlayer = sortedWaitingList[0]

        const promotedRegistration: RegisteredPlayer = {
          playerId: firstWaitingListPlayer.playerId,
          firstName: firstWaitingListPlayer.firstName,
          lastName: firstWaitingListPlayer.lastName,
          email: firstWaitingListPlayer.email || '',
          handicapIndex: firstWaitingListPlayer.handicapIndex || 0,
          status: 'accepted',
          registeredAt: new Date()
        }

        const promotedIndex = registeredPlayers.findIndex((p: any) => p.playerId === firstWaitingListPlayer.playerId)
        if (promotedIndex !== -1) {
          registeredPlayers[promotedIndex] = promotedRegistration
        } else {
          registeredPlayers.push(promotedRegistration)
        }

        updatedWaitingList = waitingList.filter((p: any) => p.playerId !== firstWaitingListPlayer.playerId)
        promotedPlayer = promotedRegistration
      }

      await updateDoc(tournamentRef, {
        registeredPlayers,
        waitingList: updatedWaitingList,
        lastUpdated: new Date()
      })

      return { registration, promotedPlayer }
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  // Add player to waiting list
  addPlayerToWaitingList: async (tournamentId: string, playerId: string, playerInfo: any) => {
    set({ error: null })
    try {
      const tournamentRef = doc(db, 'tournaments', tournamentId)
      const tournamentDoc = await getDoc(tournamentRef)

      if (!tournamentDoc.exists()) {
        throw new Error('Tournament not found')
      }

      const tournamentData = tournamentDoc.data()
      const waitingList = tournamentData.waitingList || []

      const existingIndex = waitingList.findIndex((p: any) => p.playerId === playerId)

      const waitingListEntry: WaitingListPlayer = {
        playerId,
        firstName: playerInfo.firstName,
        lastName: playerInfo.lastName,
        email: playerInfo.email || '',
        handicapIndex: playerInfo.handicapIndex || 0,
        addedAt: new Date()
      }

      if (existingIndex !== -1) {
        waitingList[existingIndex] = waitingListEntry
      } else {
        waitingList.push(waitingListEntry)
      }

      await updateDoc(tournamentRef, {
        waitingList,
        lastUpdated: new Date()
      })

      return waitingListEntry
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  // Remove player from waiting list
  removePlayerFromWaitingList: async (tournamentId: string, playerId: string) => {
    set({ error: null })
    try {
      const tournamentRef = doc(db, 'tournaments', tournamentId)
      const tournamentDoc = await getDoc(tournamentRef)

      if (!tournamentDoc.exists()) {
        throw new Error('Tournament not found')
      }

      const tournamentData = tournamentDoc.data()
      const waitingList = tournamentData.waitingList || []

      const filteredWaitingList = waitingList.filter((p: any) => p.playerId !== playerId)

      await updateDoc(tournamentRef, {
        waitingList: filteredWaitingList,
        lastUpdated: new Date()
      })

      return true
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  // Get registration status for a player
  getPlayerRegistrationStatus: async (tournamentId: string, playerId: string) => {
    try {
      const tournamentRef = doc(db, 'tournaments', tournamentId)
      const tournamentDoc = await getDoc(tournamentRef)

      if (!tournamentDoc.exists()) {
        return null
      }

      const tournamentData = tournamentDoc.data()
      const registeredPlayers = tournamentData.registeredPlayers || []
      return registeredPlayers.find((p: any) => p.playerId === playerId) || null
    } catch (err: any) {
      console.error('Error getting player registration status:', err)
      return null
    }
  },

  // VERIFIER FUNCTIONS
  
  setGroupVerifier: async (tournamentId: string, groupId: string, verifierId: string | null) => {
    set({ error: null })
    try {
      const groupRef = doc(db, 'tournaments', tournamentId, 'groups', groupId)
      await updateDoc(groupRef, {
        verifierId: verifierId || null,
        lastUpdated: new Date()
      })

      if (!verifierId) {
        await updateDoc(groupRef, {
          verificationStatus: Array(18).fill(null)
        })
      }

      console.log(`Verifier ${verifierId ? 'set' : 'removed'} for group ${groupId}`)
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  updateVerifierScores: async (tournamentId: string, groupId: string, hole: number, verifierScores: any) => {
    set({ error: null })
    try {
      const groupRef = doc(db, 'tournaments', tournamentId, 'groups', groupId)
      const holeIndex = hole - 1

      await runTransaction(db, async (transaction) => {
        const groupDoc = await transaction.get(groupRef)
        if (!groupDoc.exists()) {
          throw new Error('Group document does not exist!')
        }

        const groupData = groupDoc.data()
        const players = groupData.players || []

        const updatedPlayers = players.map((player: any) => {
          const verifierData = verifierScores[player.id]
          if (!verifierData) return player

          const updatedPlayer = { ...player }

          // Initialize verifier arrays if needed
          if (!Array.isArray(updatedPlayer.verifierScore) || updatedPlayer.verifierScore.length !== 18) {
            updatedPlayer.verifierScore = Array(18).fill(null)
          }
          if (!Array.isArray(updatedPlayer.verifierDots) || updatedPlayer.verifierDots.length !== 18) {
            updatedPlayer.verifierDots = Array(18).fill(0)
          }
          if (!Array.isArray(updatedPlayer.verifierDnf) || updatedPlayer.verifierDnf.length !== 18) {
            updatedPlayer.verifierDnf = Array(18).fill(false)
          }
          if (!Array.isArray(updatedPlayer.verifierGreenies)) {
            updatedPlayer.verifierGreenies = []
          }
          if (!Array.isArray(updatedPlayer.verifierSandies)) {
            updatedPlayer.verifierSandies = []
          }

          // Update verifier score data
          updatedPlayer.verifierScore[holeIndex] = verifierData.score ?? null
          updatedPlayer.verifierDots[holeIndex] = verifierData.dots ?? 0
          updatedPlayer.verifierDnf[holeIndex] = Boolean(verifierData.dnf ?? false)

          // Handle greenies
          if (verifierData.greenieToggle) {
            if (!updatedPlayer.verifierGreenies.includes(hole)) {
              updatedPlayer.verifierGreenies.push(hole)
            }
          } else {
            updatedPlayer.verifierGreenies = updatedPlayer.verifierGreenies.filter((h: number) => h !== hole)
          }

          // Handle sandies
          if (verifierData.sandyToggle) {
            if (!updatedPlayer.verifierSandies.includes(hole)) {
              updatedPlayer.verifierSandies.push(hole)
            }
          } else {
            updatedPlayer.verifierSandies = updatedPlayer.verifierSandies.filter((h: number) => h !== hole)
          }

          return updatedPlayer
        })

        transaction.update(groupRef, {
          players: updatedPlayers,
          lastUpdated: serverTimestamp()
        })
      })

      console.log(`Verifier scores saved for hole ${hole}`)
    } catch (err: any) {
      console.error(`Failed to save verifier scores for hole ${hole}:`, err)
      set({ error: err.message })
      throw err
    }
  },

  updateVerificationStatus: async (tournamentId: string, groupId: string, hole: number, status: string | null) => {
    set({ error: null })
    try {
      const groupRef = doc(db, 'tournaments', tournamentId, 'groups', groupId)
      const holeIndex = hole - 1

      await runTransaction(db, async (transaction) => {
        const groupDoc = await transaction.get(groupRef)
        if (!groupDoc.exists()) {
          throw new Error('Group document does not exist!')
        }

        const groupData = groupDoc.data()
        let verificationStatus = groupData.verificationStatus || Array(18).fill(null)

        if (!Array.isArray(verificationStatus) || verificationStatus.length !== 18) {
          verificationStatus = Array(18).fill(null)
        }

        verificationStatus[holeIndex] = status

        transaction.update(groupRef, {
          verificationStatus,
          lastUpdated: serverTimestamp()
        })
      })

      console.log(`Verification status for hole ${hole} set to: ${status}`)
    } catch (err: any) {
      console.error(`Failed to update verification status for hole ${hole}:`, err)
      set({ error: err.message })
      throw err
    }
  },

  getVerificationStatus: (group: Group, hole: number) => {
    if (!group?.verificationStatus || !Array.isArray(group.verificationStatus)) {
      return null
    }
    const holeIndex = hole - 1
    return group.verificationStatus[holeIndex] || null
  },

  checkHoleEntryStatus: (group: Group, hole: number) => {
    if (!group?.players) {
      return { scorerEntered: false, verifierEntered: false }
    }

    const holeIndex = hole - 1

    const scorerEntered = group.players.every((player) => {
      const score = player.score?.[holeIndex]
      const dnf = player.dnf?.[holeIndex]
      return (score !== null && score !== undefined) || dnf
    })

    const verifierEntered = group.players.every((player) => {
      const verifierScore = player.verifierScore?.[holeIndex]
      const verifierDnf = player.verifierDnf?.[holeIndex]
      return (verifierScore !== null && verifierScore !== undefined) || verifierDnf
    })

    return { scorerEntered, verifierEntered }
  },

  performVerificationCheck: async (tournamentId: string, groupId: string, hole: number) => {
    console.log(`[performVerificationCheck] Called for hole ${hole}`)
    set({ error: null })
    try {
      const groupRef = doc(db, 'tournaments', tournamentId, 'groups', groupId)
      const groupDoc = await getDoc(groupRef)

      if (!groupDoc.exists()) {
        throw new Error('Group not found')
      }

      const groupData = groupDoc.data()
      const players = groupData.players || []
      const holeIndex = hole - 1

      // Build scorer scores object
      const scorerScores: any = {}
      players.forEach((player: any) => {
        scorerScores[player.id] = {
          score: player.score?.[holeIndex],
          dots: player.dots?.[holeIndex],
          dnf: player.dnf?.[holeIndex],
          greenies: (player.greenies || []).includes(hole),
          sandies: (player.sandies || []).includes(hole)
        }
      })

      // Build verifier scores object
      const verifierScores: any = {}
      players.forEach((player: any) => {
        verifierScores[player.id] = {
          score: player.verifierScore?.[holeIndex],
          dots: player.verifierDots?.[holeIndex],
          dnf: player.verifierDnf?.[holeIndex],
          greenies: (player.verifierGreenies || []).includes(hole),
          sandies: (player.verifierSandies || []).includes(hole)
        }
      })

      // Compare entries
      const discrepancies: any = {}
      let hasDiscrepancy = false

      players.forEach((player: any) => {
        const scorer = scorerScores[player.id]
        const verifier = verifierScores[player.id]

        if (!scorer || !verifier) return

        const playerDiscrepancy = {
          score: scorer.score !== verifier.score,
          dots: scorer.dots !== verifier.dots,
          dnf: Boolean(scorer.dnf) !== Boolean(verifier.dnf),
          greenies: Boolean(scorer.greenies) !== Boolean(verifier.greenies),
          sandies: Boolean(scorer.sandies) !== Boolean(verifier.sandies)
        }

        if (Object.values(playerDiscrepancy).some((v) => v === true)) {
          hasDiscrepancy = true
          discrepancies[player.id] = {
            ...playerDiscrepancy,
            scorerData: scorer,
            verifierData: verifier
          }
        }
      })

      const status = hasDiscrepancy ? 'discrepancy' : 'verified'
      await get().updateVerificationStatus(tournamentId, groupId, hole, status)

      return {
        status,
        discrepancies: hasDiscrepancy ? discrepancies : null
      }
    } catch (err: any) {
      console.error(`Failed to perform verification check for hole ${hole}:`, err)
      set({ error: err.message })
      throw err
    }
  },

  scorerOverrideVerification: async (tournamentId: string, groupId: string, hole: number) => {
    set({ error: null })
    try {
      await get().updateVerificationStatus(tournamentId, groupId, hole, 'verified')
      console.log(`Scorer override: Hole ${hole} marked as verified`)
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  syncVerifierToScorerScores: async (tournamentId: string, groupId: string, hole: number, scorerScores: any) => {
    set({ error: null })
    try {
      const groupRef = doc(db, 'tournaments', tournamentId, 'groups', groupId)
      const holeIndex = hole - 1

      await runTransaction(db, async (transaction) => {
        const groupDoc = await transaction.get(groupRef)
        if (!groupDoc.exists()) {
          throw new Error('Group document does not exist!')
        }

        const groupData = groupDoc.data()
        const players = groupData.players || []

        const updatedPlayers = players.map((player: any) => {
          const scorerData = scorerScores[player.id]
          if (!scorerData) return player

          const updatedPlayer = { ...player }

          // Initialize verifier arrays if needed
          if (!Array.isArray(updatedPlayer.verifierScore) || updatedPlayer.verifierScore.length !== 18) {
            updatedPlayer.verifierScore = Array(18).fill(null)
          }
          if (!Array.isArray(updatedPlayer.verifierDots) || updatedPlayer.verifierDots.length !== 18) {
            updatedPlayer.verifierDots = Array(18).fill(0)
          }
          if (!Array.isArray(updatedPlayer.verifierDnf) || updatedPlayer.verifierDnf.length !== 18) {
            updatedPlayer.verifierDnf = Array(18).fill(false)
          }
          if (!Array.isArray(updatedPlayer.verifierGreenies)) {
            updatedPlayer.verifierGreenies = []
          }
          if (!Array.isArray(updatedPlayer.verifierSandies)) {
            updatedPlayer.verifierSandies = []
          }

          // Sync verifier data to match scorer
          updatedPlayer.verifierScore[holeIndex] = scorerData.score ?? null
          updatedPlayer.verifierDots[holeIndex] = scorerData.dots ?? 0
          updatedPlayer.verifierDnf[holeIndex] = Boolean(scorerData.dnf ?? false)

          // Sync greenies
          if (scorerData.greenies) {
            if (!updatedPlayer.verifierGreenies.includes(hole)) {
              updatedPlayer.verifierGreenies.push(hole)
            }
          } else {
            updatedPlayer.verifierGreenies = updatedPlayer.verifierGreenies.filter((h: number) => h !== hole)
          }

          // Sync sandies
          if (scorerData.sandies) {
            if (!updatedPlayer.verifierSandies.includes(hole)) {
              updatedPlayer.verifierSandies.push(hole)
            }
          } else {
            updatedPlayer.verifierSandies = updatedPlayer.verifierSandies.filter((h: number) => h !== hole)
          }

          return updatedPlayer
        })

        transaction.update(groupRef, {
          players: updatedPlayers,
          lastUpdated: serverTimestamp()
        })
      })

      console.log(`Verifier scores synced to match scorer for hole ${hole}`)
    } catch (err: any) {
      console.error(`Failed to sync verifier scores for hole ${hole}:`, err)
      set({ error: err.message })
      throw err
    }
  }
}))

