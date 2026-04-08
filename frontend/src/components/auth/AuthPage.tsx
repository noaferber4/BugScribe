import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(mode === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password)

    setLoading(false)

    if (error) {
      setError(error.message)
    } else if (isSignUp) {
      setMessage('Check your email to confirm your account.')
    } else {
      navigate('/app')
    }
  }

  const inputClass =
    'w-full px-3 py-2 text-sm bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 rounded-lg focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/15 transition-colors'

  return (
    <div className="min-h-screen bg-[#05080f] flex flex-col">
      {/* Navbar */}
      <header className="h-16 flex items-center px-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 bg-cyan-500 rounded flex items-center justify-center text-[#05080f] text-sm font-bold">
            B
          </div>
          <span className="font-semibold text-white tracking-tight">BugScribe</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white/[0.03] rounded-2xl border border-white/10 p-8">
          <h1 className="text-xl font-semibold text-white mb-1">
            {isSignUp ? 'Create account' : 'Sign in'}
          </h1>
          <p className="text-sm text-white/40 mb-6">
            {isSignUp ? 'Start writing better bug reports.' : 'Welcome back to BugScribe.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wide font-mono mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wide font-mono mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-lg px-3 py-2">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/30 disabled:cursor-not-allowed text-[#05080f] disabled:text-[#05080f]/50 text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-white/35">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null) }}
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
