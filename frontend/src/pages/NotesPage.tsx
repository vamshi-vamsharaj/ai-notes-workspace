// frontend/src/pages/NotesPage.tsx
// FIXES:
// 1. Reads window.location.pathname (or useLocation) to detect /notes/archived route
//    and initialises is_archived filter accordingly — previously it only checked store state
//    which never got set when navigating directly to /notes/archived via the sidebar
// 2. Re-runs effect when pathname changes so switching between Notes and Archive refreshes correctly
// 3. Passes correct initial filter when mounting

import { useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useNotesStore } from '@/store/notesStore'
import { NoteCard } from '@/components/notes/NoteCard'
import { NotesSkeleton } from '@/components/notes/NotesSkeleton'
import { EmptyState } from '@/components/notes/EmptyState'
import { NotesToolbar } from '@/components/notes/NotesToolbar'
import { Archive, FileText } from 'lucide-react'

export function NotesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const tagParam = searchParams.get('tag')

  const {
    notes,
    isLoading,
    isCreating,
    filters,
    fetchNotes,
    fetchTags,
    createNote,
    setFilters,
  } = useNotesStore()

  // FIX: derive archive state from the current URL path, not just store state
  const isArchiveView = location.pathname === '/notes/archived'

  useEffect(() => {
    // Build the correct initial filters from URL context
    const initialFilters = {
      ...filters,
      is_archived: isArchiveView,
      tag_id: tagParam || undefined,
    }
    setFilters(initialFilters)
    fetchNotes(initialFilters)
    fetchTags()
    // Re-run when route or tag param changes
  }, [location.pathname, tagParam]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateNote = async () => {
    try {
      const note = await createNote({ title: 'Untitled', content: '' })
      navigate(`/notes/${note.id}`)
    } catch {
      // Error already stored in notesStore
    }
  }

  return (
    <div className="flex flex-col h-full">
      <NotesToolbar onCreateNote={handleCreateNote} isCreating={isCreating} />

      <div className="flex-1 overflow-y-auto p-5">
        {/* Section heading */}
        <div className="flex items-center gap-2 mb-5">
          {isArchiveView ? (
            <Archive size={14} style={{ color: 'var(--text-tertiary)' }} />
          ) : (
            <FileText size={14} style={{ color: 'var(--text-tertiary)' }} />
          )}
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {isArchiveView ? 'Archive' : 'All notes'}
            {notes.length > 0 && (
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded-md text-xs"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-tertiary)',
                }}
              >
                {notes.length}
              </span>
            )}
          </span>

          {/* Active filter chips */}
          {(filters.tag_id || filters.search) && (
            <div className="flex items-center gap-1.5 ml-2">
              {filters.search && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(124,58,237,0.1)',
                    color: 'var(--accent-violet-bright)',
                    border: '1px solid rgba(124,58,237,0.2)',
                  }}
                >
                  "{filters.search}"
                </span>
              )}
              {filters.tag_id && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(124,58,237,0.1)',
                    color: 'var(--accent-violet-bright)',
                    border: '1px solid rgba(124,58,237,0.2)',
                  }}
                >
                  tag filter active
                </span>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <NotesSkeleton count={6} />
        ) : notes.length === 0 ? (
          <EmptyState
            title={isArchiveView ? 'No archived notes' : 'No notes yet'}
            description={
              filters.search
                ? `No notes match "${filters.search}". Try a different search.`
                : isArchiveView
                ? 'Notes you archive will appear here.'
                : 'Create your first note to start capturing your ideas.'
            }
            action={
              !isArchiveView && !filters.search
                ? { label: 'New note', onClick: handleCreateNote }
                : undefined
            }
            icon={
              isArchiveView ? (
                <Archive size={22} style={{ color: 'var(--text-tertiary)' }} />
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notes.map((note, i) => (
              <NoteCard key={note.id} note={note} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}