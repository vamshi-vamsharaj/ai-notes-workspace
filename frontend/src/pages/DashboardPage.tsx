// frontend/src/pages/DashboardPage.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText, Sparkles, Tag, TrendingUp,
  Clock, Plus, ArrowRight
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNotesStore } from '@/store/notesStore'
import { NoteCard } from '@/components/notes/NoteCard'
import { NotesSkeleton } from '@/components/notes/NotesSkeleton'

const stagger = {
  container: {
    animate: {
      transition: {
        staggerChildren: 0.06,
      },
    },
  },

  item: {
    initial: {
      opacity: 0,
      y: 14,
    },

    animate: {
      opacity: 1,
      y: 0,

      transition: {
        duration: 0.25,
      },
    },
  },
} as const

export function DashboardPage() {
  const { user } = useAuthStore()
  const { notes, tags, isLoading, total, fetchNotes, fetchTags, createNote, isCreating } = useNotesStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotes({ is_archived: false, sort: 'updated_at' })
    fetchTags()
  }, []) // eslint-disable-line

  const recentNotes = notes.slice(0, 4)
  const topTags = [...tags]
    .sort((a, b) => {
      const aCount = notes.filter((n) => n.tags.some((t) => t.id === a.id)).length
      const bCount = notes.filter((n) => n.tags.some((t) => t.id === b.id)).length
      return bCount - aCount
    })
    .slice(0, 5)

  const aiNotes = notes.filter((n) => n.ai_summary).length

  const handleCreate = async () => {
    const note = await createNote({ title: 'Untitled', content: '' })
    navigate(`/notes/${note.id}`)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {greeting},{' '}
              <span style={{ color: 'var(--accent-violet-bright)' }}>
                {user?.name?.split(' ')[0]}
              </span>
            </h1>
          </div>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
          >
            <Plus size={15} />
            New note
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
      >
        {[
          {
            label: 'Total notes',
            value: isLoading ? '—' : total,
            icon: FileText,
            color: 'var(--accent-violet)',
            bg: 'rgba(124,58,237,0.08)',
          },
          {
            label: 'AI summaries',
            value: isLoading ? '—' : aiNotes,
            icon: Sparkles,
            color: '#10b981',
            bg: 'rgba(16,185,129,0.08)',
          },
          {
            label: 'Tags created',
            value: isLoading ? '—' : tags.length,
            icon: Tag,
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.08)',
          },
          {
            label: 'This week',
            value: isLoading ? '—' : notes.filter((n) => {
              const d = new Date(n.updated_at)
              const weekAgo = new Date()
              weekAgo.setDate(weekAgo.getDate() - 7)
              return d > weekAgo
            }).length,
            icon: TrendingUp,
            color: '#3b82f6',
            bg: 'rgba(59,130,246,0.08)',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <motion.div
            key={label}
            variants={stagger.item}
            className="rounded-xl p-4"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
              style={{ background: bg }}
            >
              <Icon size={15} style={{ color }} />
            </div>
            <p className="text-2xl font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
              {value}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent notes */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={13} style={{ color: 'var(--text-tertiary)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Recent notes
              </h2>
            </div>
            <button
              onClick={() => navigate('/notes')}
              className="flex items-center gap-1 text-xs hover:opacity-70 transition-opacity"
              style={{ color: 'var(--accent-violet-bright)' }}
            >
              View all <ArrowRight size={11} />
            </button>
          </div>

          {isLoading ? (
            <NotesSkeleton count={4} />
          ) : recentNotes.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center border border-dashed"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>
                No notes yet. Create one to get started.
              </p>
              <button
                onClick={handleCreate}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-90"
                style={{ background: 'var(--accent-violet)', color: 'white' }}
              >
                + New note
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentNotes.map((note, i) => (
                <NoteCard key={note.id} note={note} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Top tags */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Tag size={13} style={{ color: 'var(--text-tertiary)' }} />
              <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Most used tags
              </h3>
            </div>
            {topTags.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No tags created yet</p>
            ) : (
              <div className="space-y-2">
                {topTags.map((tag) => {
                  const count = notes.filter((n) => n.tags.some((t) => t.id === tag.id)).length
                  return (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => navigate(`/notes?tag=${tag.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: tag.color }} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {tag.name}
                        </span>
                      </div>
                      <span className="text-xs px-1.5 py-0.5 rounded-md"
                        style={{ background: 'var(--bg-overlay)', color: 'var(--text-tertiary)' }}>
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
          >
            <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Quick actions
            </h3>
            <div className="space-y-1">
              {[
                { label: 'Browse all notes', icon: FileText, to: '/notes' },
                { label: 'View archive', icon: FileText, to: '/notes/archived' },
                { label: 'AI Insights', icon: Sparkles, to: '/analytics' },
              ].map(({ label, icon: Icon, to }) => (
                <button
                  key={label}
                  onClick={() => navigate(to)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs hover:bg-white/5 transition-colors text-left"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Icon size={13} style={{ color: 'var(--text-tertiary)' }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}