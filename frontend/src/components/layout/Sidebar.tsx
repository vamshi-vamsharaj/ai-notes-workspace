// frontend/src/components/layout/Sidebar.tsx
// REDESIGN goals:
// - Floating gradient active indicator (Linear-style)
// - Better typography hierarchy + spacing
// - Gradient accent on active icons
// - Workspace branding area
// - Glassmorphism bottom user strip
// - Mobile drawer unchanged (already works)
// - Sidebar content NEVER scrolls the page (h-full flex-col)

import { useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Archive, BarChart2, PenLine,
  ChevronLeft, Hash, Sparkles, X, Plus,
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useNotesStore } from '@/store/notesStore'
import { useAuthStore } from '@/store/authStore'

const NAV_ITEMS = [
  { to: '/dashboard', icon: BarChart2, label: 'Overview', end: true },
  { to: '/notes', icon: FileText, label: 'Notes', end: true },
  { to: '/notes/archived', icon: Archive, label: 'Archive', end: false },
  { to: '/analytics', icon: Sparkles, label: 'AI Insights', end: true },
]

// ── Shared sidebar content tree ───────────────────────────────────────────────
function SidebarInner({
  expanded,
  onClose,
}: {
  expanded: boolean
  onClose?: () => void
}) {
  const { tags, applyFilter, createNote, isCreating } = useNotesStore()
  const { user } = useAuthStore()
  const { toggleSidebar } = useUIStore()
  const navigate = useNavigate()

  const handleTagClick = (tagId: string) => {
    navigate('/notes')
    applyFilter({ tag_id: tagId, is_archived: false })
  }

  const handleNewNote = async () => {
    try {
      const note = await createNote({ title: 'Untitled', content: '' })
      navigate(`/notes/${note.id}`)
    } catch {
      // error in store
    }
  }

  return (
    // h-full ensures the sidebar column is exactly viewport height
    <div className="flex flex-col h-full relative">

      {/* ── Logo / workspace area ── */}
      <div
        className="h-14 flex items-center gap-2.5 px-4 border-b shrink-0"
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
          {expanded && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.14 }}
              className="flex items-center justify-between flex-1 min-w-0"
            >
              <div>
                <p
                  className="text-sm font-semibold tracking-tight leading-none"
                  style={{ color: 'var(--text-primary)' }}
                >
                  NoteFlow
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  Workspace
                </p>
              </div>

              {onClose && (
                <button
                  onClick={onClose}
                  className="lg:hidden w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <X size={14} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Quick action: new note ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 pt-3 pb-1 shrink-0"
          >
            <button
              onClick={handleNewNote}
              disabled={isCreating}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.2)',
                color: 'var(--accent-violet-bright)',
              }}
            >
              <Plus size={13} />
              New note
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nav section label ── */}
      <AnimatePresence>
        {expanded && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pt-4 pb-1.5 text-xs font-semibold uppercase tracking-widest shrink-0"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Navigation
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Nav items ── */}
      <nav className="px-2 space-y-0.5 shrink-0">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm transition-all duration-150 relative group"
            style={({ isActive }) => ({
              color: isActive ? 'white' : 'var(--text-secondary)',
              background: isActive
                ? 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(91,33,182,0.12))'
                : 'transparent',
            })}
          >
            {({ isActive }) => (
              <>
                {/* Active left-border indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
                    style={{ background: 'var(--accent-violet-bright)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <Icon
                  size={16}
                  className="shrink-0"
                  style={{
                    color: isActive ? 'var(--accent-violet-bright)' : 'var(--text-tertiary)',
                  }}
                />

                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="whitespace-nowrap text-sm font-medium"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Tags section ── */}
      <AnimatePresence>
        {expanded && tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 px-2 shrink-0"
          >
            <p
              className="px-2.5 mb-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Tags
            </p>
            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              {tags.slice(0, 8).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagClick(tag.id)}
                  className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-xl text-xs transition-colors hover:bg-white/5 text-left"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Hash size={11} style={{ color: tag.color }} className="shrink-0" />
                  <span className="truncate">{tag.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="flex-1" />

      {/* ── Bottom user strip (glassmorphism) ── */}
      <div
        className="p-2 border-t shrink-0"
        style={{
          borderColor: 'var(--border-subtle)',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
        >
          <div
            className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p
                  className="text-xs font-semibold truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
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

      {/* ── Desktop collapse toggle ── */}
      <button
        onClick={toggleSidebar}
        className="absolute top-[17px] -right-0 w-8 h-8 rounded-full border hidden lg:flex items-center justify-center z-50 transition-all hover:scale-110"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border-default)',
          color: 'var(--text-secondary)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
        title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <motion.div
          animate={{ rotate: expanded ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronLeft size={13} />
        </motion.div>
      </button>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function Sidebar() {
  const { sidebarOpen, mobileNavOpen, setMobileNavOpen } = useUIStore()
  const location = useLocation()

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname, location.search]) // eslint-disable-line

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileNavOpen) setMobileNavOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileNavOpen]) // eslint-disable-line

  return (
    <>
      {/* ── Desktop ── */}
      <motion.aside
        initial={false}
animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative hidden lg:block shrink-0 border-r overflow-hidden"
        style={{
          borderColor: 'var(--border-subtle)',
          background: 'var(--bg-surface)',
          // h-full inherits from parent flex container (h-screen)
        }}
      >
        <SidebarInner expanded={sidebarOpen} />
      </motion.aside>

      {/* ── Mobile: backdrop + slide-in drawer ── */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
             className="fixed left-0 top-0 bottom-0 z-50 w-[260px] border-r lg:hidden"
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-surface)',
              }}
            >
              <SidebarInner
                expanded={true}
                onClose={() => setMobileNavOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}