// frontend/src/components/notes/TagSelector.tsx
import { useState, useRef, useEffect } from 'react'
import { Plus, X, Hash, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotesStore } from '@/store/notesStore'
import { TAG_COLORS, type Tag } from '@/types/notes.types'

interface TagSelectorProps {
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
}

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const { tags: allTags, createTag } = useNotesStore()
  const [open, setOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
const [selectedColor, setSelectedColor] = useState<string>(
  TAG_COLORS[0] as string
)
  const [isCreating, setIsCreating] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id)
    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId))
  }

  const handleCreate = async () => {
    if (!newTagName.trim()) return
    setIsCreating(true)
    try {
      const tag = await createTag(newTagName.trim(), selectedColor)
      onTagsChange([...selectedTags, tag])
      setNewTagName('')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      {/* Selected tags + add button */}
      <div className="flex flex-wrap items-center gap-1.5">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            style={{
              background: `${tag.color}18`,
              color: tag.color,
              border: `1px solid ${tag.color}30`,
            }}
          >
            {tag.name}
            <button
              onClick={(e) => { e.stopPropagation(); removeTag(tag.id) }}
              className="hover:opacity-70 transition-opacity"
            >
              <X size={10} />
            </button>
          </span>
        ))}

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors hover:bg-white/5"
          style={{
            color: 'var(--text-tertiary)',
            border: '1px dashed var(--border-default)',
          }}
        >
          <Plus size={10} />
          Add tag
        </button>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 top-full mt-2 w-60 rounded-xl z-30 overflow-hidden"
            style={{
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border-default)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Existing tags */}
            <div className="p-2 max-h-44 overflow-y-auto">
              {allTags.length === 0 && (
                <p className="text-xs text-center py-3" style={{ color: 'var(--text-tertiary)' }}>
                  No tags yet
                </p>
              )}
              {allTags.map((tag) => {
                const isSelected = selectedTags.some((t) => t.id === tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag)}
                    className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Hash size={11} style={{ color: tag.color }} />
                    <span className="flex-1 text-left">{tag.name}</span>
                    {isSelected && <Check size={11} style={{ color: tag.color }} />}
                  </button>
                )
              })}
            </div>

            {/* Create new tag */}
            <div className="p-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="text-xs mb-2 px-1" style={{ color: 'var(--text-tertiary)' }}>New tag</p>

              {/* Color swatches */}
              <div className="flex gap-1.5 px-1 mb-2">
                {TAG_COLORS.slice(0, 6).map((color: string) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className="w-4 h-4 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: color,
                      outline: selectedColor === color ? `2px solid ${color}` : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>

              <div className="flex gap-1.5">
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="Tag name..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  onClick={handleCreate}
                  disabled={!newTagName.trim() || isCreating}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-40 transition-opacity"
                  style={{ background: 'var(--accent-violet)' }}
                >
                  {isCreating ? '...' : 'Add'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}