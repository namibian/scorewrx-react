import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'

interface AuthGuardProps {
  children: ReactNode
}

/**
 * AuthGuard - Protects routes that require authentication
 * Redirects to login if user is not authenticated
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, initialized } = useAuthStore()
  const location = useLocation()

  // Wait for auth to initialize before making routing decisions
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // User is authenticated, render children
  return <>{children}</>
}

/**
 * GuestGuard - Protects routes that should only be accessible to non-authenticated users
 * Redirects to dashboard if user is already authenticated
 */
export function GuestGuard({ children }: AuthGuardProps) {
  const { user, initialized } = useAuthStore()

  // Wait for auth to initialize
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to dashboard if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  // User is not authenticated, render children
  return <>{children}</>
}

