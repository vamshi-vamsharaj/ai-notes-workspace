// frontend/src/components/share/ShareModal.tsx
// Design: Vercel deploy URL modal + Linear share drawer — minimal, focused.
// WHY a modal (not a drawer): share is a quick action, not a workflow.
// Modal dismisses as soon as the user copies the link.

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Link2, Copy, Check, Globe, Lock, Loader2 } from 'lucide-react'
import { shareService, type ShareState } from '@/services/share.service'

interface ShareModalProps {
  noteId: string
  noteTitle: string
  isOpen: boolean
  onClose: () => void
}

export function ShareModal({ noteId, noteTitle, isOpen, onClose }: ShareModalProps) {
  const [state, setState] = useState<ShareState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load current share state when modal opens
  useEffect(() => {
    if (!isOpen) return
    setIsLoading(true)
    setError(null)

    shareService.getShareState(noteId)
      .then(setState)
      .catch(() => {
        // Note was never shared — default to off state
        setState({ note_id: noteId, is_public: false, share_token: null, share_url: null })
      })
      .finally(() => setIsLoading(false))
  }, [isOpen, noteId])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleToggle = async () => {
    if (!state || isToggling) return
    setIsToggling(true)
    setError(null)

    try {
      const next = state.is_public
        ? await shareService.disableShare(noteId)
        : await shareService.enableShare(noteId)
      setState(next)
    } catch {
      setError('Failed to update share settings. Please try again.')
    } finally {
      setIsToggling(false)
    }
  }

  const handleCopy = async () => {
    if (!state?.share_url) return
    await navigator.clipboard.writeText(state.share_url)
    setCopied(true)
    inputRef.current?.select()
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border overflow-hidden"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
              }}
              initial={{ scale: 0.95, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 8 }}
              transition={{ type: 'spring', bounce: 0.12, duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(124,58,237,0.12)' }}
                  >
                    <Globe size={14} style={{ color: 'var(--accent-violet-bright)' }} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Share note
                    </h2>
                    <p className="text-xs truncate max-w-[220px]" style={{ color: 'var(--text-tertiary)' }}>
                      {noteTitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                ) : (
                  <>
                    {/* Toggle row */}
                    <div
                      className="flex items-center justify-between p-4 rounded-xl mb-4"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{
                            background: state?.is_public ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                          }}
                        >
                          {state?.is_public
                            ? <Globe size={15} style={{ color: '#10b981' }} />
                            : <Lock size={15} style={{ color: 'var(--text-tertiary)' }} />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {state?.is_public ? 'Anyone with the link' : 'Only you'}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {state?.is_public
                              ? 'This note is publicly visible'
                              : 'This note is private'}
                          </p>
                        </div>
                      </div>

                      {/* Toggle */}
                      <button
                        onClick={handleToggle}
                        disabled={isToggling}
                        className="relative w-10 h-6 rounded-full transition-all duration-200 shrink-0 disabled:opacity-50"
                        style={{
                          background: state?.is_public ? '#7c3aed' : 'rgba(255,255,255,0.12)',
                        }}
                        aria-label="Toggle public sharing"
                      >
                        {isToggling ? (
                          <Loader2
                            size={10}
                            className="animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            style={{ color: 'white' }}
                          />
                        ) : (
                          <motion.div
                            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                            animate={{ left: state?.is_public ? '22px' : '4px' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                      </button>
                    </div>

                    {/* Error */}
                    {error && (
                      <div
                        className="mb-4 px-3 py-2.5 rounded-lg text-xs"
                        style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        {error}
                      </div>
                    )}

                    {/* Share URL row — only shown when public */}
                    <AnimatePresence>
                      {state?.is_public && state.share_url && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div
                            className="flex items-center gap-2 p-3 rounded-xl"
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                          >
                            <Link2 size={13} style={{ color: 'var(--text-tertiary)' }} className="shrink-0" />
                            <input
                              ref={inputRef}
                              readOnly
                              value={state.share_url}
                              className="flex-1 text-xs bg-transparent outline-none truncate"
                              style={{ color: 'var(--text-secondary)' }}
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                            <button
                              onClick={handleCopy}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all"
                              style={{
                                background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.15)',
                                color: copied ? '#10b981' : 'var(--accent-violet-bright)',
                                border: copied ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(124,58,237,0.25)',
                              }}
                            >
                              {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy link</>}
                            </button>
                          </div>
                          <p className="text-xs mt-2 px-1" style={{ color: 'var(--text-tertiary)' }}>
                            Anyone with this link can view this note without signing in.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}