// frontend/src/pages/AIInsightsPage.tsx
// Premium analytics dashboard — Vercel Analytics + Stripe Dashboard inspired.
// WHY Recharts: already in your stack. WHY not Chart.js: Recharts is React-native,
// composable, and has first-class TypeScript types.

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

import {
  Sparkles, FileText, Flame, TrendingUp, BarChart2,
  Hash, Clock, Zap, Award, Target,
} from 'lucide-react'
import { useAnalyticsStore } from '@/store/analyticsStore'

// ── Colour palette consistent with your CSS variables ──────────────────────
const BRAND_VIOLET = '#7c3aed'
const BRAND_VIOLET_BRIGHT = '#a78bfa'
const EMERALD = '#10b981'
const AMBER = '#f59e0b'
const BLUE = '#3b82f6'
const PINK = '#ec4899'
const PIE_COLORS = [BRAND_VIOLET_BRIGHT, EMERALD, AMBER, BLUE, PINK, '#f87171']

// ── Formatting helpers ────────────────────────────────────────────────────
const shortDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const ACTION_LABELS: Record<string, string> = {
  summary:      'Summary',
  action_items: 'Actions',
  title:        'Title',
  chat:         'Chat',
}

// ── Skeleton card ─────────────────────────────────────────────────────────
const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div
    className={`rounded-xl animate-pulse ${className}`}
    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', height: 120 }}
  />
)

// ── Stat card ─────────────────────────────────────────────────────────────
interface StatProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  index?: number
}

const StatCard = ({ label, value, sub, icon: Icon, iconColor, iconBg, index = 0 }: StatProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
    className="rounded-xl p-4 flex flex-col gap-3"
    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
        <Icon size={13} style={{ color: iconColor }} />
      </div>
    </div>
    <div>
      <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>}
    </div>
  </motion.div>
)

// ── Custom tooltip ────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="px-3 py-2.5 rounded-xl text-xs shadow-xl"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        minWidth: 120,
      }}
    >
      <p className="font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span style={{ color: 'var(--text-tertiary)' }}>
              {ACTION_LABELS[entry.name] ?? entry.name}
            </span>
          </div>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Chart section wrapper ─────────────────────────────────────────────────
const ChartSection = ({
  title, subtitle, children, action,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
}) => (
  <div
    className="rounded-xl p-5"
    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
  >
    <div className="flex items-start justify-between mb-5">
      <div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
)

