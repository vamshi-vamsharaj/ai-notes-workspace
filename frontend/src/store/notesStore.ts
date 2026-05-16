// frontend/src/store/notesStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { notesService } from '@/services/notes.service'
import { tagsService } from '@/services/tags.service'
import type {
  Note,
  NoteListItem,
  Tag,
  CreateNotePayload,
  UpdateNotePayload,
  NotesFilter,
} from '@/types/notes.types'

interface NotesStore {
  // State
  notes: NoteListItem[]
  currentNote: Note | null
  tags: Tag[]
  total: number
  isLoading: boolean
  isSaving: boolean
  isCreating: boolean
  error: string | null
  filters: NotesFilter

  // Actions
  fetchNotes: (filters?: NotesFilter) => Promise<void>
  fetchNote: (id: string) => Promise<void>
  createNote: (payload?: CreateNotePayload) => Promise<Note>
  updateNote: (id: string, payload: UpdateNotePayload) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  archiveNote: (id: string, archive: boolean) => Promise<void>
  setCurrentNote: (note: Note | null) => void
  setFilters: (filters: NotesFilter) => void
  applyFilter: (partial: Partial<NotesFilter>) => Promise<void>
  clearCurrentNote: () => void

  fetchTags: () => Promise<void>
  createTag: (name: string, color?: string) => Promise<Tag>
  deleteTag: (id: string) => Promise<void>
}

export const useNotesStore = create<NotesStore>()(
  devtools(
    (set, get) => ({
      notes: [],
      currentNote: null,
      tags: [],
      total: 0,
      isLoading: false,
      isSaving: false,
      isCreating: false,
      error: null,
      filters: { is_archived: false, sort: 'updated_at' },

      fetchNotes: async (filters) => {
        const activeFilters = filters ?? get().filters
        set({ isLoading: true, error: null, filters: activeFilters })
        try {
          const { notes, total } = await notesService.getNotes(activeFilters)
          set({ notes, total, isLoading: false })
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to load notes'
          set({ error: msg, isLoading: false })
        }
      },

      fetchNote: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          const note = await notesService.getNote(id)
          set({ currentNote: note, isLoading: false })
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to load note'
          set({ error: msg, isLoading: false })
        }
      },

      createNote: async (payload = {}) => {
        set({ isCreating: true, error: null })
        try {
          const note = await notesService.createNote(payload)
          set((state) => ({
            notes: [note as unknown as NoteListItem, ...state.notes],
            total: state.total + 1,
            isCreating: false,
          }))
          return note
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to create note'
          set({ error: msg, isCreating: false })
          throw err
        }
      },

      updateNote: async (id: string, payload: UpdateNotePayload) => {
        set({ isSaving: true })
        try {
          const updated = await notesService.updateNote(id, payload)
          set((state) => ({
            notes: state.notes.map((n) =>
              n.id === id ? ({ ...n, ...updated } as NoteListItem) : n
            ),
            currentNote:
              state.currentNote?.id === id
                ? { ...state.currentNote, ...updated }
                : state.currentNote,
            isSaving: false,
          }))
        } catch (err) {
          set({ isSaving: false })
          throw err
        }
      },

      deleteNote: async (id: string) => {
        // Optimistic: remove immediately, rollback on error
        const prev = get().notes
        const prevTotal = get().total
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          total: Math.max(0, state.total - 1),
        }))
        try {
          await notesService.deleteNote(id)
        } catch (error) {
          // Rollback the UI if the backend rejects the deletion
          set({ notes: prev, total: prevTotal })
          // FIX: Actually throw the error so the Modal knows it failed!
          throw error 
        }
      },

      archiveNote: async (id: string, archive: boolean) => {
        const prev = get().notes
        const prevTotal = get().total
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          total: Math.max(0, state.total - 1),
        }))
        try {
          await notesService.archiveNote(id, archive)
        } catch (err) {
          set({ notes: prev, total: prevTotal })
          throw err
        }
      },

      setCurrentNote: (note) => set({ currentNote: note }),
      clearCurrentNote: () => set({ currentNote: null }),
      setFilters: (filters) => set({ filters }),

      applyFilter: async (partial: Partial<NotesFilter>) => {
        const newFilters = { ...get().filters, ...partial }
        set({ filters: newFilters, isLoading: true, error: null })
        try {
          const { notes, total } = await notesService.getNotes(newFilters)
          set({ notes, total, isLoading: false })
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to filter notes'
          set({ error: msg, isLoading: false })
        }
      },

      fetchTags: async () => {
        try {
          const tags = await tagsService.getTags()
          set({ tags })
        } catch {
          // Non-critical — silently ignore
        }
      },

      createTag: async (name: string, color = '#7c3aed') => {
        const tag = await tagsService.createTag({ name, color })
        set((state) => ({ tags: [...state.tags, tag] }))
        return tag
      },

      deleteTag: async (id: string) => {
        await tagsService.deleteTag(id)
        set((state) => ({ tags: state.tags.filter((t) => t.id !== id) }))
      },
    }),
    { name: 'NotesStore' }
  )
)

export const selectNotes = (s: NotesStore) => s.notes
export const selectCurrentNote = (s: NotesStore) => s.currentNote
export const selectTags = (s: NotesStore) => s.tags
export const selectNotesLoading = (s: NotesStore) => s.isLoading
export const selectIsSaving = (s: NotesStore) => s.isSaving