// frontend/src/pages/NoteEditorPage.tsx
// Changes from previous version:
// 1. Markdown preview toggle (Edit / Preview) in the toolbar
// 2. react-markdown renders the content in preview mode
// 3. All existing logic (autosave, AI panel, share modal, etc.) preserved exactly

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Archive, ArchiveRestore, Trash2,
  Share2, Check, Clock, Eye, Edit3,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useNotesStore } from '@/store/notesStore'
import { useUIStore } from '@/store/uiStore'
import { useAIStore } from '@/store/aiStore'
import { useAutosave } from '@/hooks/useAutosave'
import { TagSelector } from '@/components/notes/TagSelector'
import { AISidePanel } from '@/components/ai/AISidePanel'
import { AIFloatingButton } from '@/components/ai/AIFloatingButton'
import { ShareModal } from '@/components/share/ShareModal'
import type { Tag } from '@/types/notes.types'
import { formatRelativeTime } from '@/lib/utils'

export function NoteEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { currentNote, isLoading, isSaving, fetchNote, updateNote, archiveNote, clearCurrentNote } = useNotesStore()
  const { openDeleteModal } = useUIStore()
  const { isPanelOpen, openPanel, closePanel, clearGenerations } = useAIStore()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<Tag[]>([])
  const [isReady, setIsReady] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const contentRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!id) return
    setIsReady(false)
    clearGenerations()
    fetchNote(id).then(() => setIsReady(true))
    return () => clearCurrentNote()
  }, [id]) // eslint-disable-line

  useEffect(() => {
    if (currentNote && !isLoading) {
      setTitle(currentNote.title || '')
      setContent(currentNote.content || '')
      setTags(currentNote.tags || [])
      setIsReady(true)
    }
  }, [currentNote?.id]) // eslint-disable-line

  // ⌘J — toggle AI panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        if (isPanelOpen) closePanel()
        else if (id) openPanel(id)
      }
      // ⌘P — toggle preview
      if ((e.metaKey || e.ctrlKey) && e.key === 'p' && !e.shiftKey) {
        e.preventDefault()
        setPreviewMode((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isPanelOpen, id, openPanel, closePanel])

  useAutosave({ noteId: id!, title, content, delay: 1000 })

  const handleTagsChange = useCallback(async (newTags: Tag[]) => {
    setTags(newTags)
    if (!id) return
    await updateNote(id, { tag_ids: newTags.map((t) => t.id) })
  }, [id, updateNote])

  const handleInsertText = useCallback((text: string) => {
    setContent((prev) => prev ? `${prev}\n\n${text}` : text)
    setPreviewMode(false)
    setTimeout(() => contentRef.current?.focus(), 50)
  }, [])

  const handleArchive = async () => {
    if (!id || !currentNote) return
    await archiveNote(id, !currentNote.is_archived)
    navigate('/notes')
  }

  if (isLoading || !isReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--border-default)', borderTopColor: 'var(--accent-violet)' }} />
      </div>
    )
  }

  if (!currentNote) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p style={{ color: 'var(--text-secondary)' }}>Note not found.</p>
        <button onClick={() => navigate('/notes')} className="text-sm"
          style={{ color: 'var(--accent-violet-bright)' }}>
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
      className="flex h-full overflow-hidden"
    >
      {/* ── Editor column ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}>
          <button onClick={() => navigate('/notes')}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={13} /> Notes
          </button>

          <div className="w-px h-4" style={{ background: 'var(--border-subtle)' }} />

          {/* Save status */}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {isSaving ? (
              <>
                <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--text-tertiary)', borderTopColor: 'var(--accent-violet)' }} />
                Saving…
              </>
            ) : (
              <>
                <Check size={12} style={{ color: '#10b981' }} />
                Saved
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <Clock size={11} />
            {formatRelativeTime(currentNote.updated_at)}
          </div>

          <div className="flex-1" />

          {/* Edit / Preview toggle */}
          <div className="flex items-center rounded-lg p-0.5 mr-1"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setPreviewMode(false)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all"
              style={{
                background: !previewMode ? 'var(--bg-overlay)' : 'transparent',
                color: !previewMode ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
              title="Edit mode (⌘P)"
            >
              <Edit3 size={11} /> Edit
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all"
              style={{
                background: previewMode ? 'var(--bg-overlay)' : 'transparent',
                color: previewMode ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
              title="Preview mode (⌘P)"
            >
              <Eye size={11} /> Preview
            </button>
          </div>

          {id && <AIFloatingButton noteId={id} />}

          <div className="flex items-center gap-0.5 ml-1">
            <ActionBtn
              icon={currentNote.is_archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
              label={currentNote.is_archived ? 'Unarchive' : 'Archive'}
              onClick={handleArchive}
            />
            <ActionBtn
              icon={<Share2 size={13} />}
              label="Share"
              onClick={() => setShareModalOpen(true)}
            />
            <button onClick={() => openDeleteModal(id!)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-red-500/10 transition-colors"
              style={{ color: '#ef4444' }}>
              <Trash2 size={13} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {/* Editor / Preview area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-10">
            {/* Tags */}
            <div className="mb-6">
              <TagSelector selectedTags={tags} onTagsChange={handleTagsChange} />
            </div>

            {/* Title (always editable) */}
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
              style={{ fontSize: '2rem', lineHeight: 1.2, overflow: 'hidden', color: 'var(--text-primary)' }}
            />

            <div className="mb-6" style={{ height: 1, background: 'var(--border-subtle)' }} />

            {/* Content: Edit or Preview */}
            {previewMode ? (
              <div className="prose-dark">
                {content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>
                    Nothing to preview yet.
                  </p>
                )}
              </div>
            ) : (
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
                placeholder="Start writing… (⌘J for AI · ⌘P to preview)"
                rows={20}
                className="note-textarea"
                style={{
                  fontSize: '0.9375rem',
                  minHeight: '60vh',
                  overflow: 'hidden',
                  color: 'var(--text-secondary)',
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* AI Side Panel */}
      {id && (
        <AISidePanel
          noteId={id}
          noteContent={content}
          onInsertText={handleInsertText}
        />
      )}

      {currentNote && (
        <ShareModal
          noteId={currentNote.id}
          noteTitle={currentNote.title || 'Untitled'}
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </motion.div>
  )
}

function ActionBtn({ icon, label, onClick, title }: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  title?: string
}) {
  return (
    <button onClick={onClick} title={title}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 transition-colors"
      style={{ color: 'var(--text-secondary)' }}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}