// frontend/src/components/ai/AIResultRenderer.tsx
// Renders the AI output correctly based on its type.
// Text → formatted paragraphs
// List → checkboxes
// Flashcards → flip-card grid
// Quiz → answer-reveal questions
// Tags → pill chips

import { useState } from 'react'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { AIResult, Flashcard, QuizQuestion } from '@/types/ai.types'

interface Props {
  result: AIResult
  outputType: string
}

export function AIResultRenderer({ result, outputType }: Props) {
  if (!result) return null

  switch (outputType) {
    case 'text':
      return <TextResult text={result as string} />
    case 'list':
      return <ListResult items={result as string[]} />
    case 'flashcards':
      return <FlashcardsResult cards={result as Flashcard[]} />
    case 'quiz':
      return <QuizResult questions={result as QuizQuestion[]} />
    case 'tags':
      return <TagsResult tags={result as string[]} />
    default:
      return <TextResult text={JSON.stringify(result, null, 2)} />
  }
}

function TextResult({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split('\n').filter(Boolean).map((line, i) => (
        <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {line}
        </p>
      ))}
    </div>
  )
}

function ListResult({ items }: { items: string[] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <p className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>
        No action items found.
      </p>
    )
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <div
            className="w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5"
            style={{ border: '1px solid var(--border-default)' }}
          >
            <Check size={10} style={{ color: 'var(--accent-violet-bright)' }} />
          </div>
          <span className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  )
}

function FlashcardsResult({ cards }: { cards: Flashcard[] }) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})

  if (!Array.isArray(cards) || cards.length === 0) {
    return <p className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>No flashcards generated.</p>
  }

  return (
    <div className="space-y-2">
      {cards.map((card, i) => (
        <button
          key={i}
          onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
          className="w-full text-left rounded-xl p-3.5 transition-all duration-200"
          style={{
            background: flipped[i] ? 'rgba(124,58,237,0.08)' : 'var(--bg-elevated)',
            border: `1px solid ${flipped[i] ? 'rgba(124,58,237,0.25)' : 'var(--border-subtle)'}`,
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                {flipped[i] ? 'Answer' : 'Question'}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {flipped[i] ? card.back : card.front}
              </p>
            </div>
            <div style={{ color: 'var(--text-tertiary)' }}>
              {flipped[i] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>
        </button>
      ))}
      <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
        Tap a card to reveal the answer
      </p>
    </div>
  )
}

function QuizResult({ questions }: { questions: QuizQuestion[] }) {
  const [selected, setSelected] = useState<Record<number, string>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})

  if (!Array.isArray(questions) || questions.length === 0) {
    return <p className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>No questions generated.</p>
  }

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={i} className="rounded-xl p-3.5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
            {i + 1}. {q.question}
          </p>
          <div className="space-y-1.5">
            {q.options.map((opt) => {
              const isSelected = selected[i] === opt
              const isCorrect = opt === q.answer
              const show = revealed[i]
              return (
                <button
                  key={opt}
                  onClick={() => {
                    setSelected((s) => ({ ...s, [i]: opt }))
                    setRevealed((r) => ({ ...r, [i]: true }))
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all"
                  style={{
                    background: show && isCorrect
                      ? 'rgba(16,185,129,0.12)'
                      : show && isSelected && !isCorrect
                      ? 'rgba(239,68,68,0.1)'
                      : isSelected
                      ? 'rgba(124,58,237,0.1)'
                      : 'transparent',
                    border: `1px solid ${
                      show && isCorrect
                        ? 'rgba(16,185,129,0.3)'
                        : show && isSelected && !isCorrect
                        ? 'rgba(239,68,68,0.3)'
                        : isSelected
                        ? 'rgba(124,58,237,0.3)'
                        : 'var(--border-subtle)'
                    }`,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function TagsResult({ tags }: { tags: string[] }) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return <p className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>No tags suggested.</p>
  }

  const colors = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#db2777']

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, i) => {
        const color = colors[i % colors.length]
        return (
          <span
            key={tag}
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{
              background: `${color}15`,
              color,
              border: `1px solid ${color}30`,
            }}
          >
            #{tag}
          </span>
        )
      })}
    </div>
  )
}