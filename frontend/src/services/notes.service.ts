// frontend/src/services/notes.service.ts
import api from './api'
import type {
  Note,
  CreateNotePayload,
  UpdateNotePayload,
  NotesFilter,
  PaginatedNotes,
} from '@/types/notes.types'

export const notesService = {
  async getNotes(filters?: NotesFilter): Promise<PaginatedNotes> {
    const params = new URLSearchParams()
    if (filters?.search) params.set('search', filters.search)
    if (filters?.tag_id) params.set('tag_id', filters.tag_id)
    if (filters?.is_archived !== undefined) params.set('is_archived', String(filters.is_archived))
    if (filters?.sort) params.set('sort', filters.sort)

    // ADDED: Trailing slash before the query parameters
    const { data } = await api.get<PaginatedNotes>(`/notes/?${params.toString()}`)
    return data
  },

  async getNote(id: string): Promise<Note> {
    const { data } = await api.get<Note>(`/notes/${id}`)
    return data
  },

  async createNote(payload: CreateNotePayload = {}): Promise<Note> {
    // ADDED: Trailing slash at the end of the URL
    const { data } = await api.post<Note>('/notes/', payload)
    return data
  },

  async updateNote(id: string, payload: UpdateNotePayload): Promise<Note> {
    const { data } = await api.patch<Note>(`/notes/${id}`, payload)
    return data
  },

  async deleteNote(id: string): Promise<void> {
    await api.delete(`/notes/${id}`)
  },

  async archiveNote(id: string, archive: boolean): Promise<Note> {
    const { data } = await api.patch<Note>(`/notes/${id}`, { is_archived: archive })
    return data
  },
}