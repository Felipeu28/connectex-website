import type { Metadata } from 'next'

const BASE_URL = 'https://connectex.net'
const SITE_NAME = 'Connectex Solutions'
const DEFAULT_DESCRIPTION =
  "Austin's vendor-neutral technology advisor for small business. We source IT, cybersecurity, cloud, and communications from 600+ providers — no vendor bias, no wasted budget."

export function generateMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  image = '/og/default.png',
}: {
  title: string
  description?: string
  path?: string
  image?: string
}): Metadata {
  const url = `${BASE_URL}${path}`
  const fullTitle = path === '' ? `${SITE_NAME} | ${title}` : `${title} | ${SITE_NAME}`

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
  }
}

export const defaultMetadata: Metadata = generateMetadata({
  title: "Austin's Vendor-Neutral Technology Advisor for Small Business",
})
