import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | ConnectEx Solutions',
  description:
    'ConnectEx Solutions terms of service — usage terms, intellectual property, liability limitations, and free vulnerability scan disclaimer for connectex.net.',
}

export default function TermsPage() {
  return (
    <section className="pt-32 pb-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
        <div className="prose prose-invert prose-sm max-w-none prose-p:text-[var(--text-muted)] prose-h2:text-white prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3">
          <p>Last updated: March 31, 2026</p>
          <h2>Use of This Website</h2>
          <p>By accessing connectex.net, you agree to use the site for lawful purposes only. The content on this site is for informational purposes and does not constitute legal, financial, or technical advice.</p>
          <h2>Free Vulnerability Scan</h2>
          <p>The free domain vulnerability scan offered by ConnectEx Solutions is an advisory service. Results are for informational purposes. ConnectEx Solutions makes no warranties about the completeness or accuracy of scan results.</p>
          <h2>Intellectual Property</h2>
          <p>All content on this website is the property of ConnectEx Solutions. You may not reproduce or redistribute any content without written permission.</p>
          <h2>Limitation of Liability</h2>
          <p>ConnectEx Solutions is not liable for any damages arising from your use of this website or reliance on information provided.</p>
          <h2>Contact</h2>
          <p>For questions, email <a href="mailto:mark@connectex.net">mark@connectex.net</a>.</p>
        </div>
      </div>
    </section>
  )
}
