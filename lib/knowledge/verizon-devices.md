# Verizon Business — Device & Service Troubleshooting Knowledge Base

---

## APN Settings (All Verizon Business Devices)

**Standard Business APN:**
- APN Name: Verizon
- APN: `vzwinternet`
- Username: (leave blank)
- Password: (leave blank)
- MCC: 311 / MNC: 480
- APN Type: default, supl, dun

**Enterprise / Private Network APN:**
- APN: `VZWENTP` (only if provisioned by Verizon for private LTE)

**When to use which:** 99% of business accounts use `vzwinternet`. VZWENTP only applies to custom enterprise network agreements.

---

## Verizon One Talk — Business Phone System

One Talk is Verizon's hosted UCaaS phone system sold directly through Verizon Business. It works on desk phones, the One Talk mobile app, and softphones. Mark sells and manages these accounts.

### Supported Desk Phone Models
- **Polycom VVX 300/310** — entry level, 6 line keys
- **Polycom VVX 400/410** — mid-range, 12 line keys (most common in small offices)
- **Polycom VVX 500/501** — executive, color display
- **Yealink T33G** — budget-friendly, 4 lines
- **Yealink T43U** — mid-range, USB port, 12 lines
- **Yealink T54W** — high-end, color touchscreen, Wi-Fi capable

