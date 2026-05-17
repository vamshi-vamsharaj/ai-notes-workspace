// frontend/src/services/analytics.service.ts
import api from './api'

export interface DailyActivity {
  date: string
  notes_created: number
  notes_edited: number
  ai_generations: number
}

export interface TagStat {
  name: string
  color: string
  count: number
}

export interface AnalyticsSummary {
  total_notes: number
  archived_notes: number
  public_notes: number
  notes_this_week: number
  notes_this_month: number
  total_ai_generations: number
  ai_generations_this_week: number
  notes_with_ai_summary: number
  most_used_ai_action: string | null
  ai_action_breakdown: Record<string, number>
  total_tags: number
  top_tags: TagStat[]
  avg_note_length: number
  longest_note_words: number
  total_words_written: number
  current_streak_days: number
  longest_streak_days: number
}

export interface WeeklyActivity {
  days: DailyActivity[]
  total_notes_created: number
  total_ai_generations: number
  most_active_day: string | null
}

export interface NoteGrowthPoint {
  date: string
  cumulative_notes: number
}

export interface AITrendPoint {
  date: string
  count: number
  action: string
}

export const analyticsService = {
  async getSummary(): Promise<AnalyticsSummary> {
    const { data } = await api.get<AnalyticsSummary>('/analytics/summary')
    return data
  },

  async getWeeklyActivity(): Promise<WeeklyActivity> {
    const { data } = await api.get<WeeklyActivity>('/analytics/weekly')
    return data
  },

  async getNoteGrowth(): Promise<NoteGrowthPoint[]> {
    const { data } = await api.get<{ points: NoteGrowthPoint[] }>('/analytics/growth')
    return data.points
  },

  async getAITrends(): Promise<AITrendPoint[]> {
    const { data } = await api.get<{ daily: AITrendPoint[] }>('/analytics/ai-trends')
    return data.daily
  },
}