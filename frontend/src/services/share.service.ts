// frontend/src/services/share.service.ts
// WHY a service layer (not raw axios in components):
// - Centralises the API base URL and auth header attachment
// - If the endpoint changes, you fix one file
// - Easy to mock in tests

import api from './api'

export interface ShareState {
  note_id: string
  is_public: boolean
  share_token: string | null
  share_url: string | null
}

export const shareService = {
  /** Fetch current share state (used when ShareModal opens) */
  async getShareState(noteId: string): Promise<ShareState> {
    const { data } = await api.get<ShareState>(`/notes/${noteId}/share`)
    return data
  },

  /** Enable sharing — returns the generated share URL */
  async enableShare(noteId: string): Promise<ShareState> {
    const { data } = await api.post<ShareState>(`/notes/${noteId}/share`, {})
    return data
  },

  /** Disable sharing — invalidates the token */
  async disableShare(noteId: string): Promise<ShareState> {
    const { data } = await api.delete<ShareState>(`/notes/${noteId}/share`)
    return data
  },

  /** Fetch a publicly shared note — no auth header needed */
  async getPublicNote(token: string) {
    // Use the base axios instance but WITHOUT the auth interceptor
    // WHY: public endpoint must work for logged-out users
    const { data } = await api.get(`/shared/${token}`)
    return data
  },
}