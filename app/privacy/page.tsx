import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | ConnectEx Solutions',
  description:
    'ConnectEx Solutions privacy policy — how we collect, use, and protect your information when you use our website and request technology assessments.',
}

export default function PrivacyPage() {
  return (
    <section className="pt-32 pb-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-invert prose-sm max-w-none prose-p:text-[var(--text-muted)] prose-h2:text-white prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3">
          <p>Last updated: March 31, 2026</p>
          <h2>Information We Collect</h2>
          <p>ConnectEx Solutions collects information you voluntarily provide through our contact and referral forms, including your name, company name, email address, phone number, and company domain.</p>
          <h2>How We Use Your Information</h2>
          <p>We use the information you provide solely to respond to your inquiry, conduct the requested domain vulnerability assessment, and follow up about technology solutions relevant to your business. We do not sell or share your information with third parties.</p>
          <h2>Email Communications</h2>
          <p>By submitting our contact form, you consent to receive email communications from ConnectEx Solutions related to your inquiry. You may opt out at any time by replying to any email with &ldquo;unsubscribe&rdquo; in the subject line.</p>
          <h2>Analytics</h2>
          <p>This website uses Google Analytics 4 to understand how visitors use our site. Analytics data is anonymized and used only to improve our website content.</p>
          <h2>Contact</h2>
          <p>For privacy questions, email <a href="mailto:mark@connectex.net">mark@connectex.net</a>.</p>
        </div>
      </div>
    </section>
  )
}
