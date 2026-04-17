import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep the internal CRM and API surfaces out of search indexes.
        // Middleware auth is currently bypassed for testing, but we never
        // want these pages ranking in Google regardless of auth posture.
        disallow: ['/crm/', '/api/'],
      },
    ],
    sitemap: 'https://connectex.net/sitemap.xml',
  }
}
