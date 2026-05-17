// frontend/src/store/aiStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { aiService } from '@/services/ai.service'
import type {
  AIAction,
  AIGeneration,
  AIGeneratePayload,
  AIUsageStats,
} from '@/types/ai.types'

interface AIStore {
  // Panel state
  isPanelOpen: boolean
  activeNoteId: string | null

  // Generation state
  isGenerating: boolean
  activeAction: AIAction | null
  generations: AIGeneration[]       // history for current note
  lastGeneration: AIGeneration | null
  error: string | null

  // Usage stats
  usageStats: AIUsageStats | null

  // Actions
  openPanel: (noteId: string) => void
  closePanel: () => void
  generate: (payload: AIGeneratePayload) => Promise<AIGeneration | null>
  loadHistory: (noteId: string) => Promise<void>
  loadUsageStats: () => Promise<void>
  clearError: () => void
  clearGenerations: () => void
}

export const useAIStore = create<AIStore>()(
  devtools(
    (set, get) => ({
      isPanelOpen: false,
      activeNoteId: null,
      isGenerating: false,
      activeAction: null,
      generations: [],
      lastGeneration: null,
      error: null,
      usageStats: null,

      openPanel: (noteId: string) => {
        set({ isPanelOpen: true, activeNoteId: noteId })
        // Load history when panel opens
        get().loadHistory(noteId)
      },

      closePanel: () => set({ isPanelOpen: false }),

      generate: async (payload: AIGeneratePayload) => {
        set({ isGenerating: true, activeAction: payload.action, error: null })
        try {
          const generation = await aiService.generate(payload)
          set((state) => ({
            generations: [generation, ...state.generations],
            lastGeneration: generation,
            isGenerating: false,
            activeAction: null,
          }))
          return generation
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : 'AI generation failed. Please retry.'
          set({ error: msg, isGenerating: false, activeAction: null })
          return null
        }
      },

      loadHistory: async (noteId: string) => {
        try {
          const { items } = await aiService.getHistory(noteId)
          set({ generations: items })
        } catch {
          // Non-critical — history failing shouldn't break the panel
        }
      },

      loadUsageStats: async () => {
        try {
          const stats = await aiService.getUsageStats()
          set({ usageStats: stats })
        } catch {
          // Silent fail
        }
      },

      clearError: () => set({ error: null }),
      clearGenerations: () => set({ generations: [], lastGeneration: null }),
    }),
    { name: 'AIStore' }
  )
)