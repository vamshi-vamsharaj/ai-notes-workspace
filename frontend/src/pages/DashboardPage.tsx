// frontend/src/pages/DashboardPage.tsx
// Fully self-contained dashboard insights.
// All metrics are derived from notesStore data so the page works
// immediately without any extra backend endpoints.
// Recharts is used for the activity bar chart and tag breakdown.
// No new dependencies needed — recharts is already in the stack.

import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  FileText, Sparkles,  TrendingUp, Plus,
  ArrowRight, Clock, Flame, Hash, Zap,
  BarChart2, BookOpen, Archive,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNotesStore } from '@/store/notesStore'
import { NoteCard } from '@/components/notes/NoteCard'
import { NotesSkeleton } from '@/components/notes/NotesSkeleton'

// ─── Colour tokens (match CSS variables) ─────────────────────────────────────
const V      = '#7c3aed'
const V_SOFT = '#a78bfa'
const EMERALD = '#10b981'
const AMBER   = '#f59e0b'
const BLUE    = '#3b82f6'
const PINK    = '#ec4899'
const TAG_PALETTE = [V_SOFT, EMERALD, AMBER, BLUE, PINK, '#f87171', '#34d399', '#60a5fa']

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isoToDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' })
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}
function wordCount(text: string): number {
  return text ? text.trim().split(/\s+/).filter(Boolean).length : 0
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, iconColor, iconBg, delay = 0, onClick,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  delay?: number
  onClick?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay }}
      onClick={onClick}
      className={`rounded-xl p-4 flex flex-col gap-3 ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
          {label}
        </span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: iconBg }}
        >
          <Icon size={13} style={{ color: iconColor }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  )
}

const SkeletonCard = () => (
  <div
    className="rounded-xl p-4 h-24 skeleton"
    style={{ border: '1px solid var(--border-subtle)' }}
  />
)

function SectionHeader({
  icon: Icon, title, action,
}: {
  icon: React.ElementType
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon size={13} style={{ color: 'var(--text-tertiary)' }} />
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
      </div>
      {action}
    </div>
  )
}

// Custom Recharts tooltip styled to match the dark theme
function DarkTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="px-3 py-2.5 rounded-xl text-xs shadow-2xl"
      style={{
        background: 'var(--bg-overlay)',
        border: '1px solid var(--border-default)',
        minWidth: 110,
      }}
    >
      <p className="font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: entry.color }} />
            <span style={{ color: 'var(--text-tertiary)' }}>{entry.name}</span>
          </div>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user } = useAuthStore()
  const {
    notes, tags, isLoading, total,
    fetchNotes, fetchTags, createNote, isCreating,
  } = useNotesStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotes({ is_archived: false, sort: 'updated_at' })
    fetchTags()
  }, []) // eslint-disable-line

  // ── Derived metrics (all from notesStore — no extra endpoints needed) ──────

  const metrics = useMemo(() => {
    const weekAgo  = daysAgo(7)
    const monthAgo = daysAgo(30)

    const notesThisWeek  = notes.filter(n => new Date(n.updated_at) >= weekAgo).length
    const notesThisMonth = notes.filter(n => new Date(n.created_at) >= monthAgo).length
    const aiNotes        = notes.filter(n => n.ai_summary).length
    const totalWords     = notes.reduce((s, n) => s + wordCount(n.content ?? ''), 0)
    const avgWords       = notes.length ? Math.round(totalWords / notes.length) : 0

    // Writing streak: count consecutive days (from today backwards) that have at least 1 edit
    const editDays = new Set(notes.map(n => new Date(n.updated_at).toDateString()))
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const d = daysAgo(i)
      if (editDays.has(d.toDateString())) {
        streak++
      } else if (i > 0) { // allow today to have no edits yet
        break
      }
    }

    return { notesThisWeek, notesThisMonth, aiNotes, totalWords, avgWords, streak }
  }, [notes])

  // ── 7-day activity bar chart ───────────────────────────────────────────────
  const activityData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day    = daysAgo(6 - i)
      const dayStr = day.toDateString()
      const created = notes.filter(n => new Date(n.created_at).toDateString() === dayStr).length
      const edited  = notes.filter(n =>
        new Date(n.updated_at).toDateString() === dayStr &&
        new Date(n.created_at).toDateString() !== dayStr
      ).length
      return {
        day: isoToDay(day.toISOString()),
        Created: created,
        Edited: edited,
      }
    })
  }, [notes])

  // ── Tag usage breakdown ────────────────────────────────────────────────────
  const tagData = useMemo(() => {
    return tags
      .map(tag => ({
        ...tag,
        count: notes.filter(n => n.tags?.some(t => t.id === tag.id)).length,
      }))
      .filter(t => t.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [notes, tags])


  // ── Recent notes (top 4) ───────────────────────────────────────────────────
  const recentNotes = notes.slice(0, 4)

  // ── Greeting ──────────────────────────────────────────────────────────────
  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const handleCreate = async () => {
    const note = await createNote({ title: 'Untitled', content: '' })
    navigate(`/notes/${note.id}`)
  }

  return (
    <div className="p-5 pb-12 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between mb-7"
      >
        <div>
          <p
            className="text-xs font-medium uppercase tracking-widest mb-1.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {greeting},{' '}
            <span style={{ color: 'var(--accent-violet-bright)' }}>
              {user?.name?.split(' ')[0]}
            </span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Here's what's happening in your workspace.
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
        >
          {isCreating
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Plus size={14} />
          }
          New note
        </button>
      </motion.div>

      {/* ── Stat cards row ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard delay={0.00} label="Total notes"    value={total}
            sub={`${metrics.notesThisWeek} edited this week`}
            icon={FileText} iconColor={V_SOFT} iconBg="rgba(124,58,237,0.1)"
            onClick={() => navigate('/notes')} />
          <StatCard delay={0.04} label="AI enhanced"   value={metrics.aiNotes}
            sub={`of ${total} notes have AI summaries`}
            icon={Sparkles} iconColor={EMERALD} iconBg="rgba(16,185,129,0.1)"
            onClick={() => navigate('/analytics')} />
          <StatCard delay={0.08} label="Writing streak" value={`${metrics.streak}d`}
            sub={metrics.streak > 1 ? 'Keep it up!' : 'Write today to start a streak'}
            icon={Flame} iconColor={AMBER} iconBg="rgba(245,158,11,0.1)" />
          <StatCard delay={0.12} label="Words written"  value={metrics.totalWords.toLocaleString()}
            sub={`avg ${metrics.avgWords} words per note`}
            icon={BookOpen} iconColor={BLUE} iconBg="rgba(59,130,246,0.1)" />
          <StatCard delay={0.16} label="This week"  value={metrics.notesThisWeek}
            sub="notes touched in 7 days"
            icon={TrendingUp} iconColor={PINK} iconBg="rgba(236,72,153,0.1)" />
          <StatCard delay={0.20} label="This month" value={metrics.notesThisMonth}
            sub="notes created in 30 days"
            icon={BarChart2} iconColor={V_SOFT} iconBg="rgba(124,58,237,0.1)" />
          <StatCard delay={0.24} label="Tags"        value={tags.length}
            sub={tagData.length > 0 ? `most used: ${tagData[0]?.name}` : 'no tags yet'}
            icon={Hash} iconColor={AMBER} iconBg="rgba(245,158,11,0.1)" />
          <StatCard delay={0.28} label="Archived"    value={0}
            sub="notes in archive"
            icon={Archive} iconColor="rgba(255,255,255,0.3)" iconBg="rgba(255,255,255,0.04)"
            onClick={() => navigate('/notes/archived')} />
        </div>
      )}

      {/* ── Charts + Recent notes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* 7-day activity chart — spans 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="lg:col-span-2 rounded-xl p-5"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                7-day activity
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Notes created and edited per day
              </p>
            </div>
            {metrics.notesThisWeek > 0 && (
              <span
                className="text-xs px-2 py-1 rounded-lg font-medium"
                style={{ background: 'rgba(16,185,129,0.1)', color: EMERALD }}
              >
                +{metrics.notesThisWeek} this week
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="h-44 skeleton rounded-lg" />
          ) : activityData.every(d => d.Created === 0 && d.Edited === 0) ? (
            <div className="h-44 flex flex-col items-center justify-center gap-2">
              <BarChart2 size={28} style={{ color: 'rgba(255,255,255,0.08)' }} />
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                No activity yet — start writing!
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={176}>
              <BarChart data={activityData} barSize={10} barGap={3}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={20}
                />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="Created" fill={V}       radius={[4, 4, 0, 0]} />
                <Bar dataKey="Edited"  fill={V_SOFT}  radius={[4, 4, 0, 0]} fillOpacity={0.45} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3">
            {[
              { label: 'Created', color: V },
              { label: 'Edited',  color: V_SOFT },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI usage ring — 1 col */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-xl p-5"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
        >
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            AI coverage
          </h3>
          <p className="text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>
            Notes enhanced by AI
          </p>

          {isLoading ? (
            <div className="h-36 skeleton rounded-lg" />
          ) : (
            <>
              {/* Ring visualisation (pure CSS — no extra library) */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {/* track */}
                    <circle cx="50" cy="50" r="38"
                      fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                    {/* progress */}
                    <circle cx="50" cy="50" r="38"
                      fill="none" stroke={V_SOFT} strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 38}`}
                      strokeDashoffset={`${2 * Math.PI * 38 * (1 - (total > 0 ? metrics.aiNotes / total : 0))}`}
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {total > 0 ? Math.round((metrics.aiNotes / total) * 100) : 0}%
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>covered</span>
                  </div>
                </div>

                <div className="flex gap-4 mt-4 text-center">
                  <div>
                    <p className="text-base font-semibold" style={{ color: V_SOFT }}>{metrics.aiNotes}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Enhanced</p>
                  </div>
                  <div className="w-px" style={{ background: 'var(--border-subtle)' }} />
                  <div>
                    <p className="text-base font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {Math.max(0, total - metrics.aiNotes)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Plain</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/analytics')}
                className="flex items-center justify-center gap-1 w-full mt-4 text-xs transition-opacity hover:opacity-70"
                style={{ color: 'var(--accent-violet-bright)' }}
              >
                Full AI insights <ArrowRight size={11} />
              </button>
            </>
          )}
        </motion.div>
      </div>

      {/* ── Bottom row: Recent notes + Tag breakdown + Quick actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent notes — 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.22 }}
          className="lg:col-span-2"
        >
          <SectionHeader
            icon={Clock}
            title="Recent notes"
            action={
              <button
                onClick={() => navigate('/notes')}
                className="flex items-center gap-1 text-xs hover:opacity-70 transition-opacity"
                style={{ color: 'var(--accent-violet-bright)' }}
              >
                View all <ArrowRight size={11} />
              </button>
            }
          />

          {isLoading ? (
            <NotesSkeleton count={4} />
          ) : recentNotes.length === 0 ? (
            <div
              className="rounded-xl p-10 text-center"
              style={{ border: '1px dashed var(--border-subtle)' }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
              >
                <FileText size={20} style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>
                No notes yet
              </p>
              <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.18)' }}>
                Create your first note and start building your knowledge base.
              </p>
              <button
                onClick={handleCreate}
                className="text-xs px-4 py-2 rounded-lg transition-all hover:opacity-90"
                style={{ background: 'var(--accent-violet)', color: 'white' }}
              >
                + New note
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentNotes.map((note, i) => (
                <NoteCard key={note.id} note={note} index={i} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Right column — tags + quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.26 }}
          className="space-y-4"
        >
          {/* Tag breakdown */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Hash size={13} style={{ color: 'var(--text-tertiary)' }} />
              <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Top tags
              </h3>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-5 skeleton rounded" />
                ))}
              </div>
            ) : tagData.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                No tags yet. Add tags to your notes to see them here.
              </p>
            ) : (
              <div className="space-y-2.5">
                {tagData.map((tag, i) => {
                  const maxCount = tagData[0].count
                  const pct = maxCount > 0 ? (tag.count / maxCount) * 100 : 0
                  return (
                    <div
                      key={tag.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/notes?tag=${tag.id}`)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: tag.color }}
                          />
                          <span className="text-xs truncate max-w-[100px]"
                            style={{ color: 'var(--text-secondary)' }}>
                            {tag.name}
                          </span>
                        </div>
                        <span className="text-xs shrink-0 ml-2"
                          style={{ color: 'var(--text-tertiary)' }}>
                          {tag.count}
                        </span>
                      </div>
                      <div
                        className="h-1 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: TAG_PALETTE[i % TAG_PALETTE.length] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.3 + i * 0.07, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Writing insights */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap size={13} style={{ color: 'var(--text-tertiary)' }} />
              <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Writing insights
              </h3>
            </div>
            <div className="space-y-2">
              {[
                {
                  label: 'Avg note length',
                  value: `${metrics.avgWords} words`,
                  icon: BookOpen,
                  color: BLUE,
                },
                {
                  label: 'Total words',
                  value: metrics.totalWords.toLocaleString(),
                  icon: FileText,
                  color: V_SOFT,
                },
                {
                  label: 'Writing streak',
                  value: `${metrics.streak} ${metrics.streak === 1 ? 'day' : 'days'}`,
                  icon: Flame,
                  color: AMBER,
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={12} style={{ color }} />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {label}
                    </span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
          >
            <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Quick actions
            </h3>
            <div className="space-y-0.5">
              {[
                { label: 'All notes',    icon: FileText,  to: '/notes' },
                { label: 'Archive',      icon: Archive,   to: '/notes/archived' },
                { label: 'AI Insights',  icon: Sparkles,  to: '/analytics' },
              ].map(({ label, icon: Icon, to }) => (
                <button
                  key={label}
                  onClick={() => navigate(to)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs hover:bg-white/5 transition-colors text-left"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Icon size={13} style={{ color: 'var(--text-tertiary)' }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}