import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard, GuestGuard } from './components/auth/auth-guard'
import { AdminLayout } from './layouts/admin-layout'
import { DeviceGuard } from './components/common/mobile-only-warning'
import LoginPage from './pages/login'
import RegisterPage from './pages/register'
import Dashboard from './pages/dashboard'
import TournamentsPage from './pages/tournaments'
import CoursesPage from './pages/courses'
import PlayersPage from './pages/players'
import GameSetupPage from './pages/game-setup'
import ScorecardPage from './pages/scorecard'
import './App.css'

function App() {
  return (
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

        {/* Protected Mobile Scoring Routes - Scoring Layout */}
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
  )
}

export default App
