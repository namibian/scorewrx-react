import { create } from 'zustand'
import { auth, db } from '@/lib/firebase/config'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import type { User, UserProfile } from '@/types'

interface AuthState {
  user: User | null
  userProfile: UserProfile | null
  error: string | null
  loading: boolean
  initialized: boolean
  
  // Actions
  init: () => Promise<void>
  fetchUserProfile: (uid: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  setUserProfile: (profile: UserProfile | null) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  error: null,
  loading: false,
  initialized: false,

  // Initialize auth state and persistence
  init: async () => {
    try {
      await setPersistence(auth, browserLocalPersistence)
      
      // Set up auth state listener
      onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email
          }
          set({ user })
          
          // Fetch user profile
          await get().fetchUserProfile(firebaseUser.uid)
        } else {
          set({ user: null, userProfile: null })
        }
        
        set({ initialized: true })
      })
    } catch (err) {
      console.error('Failed to set auth persistence:', err)
      set({ error: 'Failed to set auth persistence', initialized: true })
    }
  },

  // Fetch user profile data from Firestore
  fetchUserProfile: async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      
      if (userDoc.exists()) {
        const data = userDoc.data()
        
        // Helper to convert various date formats to Date object
        const toDate = (value: any): Date => {
          if (!value) return new Date()
          if (value instanceof Date) return value
          if (typeof value?.toDate === 'function') return value.toDate()
          if (typeof value === 'string' || typeof value === 'number') return new Date(value)
          return new Date()
        }
        
        const profile: UserProfile = {
          email: data.email,
          affiliation: data.affiliation,
          firstName: data.firstName,
          lastName: data.lastName,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt)
        }
        
        // Warn if affiliation is missing
        if (!profile.affiliation) {
          console.warn('User profile is missing affiliation field. Please add an "affiliation" field to the user document in Firebase.')
        }
        
        set({ userProfile: profile })
      } else {
        console.error('User document does not exist at: users/' + uid)
        set({ userProfile: null })
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
      set({ userProfile: null })
    }
  },

  // Sign up
  signup: async (email: string, password: string) => {
    set({ error: null, loading: true })
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password)
      if (!res) throw new Error('Could not complete signup')
      
      const user: User = {
        uid: res.user.uid,
        email: res.user.email
      }
      set({ user })
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Login
  login: async (email: string, password: string) => {
    set({ error: null, loading: true })
    try {
      const res = await signInWithEmailAndPassword(auth, email, password)
      if (!res) throw new Error('Could not complete login')
      
      const user: User = {
        uid: res.user.uid,
        email: res.user.email
      }
      set({ user })
      await get().fetchUserProfile(res.user.uid)
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Logout
  logout: async () => {
    set({ error: null })
    try {
      await signOut(auth)
      set({ user: null, userProfile: null })
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  // Set user (for internal use)
  setUser: (user: User | null) => {
    set({ user })
  },

  // Set user profile (for internal use)
  setUserProfile: (profile: UserProfile | null) => {
    set({ userProfile: profile })
  }
}))

// Initialize auth on store creation
useAuthStore.getState().init()

