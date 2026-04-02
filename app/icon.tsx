import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #8B2BE2, #00C9A7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 18,
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
