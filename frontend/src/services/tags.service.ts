// frontend/src/services/tags.service.ts
import api from './api'
import type { Tag, CreateTagPayload, UpdateTagPayload } from '@/types/notes.types'

export const tagsService = {
  async getTags(): Promise<Tag[]> {
    const { data } = await api.get<Tag[]>('/tags')
    return data
  },

  async createTag(payload: CreateTagPayload): Promise<Tag> {
    const { data } = await api.post<Tag>('/tags', payload)
    return data
  },

  async updateTag(id: string, payload: UpdateTagPayload): Promise<Tag> {
    const { data } = await api.patch<Tag>(`/tags/${id}`, payload)
    return data
  },

  async deleteTag(id: string): Promise<void> {
    await api.delete(`/tags/${id}`)
  },

  async assignTagsToNote(noteId: string, tagIds: string[]): Promise<void> {
    await api.post(`/notes/${noteId}/tags`, { tag_ids: tagIds })
  },
}