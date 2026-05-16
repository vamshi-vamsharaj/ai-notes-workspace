import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useNotesStore } from '@/store/notesStore'

export function DeleteNoteModal() {
  const { deleteModalNoteId, closeDeleteModal } = useUIStore()
  const { deleteNote } = useNotesStore()
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()

  const isOpen = !!deleteModalNoteId

  const handleDelete = async () => {
    if (!deleteModalNoteId) return
    setIsDeleting(true)
    try {
      await deleteNote(deleteModalNoteId)
      
      const onEditorPage = window.location.pathname.includes(`/notes/${deleteModalNoteId}`)
      if (onEditorPage) {
        navigate('/notes', { replace: true })
      }
      
      closeDeleteModal()
    } catch (error) {
      console.error("Failed to delete note:", error)
      alert("Failed to delete note. Check the console.")
      closeDeleteModal() 
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) closeDeleteModal()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={handleClose}
        />
      )}

      {isOpen && (
        <motion.div
          key="modal-content"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              pointerEvents: 'auto',
            }}
          >
            {/* Icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <AlertTriangle size={18} style={{ color: '#ef4444' }} />
            </div>

            <h2
              className="text-base font-semibold mb-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              Delete this note?
            </h2>
            <p
              className="text-sm leading-relaxed mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              This action cannot be undone. The note and all its content will be permanently removed.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  handleClose()
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
                style={{
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete()
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: '#dc2626' }}
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Deleting…
                  </span>
                ) : (
                  'Delete note'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}