import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { localBusinessSchema } from '@/lib/schema'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://connectex.net'),
  title: {
    default: "ConnectEx Solutions | Austin's Vendor-Neutral Technology Advisor",
    template: '%s | ConnectEx Solutions',
  },
  description:
    "Austin's vendor-neutral technology advisor for small business. We source IT, cybersecurity, cloud, and communications from 600+ providers — no vendor bias, no wasted budget.",
  keywords: [
    'technology advisor Austin Texas',
    'managed IT services Austin TX',
    'cybersecurity Austin small business',
    'IT consulting Central Texas',
    'vendor-neutral technology advisor',
    'business technology solutions Austin',
  ],
  authors: [{ name: 'ConnectEx Solutions', url: 'https://connectex.net' }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://connectex.net',
    siteName: 'ConnectEx Solutions',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline theme init — prevents flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var p=window.matchMedia('(prefers-color-scheme:dark)').matches;if(s?s!=='dark':!p)document.documentElement.classList.add('light')}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema()) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  )
}
