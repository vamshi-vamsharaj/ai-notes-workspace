// frontend/src/pages/LoginPage.tsx
import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Zap, Lock, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import type { LoginFormData } from '@/types/auth.types'

const features = [
  { icon: Sparkles, label: 'AI-powered summaries', desc: 'One click to extract insights from any note' },
  { icon: Zap, label: 'Instant search', desc: 'Find anything across all your notes instantly' },
  { icon: Lock, label: 'Private by default', desc: 'Share only what you want, with anyone' },
]

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, isAuthenticated, error, clearError } = useAuthStore()
  const from = (location.state as any)?.from?.pathname || '/dashboard'

  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' })
  const [formErrors, setFormErrors] = useState<Partial<LoginFormData>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
  if (isAuthenticated) {
    navigate(from, { replace: true })
  }
}, [isAuthenticated, navigate, from])
  useEffect(() => () => clearError(), [])

  const validate = (): boolean => {
    const errors: Partial<LoginFormData> = {}
    if (!formData.email) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Enter a valid email'
    if (!formData.password) errors.password = 'Password is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
await login(formData.email, formData.password)

console.log("LOGIN STATE:", useAuthStore.getState())
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* ─── Left branding panel ─── */}
      <div
        className="hidden lg:flex w-[420px] xl:w-[480px] shrink-0 flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}
      >
        {/* Dot grid bg */}
        <div className="absolute inset-0 dot-grid opacity-40" />

        {/* Glow orb */}
        <div
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(124,58,237,0.12)' }}
        />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative flex items-center gap-3"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}
          >
            <span className="text-white font-bold text-sm serif italic">N</span>
          </div>
          <div>
            <span className="text-white font-semibold tracking-tight">NoteFlow</span>
            <span
              className="ml-2 text-xs px-1.5 py-0.5 rounded-md font-medium"
              style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--accent-violet-bright)' }}
            >
              AI
            </span>
          </div>
        </motion.div>

        {/* Main copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--text-tertiary)' }}>
            Your AI workspace
          </p>
          <h2 className="text-3xl font-light leading-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            Think clearly.
          </h2>
          <h2 className="text-3xl leading-tight mb-8" style={{ color: 'var(--text-primary)' }}>
            <span className="serif italic" style={{ color: 'var(--accent-violet-bright)' }}>Write</span> freely.
          </h2>

          <div className="space-y-4">
            {features.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
                className="flex items-start gap-3"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}
                >
                  <Icon size={13} style={{ color: 'var(--accent-violet-bright)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative text-xs"
          style={{ color: 'var(--text-tertiary)' }}
        >
          © 2026 NoteFlow · Built for clarity
        </motion.p>
      </div>

      {/* ─── Right: auth form ─── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}>
              <span className="text-white font-bold text-sm serif italic">N</span>
            </div>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>NoteFlow</span>
          </div>

          <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-tertiary)' }}>
            Sign in to your workspace
          </p>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 px-3.5 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#fca5a5',
              }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Email address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, email: e.target.value }))
                  setFormErrors((p) => ({ ...p, email: undefined }))
                  clearError()
                }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: 'var(--bg-elevated)',
                  border: `1px solid ${formErrors.email ? 'rgba(239,68,68,0.5)' : focusedField === 'email' ? 'rgba(124,58,237,0.5)' : 'var(--border-default)'}`,
                  color: 'var(--text-primary)',
                  boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(124,58,237,0.08)' : 'none',
                }}
              />
              {formErrors.email && (
                <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>{formErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, password: e.target.value }))
                    setFormErrors((p) => ({ ...p, password: undefined }))
                    clearError()
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-11 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: `1px solid ${formErrors.password ? 'rgba(239,68,68,0.5)' : focusedField === 'password' ? 'rgba(124,58,237,0.5)' : 'var(--border-default)'}`,
                    color: 'var(--text-primary)',
                    boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(124,58,237,0.08)' : 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>{formErrors.password}</p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="relative w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white overflow-hidden transition-opacity disabled:opacity-60 mt-1"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}
            >
              {/* Shimmer on hover */}
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 100%)' }} />

              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight size={14} />
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-tertiary)' }}>
            No account?{' '}
            <Link to="/signup" className="font-medium transition-colors hover:opacity-80" style={{ color: 'var(--accent-violet-bright)' }}>
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage