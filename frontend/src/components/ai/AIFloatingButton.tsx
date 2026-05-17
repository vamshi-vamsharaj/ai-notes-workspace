// frontend/src/components/ai/AIFloatingButton.tsx
// Floating button that opens the AI side panel from any note editor.
// Shows generation count badge when history exists.

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useAIStore } from '@/store/aiStore'

interface AIFloatingButtonProps {
  noteId: string
}

export function AIFloatingButton({ noteId }: AIFloatingButtonProps) {
  const { isPanelOpen, openPanel, closePanel, isGenerating, generations } = useAIStore()

  const handleClick = () => {
    if (isPanelOpen) {
      closePanel()
    } else {
      openPanel(noteId)
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.04 }}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-shadow"
      style={{
        background: isPanelOpen
          ? 'linear-gradient(135deg, #5b21b6, #4c1d95)'
          : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
        boxShadow: isPanelOpen
          ? 'none'
          : '0 0 0 1px rgba(124,58,237,0.4), 0 4px 16px rgba(124,58,237,0.25)',
      }}
      title={isPanelOpen ? 'Close AI panel (⌘J)' : 'Open AI panel (⌘J)'}
    >
      {isGenerating ? (
        <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      ) : (
        <Sparkles size={13} />
      )}
      <span>AI</span>

      {/* History badge */}
      <AnimatePresence>
        {!isPanelOpen && generations.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white flex items-center justify-center text-xs font-bold"
            style={{ background: '#10b981', fontSize: 9 }}
          >
            {generations.length > 9 ? '9+' : generations.length}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}