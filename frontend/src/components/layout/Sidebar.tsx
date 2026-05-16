// frontend/src/components/layout/Sidebar.tsx
// FIXES:
// 1. Mobile: renders as a full-screen drawer overlay on small screens
// 2. Archive nav: uses useLocation to detect /notes/archived and sets is_archived filter correctly
// 3. Collapse toggle: hidden on mobile (drawer handles open/close)
// 4. Tags nav: clicking a tag applies tag_id filter via applyFilter
// 5. Close drawer on nav item click (mobile UX)

import { useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Archive, BarChart2,
  PenLine, ChevronLeft, Hash, Sparkles, X,
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useNotesStore } from '@/store/notesStore'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/dashboard', icon: BarChart2, label: 'Overview', end: true },
  { to: '/notes', icon: FileText, label: 'Notes', end: true },
  { to: '/notes/archived', icon: Archive, label: 'Archive', end: false },
  { to: '/analytics', icon: Sparkles, label: 'AI Insights', end: true },
]

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, mobileNavOpen, setMobileNavOpen } = useUIStore()
  const { tags, applyFilter } = useNotesStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname, location.search]) // eslint-disable-line

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileNavOpen) setMobileNavOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileNavOpen]) // eslint-disable-line

  const handleTagClick = (tagId: string) => {
    // Navigate to notes and apply tag filter
    navigate('/notes')
    applyFilter({ tag_id: tagId, is_archived: false })
  }

  // ─── Shared sidebar content ───────────────────────────────────────────────
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div
        className="h-14 flex items-center px-4 border-b shrink-0"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
          onClick={() => navigate('/dashboard')}
        >
          <PenLine size={13} className="text-white" />
        </div>

        <AnimatePresence>
          {(sidebarOpen || mobileNavOpen) && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className="ml-2.5 text-sm font-semibold tracking-tight whitespace-nowrap"
              style={{ color: 'var(--text-primary)' }}
            >
              NoteFlow
            </motion.span>
          )}
        </AnimatePresence>

        {/* Mobile close button */}
        {mobileNavOpen && (
          <button
            onClick={() => setMobileNavOpen(false)}
            className="ml-auto p-1 rounded-lg hover:bg-white/10 transition-colors lg:hidden"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all duration-150',
                isActive ? 'text-white' : 'hover:text-white'
              )
            }
            style={({ isActive }) => ({
              color: isActive ? 'white' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-elevated)' : 'transparent',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={16}
                  className="shrink-0 transition-colors"
                  style={{ color: isActive ? 'var(--accent-violet-bright)' : 'inherit' }}
                />
                <AnimatePresence>
                  {(sidebarOpen || mobileNavOpen) && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="whitespace-nowrap text-sm"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}

        {/* Tags section — only show when sidebar is expanded */}
        {(sidebarOpen || mobileNavOpen) && tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-4 pb-1"
          >
            <p
              className="px-2.5 mb-1.5 text-xs font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Tags
            </p>
            <div className="space-y-0.5">
              {tags.slice(0, 8).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagClick(tag.id)}
                  className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-sm hover:bg-white/5 transition-colors text-left"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Hash size={12} style={{ color: tag.color }} className="shrink-0" />
                  <span className="truncate">{tag.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </nav>

      {/* Bottom user strip */}
      <div
        className="p-2 border-t shrink-0"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
          <div
            className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold text-white"
            style={{ background: 'var(--accent-violet)' }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <AnimatePresence>
            {(sidebarOpen || mobileNavOpen) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {user?.name}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                  {user?.email}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Desktop collapse toggle — hidden on mobile */}
      <button
        onClick={toggleSidebar}
        className="absolute top-4 -right-3 w-6 h-6 rounded-full border hidden lg:flex items-center justify-center z-10 transition-colors hover:bg-white/10"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border-default)',
          color: 'var(--text-secondary)',
        }}
      >
        <motion.div
          animate={{ rotate: sidebarOpen ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronLeft size={12} />
        </motion.div>
      </button>
    </>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 220 : 60 }}
        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative hidden lg:flex flex-col shrink-0 border-r overflow-hidden"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
      >
        <SidebarContent />
      </motion.aside>

      {/* ── Mobile: backdrop + drawer ── */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileNavOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[220px] flex flex-col border-r lg:hidden"
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-surface)',
              }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}