### Phone Shows "Not Registered" / No Service
1. Check ethernet cable is plugged into phone AND into a PoE switch port (Power over Ethernet required — regular switch ports won't power the phone)
2. Verify PoE switch has power and the port LED is lit
3. Check if internet is working generally — if internet is down, all phones go down
4. On phone: Menu → Status → Network → verify IP address shows (not 0.0.0.0)
   - No IP address = DHCP not responding = router/switch issue
5. On phone: Menu → Status → Lines → verify registration status
6. If phone was recently moved or reset: SIP credentials need re-provisioning
   - Mark must log into One Talk Admin portal to re-push config to the device
7. Factory reset as last resort:
   - Polycom: hold pound (#) during boot → select option 3 (Reset to Default)
   - Yealink: Settings → Advanced → Reset Config → Reset to Factory Default

### Phone Has No Dial Tone (Registered but Silent)
1. Verify phone shows "Registered" or "Ready" on screen
2. Check DND (Do Not Disturb): Polycom — press "DnD" soft key to toggle; Yealink — press DND button
3. Check audio path: Menu → Settings → Basic → Sound → Headset/Handset — confirm correct audio device
4. Physical check: RJ9 handset cable seated on both ends
5. Try a headset in the headset port to isolate handset vs. phone issue

### One Talk Mobile App Not Ringing for Incoming Calls
1. Phone Settings → One Talk app → Notifications → enable "Incoming Calls"
2. Check "Do Not Disturb" is off in both phone OS and One Talk app
3. In One Talk Admin portal: confirm the user's mobile number is added as a "linked number"
4. iOS: Settings → One Talk → Background App Refresh → ON
5. If linked but still not ringing: unlink mobile number → save → re-add → save

### Missed Calls Going to Mobile Voicemail Instead of One Talk Voicemail
- One Talk uses simultaneous ring — if mobile doesn't answer in time, it defaults to mobile carrier voicemail
- Fix in One Talk Admin portal: Users → select user → Call Handling → set "Number of rings before voicemail" to 4 or higher on mobile
- Or: disable the linked mobile number for ringing, keep only desk phone + app

### Voicemail Setup / First-Time Access
1. Press the Messages button on desk phone (envelope icon)
2. Default PIN is last 4 digits of the direct number — if that fails, Mark resets via Admin portal
3. Follow prompts to record name and greeting
4. Visual voicemail in One Talk app: tap the Voicemail tab

### One Talk Admin Portal (Mark's Access)
- URL: `https://onetalk.verizon.com`
- Login: Verizon Business account credentials (not personal My Verizon)
- Common tasks AI can walk Mark through: adding users, resetting PINs, adjusting call routing

### Auto-Attendant / Main Line Not Working
- Auto-attendant setup requires One Talk Admin portal access → route to Mark
- If auto-attendant is playing but calls aren't routing to the right extensions: Mark checks routing tree in admin portal

### Escalation — Always Route to Mark for One Talk
- Adding or removing lines/users
- Porting a number into or out of One Talk
- Setting up hunt groups or call queues
- Auto-attendant menu tree changes
- Any billing or plan changes

---

## Verizon Fios Business Internet

### Router Models in the Field

**Current models (2022–present):**
- **Verizon CR1000A** — Wi-Fi 6, fastest current model, dual-band
- **Verizon CR1000B** — identical to CR1000A, rebadged

**Older models still common:**
- **Verizon G3100** — Wi-Fi 6, very common, still fully supported
- **Verizon G1100** — Wi-Fi 5, older but still deployed in many offices
- **Frontier/Verizon ARRIS NVG468MQ** — if acquired through Frontier in some TX markets

**Admin panel access for all models:**
- URL: `http://192.168.1.1`
- Default username: `admin`
- Default password: printed on sticker on the side/bottom of router

### Fios Business — No Internet

1. Check the ONT (Optical Network Terminal) — the white or gray box on the wall, usually near where fiber enters the building
   - Power LED: should be solid green
   - WAN/Internet LED: should be solid green (amber/red = Verizon network issue)
2. If ONT LEDs look normal: power cycle the router (unplug 60 seconds, replug, wait 3 minutes)
3. Check ethernet cable between ONT and router WAN port — replace if possible
4. Log into router admin panel (192.168.1.1) → check WAN/Broadband status
5. If router shows "No WAN IP" or "Disconnected": Verizon network issue → call 1-800-VERIZON (business support line: 1-800-922-0204)
6. If ONT has red light: fiber line issue, Verizon must send a tech

### Fios Business — Wi-Fi Connectivity Issues

1. **Range issues:** CR1000A/G3100 are dual-band — use 5GHz (faster, shorter range) for conference rooms and 2.4GHz for devices far from router
2. **Can't connect to Wi-Fi:** check password on router label or admin panel → My Network → Wi-Fi → WPA2 key
3. **Slow Wi-Fi:** admin panel → My Network → Diagnostics → Run speed test internally; if speeds to router are good but wireless is slow → channel congestion
   - Admin panel → Wi-Fi → Advanced → change channel to less congested (1, 6, or 11 for 2.4GHz)
4. **Device keeps disconnecting:** admin panel → My Network → DHCP → increase lease time; or assign static IP for the problematic device

### Static IP Setup (Common for Businesses with Cameras, VoIP, Servers)
1. Admin panel → My Network → Network Connections → Broadband Connection
2. If Verizon provisioned a static IP block: enter IP, subnet, gateway as provided in the Verizon welcome letter
3. For internal device static IPs (e.g., VoIP phone, camera NVR):
   - Assign by MAC address: admin panel → My Network → DHCP → Advanced → Add Reserved IP
4. Port forwarding for security cameras, VoIP, remote desktop:
   - Admin panel → Firewall → Port Forwarding → add rule (application, internal IP, port range)

### Fios Business Gigabit Speed — Not Getting Full Speed
1. Computer must use wired ethernet for gigabit testing (Wi-Fi tops out around 800 Mbps even on Wi-Fi 6)
2. Ethernet cable must be Cat 5e or better (Cat 6 preferred for gigabit)
3. Test at `fast.com` or `speedtest.net` — pick a local Austin server
4. If wired speed is low: check that ethernet port on computer is gigabit capable
5. If consistently below 50% of provisioned speed: call Verizon Business support — they can remotely check line quality

---

## Verizon 5G Business Internet (Fixed Wireless)

This is Verizon's fixed wireless product — a 5G/LTE router at the business, no fiber needed. Common in Austin suburbs and areas where Fios isn't available.

### Router Models
- **Verizon ASK-NCQ1338FA** ("5G Business Internet Gateway") — current black cube model
- **Inseego FW2000** — earlier 5G gateway, tower-shaped
- Both have a touchscreen/display and internal 5G antenna

### Initial Setup
1. Router must be placed near a window or exterior wall — 5G signal is blocked by thick walls and metal
2. Power on → follow display prompts to connect to 5G network
3. Admin panel: `http://192.168.0.1` or `http://5ggateway.local`
4. Default Wi-Fi credentials: on sticker on back of device

### 5G Business Internet — No Internet / Poor Speed
1. Check signal display on router — needs at least 3/5 bars; if 1-2 bars, try repositioning near a different window
2. Avoid placing near: microwaves, cordless phone bases, large metal objects
3. Power cycle: unplug power 30 seconds → replug → wait 3 minutes
4. Check for Verizon 5G outages: `downdetector.com/status/verizon` — fixed wireless goes down with tower outages
5. Admin panel → Status → check which band is connected (mmWave vs. Sub-6GHz)
   - mmWave: very fast (500+ Mbps) but only works within ~500 feet of tower with clear line of sight
   - Sub-6GHz (C-Band): more typical for fixed wireless (100–300 Mbps)
6. If speed is consistently under 50 Mbps on sub-6: request Verizon technician to optimize antenna alignment

### 5G Internet — Connected but Devices Can't Get Online
1. Admin panel → Connected Devices — verify device appears
2. Check DHCP is enabled: admin panel → LAN → DHCP → ON
3. Try rebooting just the router (not the ONT — there isn't one with 5G)
4. DNS issue: admin panel → WAN → DNS → set manually to `8.8.8.8` and `8.8.4.4` (Google DNS)

---

## Verizon 4G LTE Business Internet (Non-Fios Areas)

Older fixed wireless product, still deployed in many businesses. Looks like a small desktop router with an external antenna port.

### Common Models
- **Cradlepoint IBR900** — rugged, enterprise LTE router (Mark may have provisioned these)
- **Verizon LTE Business Internet router** (white square device)
- **MoFi Network MOFI4500** — sometimes used in low-coverage areas

### LTE Business Internet — No Internet
1. Check antenna cables are tight — LTE routers have SMA connectors on back
2. Admin panel (check label — usually `192.168.0.1` or `10.0.0.1`) → check signal bars and carrier
3. Verify APN: admin → Mobile/Cellular → APN → must be `vzwinternet`
4. Power cycle
5. SIM may have expired data or be inactive → call 1-800-922-0204 with account number

---

## Verizon Network Extender (Indoor Cell Coverage)

Used when a business has poor Verizon cell signal indoors. Plugs into internet and creates a small cell tower inside.

### Models
- **Samsung SLS-BU103** — 4G LTE Network Extender 2 (current model, black box)
- **Samsung SLS-BU101** — older model

### Setup
1. Connect ethernet from extender to router (must be wired, not Wi-Fi)
2. Power on — initial GPS sync takes up to 30 minutes (green light = ready)
3. **GPS requirement:** extender must be near a window with GPS signal — cannot be in a basement or interior room with no sky view
4. Once GPS acquires, cellular LED turns green — all Verizon devices in range (~5,000 sq ft) will register

### Network Extender Not Working / Red Light
1. Red cellular light: not registered with Verizon — check internet connection first
2. Red GPS light: no GPS fix — move extender to a window; if no windows available, an external GPS antenna (sold separately) can be run outside
3. Blue/amber GPS light: still acquiring — wait up to 30 minutes
4. Make sure ports are open in router firewall:
   - UDP 500, UDP 4500 (IPSec)
   - TCP/UDP 4500
5. Some routers with strict NAT block the extender — try placing extender in router's DMZ temporarily to test
6. Devices not connecting to extender: Verizon phones must be set to "preferred network" = LTE/CDMA; phones on "LTE only" may skip it

### Escalation for Network Extender
- If extender registers (green light) but call quality is still poor: Verizon may need to tune the macro tower — route to Mark
- If business needs coverage across multiple floors: may need multiple extenders or a Small Cell solution — route to Mark (sales opportunity)

---

## iPhone — Verizon Business

### No Data / Data Not Working
1. Settings → Cellular → Cellular Data → verify it is ON
2. Settings → Cellular → Cellular Data Options → verify "Data Roaming" is ON if traveling
3. Check APN: Settings → Cellular → Cellular Data Network → APN should be `vzwinternet`
4. Toggle Airplane Mode ON for 30 seconds, then OFF
5. Restart iPhone (hold side + volume down → slide to power off)
6. If still failing: Settings → General → Transfer or Reset iPhone → Reset → Reset Network Settings (reconnects to Wi-Fi and Bluetooth after, does not erase data)
7. If none of the above: SIM may need re-provisioning — contact Verizon Business at 1-800-922-0204

### Email Not Syncing (Microsoft 365 / Exchange)
1. Settings → Mail → Accounts → tap the account → verify toggle is ON
2. Delete and re-add account: Settings → Mail → Accounts → Delete Account → Add Account → Microsoft Exchange
3. Server field: `outlook.office365.com`
4. Sign in with full email address and Microsoft password
5. If MFA blocks it: generate an App Password in Microsoft account security settings

### Business Mobile Management (BMM) / MDM Enrollment
1. Open App Store, search "Verizon MDM" or follow enrollment link from Mark
2. If device shows "Supervised" notification — this is normal for business devices
3. If enrollment fails: Settings → General → VPN & Device Management → check for existing profiles conflicting
4. Factory reset may be required if prior MDM profile is locked
5. Verizon BMM support: 1-877-596-7577

### Wi-Fi Calling Setup
1. Settings → Cellular → Wi-Fi Calling → toggle ON
2. Confirm emergency address when prompted (required by FCC)
3. If greyed out: carrier settings update needed → Settings → General → About → if update prompt appears, tap Update

---

## Android (Samsung Galaxy) — Verizon Business

### No Data / Data Not Working
1. Settings → Connections → Mobile Networks → Data Roaming → ON
2. Settings → Connections → Mobile Networks → Access Point Names → verify `vzwinternet` exists
   - If missing: tap (+) → Name: Verizon → APN: vzwinternet → Save → select it
3. Toggle Airplane Mode ON/OFF
4. Power off, remove SIM, reinsert, power on
5. Settings → General Management → Reset → Reset Network Settings

### Samsung Galaxy — Email Setup (Outlook)
1. Open Outlook app → Add Account → add work email
2. If using Samsung Email: Add Account → Microsoft Exchange ActiveSync → server: `outlook.office365.com`
3. If login loops: clear Outlook app cache → Settings → Apps → Outlook → Storage → Clear Cache

### MDM Enrollment (Samsung Knox)
1. Verizon Business uses Samsung Knox for Android MDM
2. Device receives enrollment invite via email or SMS from Verizon
3. Install "Knox Enrollment Service" from Play Store if not auto-installed
4. If enrollment fails: check that device is not "carrier locked" to another network

---

## Verizon Jetpack / MiFi Hotspot Devices

### Inseego MiFi X PRO 5G (MV3000) — Most Common Current Model
**Default Wi-Fi credentials:** printed on label inside battery compartment or back cover
**Admin interface:** connect to hotspot Wi-Fi → open browser → go to `http://192.168.1.1`
**Default admin password:** printed on device label (usually same as Wi-Fi password initially)

#### Hotspot Not Connecting to Internet
1. Power cycle: hold power button 3 seconds → off → wait 15 seconds → power on
2. Check signal bars on device screen — need at least 2 bars for data
3. Log into admin panel (`http://192.168.1.1`) → check APN is `vzwinternet`
4. Admin panel → Advanced → Cellular → Reset to defaults
5. SIM may be loose: power off → remove back panel → reseat SIM → power on
6. If device shows "No SIM" or "SIM Error": SIM needs replacement → call 1-800-922-0204

#### Laptop Can't Connect to Hotspot
1. Forget the hotspot network on laptop and reconnect fresh
2. Verify Wi-Fi password (found on device label or admin panel)
3. Check connected device limit: admin panel → Connected Devices — Jetpack supports up to 15 devices
4. Try 2.4GHz band if 5GHz is dropping: admin panel → Wi-Fi → set band

---

## Verizon Business Account — Common Issues

### Can't Access Verizon Business Center (verizonenterprise.com)
1. Go to `https://www.verizonbusiness.com` → My Business → Log in
2. Account ID is on the monthly invoice (different from personal My Verizon)
3. If locked out: password reset via email on file, or call 1-800-922-0204 option 3

### Adding a Line / Device Upgrade
- This requires account admin access and is a sales action → route to Mark
- Mark can process upgrades through his Verizon Business rep channel

### Billing Dispute
- Pull invoice from Verizon Business Center → My Account → Billing
- Charges labeled "equipment installment" are device financing (24-month)
- Overage charges: check data usage under My Account → Usage
- Disputes: call 1-800-922-0204 → Billing department

---

## Escalation Triggers — Always Route to Mark

- Device activation on a new line (requires account admin)
- Contract changes, early termination fee questions
- Adding/removing lines from the account
- MDM policy configuration (Knox/BMM policy setup, not just enrollment)
- Device doesn't activate after SIM swap
- "Suspended" account notice
- Porting a number from another carrier
- One Talk: adding/removing users, hunt groups, auto-attendant changes, call queue setup
- New phone system selection (One Talk vs. RingCentral vs. Teams Phone — sales opportunity)
- 5G Business Internet speed consistently below expectations (may need tower optimization or product switch)
- Network Extender: needs multiple units or Small Cell solution
