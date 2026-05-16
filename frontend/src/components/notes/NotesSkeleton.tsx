// frontend/src/components/notes/NotesSkeleton.tsx
export function NotesSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl p-4"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            animationDelay: `${i * 0.05}s`,
          }}
        >
          {/* Tag pill */}
          <div className="skeleton h-4 w-16 rounded-full mb-3" />
          {/* Title */}
          <div className="skeleton h-4 w-3/4 rounded mb-2" />
          <div className="skeleton h-4 w-1/2 rounded mb-3" />
          {/* Snippet */}
          <div className="space-y-1.5">
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </div>
          {/* Footer */}
          <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="skeleton h-3 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}