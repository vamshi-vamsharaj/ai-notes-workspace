// frontend/src/components/ai/AISidePanel.tsx
// IMPROVEMENTS over previous version:
// 1. Resizable via drag handle — min 280px, max 520px
// 2. Scroll shadow at top when content is scrolled (like ChatGPT)
// 3. Sticky panel header always visible
// 4. Smooth spring animation
// 5. Panel width persisted in sessionStorage

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Copy, CornerDownLeft, RotateCcw, ChevronDown,
  Sparkles, CheckSquare, Heading, Tag, Wand2,
  AlignLeft, BookOpen, Layers, HelpCircle, Lightbulb,
  Clock, Check, GripVertical,
} from 'lucide-react'
import { useAIStore } from '@/store/aiStore'
import { AI_ACTIONS, ACTION_GROUPS, type AIAction, type AIActionMeta } from '@/types/ai.types'
import { AIResultRenderer } from './AIResultRenderer'
import { AILoadingSkeleton } from './AILoadingSkeleton'

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles, CheckSquare, Heading, Tag, Wand2,
  AlignLeft, BookOpen, Layers, HelpCircle, Lightbulb,
}

const MIN_WIDTH = 280
const MAX_WIDTH = 520
const DEFAULT_WIDTH = 340

function getSavedWidth(): number {
  try {
    const v = sessionStorage.getItem('ai-panel-width')
    if (v) {
      const n = parseInt(v, 10)
      if (n >= MIN_WIDTH && n <= MAX_WIDTH) return n
    }
  } catch { /* ignore */ }
  return DEFAULT_WIDTH
}

interface AISidePanelProps {
  noteId: string
  noteContent: string
  onInsertText?: (text: string) => void
}

