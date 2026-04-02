import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: 'linear-gradient(135deg, #8B2BE2, #00C9A7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 100,
            fontWeight: 700,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          C
        </span>
      </div>
    ),
    { ...size }
  )
}
