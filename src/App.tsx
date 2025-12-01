import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard, GuestGuard } from './components/auth/auth-guard'
import LoginPage from './pages/login'
import RegisterPage from './pages/register'
import Dashboard from './pages/dashboard'
import TournamentsPage from './pages/tournaments'
import CoursesPage from './pages/courses'
import PlayersPage from './pages/players'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
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

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <AuthGuard>
            <Dashboard />
          </AuthGuard>
        } />
        <Route path="/tournaments" element={
          <AuthGuard>
            <TournamentsPage />
          </AuthGuard>
        } />
        <Route path="/courses" element={
          <AuthGuard>
            <CoursesPage />
          </AuthGuard>
        } />
        <Route path="/players" element={
          <AuthGuard>
            <PlayersPage />
          </AuthGuard>
        } />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
