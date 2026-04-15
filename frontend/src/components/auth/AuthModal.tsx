import { useState } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'
import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface AuthModalProps {
  initialMode?: 'login' | 'signup'
  onClose: () => void
}

export function AuthModal({ initialMode = 'login', onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth()

  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const switchMode = (signup: boolean) => {
    setIsSignUp(signup)
    setError(null)
    setMessage(null)
  }

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
      onClose()
      // AuthRoute / LandingPage will react to the user state update from onAuthStateChange
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <Card
          className="border-white/10 pb-0 overflow-hidden"
          style={{ background: 'rgba(6, 10, 20, 0.97)' }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white/30 hover:text-white/70 transition-colors rounded-md p-1 hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <CardHeader className="flex flex-col items-center gap-3 pb-6 pt-8">
            {/* Logo */}
            <div className="h-11 w-11 bg-cyan-500 rounded-xl flex items-center justify-center text-[#05080f] text-lg font-bold shadow-lg shadow-cyan-500/20">
              B
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-semibold text-white">
                {isSignUp ? 'Create an account' : 'Sign in to BugScribe'}
              </h2>
              <p className="text-sm text-white/40">
                {isSignUp
                  ? 'Start writing better bug reports.'
                  : 'Welcome back. Enter your details.'}
              </p>
            </div>
          </CardHeader>

          {/* Form */}
          <CardContent className="px-8 pb-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="auth-email" className="text-white/60 text-xs uppercase tracking-wide font-mono">
                  Email address
                </Label>
                <Input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/40 focus-visible:border-cyan-500/60 focus-visible:ring-cyan-500/15 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auth-password" className="text-white/60 text-xs uppercase tracking-wide font-mono">
                    Password
                  </Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      className="text-xs text-cyan-400/70 hover:text-cyan-400 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10 bg-white/[0.05] border-white/10 text-white placeholder:text-white/40 focus-visible:border-cyan-500/60 focus-visible:ring-cyan-500/15 h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isSignUp && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="auth-remember"
                    className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                  />
                  <label htmlFor="auth-remember" className="text-sm text-white/40 font-normal cursor-pointer">
                    Remember me
                  </label>
                </div>
              )}

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

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#05080f] font-semibold h-10 mt-2 disabled:opacity-50 transition-colors"
              >
                {loading
                  ? 'Please wait…'
                  : isSignUp
                    ? 'Create account'
                    : 'Sign in'}
              </Button>
            </form>
          </CardContent>

          {/* Footer toggle */}
          <CardFooter className="flex justify-center border-t border-white/[0.07] py-4 mt-4">
            <p className="text-sm text-white/35">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => switchMode(!isSignUp)}
                className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
