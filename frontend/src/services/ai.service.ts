// frontend/src/services/ai.service.ts
import api from './api'
import type {
  AIGeneratePayload,
  AIGeneration,
  AIHistoryResponse,
  AIUsageStats,
} from '@/types/ai.types'

export const aiService = {
  async generate(payload: AIGeneratePayload): Promise<AIGeneration> {
    const { data } = await api.post<AIGeneration>('/ai/generate', payload, {
      timeout: 35_000, // 35s — longer than backend 30s so backend error propagates
    })
    return data
  },

  async getHistory(noteId: string, limit = 20): Promise<AIHistoryResponse> {
    const { data } = await api.get<AIHistoryResponse>(
      `/ai/history/${noteId}?limit=${limit}`
    )
    return data
  },

  async getUsageStats(): Promise<AIUsageStats> {
    const { data } = await api.get<AIUsageStats>('/ai/usage')
    return data
  },
}