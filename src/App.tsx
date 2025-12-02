import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard, GuestGuard } from './components/auth/auth-guard'
import { AdminLayout } from './layouts/admin-layout'
import { DeviceGuard } from './components/common/mobile-only-warning'
import { Toaster } from 'sonner'
import LoginPage from './pages/login'
import RegisterPage from './pages/register'
import Dashboard from './pages/dashboard'
import TournamentsPage from './pages/tournaments'
import CoursesPage from './pages/courses'
import PlayersPage from './pages/players'
import GameSetupPage from './pages/game-setup'
import ScorecardPage from './pages/scorecard'
import TournamentRegistrationPage from './pages/tournament-registration'

// Scoring flow pages (public - no auth required)
import TournamentCodeEntryPage from './pages/scoring/tournament-code-entry'
import PlayerLandingPage from './pages/scoring/player-landing'

import './App.css'

function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter>
      <Routes>
        {/* Public routes - No layout */}
        <Route path="/login" element={
          <GuestGuard>
            <LoginPage />
          </GuestGuard>
        } />
        <Route path="/register" element={
          <GuestGuard>
            <RegisterPage />
          </GuestGuard>
        } />
        
        {/* Public Tournament Registration Route - No auth required */}
        <Route path="/registration/:code" element={<TournamentRegistrationPage />} />

        {/* Public Scoring Routes - Mobile Only, No Auth Required */}
        <Route path="/scoring" element={
          <DeviceGuard requireMobile={true}>
            <TournamentCodeEntryPage />
          </DeviceGuard>
        } />
        <Route path="/scoring/select" element={
          <DeviceGuard requireMobile={true}>
            <PlayerLandingPage />
          </DeviceGuard>
        } />
        <Route path="/scoring/setup/:tournamentId/:playerId/:groupId" element={
          <DeviceGuard requireMobile={true}>
            <GameSetupPage />
          </DeviceGuard>
        } />
        <Route path="/scoring/scorecard/:tournamentId/:playerId/:groupId" element={
          <DeviceGuard requireMobile={true}>
            <ScorecardPage />
          </DeviceGuard>
        } />

        {/* Protected Admin Routes - Desktop Layout */}
        <Route path="/dashboard" element={
          <AuthGuard>
            <DeviceGuard requireMobile={false} showWarning={false}>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </DeviceGuard>
          </AuthGuard>
        } />
        <Route path="/tournaments" element={
          <AuthGuard>
            <DeviceGuard requireMobile={false} showWarning={false}>
              <AdminLayout>
                <TournamentsPage />
              </AdminLayout>
            </DeviceGuard>
          </AuthGuard>
        } />
        <Route path="/courses" element={
          <AuthGuard>
            <DeviceGuard requireMobile={false} showWarning={false}>
              <AdminLayout>
                <CoursesPage />
              </AdminLayout>
            </DeviceGuard>
          </AuthGuard>
        } />
        <Route path="/players" element={
          <AuthGuard>
            <DeviceGuard requireMobile={false} showWarning={false}>
              <AdminLayout>
                <PlayersPage />
              </AdminLayout>
            </DeviceGuard>
          </AuthGuard>
        } />

        {/* Legacy Protected Mobile Scoring Routes - Keep for backward compatibility */}
        <Route path="/tournament/:tournamentId/group/:groupId/player/:playerId/setup" element={
          <AuthGuard>
            <DeviceGuard requireMobile={true}>
              <GameSetupPage />
            </DeviceGuard>
          </AuthGuard>
        } />
        <Route path="/tournament/:tournamentId/group/:groupId/player/:playerId/scorecard" element={
          <AuthGuard>
            <DeviceGuard requireMobile={true}>
              <ScorecardPage />
            </DeviceGuard>
          </AuthGuard>
        } />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 - Redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
