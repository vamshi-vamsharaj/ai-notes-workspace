import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Archive, ArchiveRestore, Trash2, MoreHorizontal, Sparkles } from 'lucide-react'
import type { NoteListItem } from '@/types/notes.types'
import { useNotesStore } from '@/store/notesStore'
import { useUIStore } from '@/store/uiStore'
import { formatRelativeTime } from '@/lib/utils'

interface NoteCardProps {
  note: NoteListItem
  index?: number
}

export function NoteCard({ note, index = 0 }: NoteCardProps) {
  const navigate = useNavigate()
  const { archiveNote } = useNotesStore()
  const { openDeleteModal } = useUIStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const snippet = note.content?.slice(0, 120).replace(/\n/g, ' ') || 'No content yet…'

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpen(false)
    await archiveNote(note.id, !note.is_archived)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpen(false)
    openDeleteModal(note.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={() => navigate(`/notes/${note.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-xl cursor-pointer transition-all duration-200"
      style={{
        background: isHovered ? 'var(--bg-overlay)' : 'var(--bg-elevated)',
        border: `1px solid ${isHovered || menuOpen ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
        boxShadow: isHovered || menuOpen ? '0 4px 24px rgba(0,0,0,0.2)' : 'none',
        overflow: 'visible',
      }}
    >
      <div className="p-4">
        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {note.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: `${tag.color}18`,
                  color: tag.color,
                  border: `1px solid ${tag.color}30`,
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3
          className="font-semibold text-sm leading-snug mb-1.5 line-clamp-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {note.title || 'Untitled'}
        </h3>

        {/* Snippet */}
        <p
          className="text-xs leading-relaxed line-clamp-3"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {snippet}
        </p>

        {/* Footer */}
        <div
          className="flex items-center justify-between mt-3 pt-3 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {formatRelativeTime(note.updated_at)}
          </span>
          {note.ai_summary && (
            <Sparkles size={11} style={{ color: 'var(--accent-violet-bright)' }} />
          )}
        </div>
      </div>

      {/* ─── Three-dot menu ─── */}
      <div
        ref={menuRef}
        className="absolute top-3 right-3 z-20"
        style={{
          opacity: isHovered || menuOpen ? 1 : 0,
          transition: 'opacity 0.15s',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setMenuOpen((v) => !v)
          }}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{
            color: 'var(--text-tertiary)',
            background: menuOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
          }}
          onMouseOver={(e) => {
            if (!menuOpen) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'
          }}
          onMouseOut={(e) => {
            if (!menuOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'
          }}
        >
          <MoreHorizontal size={14} />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="note-dropdown-menu"
              initial={{ opacity: 0, scale: 0.94, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -4 }}
              transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute right-0 top-8 w-44 rounded-xl overflow-hidden"
              style={{
                background: 'var(--bg-overlay)',
                border: '1px solid var(--border-default)',
                boxShadow: '0 12px 36px rgba(0,0,0,0.55)',
              }}
            >
              <button
                type="button"
                onClick={handleArchive}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs transition-colors hover:bg-white/5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {note.is_archived
                  ? <ArchiveRestore size={13} />
                  : <Archive size={13} />
                }
                {note.is_archived ? 'Unarchive' : 'Archive'}
              </button>

              <div className="mx-2.5" style={{ height: '1px', background: 'var(--border-subtle)' }} />

              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs transition-colors hover:bg-red-500/10"
                style={{ color: '#f87171' }}
              >
                <Trash2 size={13} />
                Delete note
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}