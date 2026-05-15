// Walkthrough articles surfaced on the public /ticketing portal.
// Each article is self-contained Markdown for client-side rendering and is
// also injected into the AI triage context when a related ticket arrives.

export interface Walkthrough {
  slug: string
  title: string
  summary: string
  category: 'phone-setup' | 'voicemail' | 'devices' | 'microsoft365' | 'general'
  keywords: string[]
  body: string
}

export const WALKTHROUGHS: Walkthrough[] = [
  {
    slug: 'set-up-one-talk-desk-phone',
    title: 'How do I set up a Verizon One Talk desk phone?',
    summary: 'Step-by-step: unbox, connect, register, and place your first call on a Polycom or Yealink One Talk phone.',
    category: 'phone-setup',
    keywords: ['phone setup', 'one talk', 'onetalk', 'verizon', 'polycom', 'yealink', 'vvx', 't33g', 't43u', 't54w', 'desk phone'],
    body: `## Before you begin
- Confirm the phone line was provisioned by Mark in the One Talk admin portal — you should have received a confirmation email with your extension and 10-digit number.
- You need a wired ethernet jack (or a One Talk Power-over-Ethernet switch).
- The phone uses POE — if your switch doesn't supply power, plug the included power adapter into the phone.

## Step 1 — Connect the phone
1. Plug the ethernet cable into the **WAN/Internet** port on the back of the phone (the one with the world icon, not the LAN port).
2. The phone will boot — watch for the Verizon One Talk logo.

## Step 2 — Auto-provisioning
1. The phone discovers your account using its MAC address. **Do not press any keys** for the first 2-3 minutes.
2. You'll see "Provisioning..." then the phone reboots once.
3. After the second boot, the screen shows your name, extension, and 10-digit number on the home screen.

## Step 3 — Place a test call
1. Pick up the handset.
2. Dial **#83** to reach the One Talk test echo line.
3. You'll hear "One Talk test successful" within 2 seconds. Hang up.

## Common issues
- **Screen stuck on "No Service"**: the MAC address isn't registered yet. Reply to this ticket with the 12-character MAC printed on the back of the phone (looks like \`00:04:F2:XX:XX:XX\`) and we'll register it.
- **No dial tone**: confirm the cable is in the WAN port, not LAN. The LAN port is for daisy-chaining a computer.
- **Phone reboots in a loop**: usually a POE issue. Try a different ethernet jack or use the power adapter.
- **Wrong name/number on screen**: your line was provisioned to a different MAC. Open a ticket with your phone's MAC.

## Need a live walkthrough?
Reply to this ticket with "walkthrough requested" and Mark will call you to set it up screen-share style.
`,
  },
  {
    slug: 'set-up-verizon-business-phone-mobile',
    title: 'How do I set up my Verizon Business mobile phone (iPhone or Samsung)?',
    summary: 'New phone delivered? Activate it, transfer your old number, install Connectex MDM, and enable email.',
    category: 'phone-setup',
    keywords: ['phone setup', 'verizon', 'mobile', 'iphone', 'samsung', 'galaxy', 'pixel', 'activate', 'business phone'],
    body: `## What you should have received
- The phone in its retail box
- A welcome email from Verizon Business with your new 10-digit number
- (Optional) a separate Connectex MDM email with an enrollment link

## Step 1 — Unbox and power on
1. Charge the phone for 15 minutes if it's below 20%.
2. Power it on and follow the setup wizard (language → Wi-Fi → terms).

## Step 2 — Activate cellular service
**Most new business phones come pre-activated.** When you reach the cellular setup screen:
- **iPhone**: should auto-detect the eSIM. If prompted "Activate carrier?" tap **Continue**.
- **Samsung/Pixel**: tap **Connect to Cellular** when prompted. The eSIM activates over Wi-Fi.

If you're transferring an existing number, choose **"Transfer from another phone"** when prompted and follow the on-screen steps. You'll need the old phone unlocked and nearby.

## Step 3 — Sign into your Apple ID or Google account
Use your **personal** Apple ID / Google account unless Mark has set up a business Apple ID for you.

## Step 4 — Enroll in Connectex MDM (if applicable)
If your business uses MDM:
1. Open the enrollment email Mark sent you.
2. Tap the **Enroll Device** link from your new phone.
3. iOS: install the configuration profile when prompted (Settings → Profile Downloaded → Install).
4. Android Samsung: follow the Knox enrollment flow — it auto-installs work apps.

## Step 5 — Set up business email
- **iPhone**: Settings → Mail → Accounts → Add Account → Microsoft Exchange → enter your work email → tap "Sign In" (uses Microsoft 365).
- **Samsung/Pixel**: open the Outlook app, sign in with your work email.

## Common issues
- **"SIM not provisioned"** for 30+ minutes: open a ticket and we'll re-push the activation.
- **MDM enrollment loop**: usually means iCloud/Google sign-in came after profile install. Reply to this ticket — we'll reset enrollment.
- **Old phone still ringing**: number transfer takes up to 4 hours. If still ringing after 4 hours, open a ticket.

## Need help?
Reply with "walkthrough requested" and Mark will call you within one business day.
`,
  },
  {
    slug: 'set-up-voicemail-one-talk',
    title: 'How do I set up voicemail on my One Talk phone?',
    summary: 'First-time PIN setup, greeting recording, and how to retrieve voicemails on desk phones and the One Talk app.',
    category: 'voicemail',
    keywords: ['voicemail', 'set up voicemail', 'pin', 'greeting', 'one talk', 'verizon'],
    body: `## First-time setup (desk phone)
1. Press the **Messages** button (envelope icon) on your phone.
2. When prompted "Enter your password", press **#** — the default initial password is your 10-digit phone number followed by **#**, or just **#** on most One Talk phones.
3. The setup tutorial starts automatically:
   - Choose a **new 4-6 digit PIN** (avoid 0000, 1234, repeating digits).
   - Record your **name** (10 seconds max).
   - Record your **greeting** (the message callers hear): keep under 25 seconds.

## Sample greeting
> "Hi, you've reached [Your Name] at [Company]. I'm not available right now — please leave your name, number, and a quick message and I'll call you back the same business day. Thanks."

## Retrieving voicemail
- **Desk phone**: press **Messages** → enter PIN → press 1 to play.
- **One Talk app (iOS/Android)**: tap **Voicemail** in the bottom nav. Visual voicemail shows transcripts automatically.
- **From any phone**: dial your own 10-digit number → when greeting starts, press **#** → enter PIN.

## Common voicemail PIN/passcode commands
| Action | Key |
|---|---|
| Skip greeting | # |
| Delete current message | 7 |
| Save current message | 9 |
| Replay | 4 |
| Forward to email | 5 (if enabled) |
| Main menu | * |

## Enable email transcripts
Reply to this ticket with "enable voicemail transcripts" and we'll turn it on for your line. Transcripts and audio attachments arrive in your inbox within 60 seconds of a voicemail.

## Common issues
- **"Mailbox not set up"**: line wasn't provisioned for voicemail. Open a ticket with your extension.
- **Forgot PIN**: reply to this ticket — Mark can reset it.
- **Recordings keep failing**: hold the handset 6 inches from your mouth and re-record. Don't use speakerphone for setup.
`,
  },
  {
    slug: 'set-up-voicemail-mobile',
    title: 'How do I set up voicemail on my business mobile phone?',
    summary: 'Initial voicemail PIN and greeting for Verizon Business mobile (iPhone and Samsung).',
    category: 'voicemail',
    keywords: ['voicemail', 'mobile voicemail', 'iphone voicemail', 'visual voicemail', 'verizon mobile'],
    body: `## Step 1 — Activate voicemail
1. From your business mobile phone, **press and hold "1"** on the dial pad (or dial **\\*86** then call).
2. You'll hear the Verizon voicemail setup wizard.
3. When prompted "Enter your password", enter the **temporary password** Verizon sent in your welcome email — usually the last 4 of your number.

## Step 2 — Choose a new PIN
- Pick a 4-7 digit PIN (no 0000, 1234, repeating, or sequential digits — Verizon will reject those).
- Confirm by re-entering.

## Step 3 — Record your name and greeting
1. Press **2** to record your name.
2. Press **3** to record a personal greeting. Sample:
   > "Hi, you've reached [Name] at [Company]. Please leave a message and I'll get back to you."

## Step 4 — Enable Visual Voicemail (iPhone)
1. Open the **Phone** app → **Voicemail** tab.
2. If it says "Set up now", tap it and follow prompts (will reuse your PIN).
3. You'll see visual voicemail with on-device transcripts.

## Step 4 — Enable Visual Voicemail (Samsung/Pixel)
- Samsung: open **Phone** → **Voicemail**. Tap **Set up** if prompted.
- Pixel: open **Phone** → **Voicemail** tab. Some Pixels require enabling Visual Voicemail in Settings → Voicemail.

## Common issues
- **"You don't have voicemail service"**: line was sold without voicemail add-on. Open a ticket and we'll add it ($0 on most business plans).
- **Greeting won't record**: avoid background noise; hold phone normally, not speakerphone.
- **PIN locked out**: dial **\\*611** from your business phone, say "voicemail PIN reset", or open a ticket.
`,
  },
  {
    slug: 'configure-microsoft-365-mail-outlook',
    title: 'How do I set up my Microsoft 365 email in Outlook?',
    summary: 'Add your Microsoft 365 account to Outlook on iPhone, Android, Windows, or Mac.',
    category: 'microsoft365',
    keywords: ['microsoft 365', 'outlook', 'email setup', 'm365', 'add email account'],
    body: `## On iPhone or Android (Outlook mobile)
1. Install the **Outlook** app from the App Store / Play Store.
2. Open it → **Add Account** → enter your work email (e.g., \`you@company.com\`) → **Continue**.
3. You'll be redirected to a Microsoft sign-in page → enter password → approve MFA prompt.
4. The app syncs mail, calendar, and contacts automatically.

## On Windows (new Outlook)
1. Open **Outlook**. If it's the legacy version, switch to the **New Outlook** toggle at the top right.
2. **Settings** (gear) → **Accounts** → **Add Account** → enter work email → next.
3. Authenticate with your Microsoft 365 password + MFA.

## On Mac (Outlook for Mac)
1. **Outlook** → **Settings** → **Accounts** → **+** (add) → **New Account**.
2. Enter your work email → next → authenticate.

## Common issues
- **"Can't add this account"**: usually MFA isn't set up yet. Open a ticket — Mark needs to enable MFA for your account first.
- **Stuck on "Looking up your account"**: try removing the account and re-adding. If still stuck, your domain may not have autodiscover configured.
- **Calendar/contacts not syncing**: open Outlook settings → ensure Mail/Calendar/Contacts are all toggled on for the account.
- **Password rejected**: passwords are case-sensitive; check Caps Lock. If you used SSO with another provider, sign in via that provider first.
`,
  },
  {
    slug: 'reset-microsoft-365-mfa',
    title: 'I lost my phone — how do I reset Microsoft 365 MFA?',
    summary: 'Recover access when you can\'t receive your MFA code anymore.',
    category: 'microsoft365',
    keywords: ['mfa', 'multi-factor', 'authenticator', 'lost phone', 'reset mfa', 'microsoft'],
    body: `## If you have backup codes
1. Use a backup code from when you originally set up MFA (often saved as PDF or screenshot).
2. Sign in → enter backup code instead of MFA prompt.
3. Once in, go to **My Account** → **Security info** → re-register MFA on your new phone.

## If you don't have backup codes
You'll need an admin to reset MFA for you:
1. **Open a ticket** below describing "lost phone, need MFA reset".
2. We'll verify your identity (usually by calling the phone number on file with HR).
3. We disable your MFA temporarily, you sign in, then re-enroll at \`https://aka.ms/mfasetup\`.

## After regaining access — set up backup methods
1. Sign in to **myaccount.microsoft.com** → **Security info**.
2. Add at least 2 methods:
   - Microsoft Authenticator app (primary)
   - Phone number (SMS backup)
   - **Generate backup codes** — print or save these somewhere offline
3. Make sure to test each method before signing out.
`,
  },
  {
    slug: 'how-to-ask-about-my-devices',
    title: 'I want to ask a question about a device I bought from Connectex',
    summary: 'How to get device-specific help (warranty, returns, configuration, troubleshooting).',
    category: 'devices',
    keywords: ['device', 'warranty', 'return', 'broken', 'question about device', 'question about ticket'],
    body: `## What info to include in your ticket
For the fastest answer, please include:
1. **Device type and model** (e.g., "Polycom VVX 400" or "iPhone 15 Pro Verizon Business")
2. **Serial number or IMEI** (usually on a sticker on the device or in Settings → About)
3. **Symptoms** — what's wrong, how often, when it started
4. **Any error messages** — exact text or a screenshot
5. **What you've already tried** (rebooted, swapped cable, etc.)

## Common questions

### "Is this device still under warranty?"
Most Connectex-sourced devices have:
- **Mobile phones (Verizon Business)**: 1-year manufacturer warranty
- **Desk phones (Polycom/Yealink)**: 1-year warranty
- **Routers (Verizon)**: 2-year warranty
- **Extended warranty**: only if you opted in at purchase — check your invoice

Submit a ticket with your device serial number and we'll check.

### "Can I return this?"
- **Within 14 days, unopened**: full refund. Reply to this ticket with the order number.
- **Within 30 days, opened but working**: 15% restocking fee.
- **After 30 days**: not returnable, but we can help troubleshoot or trade-in.

### "Where do I find the serial number?"
- **Phone (mobile)**: Settings → General → About → Serial Number / IMEI.
- **Desk phone**: sticker on the back of the base.
- **Router**: sticker on the bottom.
- **Laptop**: Settings → System → About → Device specs.

## Need to chat with someone?
Submit a ticket and our AI assistant will reply immediately. If it can't help, Mark will follow up within one business day.
`,
  },
  {
    slug: 'how-to-ask-about-existing-ticket',
    title: 'How do I follow up on a ticket I already opened?',
    summary: 'Use your private ticket link to add details, ask follow-ups, or check status.',
    category: 'general',
    keywords: ['existing ticket', 'follow up', 'check ticket status', 'add to ticket', 'question about ticket'],
    body: `## Your ticket link
When you submitted a ticket, you received a private link that looks like:
\`\`\`
https://connectex.net/ticketing/abc123-...
\`\`\`
**Bookmark that link.** It's the only place to:
- See the current status (Open / In Progress / Resolved)
- Read replies from Mark or the AI assistant
- Add new messages, screenshots, or follow-up questions

## Can't find your link?
1. Search your inbox for **"Connectex"** or **"support@connectex.net"** — the confirmation email contains the link.
2. If you used a work email and have a spam filter, also check Spam/Junk.
3. Still can't find it? Submit a new ticket with the subject **"Lost ticket link"** and your original email; we'll match it up.

## Adding new info to a ticket
1. Open your ticket link.
2. Scroll to the **Reply** box at the bottom.
3. Type your message; attach a screenshot if useful.
4. Hit **Send** — Mark and the AI both see it.

## What "status" means
- **Open**: we've received it, AI is reviewing or has replied.
- **In Progress**: Mark is actively working on it.
- **Waiting on you**: we asked a question — please reply.
- **Resolved**: we believe it's done. If not, just reply to the ticket and it reopens.
`,
  },
]

export function findWalkthroughBySlug(slug: string): Walkthrough | undefined {
  return WALKTHROUGHS.find((w) => w.slug === slug)
}

export function walkthroughsByCategory(): Record<Walkthrough['category'], Walkthrough[]> {
  return WALKTHROUGHS.reduce((acc, w) => {
    if (!acc[w.category]) acc[w.category] = []
    acc[w.category].push(w)
    return acc
  }, {} as Record<Walkthrough['category'], Walkthrough[]>)
}

export const WALKTHROUGH_CATEGORIES: { key: Walkthrough['category']; label: string; description: string }[] = [
  { key: 'phone-setup', label: 'Phone setup', description: 'Set up a new mobile or desk phone, step by step' },
  { key: 'voicemail', label: 'Voicemail', description: 'PIN setup, greetings, and retrieval' },
  { key: 'devices', label: 'Devices & warranty', description: 'Questions about devices you bought from us' },
  { key: 'microsoft365', label: 'Microsoft 365', description: 'Email, MFA, and account access' },
  { key: 'general', label: 'Tickets & general', description: 'Following up on existing tickets and how to ask' },
]
