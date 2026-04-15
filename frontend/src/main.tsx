import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthPage } from './components/auth/AuthPage.tsx'
import { LandingPage } from './pages/LandingPage.tsx'
import { AuthProvider, useAuth } from './context/AuthContext.tsx'

function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <App /> : <Navigate to="/" replace />
}

function AuthRoute({ mode }: { mode: 'login' | 'signup' }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/app" replace /> : <AuthPage mode={mode} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthRoute mode="login" />} />
          <Route path="/signup" element={<AuthRoute mode="signup" />} />
          <Route path="/app" element={<ProtectedRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
