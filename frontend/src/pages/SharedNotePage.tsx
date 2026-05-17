// frontend/src/pages/SharedNotePage.tsx
// WHY this page is completely standalone (no AppLayout, no auth):
// - Public URLs must work for anonymous users
// - Wrapping in AppLayout would require auth and show the sidebar
// - Clean public page = better impression for shared notes

import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Sparkles, Calendar,  ExternalLink } from 'lucide-react'
import { shareService } from '@/services/share.service'

interface PublicNote {
  title: string
  content: string
  tags: { name: string; color: string }[]
  ai_summary: string | null
  created_at: string
  updated_at: string
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

export function SharedNotePage() {
  const { token } = useParams<{ token: string }>()
  const [note, setNote] = useState<PublicNote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) return
    shareService.getPublicNote(token)
      .then(setNote)
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false))
  }, [token])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07070d' }}>
        <div
          className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(124,58,237,0.3)', borderTopColor: '#7c3aed' }}
        />
      </div>
    )
  }

  // ── Not found / revoked ────────────────────────────────────────────────────
  if (notFound || !note) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: '#07070d' }}>
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <FileText size={22} style={{ color: 'rgba(255,255,255,0.2)' }} />
        </div>
        <h1 className="text-lg font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
          Note not found
        </h1>
        <p className="text-sm text-center max-w-xs mb-8" style={{ color: 'rgba(255,255,255,0.3)' }}>
          This note may have been deleted or sharing was disabled by the owner.
        </p>
        <Link
          to="/login"
          className="text-xs px-4 py-2 rounded-lg transition-colors hover:opacity-90"
          style={{ background: '#7c3aed', color: 'white' }}
        >
          Sign in to NoteFlow
        </Link>
      </div>
    )
  }

  // ── Public note view ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#07070d' }}>
      {/* Subtle top gradient */}
      <div
        className="fixed top-0 inset-x-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(124,58,237,0.06), transparent)' }}
      />

      {/* Top bar */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b backdrop-blur-md"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          background: 'rgba(7,7,13,0.85)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
          >
            <span className="text-white font-bold text-xs">N</span>
          </div>
          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
            NoteFlow · Shared note
          </span>
        </div>

        <Link
          to="/login"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
          style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <ExternalLink size={11} />
          Sign in
        </Link>
      </header>

      {/* Content */}
      <motion.main
        className="max-w-2xl mx-auto px-6 py-12"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {note.tags.map((tag) => (
              <span
                key={tag.name}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: `${tag.color}15`,
                  color: tag.color,
                  border: `1px solid ${tag.color}30`,
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: tag.color }} />
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1
          className="font-semibold leading-tight mb-4"
          style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.92)', lineHeight: 1.25 }}
        >
          {note.title || 'Untitled'}
        </h1>

        {/* Metadata */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <Calendar size={11} />
            Updated {formatDate(note.updated_at)}
          </div>
        </div>

        {/* AI Summary */}
        {note.ai_summary && (
          <div
            className="flex items-start gap-3 p-4 rounded-xl mb-8"
            style={{
              background: 'rgba(124,58,237,0.06)',
              border: '1px solid rgba(124,58,237,0.15)',
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'rgba(124,58,237,0.12)' }}
            >
              <Sparkles size={13} style={{ color: '#a78bfa' }} />
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: '#a78bfa' }}>
                AI Summary
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {note.ai_summary}
              </p>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="mb-8" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* Content */}
        <div
          className="text-md leading-relaxed whitespace-pre-wrap"
          style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'inherit', lineHeight: 1.75 }}
        >
          {note.content || <span style={{ color: 'rgba(255,255,255,0.2)' }}>No content</span>}
        </div>
      </motion.main>

      {/* Footer */}
      <footer className="text-center pb-12 pt-4">
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Shared via{' '}
          <Link to="/login" className="hover:opacity-70 transition-opacity" style={{ color: 'rgba(255,255,255,0.3)' }}>
            NoteFlow
          </Link>
          {' '}· AI-powered notes workspace
        </p>
      </footer>
    </div>
  )
}