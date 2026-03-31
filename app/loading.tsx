export default function Loading() {
  return (
    <section className="min-h-screen pt-32 pb-24 px-4 sm:px-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Title skeleton */}
        <div className="h-4 w-32 rounded bg-white/5 animate-pulse mb-8" />
        <div className="h-10 w-3/4 rounded bg-white/5 animate-pulse mb-4" />
        <div className="h-10 w-1/2 rounded bg-white/5 animate-pulse mb-6" />

        {/* Subtitle skeleton */}
        <div className="h-5 w-full rounded bg-white/5 animate-pulse mb-3" />
        <div className="h-5 w-2/3 rounded bg-white/5 animate-pulse mb-12" />

        {/* Card skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/5 p-8"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse mb-6" />
              <div className="h-5 w-2/3 rounded bg-white/5 animate-pulse mb-3" />
              <div className="h-4 w-full rounded bg-white/5 animate-pulse mb-2" />
              <div className="h-4 w-4/5 rounded bg-white/5 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
