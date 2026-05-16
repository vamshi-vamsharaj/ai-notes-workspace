// frontend/src/components/notes/NotesToolbar.tsx
// FIXES:
// 1. Uses applyFilter() from notesStore instead of calling setFilters() + fetchNotes() separately.
//    The old pattern had a race: setFilters is synchronous but fetchNotes reads stale filters
//    if called in the same tick. applyFilter merges + fetches atomically.
// 2. Tag filter select renders correctly with current filter state
// 3. Archive toggle label reflects current state accurately
// 4. Clear button resets both search and tag filters

import { useNotesStore } from '@/store/notesStore'
import { X, SlidersHorizontal } from 'lucide-react'
import type { NotesFilter } from '@/types/notes.types'

interface NotesToolbarProps {
  onCreateNote: () => void
  isCreating: boolean
}

const SORT_OPTIONS: { value: NonNullable<NotesFilter['sort']>; label: string }[] = [
  { value: 'updated_at', label: 'Last edited' },
  { value: 'created_at', label: 'Created' },
  { value: 'title', label: 'Title A–Z' },
]

export function NotesToolbar({ onCreateNote, isCreating }: NotesToolbarProps) {
  const { filters, applyFilter, tags } = useNotesStore()

  const hasActiveFilters = !!(filters.tag_id || filters.search)

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-5 py-2.5 border-b"
      style={{ borderColor: 'var(--border-subtle)', minHeight: '48px' }}
    >
      {/* Sort buttons */}
      <div className="flex items-center gap-0.5">
        {SORT_OPTIONS.map((opt) => {
          const isActive = filters.sort === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => applyFilter({ sort: opt.value })}
              className="px-2.5 py-1.5 rounded-lg text-xs transition-all"
              style={{
                background: isActive ? 'var(--bg-overlay)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                border: isActive
                  ? '1px solid var(--border-default)'
                  : '1px solid transparent',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      <div
        className="w-px h-4 mx-0.5 hidden sm:block"
        style={{ background: 'var(--border-subtle)' }}
      />

      {/* Tag filter */}
      <select
        value={filters.tag_id ?? ''}
        onChange={(e) => applyFilter({ tag_id: e.target.value || undefined })}
        className="text-xs px-2.5 py-1.5 rounded-lg outline-none cursor-pointer transition-colors"
        style={{
          background: 'var(--bg-elevated)',
          border: `1px solid ${filters.tag_id ? 'rgba(124,58,237,0.4)' : 'var(--border-subtle)'}`,
          color: filters.tag_id ? 'var(--accent-violet-bright)' : 'var(--text-tertiary)',
        }}
      >
        <option value="">All tags</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>

      {/* Clear active filters */}
      {hasActiveFilters && (
        <button
          onClick={() => applyFilter({ tag_id: undefined, search: undefined })}
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: 'var(--text-tertiary)' }}
          title="Clear all filters"
        >
          <X size={11} />
          Clear
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Archive toggle */}
      <button
        onClick={() => applyFilter({ is_archived: !filters.is_archived })}
        className="text-xs px-3 py-1.5 rounded-lg transition-all"
        style={{
          background: filters.is_archived ? 'rgba(245,158,11,0.1)' : 'transparent',
          color: filters.is_archived ? '#f59e0b' : 'var(--text-tertiary)',
          border: filters.is_archived
            ? '1px solid rgba(245,158,11,0.25)'
            : '1px solid transparent',
        }}
        title={filters.is_archived ? 'Showing archived notes' : 'Showing active notes'}
      >
        {filters.is_archived ? '● Archived' : 'Active'}
      </button>

      {/* New note CTA */}
      <button
        onClick={onCreateNote}
        disabled={isCreating}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: 'var(--accent-violet)' }}
      >
        {isCreating ? (
          <>
            <div className="w-3 h-3 rounded-full border border-white/40 border-t-white animate-spin" />
            Creating…
          </>
        ) : (
          '+ New note'
        )}
      </button>
    </div>
  )
}