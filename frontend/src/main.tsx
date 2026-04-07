import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthPage } from './components/auth/AuthPage.tsx'
import { useAuth } from './hooks/useAuth.ts'

function Root() {
  const { user, loading } = useAuth()

  if (loading) return null

  return user ? <App /> : <AuthPage />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
