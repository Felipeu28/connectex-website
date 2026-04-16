/**
 * Preferred vendors for the /preferred-vendors page.
 *
 * To add, remove, or reorder vendors: edit this array. The page reads it
 * at build time — no code changes needed elsewhere. Keep descriptions to
 * one sentence so the grid cards stay compact.
 */

export interface Vendor {
  /** Display name. */
  name: string
  /** One-line description of what they provide. */
  tagline: string
  /** Short (2-4 char) logo placeholder text shown in the avatar circle. */
  initials: string
  /** Primary brand color (hex). Used for accent on the card. */
  color: string
  /** Category label shown as a subtle chip. */
  category: string
  /** True for Austin / Texas-based companies — renders a "Local" ribbon. */
  local?: boolean
  /** Optional URL to the vendor's site (opens in new tab). */
  url?: string
  /** If true, this vendor gets a large featured card instead of a grid tile. */
  featured?: boolean
  /** Bullet list of offerings — only used for featured vendors. */
  offerings?: string[]
}

export const vendors: Vendor[] = [
  // ── Featured partner (rendered separately as a large card) ──────────
  {
    name: 'Verizon Business',
    tagline:
      'Direct carrier partnership with dedicated account access and negotiated business pricing.',
    initials: 'VZ',
    color: '#CD040B',
    category: 'Connectivity',
    featured: true,
    offerings: [
      'Business wireless plans (negotiated rates)',
      'Dedicated fiber & broadband circuits',
      'SD-WAN and network management',
      'IoT connectivity solutions',
      'Priority business support & dedicated rep',
    ],
  },

  // ── Grid vendors (rendered as compact cards) ────────────────────────
  {
    name: 'MOIL',
    tagline:
      'Austin-based managed IT and cloud services provider — local support, enterprise capability.',
    initials: 'MO',
    color: '#00C9A7',
    category: 'Managed IT',
    local: true,
    url: 'https://moil.com',
  },
  {
    name: 'vCom Solutions',
    tagline:
      'Technology expense management and lifecycle services — visibility and control over your IT spend.',
    initials: 'vC',
    color: '#4B6CF7',
    category: 'Expense Management',
    url: 'https://vcomsolutions.com',
  },
  {
    name: 'HarborIT',
    tagline:
      'Managed IT services and cybersecurity solutions for growing businesses.',
    initials: 'HI',
    color: '#2196F3',
    category: 'Managed IT',
    url: 'https://harborit.com',
  },
  {
    name: 'Granite Channels',
    tagline:
      'Multi-carrier network solutions — voice, data, and internet from a single provider.',
    initials: 'GC',
    color: '#78909C',
    category: 'Connectivity',
    url: 'https://granitechannels.com',
  },
  {
    name: 'RingCentral',
    tagline:
      'Cloud communications and UCaaS — phone, video, messaging in one platform.',
    initials: 'RC',
    color: '#F57C00',
    category: 'Communications',
    url: 'https://ringcentral.com',
  },
  {
    name: 'NICE',
    tagline:
      'Contact center and CX solutions — AI-powered customer experience at any scale.',
    initials: 'NI',
    color: '#1A237E',
    category: 'Contact Center',
    url: 'https://nice.com',
  },
  {
    name: 'Firstbase',
    tagline:
      'Remote work equipment management — provision, track, and retrieve devices for distributed teams.',
    initials: 'FB',
    color: '#8B2BE2',
    category: 'Remote IT',
    url: 'https://firstbase.com',
  },
  {
    name: 'Broker Online Exchange',
    tagline:
      'Telecom and IT brokerage platform — quoting, ordering, and commission management in one place.',
    initials: 'BOE',
    color: '#00897B',
    category: 'Platform',
    url: 'https://brokeronlineexchange.com',
  },
  {
    name: 'Devs.ai',
    tagline:
      'AI-powered development and automation solutions for modern businesses.',
    initials: 'DA',
    color: '#E91E63',
    category: 'AI & Development',
    url: 'https://devs.ai',
  },
]

/** Convenience: split vendors into featured and grid. */
export const featuredVendor = vendors.find((v) => v.featured) ?? null
export const gridVendors = vendors.filter((v) => !v.featured)
