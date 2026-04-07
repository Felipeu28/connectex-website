import { ImageResponse } from 'next/og'
import { solutions, getSolution } from '@/data/solutions'

export const alt = 'Connectex Solutions'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export async function generateStaticParams() {
  return solutions.map((s) => ({ slug: s.slug }))
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const solution = getSolution(slug)

  const title = solution?.title ?? 'Technology Solutions'
  const color = solution?.color ?? '#00C9A7'
  const tagline = solution?.tagline ?? 'Vendor-neutral technology advisor for Austin SMBs'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 80px',
          background: '#0F1B2D',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#FFFFFF',
            }}
          >
            Connectex Solutions
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: color,
              padding: '4px 12px',
              border: `1px solid ${color}`,
              borderRadius: '999px',
            }}
          >
            Solutions
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span
            style={{
              fontSize: 48,
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#FFFFFF',
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: 22,
              color: color,
              lineHeight: 1.4,
              fontWeight: 600,
            }}
          >
            {tagline}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '4px',
            background: color,
            borderRadius: '2px',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
