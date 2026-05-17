// frontend/src/components/layout/Navbar.tsx
// FIXES:
// 1. Added mobile hamburger menu button that opens sidebar drawer
// 2. Search debounce now correctly calls applyFilter (not fetchNotes directly)
//    so it doesn't blow away existing sort/tag filters
// 3. Profile dropdown: functional logout, settings placeholder, proper close-on-outside-click
// 4. Settings modal stub rendered inline

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LogOut, User, Settings, ChevronDown, Menu, X  } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useNotesStore } from '@/store/notesStore'
import { useUIStore } from '@/store/uiStore'
import { useDebounce } from '@/hooks/useDebounce'

export function Navbar() {
  const { user, logout } = useAuthStore()
  const { applyFilter, filters } = useNotesStore()
  const { toggleMobileNav, mobileNavOpen } = useUIStore()
  const navigate = useNavigate()

  const [search, setSearch] = useState(filters.search ?? '')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebounce(search, 380)

  // Apply search filter when debounced value changes
  // FIX: use applyFilter so we don't stomp existing tag/sort filters
  useEffect(() => {
    applyFilter({ search: debouncedSearch || undefined })
  }, [debouncedSearch]) // eslint-disable-line

  // Close profile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    setProfileMenuOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  const handleClearSearch = () => {
    setSearch('')
    applyFilter({ search: undefined })
  }

  return (
    <>
      <header
        className="h-14 shrink-0 flex items-center gap-3 px-4 border-b"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        {/* Mobile hamburger */}
        <button
          onClick={toggleMobileNav}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 transition-colors shrink-0"
          style={{ color: 'var(--text-secondary)' }}
          aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileNavOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        {/* Search bar */}
        <div className="flex-1 max-w-sm relative left-7">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="w-full pl-8 pr-8 py-1.5 rounded-lg text-sm outline-none transition-all"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          />
          {/* Clear search */}
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors hover:opacity-70"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {/* Notification bell — placeholder */}
          

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              {/* Avatar */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
              >
                {user?.name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <span
                className="text-sm hidden sm:block max-w-[100px] truncate"
                style={{ color: 'var(--text-secondary)' }}
              >
                {user?.name?.split(' ')[0]}
              </span>
              <ChevronDown
                size={12}
                style={{
                  color: 'var(--text-tertiary)',
                  transform: profileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </button>

            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden z-50"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* User info header */}
                  <div
                    className="px-3.5 py-3 border-b"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
                      >
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {user?.name}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-1">
                    <DropdownItem
                      icon={<User size={13} />}
                      label="Profile"
                      onClick={() => {
                        setProfileMenuOpen(false)
                        // Profile page — Phase 6
                      }}
                    />
                    <DropdownItem
                      icon={<Settings size={13} />}
                      label="Settings"
                      onClick={() => {
                        setProfileMenuOpen(false)
                        setSettingsOpen(true)
                      }}
                    />

                    <div
                      className="my-1 mx-1 border-t"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    />

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:bg-red-500/10"
                      style={{ color: '#ef4444' }}
                    >
                      <LogOut size={13} />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Settings modal placeholder ── */}
      <AnimatePresence>
        {settingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setSettingsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ pointerEvents: 'none' }}
            >
              <div
                className="w-full max-w-md rounded-2xl p-6"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                  pointerEvents: 'auto',
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2
                    className="text-base font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Settings
                  </h2>
                  <button
                    onClick={() => setSettingsOpen(false)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Settings sections */}
                {[
                  { label: 'Account', items: ['Edit profile', 'Change password', 'Delete account'] },
                  { label: 'Preferences', items: ['Theme', 'Notifications', 'Language'] },
                  { label: 'Integrations', items: ['API keys', 'Connected apps'] },
                ].map((section) => (
                  <div key={section.label} className="mb-5">
                    <p
                      className="text-xs font-medium uppercase tracking-wider mb-2"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {section.label}
                    </p>
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{ border: '1px solid var(--border-subtle)' }}
                    >
                      {section.items.map((item, i) => (
                        <button
                          key={item}
                          className="flex items-center justify-between w-full px-3.5 py-2.5 text-sm hover:bg-white/5 transition-colors"
                          style={{
                            color: 'var(--text-secondary)',
                            borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
                          }}
                        >
                          {item}
                          <span style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>›</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <p
                  className="text-xs text-center mt-4"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  NoteFlow v1.0.0 · Phase 3
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// Reusable dropdown menu item
function DropdownItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
      style={{ color: 'var(--text-secondary)' }}
    >
      {icon}
      {label}
    </button>
  )
}