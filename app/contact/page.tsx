import { Suspense } from 'react'
import { ContactForm } from '@/components/forms/ContactForm'
import { breadcrumbSchema } from '@/lib/schema'
import { generateMetadata as genMeta } from '@/lib/seo'

export const metadata = genMeta({
  title: 'Get Your Free Vulnerability Scan — ConnectEx Austin TX',
  description:
    'Find out what a hacker can see when they look at your Austin business — free domain and email security report from ConnectEx, delivered within 24 hours.',
  path: '/contact',
})

function ContactFormWithDomain() {
  return <ContactForm />
}

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', url: '/' },
              { name: 'Contact', url: '/contact' },
            ])
          ),
        }}
      />

      <section className="min-h-screen pt-24 pb-16 px-4 sm:px-6 grid-bg">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left: context */}
            <div className="pt-8">
              <p className="text-[#FF6B6B] text-sm font-semibold uppercase tracking-widest mb-4">Free Vulnerability Scan</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
                Find out what hackers see when they look at your business
              </h1>
              <p className="text-[var(--text-muted)] text-lg leading-relaxed mb-10">
                We run a comprehensive assessment on your company domain — showing you exactly where your vulnerabilities are before someone exploits them.
                No obligation. No sales pitch. Results within 24 hours.
              </p>

              {/* What you get */}
              <div className="space-y-4 mb-12">
                {[
                  ['Email security report', 'DMARC, DKIM, SPF — the #1 attack vector for SMBs'],
                  ['Domain exposure analysis', 'What subdomains and records are visible to attackers'],
                  ['Blacklist & reputation check', 'Is your domain flagged by major email providers?'],
                  ['Vulnerability summary', 'Prioritized list of issues to fix, in plain language'],
                ].map(([title, desc]) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-lg bg-[#00C9A7]/15 border border-[#00C9A7]/30 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-[#00C9A7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mark's contact */}
              <div className="glass rounded-2xl p-6 border border-white/8">
                <p className="text-sm font-semibold text-white mb-3">Prefer to talk first?</p>
                <div className="space-y-2 text-sm text-[var(--text-muted)]">
                  <a href="tel:+15129621199" className="flex items-center gap-2 hover:text-[#00C9A7] transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                    (512) 962-1199
                  </a>
                  <a href="mailto:mark@connectex.net" className="flex items-center gap-2 hover:text-[#00C9A7] transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    mark@connectex.net
                  </a>
                </div>
              </div>
            </div>

            {/* Right: form */}
            <div className="glass rounded-3xl p-8 sm:p-10 border border-white/8 sticky top-24">
              <Suspense fallback={<div className="text-[var(--text-muted)]">Loading...</div>}>
                <ContactFormWithDomain />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
