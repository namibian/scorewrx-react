/**
 * Tournament Session Management Hook
 * 
 * Manages the tournament session state using sessionStorage.
 * This allows players to access the scoring feature via tournament code
 * without requiring authentication.
 */

const STORAGE_KEY = 'scorewrx_tournament_session'

interface TournamentSession {
  tournamentId: string
  tournamentCode: string
  timestamp: string
}

/**
 * Get the current tournament session from sessionStorage
 */
export function getTournamentSession(): TournamentSession | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as TournamentSession
    }
  } catch (error) {
    console.error('Error loading tournament session:', error)
  }
  return null
}

/**
 * Set the tournament session in sessionStorage
 */
export function setTournamentSession(tournamentId: string, tournamentCode: string): void {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tournamentId,
        tournamentCode,
        timestamp: new Date().toISOString(),
      })
    )
  } catch (error) {
    console.error('Error saving tournament session:', error)
  }
}

/**
 * Clear the tournament session from sessionStorage
 */
export function clearTournamentSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing tournament session:', error)
  }
}

/**
 * Check if a valid tournament session exists
 */
export function hasSession(): boolean {
  const session = getTournamentSession()
  return !!session?.tournamentId
}

/**
 * Get the tournament ID from the current session
 */
export function getSessionTournamentId(): string | null {
  return getTournamentSession()?.tournamentId || null
}

/**
 * Get the tournament code from the current session
 */
export function getSessionTournamentCode(): string | null {
  return getTournamentSession()?.tournamentCode || null
}

/**
 * React hook for tournament session management
 */
export function useTournamentSession() {
  return {
    getSession: getTournamentSession,
    setSession: setTournamentSession,
    clearSession: clearTournamentSession,
    hasSession,
    getTournamentId: getSessionTournamentId,
    getTournamentCode: getSessionTournamentCode,
  }
}

