export interface Feature {
  name: string
  detail: string
}

export interface ProcessStep {
  step: number
  title: string
  description: string
}

export interface Solution {
  slug: string
  title: string
  shortTitle: string
  tagline: string
  description: string
  metaDescription: string
  icon: string
  color: string
  features: Feature[]
  useCases: string[]
  differentiators: { heading: string; body: string }[]
  faqs: { question: string; answer: string }[]
  stat: { value: string; label: string }
  processSteps: ProcessStep[]
  pricing: { summary: string; note: string }
  ctaDetail: string
}

export const solutions: Solution[] = [
  {
    slug: 'managed-it',
    title: 'Managed IT Services for Austin Small Business',
    shortTitle: 'Managed IT',
    tagline: 'Your outsourced IT department — without the overhead.',
    description:
      'We source and manage best-in-class managed IT providers for SMBs nationwide. Proactive monitoring, helpdesk support, and strategic IT planning — all from one advisor who shops the entire market on your behalf.',
    metaDescription:
      'Managed IT services for Austin TX small business. Connectex sources the right IT provider from 600+ vendors — proactive monitoring, helpdesk, and IT strategy.',
    icon: 'Monitor',
    color: '#00C9A7',
    features: [
      {
        name: '24/7 proactive network monitoring',
        detail: 'Issues flagged before they cause downtime. You know there is a problem before your staff does — not after a workday is already lost.',
      },
      {
        name: 'Unlimited helpdesk support',
        detail: 'Every ticket, every user, no per-incident fees. Your team gets fast resolutions without you getting a surprise invoice.',
      },
      {
        name: 'Patch management & updates',
        detail: 'OS, firmware, and software patches applied on a schedule — reducing your attack surface and keeping systems stable.',
      },
      {
        name: 'Vendor coordination & escalation',
        detail: 'When something breaks with a vendor, we escalate on your behalf. No more being passed around on hold.',
      },
      {
        name: 'IT roadmap & budget planning',
        detail: 'A 12-month technology plan aligned to your business goals — no surprise capital expenses.',
      },
      {
        name: 'Hardware procurement',
        detail: 'We spec, source, and deploy the right hardware at the right price. No markup, no guessing.',
      },
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
        body: 'You get a local Austin-based advisor backed by carrier-grade infrastructure partnerships across the entire country.',
      },
    ],
    faqs: [
      {
        question: 'How much does managed IT cost for a small business in Austin?',
        answer:
          'Managed IT services in Austin typically run $75–$150 per user per month depending on service level. Connectex sources options across that entire range and matches you to the provider that fits your actual needs and budget — at no extra cost to you.',
      },
      {
        question: 'What is the difference between managed IT and break/fix IT support?',
        answer:
          'Break/fix IT is reactive — you call when something breaks. Managed IT is proactive — your systems are monitored 24/7 and issues are prevented before they cause downtime. For most businesses with 5+ employees, managed IT pays for itself in prevented downtime alone.',
      },
      {
        question: 'How long does it take to onboard a managed IT provider?',
        answer:
          'Most transitions take 2–4 weeks. Connectex handles the vendor selection, contract negotiation, and onboarding coordination so your team experiences minimal disruption.',
      },
      {
        question: 'Can I keep my existing software and tools?',
        answer:
          'Yes. A good managed IT provider works with your existing stack. We confirm compatibility during the discovery phase before recommending any provider.',
      },
    ],
    stat: { value: '47%', label: 'of SMBs experience at least one IT failure per year that costs over $10,000' },
    processSteps: [
      {
        step: 1,
        title: 'Free IT environment audit',
        description: 'We review your current setup — network, devices, software, backups, and security posture — and deliver a full report with no obligation.',
      },
      {
        step: 2,
        title: 'Provider matching',
        description: 'We match you to the right MSP from our vetted network based on your industry, team size, compliance needs, and budget.',
      },
      {
        step: 3,
        title: 'Contract & onboarding',
        description: 'We negotiate the contract and manage the onboarding timeline. Your team gets white-glove support from day one with minimal disruption.',
      },
      {
        step: 4,
        title: 'Ongoing advocacy',
        description: 'We stay involved as your advisor — attending QBRs, reviewing SLA performance, and escalating on your behalf if issues arise.',
      },
    ],
    pricing: {
      summary: '$75–$150 per user/month',
      note: 'Typical range for full managed IT coverage. Connectex sources options across the entire spectrum and negotiates on your behalf at no extra cost to you.',
    },
    ctaDetail: 'Get a free IT environment audit — we will show you where your gaps are and exactly what the right solution costs.',
  },
  {
    slug: 'cybersecurity',
    title: 'Cybersecurity Solutions for Small Business',
    shortTitle: 'Cybersecurity',
    tagline: 'See what hackers see — before they do.',
    description:
      'We run a free domain and email security assessment to show you exactly where your vulnerabilities are. Then we source the right cybersecurity solution from our vetted network — from email security to endpoint protection to compliance.',
    metaDescription:
      'Cybersecurity services for Austin TX small business. Free domain vulnerability scan. Connectex sources email security, endpoint protection, and compliance solutions.',
    icon: 'Shield',
    color: '#FF6B6B',
    features: [
      {
        name: 'Free domain & email security report',
        detail: 'We run a full scan of your domain: DMARC/DKIM/SPF status, data leaks, blacklist flags, and exposed vulnerabilities — before we recommend anything.',
      },
      {
        name: 'Email security (DMARC, DKIM, SPF)',
        detail: 'The #1 vector for SMB breaches. We source and configure email authentication to stop phishing, spoofing, and business email compromise attacks.',
      },
      {
        name: 'Endpoint detection & response (EDR)',
        detail: 'Monitors every device in real-time for suspicious behavior. Goes far beyond antivirus to stop zero-day threats and ransomware before they spread.',
      },
      {
        name: 'Security awareness training',
        detail: 'Monthly phishing simulations and micro-training that measurably reduce your team\'s susceptibility to social engineering.',
      },
      {
        name: 'Vulnerability assessments',
        detail: 'Regular scans of your network and applications to surface risks before attackers find them — with a prioritized remediation plan.',
      },
      {
        name: 'Compliance readiness (HIPAA, SOC 2, CMMC)',
        detail: 'We source specialists that navigate the specific compliance requirements for your industry and customer contracts.',
      },
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
    processSteps: [
      {
        step: 1,
        title: 'Free vulnerability scan',
        description: 'We run a domain report showing your email security gaps, data leaks, and exposed vulnerabilities. Zero cost, zero obligation, under 24 hours.',
      },
      {
        step: 2,
        title: 'Risk prioritization',
        description: 'We rank your vulnerabilities by severity and business impact — so you know what to fix first and why.',
      },
      {
        step: 3,
        title: 'Solution sourcing',
        description: 'We match you to best-in-class solutions from our cybersecurity vendor network — email security, EDR, training, and compliance.',
      },
      {
        step: 4,
        title: 'Ongoing monitoring',
        description: 'We set up monitoring, alerting, and a review cadence so your protection stays current as threats evolve.',
      },
    ],
    pricing: {
      summary: 'Free assessment, then $15–$50 per user/month',
      note: 'Basic email security and EDR coverage starts under $20/user. Full-stack protection with compliance tooling runs higher. We scope exactly what you need — nothing more.',
    },
    ctaDetail: 'Start with the free domain scan — most Austin SMBs we assess have at least one critical vulnerability they didn\'t know about.',
  },
  {
    slug: 'cloud',
    title: 'Cloud & Collaboration Solutions for Austin Business',
    shortTitle: 'Cloud & Collaboration',
    tagline: 'Work from anywhere — without the IT headache.',
    description:
      'We source and implement cloud infrastructure, Microsoft 365, Google Workspace, cloud storage, and collaboration tools for SMBs nationwide. One advisor, 600+ providers, zero integration headaches.',
    metaDescription:
      'Cloud solutions for Austin TX small business. Microsoft 365, Google Workspace, cloud migration, and collaboration tools sourced by Connectex — vendor-neutral advisor.',
    icon: 'Cloud',
    color: '#60A5FA',
    features: [
      {
        name: 'Microsoft 365 & Google Workspace',
        detail: 'We source, license, configure, and optimize the right productivity platform for your team\'s workflow — at the best available price.',
      },
      {
        name: 'Cloud migration planning & execution',
        detail: 'Full migration management from on-premise servers to the cloud — data, email, applications, and users — with zero-downtime cutovers.',
      },
      {
        name: 'Cloud backup & disaster recovery',
        detail: 'Off-site backups with tested restore times. If ransomware hits, you are back up in hours, not days.',
      },
      {
        name: 'VPN & secure remote access',
        detail: 'Properly configured remote access that does not create new security holes. Includes zero-trust options for higher-risk environments.',
      },
      {
        name: 'File sharing & document management',
        detail: 'SharePoint, OneDrive, or Google Drive set up with the right permissions, folder structure, and team training for real adoption.',
      },
      {
        name: 'Cloud cost optimization',
        detail: 'We audit and right-size your current cloud licenses. Most SMBs find 20–30% in savings within 30 days.',
      },
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
        body: 'Microsoft, Google, cloud backup, and remote access — all coordinated through Connectex. One call resolves issues across your entire cloud stack.',
      },
    ],
    faqs: [
      {
        question: 'Is Microsoft 365 or Google Workspace better for small business?',
        answer:
          'It depends on your workflow. Microsoft 365 is better if your team uses Word/Excel heavily or integrates with Windows environments. Google Workspace is better for collaboration-first teams that live in the browser. Connectex assesses your workflow before recommending either.',
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
    processSteps: [
      {
        step: 1,
        title: 'Cloud readiness assessment',
        description: 'We audit your current environment: what is on-premise, what is already in the cloud, bandwidth requirements, and your security posture.',
      },
      {
        step: 2,
        title: 'Migration planning',
        description: 'A detailed migration plan with timeline, rollback procedures, data mapping, and a zero-downtime cutover strategy.',
      },
      {
        step: 3,
        title: 'Migration & configuration',
        description: 'We manage the full move — data, email, applications, and user accounts — coordinating every vendor involved.',
      },
      {
        step: 4,
        title: 'Training & optimization',
        description: 'User training, documentation, and a 90-day optimization review to ensure adoption and right-size ongoing costs.',
      },
    ],
    pricing: {
      summary: 'Microsoft 365 from $6/user/month; migrations from $2,500',
      note: 'Licensing flows through us at the same or better price than direct. Migration scope depends on complexity — most SMB migrations (10–50 users) complete in 2–6 weeks.',
    },
    ctaDetail: 'Get a free cloud audit — we will show you what you are paying versus what you should be paying, and what a migration would actually cost.',
  },
  {
    slug: 'communications',
    title: 'Business Phone & UCaaS Solutions Austin TX',
    shortTitle: 'Communications',
    tagline: 'Replace your old phone system with something that actually works.',
    description:
      'We source VoIP, UCaaS, and business communication systems for SMBs nationwide. Cut your phone bills, unify voice/video/messaging, and never get locked into a single carrier again.',
    metaDescription:
      'Business phone systems and UCaaS solutions for Austin TX SMBs. Connectex sources VoIP and unified communications from leading carriers — vendor-neutral advisor.',
    icon: 'Phone',
    color: '#A78BFA',
    features: [
      {
        name: 'VoIP business phone systems',
        detail: 'Modern cloud phone systems with desktop apps, mobile apps, and full feature parity with legacy PBX — at a fraction of the cost.',
      },
      {
        name: 'Unified Communications as a Service (UCaaS)',
        detail: 'Voice, video, messaging, and file sharing in one platform. No more juggling Zoom, Teams, and a desk phone separately.',
      },
      {
        name: 'Video conferencing integration',
        detail: 'Integrated video that works with your existing calendar and contact system — no separate licenses or logins needed.',
      },
      {
        name: 'Mobile app for desk phone replacement',
        detail: 'Your office number follows you anywhere. Full desk phone features on any smartphone — with the same extension and voicemail.',
      },
      {
        name: 'Call center & contact center solutions',
        detail: 'Queue management, IVR, call recording, and reporting for businesses with customer-facing teams.',
      },
      {
        name: 'Carrier comparison & contract negotiation',
        detail: 'We run your requirements through every major carrier and negotiate the best rate on your behalf — no single-vendor bias.',
      },
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
        body: 'Sign one Master Services Agreement through Connectex and access the entire carrier ecosystem. One relationship replaces five vendor calls.',
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
    processSteps: [
      {
        step: 1,
        title: 'Phone system audit',
        description: 'We review your current system, contracts, feature usage, and call volumes to understand exactly what you need — and what you do not.',
      },
      {
        step: 2,
        title: 'Carrier comparison',
        description: 'We run your requirements through every relevant carrier — Verizon, AT&T, RingCentral, 8x8, and more — and present real pricing side-by-side.',
      },
      {
        step: 3,
        title: 'Contract negotiation',
        description: 'We negotiate on your behalf, handling term lengths, pricing tiers, porting timelines, and SLA guarantees.',
      },
      {
        step: 4,
        title: 'Number porting & cutover',
        description: 'We manage the porting process and coordinate a zero-downtime cutover to your new system, with training for your team.',
      },
    ],
    pricing: {
      summary: '$20–$45 per user/month',
      note: 'VoIP typically costs 40–60% less than legacy PBX with no hardware investment. Connectex compares every carrier to get you the best available rate and terms.',
    },
    ctaDetail: 'Get a free phone system audit — we will compare what you are paying to what is available and tell you exactly what you would save.',
  },
  {
    slug: 'connectivity',
    title: 'Business Internet & Connectivity Services Austin TX',
    shortTitle: 'Connectivity',
    tagline: 'Fast, reliable internet — without overpaying for it.',
    description:
      'We source fiber, broadband, SD-WAN, and wireless backup solutions for Austin SMBs from every major carrier. Never get stuck with one provider\'s pricing or coverage gaps again.',
    metaDescription:
      'Business internet and connectivity services for Austin TX small business. Connectex sources fiber, broadband, and SD-WAN from Verizon, AT&T, and 600+ carriers — vendor-neutral advisor.',
    icon: 'Globe',
    color: '#34D399',
    features: [
      {
        name: 'Dedicated fiber internet circuits',
        detail: 'Dedicated bandwidth that is not shared with neighbors. Consistent speeds during peak hours with SLA-backed uptime guarantees.',
      },
      {
        name: 'SD-WAN network optimization',
        detail: 'Intelligently manages traffic across multiple connections, prioritizing critical apps and auto-routing around outages.',
      },
      {
        name: 'Wireless backup & automatic failover',
        detail: '4G/5G backup circuit that activates within 30–60 seconds if your primary connection fails — so you never lose revenue to an outage.',
      },
      {
        name: 'Multi-carrier bonding',
        detail: 'Combine two or more circuits for higher throughput and redundancy — ideal for cloud-heavy businesses or remote office connectivity.',
      },
      {
        name: 'Business broadband (cable/fiber)',
        detail: 'Shared broadband from Spectrum, Comcast, or AT&T where cost efficiency matters more than dedicated SLAs.',
      },
      {
        name: 'Carrier comparison & contract negotiation',
        detail: 'We run every carrier at your address and negotiate — most businesses find 20–40% savings versus renewing direct.',
      },
    ],
    useCases: [
      'Businesses renewing their internet contract without comparing alternatives',
      'Companies that need automatic failover to prevent downtime',
      'SMBs building SD-WAN for distributed locations or remote workers',
      'Organizations moving to the cloud and needing more bandwidth',
    ],
    differentiators: [
      {
        heading: 'We compare every carrier',
        body: 'AT&T, Verizon, Spectrum, Comcast, Lumen, and regional providers — we run your address through all of them and show you real pricing side-by-side. No single-carrier bias.',
      },
      {
        heading: '20+ years of carrier relationships',
        body: 'Mark has deep relationships with every major carrier. That means better pricing, faster escalations, and someone who knows how contracts actually work.',
      },
      {
        heading: 'Never without internet',
        body: 'We design connectivity solutions with automatic 4G/5G failover — if your primary connection goes down, wireless backup keeps you online within 30–60 seconds.',
      },
    ],
    faqs: [
      {
        question: 'How much does business fiber internet cost in Austin?',
        answer:
          'Business fiber in Austin typically runs $200–$1,500+/month depending on bandwidth (50 Mbps to 1 Gbps+) and the provider. Connectex compares every available carrier at your address and negotiates on your behalf — most businesses find 20–40% savings versus renewing direct.',
      },
      {
        question: 'What is SD-WAN and does my business need it?',
        answer:
          'SD-WAN (Software-Defined Wide Area Network) manages traffic across multiple internet connections, prioritizing critical applications and automatically routing around outages. Most businesses with 20+ employees, remote workers, or multiple locations benefit from SD-WAN.',
      },
      {
        question: 'What happens to my business when the internet goes down?',
        answer:
          'A wireless backup circuit (4G/5G) automatically takes over when your primary connection fails — usually within 30–60 seconds. For businesses where downtime costs revenue, this is essential infrastructure.',
      },
      {
        question: 'Can you help us get out of our current internet contract early?',
        answer:
          'Yes. We review your contract terms and identify the most cost-effective path — whether that is waiting for the renewal window, negotiating an upgrade with better terms, or porting to a better provider.',
      },
    ],
    stat: { value: '87%', label: 'of SMBs overpay on internet by renewing without comparing alternatives' },
    processSteps: [
      {
        step: 1,
        title: 'Address & requirements survey',
        description: 'We run every carrier at your physical address and map available bandwidth tiers, latency specs, and contract terms.',
      },
      {
        step: 2,
        title: 'Side-by-side comparison',
        description: 'You see real pricing from every available provider in one view — no one carrier\'s sales pitch.',
      },
      {
        step: 3,
        title: 'Contract negotiation',
        description: 'We negotiate term length, pricing escalators, SLA credits, and early termination flexibility on your behalf.',
      },
      {
        step: 4,
        title: 'Installation coordination',
        description: 'We coordinate the carrier, your team, and any cabling contractors to get you live on time with minimal disruption.',
      },
    ],
    pricing: {
      summary: '$200–$1,500+/month depending on bandwidth',
      note: 'Dedicated fiber starts around $200/month for 50 Mbps. 1 Gbps dedicated runs $500–$1,500+ depending on carrier and location. We always show you the full market.',
    },
    ctaDetail: 'Get a free connectivity audit — we will run every carrier at your address and show you what is available versus what you are currently paying.',
  },
  {
    slug: 'ai-automation',
    title: 'AI & Automation Tools for Austin Small Business',
    shortTitle: 'AI & Automation',
    tagline: 'Work smarter — not with more headcount.',
    description:
      'We source AI-powered tools and automation platforms that give Austin SMBs enterprise-grade efficiency. From AI chatbots to workflow automation to predictive analytics — sourced and implemented without the enterprise price tag.',
    metaDescription:
      'AI and automation solutions for Austin TX small business. Connectex sources AI tools and workflow automation from 600+ providers — no vendor lock-in.',
    icon: 'Cpu',
    color: '#F59E0B',
    features: [
      {
        name: 'AI chatbots & virtual assistants',
        detail: 'Handles your highest-volume customer inquiries 24/7 without adding headcount — trained on your specific products, services, and FAQs.',
      },
      {
        name: 'Workflow & process automation',
        detail: 'Identifies your top manual workflows and automates the triggers, routing, and outputs — from invoice processing to lead follow-up.',
      },
      {
        name: 'AI-powered cybersecurity tools',
        detail: 'Anomaly detection and threat intelligence that uses machine learning to catch what rule-based tools miss.',
      },
      {
        name: 'Predictive analytics & reporting',
        detail: 'Turn your existing data into forward-looking insights — sales forecasting, churn prediction, demand planning — without a data science team.',
      },
      {
        name: 'CRM automation & lead scoring',
        detail: 'Automatically score, route, and follow up on leads based on behavior signals — so sales focuses on deals ready to close.',
      },
      {
        name: 'Document processing & OCR',
        detail: 'Intelligent document capture that extracts, categorizes, and routes information from invoices, contracts, and forms automatically.',
      },
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
          'AI tools range from $50/month (AI writing and customer service tools) to $500+/month (enterprise workflow automation). The key is matching the tool cost to the time/labor cost it replaces. Connectex only recommends tools with a clear payback period under 6 months.',
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
    processSteps: [
      {
        step: 1,
        title: 'Process audit',
        description: 'We map your top 5–10 manual workflows and score each by volume, error rate, and labor cost to identify where AI delivers the fastest ROI.',
      },
      {
        step: 2,
        title: 'Tool selection',
        description: 'We source the right tools from our AI vendor network — matching functionality, integration compatibility, and total cost of ownership.',
      },
      {
        step: 3,
        title: 'Integration & implementation',
        description: 'We manage the implementation, API integrations with your existing systems, and configuration — no technical staff required on your end.',
      },
      {
        step: 4,
        title: 'Measurement & optimization',
        description: 'We establish before/after metrics and review ROI at 30, 60, and 90 days — then optimize based on real usage data.',
      },
    ],
    pricing: {
      summary: '$50–$500+/month per tool',
      note: 'AI tools have a wide range. We only recommend solutions with a projected payback under 6 months. Most SMBs start with one automation that pays for itself in 60–90 days.',
    },
    ctaDetail: 'Get a free AI readiness assessment — we will identify your top 3 automation opportunities and estimate the ROI for each.',
  },
]

export function getSolution(slug: string): Solution | undefined {
  return solutions.find((s) => s.slug === slug)
}
