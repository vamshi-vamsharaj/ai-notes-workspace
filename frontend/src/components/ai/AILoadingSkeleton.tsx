// frontend/src/components/ai/AILoadingSkeleton.tsx
// Pulsing skeleton that mimics a streaming text generation feel.

export function AILoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[90, 75, 85, 60].map((w, i) => (
        <div
          key={i}
          className="skeleton h-3 rounded"
          style={{
            width: `${w}%`,
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  )
}

// Larger skeleton for full result area
export function AIResultSkeleton() {
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="skeleton w-5 h-5 rounded-md" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
      {[100, 85, 92, 70, 88].map((w, i) => (
        <div
          key={i}
          className="skeleton h-3 rounded"
          style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}