// ── Main page ─────────────────────────────────────────────────────────────
export function AIInsightsPage() {
  const { summary, weekly, growth, aiTrends, isLoading, error, fetchAll } = useAnalyticsStore()

  useEffect(() => { fetchAll() }, []) // eslint-disable-line

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-sm mb-2" style={{ color: '#ef4444' }}>{error}</p>
        <button
          onClick={fetchAll}
          className="text-xs px-3 py-1.5 rounded-lg mt-2"
          style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--accent-violet-bright)' }}
        >
          Retry
        </button>
      </div>
    )
  }

  // ── Prepare chart data ─────────────────────────────────────────────────

  // Weekly bar chart — notes_created + notes_edited + ai_generations
  const weeklyData = (weekly?.days ?? []).map((d) => ({
    date: shortDate(d.date),
    Notes: d.notes_created,
    Edits: d.notes_edited,
    AI: d.ai_generations,
  }))

  // Growth area chart
  const growthData = growth.map((p) => ({
    date: shortDate(p.date),
    Notes: p.cumulative_notes,
  }))

  // AI trends stacked bar
  const trendDates = Array.from(new Set(aiTrends.map((p) => p.date))).sort()
  const trendActions = Array.from(new Set(aiTrends.map((p) => p.action)))
  const trendData = trendDates.map((date) => {
    const row: Record<string, string | number> = { date: shortDate(date) }
    trendActions.forEach((action) => {
      const found = aiTrends.find((p) => p.date === date && p.action === action)
      row[action] = found?.count ?? 0
    })
    return row
  })

  // AI action pie
  const pieData = Object.entries(summary?.ai_action_breakdown ?? {}).map(([k, v]) => ({
    name: ACTION_LABELS[k] ?? k, value: v,
  }))

  return (
    <div className="p-5 max-w-6xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between mb-7"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles size={15} style={{ color: 'var(--accent-violet-bright)' }} />
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
              AI Insights
            </p>
          </div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Your productivity dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Overview of your notes, AI usage, and writing patterns
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors hover:opacity-70"
          style={{ color: 'var(--text-tertiary)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
        >
          <TrendingUp size={11} /> Refresh
        </button>
      </motion.div>

      {/* ── Top stat cards ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard index={0} label="Total notes" value={summary?.total_notes ?? 0} icon={FileText}
            iconColor={BRAND_VIOLET_BRIGHT} iconBg="rgba(124,58,237,0.1)"
            sub={`${summary?.notes_this_week ?? 0} this week`} />
          <StatCard index={1} label="AI generations" value={summary?.total_ai_generations ?? 0} icon={Sparkles}
            iconColor={EMERALD} iconBg="rgba(16,185,129,0.1)"
            sub={`${summary?.ai_generations_this_week ?? 0} this week`} />
          <StatCard index={2} label="Writing streak" value={`${summary?.current_streak_days ?? 0}d`} icon={Flame}
            iconColor={AMBER} iconBg="rgba(245,158,11,0.1)"
            sub={`Best: ${summary?.longest_streak_days ?? 0} days`} />
          <StatCard index={3} label="Words written" value={(summary?.total_words_written ?? 0).toLocaleString()} icon={Target}
            iconColor={BLUE} iconBg="rgba(59,130,246,0.1)"
            sub={`Avg ${summary?.avg_note_length ?? 0} words/note`} />
          <StatCard index={4} label="AI-enhanced notes" value={summary?.notes_with_ai_summary ?? 0} icon={Award}
            iconColor="#ec4899" iconBg="rgba(236,72,153,0.1)" />
          <StatCard index={5} label="Tags created" value={summary?.total_tags ?? 0} icon={Hash}
            iconColor={BRAND_VIOLET_BRIGHT} iconBg="rgba(124,58,237,0.1)" />
          <StatCard index={6} label="Notes this month" value={summary?.notes_this_month ?? 0} icon={TrendingUp}
            iconColor={EMERALD} iconBg="rgba(16,185,129,0.1)" />
          <StatCard index={7} label="Shared notes" value={summary?.public_notes ?? 0} icon={Zap}
            iconColor={AMBER} iconBg="rgba(245,158,11,0.1)" />
        </div>
      )}

      {/* ── Charts row 1 ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">

        {/* Weekly activity — 3 col */}
        <div className="lg:col-span-3">
          <ChartSection title="Weekly activity" subtitle="Notes, edits and AI usage over the past 7 days">
            {isLoading ? (
              <div className="h-52 animate-pulse rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }} />
            ) : weeklyData.length === 0 ? (
              <div className="h-52 flex items-center justify-center">
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No activity yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData} barSize={6} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    iconType="circle" iconSize={8}
                    wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', paddingTop: 12 }}
                  />
                  <Bar dataKey="Notes" fill={BRAND_VIOLET} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Edits" fill="rgba(124,58,237,0.35)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="AI" fill={EMERALD} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartSection>
        </div>

        {/* AI action breakdown pie — 2 col */}
        <div className="lg:col-span-2">
          <ChartSection title="AI action breakdown" subtitle="What you use AI for most">
            {isLoading ? (
              <div className="h-52 animate-pulse rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }} />
            ) : pieData.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center gap-2">
                <Sparkles size={22} style={{ color: 'rgba(255,255,255,0.1)' }} />
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No AI usage yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8}
                    wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', paddingTop: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartSection>
        </div>
      </div>

      {/* ── Charts row 2 ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Note growth area chart */}
        <ChartSection title="Note growth" subtitle="Cumulative notes over the last 30 days">
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND_VIOLET} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={BRAND_VIOLET} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false}
                  interval={Math.floor(growthData.length / 5)} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="Notes" stroke={BRAND_VIOLET_BRIGHT} strokeWidth={2}
                  fill="url(#growthGrad)" dot={false} activeDot={{ r: 4, fill: BRAND_VIOLET_BRIGHT }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartSection>

        {/* AI trends stacked bar */}
        <ChartSection title="AI usage trends" subtitle="Daily AI generations by type (14 days)">
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ) : trendData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2">
              <BarChart2 size={22} style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Start using AI to see trends</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={trendData} barSize={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', paddingTop: 8 }}
                />
                {trendActions.map((action, i) => (
                  <Bar key={action} dataKey={action} stackId="ai" fill={PIE_COLORS[i % PIE_COLORS.length]}
                    radius={i === trendActions.length - 1 ? [3, 3, 0, 0] : undefined} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartSection>
      </div>

      {/* ── Bottom row: top tags + most used action ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top tags */}
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Hash size={13} style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Top tags</h3>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-7 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
          ) : !summary?.top_tags.length ? (
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No tags yet</p>
          ) : (
            <div className="space-y-2">
              {summary.top_tags.map((tag, i) => {
                const max = summary.top_tags[0].count
                return (
                  <div key={tag.name} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-24 shrink-0">
                      <div className="w-2 h-2 rounded-full" style={{ background: tag.color }} />
                      <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{tag.name}</span>
                    </div>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: tag.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(tag.count / max) * 100}%` }}
                        transition={{ delay: i * 0.08, duration: 0.4 }}
                      />
                    </div>
                    <span className="text-xs w-6 text-right shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                      {tag.count}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Streak + quick stats */}
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock size={13} style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Writing patterns</h3>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Current streak', value: `${summary?.current_streak_days ?? 0} days`, icon: Flame, color: AMBER },
                { label: 'Longest streak', value: `${summary?.longest_streak_days ?? 0} days`, icon: Award, color: BRAND_VIOLET_BRIGHT },
                { label: 'Avg note length', value: `${summary?.avg_note_length ?? 0} words`, icon: FileText, color: BLUE },
                { label: 'Most used AI action', value: summary?.most_used_ai_action ? ACTION_LABELS[summary.most_used_ai_action] ?? summary.most_used_ai_action : 'None', icon: Sparkles, color: EMERALD },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <Icon size={13} style={{ color }} />
                  <span className="flex-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}