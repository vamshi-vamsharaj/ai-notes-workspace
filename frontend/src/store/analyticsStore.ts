// frontend/src/store/analyticsStore.ts
// WHY this store exists separately from notesStore:
// Analytics data is read-only and comes from different endpoints.
// Mixing it into notesStore would couple unrelated concerns.

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { analyticsService } from '@/services/analytics.service'
import type {
  AnalyticsSummary,
  WeeklyActivity,
  NoteGrowthPoint,
  AITrendPoint,
} from '@/services/analytics.service'

interface AnalyticsStore {
  summary: AnalyticsSummary | null
  weekly: WeeklyActivity | null
  growth: NoteGrowthPoint[]
  aiTrends: AITrendPoint[]
  isLoading: boolean
  error: string | null

  fetchAll: () => Promise<void>
  fetchSummary: () => Promise<void>
}

export const useAnalyticsStore = create<AnalyticsStore>()(
  devtools(
    (set) => ({
      summary: null,
      weekly: null,
      growth: [],
      aiTrends: [],
      isLoading: false,
      error: null,

      fetchAll: async () => {
        set({ isLoading: true, error: null })
        try {
          // Fire all requests in parallel
          const [summary, weekly, growth, aiTrends] = await Promise.all([
            analyticsService.getSummary().catch(() => null),
            analyticsService.getWeeklyActivity().catch(() => null),
            analyticsService.getNoteGrowth().catch(() => []),
            analyticsService.getAITrends().catch(() => []),
          ])
          set({
            summary,
            weekly,
            growth: growth ?? [],
            aiTrends: aiTrends ?? [],
            isLoading: false,
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to load analytics'
          set({ error: msg, isLoading: false })
        }
      },

      fetchSummary: async () => {
        try {
          const summary = await analyticsService.getSummary()
          set({ summary })
        } catch {
          // Non-critical
        }
      },
    }),
    { name: 'AnalyticsStore' }
  )
)