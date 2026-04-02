export interface Solution {
  slug: string
  title: string
  shortTitle: string
  tagline: string
  description: string
  metaDescription: string
  icon: string
  color: string
  features: string[]
  useCases: string[]
  differentiators: { heading: string; body: string }[]
  faqs: { question: string; answer: string }[]
  stat: { value: string; label: string }
}

export const solutions: Solution[] = [
  {
    slug: 'managed-it',
    title: 'Managed IT Services for Austin Small Business',
    shortTitle: 'Managed IT',
    tagline: 'Your outsourced IT department — without the overhead.',
    description:
      'We source and manage best-in-class managed IT providers for Central Texas SMBs. Proactive monitoring, helpdesk support, and strategic IT planning — all from one advisor who shops the entire market on your behalf.',
    metaDescription:
      'Managed IT services for Austin TX small business. ConnectEx sources the right IT provider from 600+ vendors — proactive monitoring, helpdesk, and IT strategy.',
    icon: 'Monitor',
    color: '#00C9A7',
    features: [
      '24/7 proactive network monitoring',
      'Unlimited helpdesk support',
      'Patch management & updates',
      'Vendor coordination & escalation',
      'IT roadmap & budget planning',
      'Hardware procurement',
    ],
    useCases: [
      'Growing SMBs without a dedicated IT team',
      'Companies replacing expensive in-house IT staff',
      'Businesses frustrated by reactive-only IT support',
      'Organizations needing compliance-ready IT infrastructure',
    ],
    differentiators: [
      {
        heading: 'We shop 600+ providers, not just one',
        body: 'Every MSP on the market sells you their labor. We find the right provider for your industry, size, and budget — then hold them accountable.',
      },
      {
        heading: 'No vendor bias',
        body: 'We earn commissions from providers, not from upselling you more than you need. Our incentive is your long-term partnership.',
      },
      {
        heading: 'Austin-local, enterprise-scale access',
        body: 'You get a local advisor who knows Central Texas business culture, backed by carrier-grade infrastructure partnerships.',
      },
    ],
    faqs: [
      {
        question: 'How much does managed IT cost for a small business in Austin?',
        answer:
          'Managed IT services in Austin typically run $75–$150 per user per month depending on service level. ConnectEx sources options across that entire range and matches you to the provider that fits your actual needs and budget — at no extra cost to you.',
      },
      {
        question: 'What is the difference between managed IT and break/fix IT support?',
        answer:
          'Break/fix IT is reactive — you call when something breaks. Managed IT is proactive — your systems are monitored 24/7 and issues are prevented before they cause downtime. For most businesses with 5+ employees, managed IT pays for itself in prevented downtime alone.',
      },
      {
        question: 'How long does it take to onboard a managed IT provider?',
        answer:
          'Most transitions take 2–4 weeks. ConnectEx handles the vendor selection, contract negotiation, and onboarding coordination so your team experiences minimal disruption.',
      },
      {
        question: 'Can I keep my existing software and tools?',
        answer:
          'Yes. A good managed IT provider works with your existing stack. We confirm compatibility during the discovery phase before recommending any provider.',
      },
    ],
    stat: { value: '47%', label: 'of SMBs experience at least one IT failure per year that costs over $10,000' },
  },
  {
    slug: 'cybersecurity',
    title: 'Cybersecurity Solutions for Central Texas SMBs',
    shortTitle: 'Cybersecurity',
    tagline: 'See what hackers see — before they do.',
    description:
      'We run a free domain and email security assessment to show you exactly where your vulnerabilities are. Then we source the right cybersecurity solution from our vetted network — from email security to endpoint protection to compliance.',
    metaDescription:
      'Cybersecurity services for Austin TX small business. Free domain vulnerability scan. ConnectEx sources email security, endpoint protection, and compliance solutions.',
    icon: 'Shield',
    color: '#FF6B6B',
    features: [
      'Free domain & email security report',
      'Email security (DMARC, DKIM, SPF)',
      'Endpoint detection & response (EDR)',
      'Security awareness training',
      'Vulnerability assessments',
      'Compliance readiness (HIPAA, SOC 2, CMMC)',
    ],
    useCases: [
      'Businesses receiving suspicious emails or phishing attempts',
      'Companies needing HIPAA, SOC 2, or CMMC compliance',
      'SMBs that have never had a security assessment',
      'Organizations looking to qualify for cyber insurance',
    ],
    differentiators: [
      {
        heading: 'We start with data, not a sales pitch',
        body: 'We run a free report on your domain before recommending anything. You see exactly what a hacker sees — email vulnerabilities, open ports, data leaks.',
      },
      {
        heading: 'Vendor-neutral recommendations',
        body: 'We source cybersecurity solutions from best-in-class specialists in each category — not a one-size-fits-all product from a single vendor.',
      },
      {
        heading: '46% of breaches target companies under 1,000 employees',
        body: 'SMBs are not too small to be targeted. The average cost of a breach for a small business is $200,000+ — more than enough to close a company.',
      },
    ],
    faqs: [
      {
        question: 'What does your free vulnerability scan show?',
        answer:
          'We run a report on your company domain that shows email authentication issues (DMARC, DKIM, SPF), data leaks, blacklist status, open vulnerabilities visible to attackers, and domain security score. It takes under 24 hours and there is no obligation.',
      },
      {
        question: 'How do I know if my business needs cybersecurity services?',
        answer:
          "If you have company email, customer data, or any cloud applications — you need basic cybersecurity hygiene. The most common entry points we find are email security gaps and unpatched software. Most Austin SMBs we assess have at least one critical vulnerability they didn't know about.",
      },
      {
        question: 'What is the difference between antivirus and endpoint detection?',
        answer:
          'Antivirus blocks known threats. Endpoint detection and response (EDR) monitors behavior across all devices in real-time and can stop threats that have never been seen before — including ransomware. For most businesses, EDR has replaced traditional antivirus.',
      },
      {
        question: 'We already have IT support — do we still need cybersecurity?',
        answer:
          'Most IT support providers are generalists. Cybersecurity is a specialized discipline. We often find that businesses with active IT support still have significant security gaps because their provider was not focused on threat detection.',
      },
    ],
    stat: { value: '$200K+', label: 'average cost of a data breach for a small business' },
  },
  {
    slug: 'cloud',
    title: 'Cloud & Collaboration Solutions for Austin Business',
    shortTitle: 'Cloud & Collaboration',
    tagline: 'Work from anywhere — without the IT headache.',
    description:
      'We source and implement cloud infrastructure, Microsoft 365, Google Workspace, cloud storage, and collaboration tools for Central Texas SMBs. One advisor, 600+ providers, zero integration headaches.',
    metaDescription:
      'Cloud solutions for Austin TX small business. Microsoft 365, Google Workspace, cloud migration, and collaboration tools sourced by ConnectEx — vendor-neutral advisor.',
    icon: 'Cloud',
    color: '#60A5FA',
    features: [
      'Microsoft 365 & Google Workspace',
      'Cloud migration planning & execution',
      'Cloud backup & disaster recovery',
      'VPN & secure remote access',
      'File sharing & document management',
      'Cloud cost optimization',
    ],
    useCases: [
      'Businesses moving off legacy on-premise servers',
      'Companies managing remote or hybrid teams',
      'SMBs needing Microsoft 365 licensing and setup',
      'Organizations looking to reduce IT infrastructure costs',
    ],
    differentiators: [
      {
        heading: 'Right-sized for SMBs, not enterprise',
        body: 'Enterprise cloud setups are over-engineered and over-priced for small business. We source solutions scaled to your actual team size and growth trajectory.',
      },
      {
        heading: 'Migration without the chaos',
        body: 'Cloud migrations fail when not planned properly. We coordinate the vendor, timeline, and your team to make transitions seamless.',
      },
      {
        heading: 'Single vendor relationship',
        body: 'Microsoft, Google, cloud backup, and remote access — all coordinated through ConnectEx. One call resolves issues across your entire cloud stack.',
      },
    ],
    faqs: [
      {
        question: 'Is Microsoft 365 or Google Workspace better for small business?',
        answer:
          'It depends on your workflow. Microsoft 365 is better if your team uses Word/Excel heavily or integrates with Windows environments. Google Workspace is better for collaboration-first teams that live in the browser. ConnectEx assesses your workflow before recommending either.',
      },
      {
        question: 'How long does a cloud migration take?',
        answer:
          'Most SMB cloud migrations (10–50 users) take 2–6 weeks from planning to cutover. We manage the full process including data migration, testing, and user training.',
      },
      {
        question: 'What happens to our data if we switch cloud providers?',
        answer:
          'We ensure data portability is built into every solution we recommend. Before any migration, we create a full backup and verify restoration before the cutover.',
      },
      {
        question: 'Can you help us reduce our current Microsoft 365 costs?',
        answer:
          'Yes. Many businesses are over-licensed or on the wrong tier. We audit your current licenses and recommend the right mix — often finding 20–30% in savings.',
      },
    ],
    stat: { value: '94%', label: 'of SMBs use at least one cloud service — most are overpaying for it' },
  },
  {
    slug: 'communications',
    title: 'Business Phone & UCaaS Solutions Austin TX',
    shortTitle: 'Communications',
    tagline: 'Replace your old phone system with something that actually works.',
    description:
      'We source VoIP, UCaaS, and business communication systems for Central Texas SMBs. Cut your phone bills, unify voice/video/messaging, and never get locked into a single carrier again.',
    metaDescription:
      'Business phone systems and UCaaS solutions for Austin TX SMBs. ConnectEx sources VoIP and unified communications from leading carriers — vendor-neutral advisor.',
    icon: 'Phone',
    color: '#A78BFA',
    features: [
      'VoIP business phone systems',
      'Unified Communications as a Service (UCaaS)',
      'Video conferencing integration',
      'Mobile app for desk phone replacement',
      'Call center & contact center solutions',
      'Carrier comparison & contract negotiation',
    ],
    useCases: [
      'Businesses replacing legacy PBX or traditional phone systems',
      'Companies with remote teams needing unified voice/video/chat',
      'SMBs overpaying on outdated carrier contracts',
      'Organizations needing call recording or compliance features',
    ],
    differentiators: [
      {
        heading: 'We compare every major carrier',
        body: 'Verizon, AT&T, RingCentral, 8x8, Vonage — we run your requirements through all of them and show you real pricing side-by-side. No single-vendor bias.',
      },
      {
        heading: '20+ years of carrier relationships',
        body: 'Mark has deep relationships with every major carrier. That means better pricing, faster escalations, and someone who knows how contracts actually work.',
      },
      {
        heading: 'One MDA, all your vendors',
        body: 'Sign one Master Services Agreement through ConnectEx and access the entire carrier ecosystem. One relationship replaces five vendor calls.',
      },
    ],
    faqs: [
      {
        question: 'How much does VoIP cost compared to a traditional phone system?',
        answer:
          'VoIP typically costs $20–$45 per user per month with no hardware investment. Traditional PBX systems require $500–$1,500+ per user in hardware upfront. Most businesses see 40–60% cost reduction by switching to VoIP.',
      },
      {
        question: 'Will VoIP work with our existing internet connection?',
        answer:
          'Most business internet connections (25+ Mbps) support VoIP without issues. We run a network assessment before recommending any provider to ensure call quality.',
      },
      {
        question: 'What is UCaaS and do small businesses need it?',
        answer:
          'UCaaS (Unified Communications as a Service) combines voice, video, messaging, and file sharing into one platform. For businesses with remote workers or multiple offices, it eliminates the fragmentation of using separate tools for each.',
      },
      {
        question: 'Can you help us get out of our current carrier contract?',
        answer:
          'Yes. We review your contract terms and advise on the most cost-effective exit strategy — whether that is waiting for renewal, negotiating an early termination, or porting numbers while keeping the contract.',
      },
    ],
    stat: { value: '60%', label: 'average cost reduction when Austin SMBs switch from legacy PBX to VoIP' },
  },
  {
    slug: 'ai-automation',
    title: 'AI & Automation Tools for Austin Small Business',
    shortTitle: 'AI & Automation',
    tagline: 'Work smarter — not with more headcount.',
    description:
      'We source AI-powered tools and automation platforms that give Austin SMBs enterprise-grade efficiency. From AI chatbots to workflow automation to predictive analytics — sourced and implemented without the enterprise price tag.',
    metaDescription:
      'AI and automation solutions for Austin TX small business. ConnectEx sources AI tools and workflow automation from 600+ providers — no vendor lock-in.',
    icon: 'Cpu',
    color: '#F59E0B',
    features: [
      'AI chatbots & virtual assistants',
      'Workflow & process automation',
      'AI-powered cybersecurity tools',
      'Predictive analytics & reporting',
      'CRM automation & lead scoring',
      'Document processing & OCR',
    ],
    useCases: [
      'Businesses looking to automate repetitive manual processes',
      'SMBs wanting AI-powered customer service without a large team',
      'Companies seeking data-driven insights from their existing tools',
      'Organizations exploring AI tools but unsure where to start',
    ],
    differentiators: [
      {
        heading: 'Start with ROI, not technology',
        body: 'We identify which of your current manual processes deliver the highest ROI when automated — then source the right tool for that specific outcome.',
      },
      {
        heading: 'No hype, no over-engineering',
        body: 'AI is a means to an end. We match you to tools that solve real problems in your business, not the newest thing with the best marketing.',
      },
      {
        heading: 'Integration-first approach',
        body: 'AI tools only create value when they connect to your existing systems. Every recommendation we make includes an integration plan for your current stack.',
      },
    ],
    faqs: [
      {
        question: 'Where should a small business start with AI?',
        answer:
          'Start with your highest-volume, lowest-complexity tasks: customer inquiry responses, appointment scheduling, invoice processing, and report generation. These have clear ROI and low implementation risk.',
      },
      {
        question: 'How much do AI tools cost for small business?',
        answer:
          'AI tools range from $50/month (AI writing and customer service tools) to $500+/month (enterprise workflow automation). The key is matching the tool cost to the time/labor cost it replaces. ConnectEx only recommends tools with a clear payback period under 6 months.',
      },
      {
        question: 'Will AI replace our employees?',
        answer:
          'For most SMBs, AI augments employees rather than replacing them — handling repetitive tasks so your team focuses on higher-value work. The companies that win with AI treat it as a force multiplier, not a headcount reduction tool.',
      },
      {
        question: 'Do I need technical staff to implement AI tools?',
        answer:
          'Not for most SMB-appropriate tools. We source solutions designed for non-technical business owners and handle the implementation, integration, and training as part of the engagement.',
      },
    ],
    stat: { value: '4x', label: 'productivity gain for SMBs that automate their top 3 repetitive workflows' },
  },
]

export function getSolution(slug: string): Solution | undefined {
  return solutions.find((s) => s.slug === slug)
}
