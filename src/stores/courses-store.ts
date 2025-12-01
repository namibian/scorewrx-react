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
import type { Course } from '@/types'

interface CoursesState {
  courses: Course[]
  loading: boolean
  error: string | null

  // Actions
  fetchCourses: () => Promise<void>
  getCourse: (id: string) => Promise<Course>
  createCourse: (courseData: Partial<Course>) => Promise<string>
  updateCourse: (id: string, courseData: Partial<Course>) => Promise<void>
  deleteCourse: (id: string) => Promise<void>
  getCourseById: (id: string) => Course | null
  fetchCourseById: (id: string) => Promise<Course>
}

export const useCoursesStore = create<CoursesState>((set, get) => ({
  courses: [],
  loading: false,
  error: null,

  // Get all courses
  fetchCourses: async () => {
    console.log('DEBUG: fetchCourses called')
    set({ loading: true, error: null })
    try {
      const coursesRef = collection(db, 'courses')
      const authStore = useAuthStore.getState()
      const userAffiliation = authStore.userProfile?.affiliation

      console.log('DEBUG: User affiliation:', userAffiliation)
      console.log('DEBUG: User profile:', authStore.userProfile)

      if (!userAffiliation) {
        console.warn('User affiliation not found in profile:', authStore.userProfile)
        set({ error: 'User affiliation not found' })
        return
      }

      // Get only courses with matching affiliation
      const q = query(coursesRef, where('affiliation', '==', userAffiliation))
      console.log('DEBUG: Executing query for affiliation:', userAffiliation)

      const snapshot = await getDocs(q)
      console.log('DEBUG: Query returned', snapshot.docs.length, 'courses')

      const coursesData = snapshot.docs.map((doc) => {
        const data = doc.data()
        const courseData: Course = {
          id: doc.id,
          name: data.name,
          affiliation: data.affiliation,
          location: data.location,
          description: data.description,
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          teeboxes: data.teeboxes || []
        }
        console.log('DEBUG: Course loaded:', courseData.name, 'ID:', courseData.id)
        return courseData
      })

      set({ courses: coursesData })
      console.log('DEBUG: All courses loaded successfully:', coursesData.length)
    } catch (err: any) {
      console.error('ERROR: fetchCourses failed:', err)
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Get a single course
  getCourse: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const courseDoc = await getDoc(doc(db, 'courses', id))
      if (!courseDoc.exists()) {
        throw new Error('Course not found')
      }
      const rawData = courseDoc.data()

      // Get holes data from first teebox
      const defaultTeebox = rawData.teeboxes?.[0]
      if (!defaultTeebox || !defaultTeebox.holes || defaultTeebox.holes.length !== 18) {
        throw new Error('Invalid course data: Course must have exactly 18 holes')
      }

      // Map holes data, ensuring all required properties exist
      const holes = defaultTeebox.holes.map((hole: any, idx: number) => {
        if (typeof hole.par !== 'number' || typeof hole.handicap !== 'number') {
          throw new Error(
            `Invalid hole data at position ${idx + 1}: Each hole must have handicap and par values`
          )
        }
        return {
          number: idx + 1,
          par: hole.par,
          handicap: hole.handicap
        }
      })

      // Create the course data object with validated holes
      const courseData: Course = {
        id: courseDoc.id,
        name: rawData.name,
        affiliation: rawData.affiliation,
        location: rawData.location,
        description: rawData.description,
        createdBy: rawData.createdBy,
        createdAt: rawData.createdAt?.toDate() || new Date(),
        lastUpdated: rawData.lastUpdated?.toDate() || new Date(),
        teeboxes: rawData.teeboxes || [],
        holes
      } as any

      return courseData
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Create course (requires authentication)
  createCourse: async (courseData: Partial<Course>) => {
    set({ loading: true, error: null })
    try {
      const authStore = useAuthStore.getState()
      if (!authStore.user) {
        throw new Error('Authentication required')
      }

      const coursesRef = collection(db, 'courses')
      const docRef = await addDoc(coursesRef, {
        ...courseData,
        affiliation: authStore.userProfile?.affiliation,
        createdAt: new Date(),
        createdBy: authStore.user?.uid || null,
        lastUpdated: new Date()
      })
      
      await get().fetchCourses()
      return docRef.id
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Update course (requires authentication)
  updateCourse: async (id: string, courseData: Partial<Course>) => {
    console.log('DEBUG: updateCourse called with ID:', id)
    console.log('DEBUG: courseData:', courseData)

    set({ loading: true, error: null })
    try {
      const authStore = useAuthStore.getState()
      console.log('DEBUG: authStore.user:', authStore.user)
      console.log('DEBUG: authStore.userProfile:', authStore.userProfile)

      if (!authStore.user) {
        throw new Error('Authentication required')
      }

      if (!id) {
        throw new Error('Course ID is required for updates')
      }

      const docRef = doc(db, 'courses', id)
      console.log('DEBUG: Document reference created for ID:', id)

      const updateData = {
        ...courseData,
        affiliation: authStore.userProfile?.affiliation,
        lastUpdated: new Date()
      }

      console.log('DEBUG: Final update data:', updateData)

      await updateDoc(docRef, updateData)
      console.log('DEBUG: Document updated successfully')

      await get().fetchCourses()
      console.log('DEBUG: Courses refetched successfully')
    } catch (err: any) {
      console.error('ERROR: updateCourse failed:', err)
      console.error('ERROR: Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
        id,
        courseData
      })
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Delete course (requires authentication)
  deleteCourse: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const authStore = useAuthStore.getState()
      if (!authStore.user) {
        throw new Error('Authentication required')
      }

      const docRef = doc(db, 'courses', id)
      await deleteDoc(docRef)
      await get().fetchCourses()
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  // Get course by ID from local state
  getCourseById: (id: string) => {
    const found = get().courses.find((c) => c.id === id)
    return found || null
  },

  // Fetch single course and update local state
  fetchCourseById: async (id: string) => {
    const course = await get().getCourse(id)
    
    set((state) => {
      const index = state.courses.findIndex((c) => c.id === id)
      if (index !== -1) {
        const updated = [...state.courses]
        updated[index] = course
        return { courses: updated }
      } else {
        return { courses: [...state.courses, course] }
      }
    })
    
    return course
  }
}))

