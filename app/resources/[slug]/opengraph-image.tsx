import { ImageResponse } from 'next/og'
import { posts, getPost } from '@/data/posts'

export const alt = 'ConnectEx Solutions'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export async function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }))
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)

  const title = post?.title ?? 'Technology Resources'
  const category = post?.category ?? 'Resources'
  const readTime = post?.readTime ?? ''

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
            ConnectEx Solutions
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#00D4AA',
              padding: '4px 12px',
              border: '1px solid #00D4AA',
              borderRadius: '999px',
            }}
          >
            {category}
          </span>
          {readTime && (
            <span
              style={{
                fontSize: 16,
                color: '#94A3B8',
              }}
            >
              {readTime} read
            </span>
          )}
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
              fontSize: 20,
              color: '#94A3B8',
              lineHeight: 1.4,
            }}
          >
            Expert technology guides for Austin small businesses
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '4px',
            background: 'linear-gradient(90deg, #00D4AA 0%, #00D4AA 40%, transparent 100%)',
            borderRadius: '2px',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