export function AISidePanel({ noteId, noteContent, onInsertText }: AISidePanelProps) {
  const {
    isPanelOpen, closePanel,
    isGenerating, activeAction,
    generations, lastGeneration,
    error, generate, clearError,
  } = useAIStore()

  const [panelWidth, setPanelWidth] = useState(getSavedWidth)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    understand: true, transform: false, create: false,
  })
  const [activeTab, setActiveTab] = useState<'actions' | 'history'>('actions')
  const [scrolled, setScrolled] = useState(false)

  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(DEFAULT_WIDTH)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll shadow detection
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setScrolled(el.scrollTop > 8)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [isPanelOpen])

  // Drag-to-resize
  const onDragStart = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = panelWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return
      const delta = startX.current - ev.clientX   // drag left = wider
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta))
      setPanelWidth(next)
    }
    const onUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      sessionStorage.setItem('ai-panel-width', String(panelWidth))
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [panelWidth])

  const handleGenerate = useCallback(async (action: AIAction) => {
    if (isGenerating) return
    clearError()
    setActiveTab('actions')
    await generate({ note_id: noteId, action, content: noteContent })
  }, [isGenerating, noteId, noteContent, generate, clearError])

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(
      typeof text === 'string' ? text : JSON.stringify(text, null, 2)
    )
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleInsert = (result: unknown) => {
    if (!onInsertText) return
    const text = typeof result === 'string'
      ? result
      : Array.isArray(result)
      ? (result as string[]).map((item, i) =>
          `${i + 1}. ${typeof item === 'string' ? item : JSON.stringify(item)}`
        ).join('\n')
      : JSON.stringify(result, null, 2)
    onInsertText(text)
  }

  const groupedActions = (Object.keys(ACTION_GROUPS) as Array<keyof typeof ACTION_GROUPS>).map(
    (group) => ({
      group,
      label: ACTION_GROUPS[group],
      actions: AI_ACTIONS.filter((a) => a.group === group),
    })
  )

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: panelWidth, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="flex shrink-0 h-full border-l relative"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          {/* ── Drag resize handle ── */}
          <div
            onMouseDown={onDragStart}
            className="absolute left-0 top-0 bottom-0 w-1.5 z-10 flex items-center justify-center cursor-col-resize group"
            style={{ background: 'transparent' }}
          >
            <div
              className="w-0.5 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'var(--accent-violet)' }}
            />
            <GripVertical
              size={12}
              className="absolute opacity-0 group-hover:opacity-40 transition-opacity"
              style={{ color: 'var(--text-tertiary)' }}
            />
          </div>

          <div className="flex flex-col h-full w-full overflow-hidden">
            {/* ── Sticky header ── */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b shrink-0 transition-shadow duration-200"
              style={{
                borderColor: 'var(--border-subtle)',
                boxShadow: scrolled ? '0 4px 16px rgba(0,0,0,0.25)' : 'none',
                zIndex: 1,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
                >
                  <Sparkles size={12} className="text-white" />
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  AI Assistant
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Tab switcher */}
                <div
                  className="flex items-center rounded-lg p-0.5 mr-1"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  {(['actions', 'history'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                      style={{
                        background: activeTab === tab ? 'var(--bg-overlay)' : 'transparent',
                        color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      }}
                    >
                      {tab === 'history' ? (
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> History
                        </span>
                      ) : 'Actions'}
                    </button>
                  ))}
                </div>

                <button
                  onClick={closePanel}
                  className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* ── Scrollable content ── */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto"
              style={{ scrollbarWidth: 'thin' }}
            >
              {activeTab === 'actions' ? (
                <ActionsTab
                  groupedActions={groupedActions}
                  expandedGroups={expandedGroups}
                  setExpandedGroups={setExpandedGroups}
                  isGenerating={isGenerating}
                  activeAction={activeAction}
                  lastGeneration={lastGeneration}
                  error={error}
                  copiedId={copiedId}
                  onGenerate={handleGenerate}
                  onCopy={handleCopy}
                  onInsert={handleInsert}
                  onRetry={() => lastGeneration && handleGenerate(lastGeneration.action as AIAction)}
                  noteContent={noteContent}
                  onInsertText={onInsertText}
                />
              ) : (
                <HistoryTab
                  generations={generations}
                  copiedId={copiedId}
                  onCopy={handleCopy}
                  onInsert={handleInsert}
                  onInsertText={onInsertText}
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Actions Tab ──────────────────────────────────────────────────────────────
function ActionsTab({
  groupedActions, expandedGroups, setExpandedGroups,
  isGenerating, activeAction, lastGeneration,
  error, copiedId,
  onGenerate, onCopy, onInsert, onRetry, noteContent, onInsertText,
}: {
  groupedActions: { group: string; label: string; actions: AIActionMeta[] }[]
  expandedGroups: Record<string, boolean>
  setExpandedGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  isGenerating: boolean
  activeAction: AIAction | null
  lastGeneration: ReturnType<typeof useAIStore.getState>['lastGeneration']
  error: string | null
  copiedId: string | null
  onGenerate: (action: AIAction) => void
  onCopy: (text: string, id: string) => void
  onInsert: (result: unknown) => void
  onRetry: () => void
  noteContent: string
  onInsertText?: (text: string) => void
}) {
  const hasContent = noteContent.trim().length > 0

  return (
    <div className="p-3 space-y-2">
      {!hasContent && (
        <div className="rounded-xl p-3 text-xs"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
          Start writing to unlock AI features.
        </div>
      )}

      {error && (
        <div className="rounded-xl p-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-xs mb-2" style={{ color: '#f87171' }}>{error}</p>
          <button onClick={onRetry} className="flex items-center gap-1.5 text-xs hover:opacity-80"
            style={{ color: 'var(--accent-violet-bright)' }}>
            <RotateCcw size={11} /> Retry
          </button>
        </div>
      )}

      {isGenerating && activeAction && (
        <div className="rounded-xl p-3"
          style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded border-2 border-t-transparent border-violet-500 animate-spin" />
            <p className="text-xs font-medium" style={{ color: 'var(--accent-violet-bright)' }}>
              Generating…
            </p>
          </div>
          <AILoadingSkeleton />
        </div>
      )}

      {!isGenerating && lastGeneration && (
        <GenerationCard
          generation={lastGeneration}
          copiedId={copiedId}
          onCopy={onCopy}
          onInsert={onInsert}
          onRetry={() => onGenerate(lastGeneration.action as AIAction)}
          isLatest
          hasInsert={!!onInsertText}
        />
      )}

      {groupedActions.map(({ group, label, actions }) => (
        <div key={group} className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setExpandedGroups((p) => ({ ...p, [group]: !p[group] }))}
            className="flex items-center justify-between w-full px-3.5 py-2.5 hover:bg-white/3 transition-colors"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}>
              {label}
            </span>
            <ChevronDown size={13} style={{
              color: 'var(--text-tertiary)',
              transform: expandedGroups[group] ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.18s',
            }} />
          </button>

          <AnimatePresence initial={false}>
            {expandedGroups[group] && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.16 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="p-1.5 space-y-0.5">
                  {actions.map((meta) => {
                    const Icon = ICON_MAP[meta.icon] ?? Sparkles
                    const isActive = isGenerating && activeAction === meta.action
                    return (
                      <button
                        key={meta.action}
                        onClick={() => hasContent && onGenerate(meta.action)}
                        disabled={isGenerating || !hasContent}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/4"
                        style={{
                          background: isActive ? 'rgba(124,58,237,0.1)' : 'transparent',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                          style={{ background: isActive ? 'rgba(124,58,237,0.2)' : 'var(--bg-elevated)' }}
                        >
                          {isActive
                            ? <div className="w-3 h-3 border border-t-transparent border-violet-400 rounded-full animate-spin" />
                            : <Icon size={12} style={{ color: 'var(--accent-violet-bright)' }} />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                            {meta.label}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                            {meta.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

function HistoryTab({
  generations, copiedId, onCopy, onInsert, onInsertText,
}: {
  generations: ReturnType<typeof useAIStore.getState>['generations']
  copiedId: string | null
  onCopy: (text: string, id: string) => void
  onInsert: (result: unknown) => void
  onInsertText?: (text: string) => void
}) {
  if (generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <Clock size={20} style={{ color: 'var(--text-tertiary)' }} />
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No history yet</p>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          AI generations for this note will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3">
      {generations.map((gen) => (
        <GenerationCard
          key={gen.id}
          generation={gen}
          copiedId={copiedId}
          onCopy={onCopy}
          onInsert={onInsert}
          onRetry={() => {}}
          isLatest={false}
          hasInsert={!!onInsertText}
        />
      ))}
    </div>
  )
}

function GenerationCard({
  generation, copiedId, onCopy, onInsert, onRetry, isLatest, hasInsert,
}: {
  generation: ReturnType<typeof useAIStore.getState>['lastGeneration']
  copiedId: string | null
  onCopy: (text: string, id: string) => void
  onInsert: (result: unknown) => void
  onRetry: () => void
  isLatest: boolean
  hasInsert: boolean
}) {
  if (!generation) return null
  const meta = AI_ACTIONS.find((a) => a.action === generation.action)
  const isCopied = copiedId === generation.id
  const resultText = typeof generation.result === 'string'
    ? generation.result
    : JSON.stringify(generation.result)

  return (
    <motion.div
      initial={isLatest ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.15)' }}>
            <Sparkles size={10} style={{ color: 'var(--accent-violet-bright)' }} />
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            {meta?.label ?? generation.action}
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {generation.tokens_used}t
        </span>
      </div>

      <div className="p-3">
        <AIResultRenderer result={generation.result} outputType={meta?.outputType ?? 'text'} />
      </div>

      <div className="flex items-center gap-1 px-3 py-2 border-t"
        style={{ borderColor: 'var(--border-subtle)' }}>
        <button onClick={() => onCopy(resultText, generation.id)}
          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: isCopied ? '#10b981' : 'var(--text-tertiary)' }}>
          {isCopied ? <Check size={11} /> : <Copy size={11} />}
          {isCopied ? 'Copied' : 'Copy'}
        </button>

        {hasInsert && (
          <button onClick={() => onInsert(generation.result)}
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-tertiary)' }}>
            <CornerDownLeft size={11} />
            Insert
          </button>
        )}

        <button onClick={onRetry}
          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg hover:bg-white/5 transition-colors ml-auto"
          style={{ color: 'var(--text-tertiary)' }}>
          <RotateCcw size={11} />
          Retry
        </button>
      </div>
    </motion.div>
  )
}