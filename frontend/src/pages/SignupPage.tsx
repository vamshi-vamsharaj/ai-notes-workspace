// frontend/src/pages/SignupPage.tsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import type { SignupFormData } from '@/types/auth.types'

type FormErrors = Partial<SignupFormData>

function getStrength(pw: string) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

const strengthMeta = [
  { label: 'Too short', color: 'var(--border-subtle)' },
  { label: 'Weak', color: '#ef4444' },
  { label: 'Fair', color: '#f59e0b' },
  { label: 'Good', color: '#3b82f6' },
  { label: 'Strong', color: '#10b981' },
]

const SignupPage = () => {
  const navigate = useNavigate()
  const { signup, isLoading, isAuthenticated, error, clearError } = useAuthStore()

  const [formData, setFormData] = useState<SignupFormData>({
    name: '', email: '', password: '', confirmPassword: '',
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => { if (isAuthenticated) navigate('/dashboard', { replace: true }) }, [isAuthenticated])
  useEffect(() => () => clearError(), [])

  const strength = getStrength(formData.password)
  const strengthInfo = strengthMeta[strength]

  const validate = (): boolean => {
    const errors: FormErrors = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.email) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Enter a valid email'
    if (!formData.password) errors.password = 'Password is required'
    else if (formData.password.length < 6) errors.password = 'Minimum 6 characters'
    if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = 'Passwords don\'t match'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await signup(formData.email, formData.password, formData.name)
  }

  const update = (field: keyof SignupFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((p) => ({ ...p, [field]: e.target.value }))
    setFormErrors((p) => ({ ...p, [field]: undefined }))
    clearError()
  }

  const inputStyle = (field: keyof SignupFormData): React.CSSProperties => ({
    background: 'var(--bg-elevated)',
    border: `1px solid ${
      formErrors[field] ? 'rgba(239,68,68,0.5)' :
      focusedField === field ? 'rgba(124,58,237,0.5)' :
      'var(--border-default)'
    }`,
    color: 'var(--text-primary)',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(124,58,237,0.08)' : 'none',
  })

  const passwordChecks = [
    { label: 'At least 6 characters', pass: formData.password.length >= 6 },
    { label: 'Contains a number', pass: /[0-9]/.test(formData.password) },
    { label: 'Passwords match', pass: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-base)' }}>
      {/* Background glow */}
      <div
        className="fixed top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(124,58,237,0.06)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-sm relative"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}
          >
            <span className="text-white font-bold text-sm serif italic">N</span>
          </div>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>NoteFlow</span>
        </div>

        <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Create your account
        </h1>
        <p className="text-sm mb-7" style={{ color: 'var(--text-tertiary)' }}>
          Free forever. No credit card needed.
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-5 px-3.5 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Full name</label>
            <input
              type="text"
              value={formData.name}
              onChange={update('name')}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              placeholder="Jane Smith"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={inputStyle('name')}
            />
            {formErrors.name && <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>{formErrors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Email address</label>
            <input
              type="email"
              value={formData.email}
              onChange={update('email')}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={inputStyle('email')}
            />
            {formErrors.email && <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>{formErrors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={update('password')}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Min. 6 characters"
                className="w-full px-3.5 py-2.5 pr-11 rounded-xl text-sm outline-none transition-all duration-200"
                style={inputStyle('password')}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--text-tertiary)' }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Strength bar */}
            {formData.password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex-1 h-0.5 rounded-full transition-all duration-300"
                      style={{ background: i <= strength ? strengthInfo.color : 'var(--border-subtle)' }}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: strengthInfo.color }}>{strengthInfo.label}</p>
              </div>
            )}

            {formErrors.password && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{formErrors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Confirm password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={update('confirmPassword')}
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => setFocusedField(null)}
              placeholder="Repeat password"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={inputStyle('confirmPassword')}
            />
            {formErrors.confirmPassword && (
              <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>{formErrors.confirmPassword}</p>
            )}
          </div>

          {/* Password checklist */}
          {formData.password.length > 0 && (
            <div className="space-y-1.5">
              {passwordChecks.map(({ label, pass }) => (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-200"
                    style={{ background: pass ? 'rgba(16,185,129,0.15)' : 'var(--bg-elevated)', border: `1px solid ${pass ? '#10b981' : 'var(--border-default)'}` }}
                  >
                    {pass && <Check size={9} style={{ color: '#10b981' }} />}
                  </div>
                  <span className="text-xs transition-colors duration-200"
                    style={{ color: pass ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={isLoading}
            whileTap={{ scale: 0.98 }}
            className="relative w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white overflow-hidden transition-opacity disabled:opacity-60 mt-2"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}
          >
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 100%)' }} />
            {isLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create account</span>
                <ArrowRight size={14} />
              </>
            )}
          </motion.button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-tertiary)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium hover:opacity-80 transition-opacity" style={{ color: 'var(--accent-violet-bright)' }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default SignupPage