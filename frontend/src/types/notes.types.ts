// frontend/src/types/notes.types.ts

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  is_archived: boolean
  tags: Tag[]
  created_at: string
  updated_at: string
  // AI fields (populated in Phase 4)
  ai_summary?: string | null
  ai_action_items?: string[]
  ai_suggested_title?: string | null
}

export interface NoteListItem {
  ai_summary: import("react/jsx-runtime").JSX.Element
  id: string
  user_id: string
  title: string
  content: string         // truncated snippet
  is_archived: boolean
  tags: Tag[]
  created_at: string
  updated_at: string
}

export interface CreateNotePayload {
  title?: string
  content?: string
  tag_ids?: string[]
}

export interface UpdateNotePayload {
  title?: string
  content?: string
  is_archived?: boolean
  tag_ids?: string[]
}

export interface CreateTagPayload {
  name: string
  color?: string
}

export interface UpdateTagPayload {
  name?: string
  color?: string
}

export interface NotesFilter {
  search?: string
  tag_id?: string
  is_archived?: boolean
  sort?: 'updated_at' | 'created_at' | 'title'
}

export interface PaginatedNotes {
  notes: NoteListItem[]
  total: number
  page: number
  per_page: number
}

// Tag colour presets
export const TAG_COLORS = [
  '#7c3aed', // violet
  '#2563eb', // blue
  '#0891b2', // cyan
  '#059669', // emerald
  '#d97706', // amber
  '#dc2626', // red
  '#db2777', // pink
  '#7c3aed', // purple
] as const