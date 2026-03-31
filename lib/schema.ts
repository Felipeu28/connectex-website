const BASE_URL = 'https://connectex.net'

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'ProfessionalService'],
    name: 'ConnectEx Solutions',
    description:
      "Austin's vendor-neutral technology advisor for small business — sourcing IT, cybersecurity, cloud, and communications from 600+ providers.",
    url: BASE_URL,
    telephone: '+15129621199',
    email: 'mark@connectex.net',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Austin',
      addressRegion: 'TX',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 30.2672,
      longitude: -97.7431,
    },
    areaServed: {
      '@type': 'State',
      name: 'Texas',
    },
    priceRange: '$$',
    openingHours: 'Mo-Fr 08:00-18:00',
    // Populate with social profile URLs when available (e.g., LinkedIn, Facebook, Google Business Profile)
    sameAs: [],
  }
}

export function serviceSchema({
  name,
  description,
  url,
}: {
  name: string
  description: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'LocalBusiness',
      name: 'ConnectEx Solutions',
      url: BASE_URL,
    },
    areaServed: {
      '@type': 'State',
      name: 'Texas',
    },
    url: `${BASE_URL}${url}`,
  }
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  }
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function blogPostSchema({
  title,
  description,
  slug,
  datePublished,
  dateModified,
}: {
  title: string
  description: string
  slug: string
  datePublished: string
  dateModified?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url: `${BASE_URL}/resources/${slug}`,
    datePublished,
    dateModified: dateModified ?? datePublished,
    author: {
      '@type': 'Person',
      name: 'Mark',
      url: `${BASE_URL}/about`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ConnectEx Solutions',
      url: BASE_URL,
    },
  }
}
