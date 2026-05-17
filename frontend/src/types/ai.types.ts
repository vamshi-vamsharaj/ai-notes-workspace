// frontend/src/types/ai.types.ts

export type AIAction =
  | 'summarize'
  | 'extract_action_items'
  | 'generate_title'
  | 'improve_writing'
  | 'convert_to_study_notes'
  | 'generate_flashcards'
  | 'generate_quiz'
  | 'suggest_tags'
  | 'explain_content'
  | 'simplify'

export interface AIActionMeta {
  action: AIAction
  label: string
  description: string
  icon: string          // lucide icon name — resolved in component
  outputType: 'text' | 'list' | 'flashcards' | 'quiz' | 'tags'
  group: 'understand' | 'create' | 'transform'
}

export interface Flashcard {
  front: string
  back: string
}

export interface QuizQuestion {
  question: string
  options: string[]
  answer: string
}

// The parsed result varies by action
export type AIResult = string | string[] | Flashcard[] | QuizQuestion[]

export interface AIGeneration {
  id: string
  note_id: string
  action: AIAction
  result: AIResult
  tokens_used: number
  created_at: string
  cached: boolean
}

export interface AIGeneratePayload {
  note_id: string
  action: AIAction
  content: string
}

export interface AIUsageStats {
  total_generations: number
  total_tokens_used: number
  generations_this_week: number
  most_used_action: AIAction | null
  action_breakdown: Record<AIAction, number>
}

export interface AIHistoryResponse {
  items: AIGeneration[]
  total: number
}

// Metadata for each action — drives the UI
export const AI_ACTIONS: AIActionMeta[] = [
  {
    action: 'summarize',
    label: 'Summarise',
    description: 'Condense key points into a short paragraph',
    icon: 'Sparkles',
    outputType: 'text',
    group: 'understand',
  },
  {
    action: 'extract_action_items',
    label: 'Action Items',
    description: 'Pull out all tasks and to-dos',
    icon: 'CheckSquare',
    outputType: 'list',
    group: 'understand',
  },
  {
    action: 'generate_title',
    label: 'Smart Title',
    description: 'Generate a concise title',
    icon: 'Heading',
    outputType: 'text',
    group: 'understand',
  },
  {
    action: 'suggest_tags',
    label: 'Suggest Tags',
    description: 'Recommend relevant tags',
    icon: 'Tag',
    outputType: 'tags',
    group: 'understand',
  },
  {
    action: 'improve_writing',
    label: 'Improve Writing',
    description: 'Fix grammar and improve clarity',
    icon: 'Wand2',
    outputType: 'text',
    group: 'transform',
  },
  {
    action: 'simplify',
    label: 'Simplify',
    description: 'Rewrite in plain language',
    icon: 'AlignLeft',
    outputType: 'text',
    group: 'transform',
  },
  {
    action: 'convert_to_study_notes',
    label: 'Study Notes',
    description: 'Structure as study-friendly notes',
    icon: 'BookOpen',
    outputType: 'text',
    group: 'create',
  },
  {
    action: 'generate_flashcards',
    label: 'Flashcards',
    description: 'Create Q&A flashcard pairs',
    icon: 'Layers',
    outputType: 'flashcards',
    group: 'create',
  },
  {
    action: 'generate_quiz',
    label: 'Quiz',
    description: 'Generate multiple-choice questions',
    icon: 'HelpCircle',
    outputType: 'quiz',
    group: 'create',
  },
  {
    action: 'explain_content',
    label: 'Explain',
    description: 'Break down complex content simply',
    icon: 'Lightbulb',
    outputType: 'text',
    group: 'understand',
  },
]

export const ACTION_GROUPS = {
  understand: 'Understand',
  transform: 'Transform',
  create: 'Create',
} as const