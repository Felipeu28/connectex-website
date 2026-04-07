'use client'

import Script from 'next/script'
import { useState } from 'react'

declare global {
  interface Window {
    Builtfirst?: {
      embed: (opts: { baseUrl: string; containerId: string }) => void
    }
  }
}

export function BuiltfirstEmbed() {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="relative min-h-[800px]">
      <Script
        src="https://builtfirst-134665-3897.builtfirst.com/scripts/embed.js"
        strategy="afterInteractive"
        onLoad={() => {
          window.Builtfirst?.embed({
            baseUrl: 'https://builtfirst-134665-3897.builtfirst.com',
            containerId: 'builtfirst-container',
          })
          setLoaded(true)
        }}
      />

      {/* Loading skeleton */}
      {!loaded && (
        <div
          className="absolute inset-0 glass rounded-2xl border border-white/8 animate-pulse"
          aria-hidden="true"
        >
          <div className="p-8 space-y-4">
            <div className="h-8 bg-white/5 rounded-xl w-1/3" />
            <div className="h-4 bg-white/5 rounded-lg w-2/3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-32 bg-white/5 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      )}

      <div id="builtfirst-container" className="min-h-[800px]" />
    </div>
  )
}
