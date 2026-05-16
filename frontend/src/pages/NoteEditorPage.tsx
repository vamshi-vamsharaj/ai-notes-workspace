// frontend/src/pages/NoteEditorPage.tsx
import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Archive, ArchiveRestore, Trash2,
  Share2, Check, Clock, Sparkles
} from 'lucide-react'
import { useNotesStore } from '@/store/notesStore'
import { useUIStore } from '@/store/uiStore'
import { useAutosave } from '@/hooks/useAutosave'
import { TagSelector } from '@/components/notes/TagSelector'
import type { Tag } from '@/types/notes.types'
import { formatRelativeTime } from '@/lib/utils'

export function NoteEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    currentNote, isLoading, isSaving,
    fetchNote, updateNote, archiveNote, clearCurrentNote
  } = useNotesStore()
  const { openDeleteModal } = useUIStore()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<Tag[]>([])
  const [isReady, setIsReady] = useState(false)

  // Load note
  useEffect(() => {
    if (!id) return
    setIsReady(false)
    fetchNote(id).then(() => setIsReady(true))
    return () => clearCurrentNote()
  }, [id]) // eslint-disable-line

  // Sync local state from store when note loads
  useEffect(() => {
    if (currentNote && !isLoading) {
      setTitle(currentNote.title || '')
      setContent(currentNote.content || '')
      setTags(currentNote.tags || [])
      setIsReady(true)
    }
  }, [currentNote?.id]) // only on initial load

  // Autosave title + content
  useAutosave({
    noteId: id!,
    title,
    content,
    delay: 1000,
  })

  // Save tags immediately on change
  const handleTagsChange = useCallback(async (newTags: Tag[]) => {
    setTags(newTags)
    if (!id) return
    await updateNote(id, { tag_ids: newTags.map((t) => t.id) })
  }, [id, updateNote])

  const handleArchive = async () => {
    if (!id || !currentNote) return
    await archiveNote(id, !currentNote.is_archived)
    navigate('/notes')
  }

  if (isLoading || !isReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--border-default)', borderTopColor: 'var(--accent-violet)' }}
        />
      </div>
    )
  }

  if (!currentNote) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p style={{ color: 'var(--text-secondary)' }}>Note not found.</p>
        <button onClick={() => navigate('/notes')} className="text-sm" style={{ color: 'var(--accent-violet-bright)' }}>
          Back to notes
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col h-full"
    >
      {/* Editor toolbar */}
      <div
        className="flex items-center gap-2 px-5 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <button
          onClick={() => navigate('/notes')}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors mr-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={13} />
          Notes
        </button>

        <div className="w-px h-4 mx-0.5" style={{ background: 'var(--border-subtle)' }} />

        {/* Save status */}
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {isSaving ? (
            <>
              <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                style={{ borderColor: 'var(--text-tertiary)', borderTopColor: 'var(--accent-violet)' }} />
              Saving...
            </>
          ) : (
            <>
              <Check size={12} style={{ color: 'var(--accent-emerald)' }} />
              Saved
            </>
          )}
        </div>

        <div className="w-px h-4 mx-0.5" style={{ background: 'var(--border-subtle)' }} />

        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <Clock size={11} />
          {formatRelativeTime(currentNote.updated_at)}
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <ActionBtn
            icon={<Sparkles size={13} />}
            label="AI"
            onClick={() => {}} // Phase 4
            title="AI Summary (Phase 4)"
          />
          <ActionBtn
            icon={currentNote.is_archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
            label={currentNote.is_archived ? 'Unarchive' : 'Archive'}
            onClick={handleArchive}
          />
          <ActionBtn
            icon={<Share2 size={13} />}
            label="Share"
            onClick={() => {}} // Phase 5
            title="Share (Phase 5)"
          />
          <button
            onClick={() => openDeleteModal(id!)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-red-500/10 transition-colors"
            style={{ color: '#ef4444' }}
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">
          {/* Tags */}
          <div className="mb-6">
            <TagSelector selectedTags={tags} onTagsChange={handleTagsChange} />
          </div>

          {/* Title */}
          <textarea
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = e.target.scrollHeight + 'px'
            }}
            placeholder="Untitled"
            rows={1}
            className="note-textarea font-semibold mb-6"
            style={{
              fontSize: '2rem',
              lineHeight: '1.2',
              overflow: 'hidden',
              color: 'var(--text-primary)',
            }}
          />

          {/* Divider */}
          <div className="mb-6" style={{ height: '1px', background: 'var(--border-subtle)' }} />

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = e.target.scrollHeight + 'px'
            }}
            placeholder="Start writing..."
            rows={20}
            className="note-textarea"
            style={{
              fontSize: '0.9375rem',
              minHeight: '60vh',
              overflow: 'hidden',
              color: 'var(--text-secondary)',
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

function ActionBtn({
  icon, label, onClick, title
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 transition-colors"
      style={{ color: 'var(--text-secondary)' }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}