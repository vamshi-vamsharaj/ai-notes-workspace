// frontend/src/components/notes/EmptyState.tsx
import { motion } from 'framer-motion'
import { FileText, Plus } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  action?: { label: string; onClick: () => void }
  icon?: React.ReactNode
}

export function EmptyState({
  title = 'No notes yet',
  description = 'Create your first note to get started.',
  action,
  icon,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
        }}
      >
        {icon ?? <FileText size={22} style={{ color: 'var(--text-tertiary)' }} />}
      </div>

      <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="text-xs max-w-xs leading-relaxed mb-6" style={{ color: 'var(--text-tertiary)' }}>
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: 'var(--accent-violet)' }}
        >
          <Plus size={14} />
          {action.label}
        </button>
      )}
    </motion.div>
  )
}