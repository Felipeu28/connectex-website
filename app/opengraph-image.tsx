import { ImageResponse } from 'next/og'

export const alt = 'ConnectEx Solutions — Austin\'s Vendor-Neutral Technology Advisor'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '0.05em',
            }}
          >
            ConnectEx Solutions
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span
            style={{
              fontSize: 56,
              fontWeight: 800,
              lineHeight: 1.15,
              background: 'linear-gradient(135deg, #FFFFFF 0%, #00C9A7 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Austin&apos;s Vendor-Neutral Technology Advisor
          </span>
          <span
            style={{
              fontSize: 24,
              color: '#94A3B8',
              lineHeight: 1.4,
            }}
          >
            We shop 600+ providers so you don&apos;t have to.
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '4px',
            background: 'linear-gradient(90deg, #00C9A7 0%, #00C9A7 40%, transparent 100%)',
            borderRadius: '2px',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
