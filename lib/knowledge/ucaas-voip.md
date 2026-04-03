# UCaaS / VoIP / Business Phone — Troubleshooting Knowledge Base

## General VoIP Troubleshooting (Any Platform)

### One-Way Audio / Can't Hear Caller
1. Check headset/speaker is selected correctly in the app
2. Firewall/router may be blocking UDP ports — VoIP needs UDP 5060 (SIP) and 10000-20000 (RTP) open
3. If on VPN: VoIP often conflicts with VPN — disconnect VPN, test call, reconnect after
4. QoS (Quality of Service) on router: enable QoS and prioritize VoIP traffic

### Choppy / Robotic Voice Quality
1. Check internet speed: go to `fast.com` — need at least 1 Mbps up/down per call, ideally 5+
2. Use wired ethernet instead of Wi-Fi for desk phones
3. Close bandwidth-heavy apps (video streaming, large downloads) during calls
4. Router placement: move away from interference sources (microwaves, cordless phones at 2.4GHz)
5. If on business internet: contact ISP to check for packet loss on line

### Calls Dropping
1. Check Verizon signal strength if using cellular for VoIP
2. Router: enable SIP ALG? Actually — **disable SIP ALG** (most common VoIP fix): router admin → Advanced → NAT → disable SIP ALG
3. Power cycle router and VoIP adapter/phone
4. Check if drops happen at specific times (peak usage = bandwidth contention issue)

---

## RingCentral (Available via AppDirect / ConnectEx)

### App Not Ringing for Incoming Calls
1. RingCentral app → Settings → Notifications → enable "Incoming Calls"
2. Check "Do Not Disturb" is off (moon icon in app)
3. Mobile: iOS Settings → RingCentral → Notifications → Allow → enable all
4. Check call forwarding: RingCentral admin portal → Users → select user → Call Handling → verify forwarding rules

### Can't Make Outbound Calls
1. Verify user has outbound calling enabled: admin portal → Users → select user → Calls → Outbound Calling → ON
2. Check if international calling is blocked (default for most business plans) — Mark can enable via admin portal
3. Softphone license may not be assigned: admin portal → Users → Devices — ensure a softphone is listed

### Voicemail Not Transcribing
1. RingCentral → Settings → Voicemail → enable "Voicemail-to-Text"
2. Feature requires "RingCentral MVP" or higher tier — check subscription
3. Transcription emails going to spam: whitelist `@ringcentral.com`

### Setting Up New RingCentral User
1. Admin portal (`https://service.ringcentral.com`) → Users → Add User
2. Assign extension, DID (direct number), and device
3. User receives welcome email → activates account → downloads app
4. Configure call handling: Hours, voicemail greeting, forwarding

---

## Microsoft Teams Phone (Teams Calling)

### Teams Phone Not Receiving Calls
1. Teams → Settings → Calls → verify "Also ring" is configured if using mobile
2. Check Calling Plan is active: admin.microsoft.com → Billing → Products → Teams Phone license
3. Verify phone number is assigned: Teams admin center → Users → select user → check phone number assigned

### Can't Call External Numbers (Only Internal Teams)
1. User needs a Calling Plan license (Microsoft or Operator Connect via Verizon)
2. Teams admin center → Users → select user → Policies → Calling Policy must allow external calls
3. If using Verizon's Operator Connect: number must be ported and verified in Teams admin

---

## Desk Phone Setup (Polycom / Yealink)

### Phone Won't Register (Shows "Not Registered")
1. Check ethernet cable is plugged into both phone and PoE switch port
2. Phone web UI: open browser → enter phone's IP address (shown in phone Settings menu) → Status → Registration → verify server address matches your VoIP provider
3. Credentials wrong: re-enter SIP username and password from your VoIP provider's portal
4. Factory reset if needed: Settings → Advanced (password: usually `admin`) → Reset to Factory

### Phone Picks Up But No Dial Tone
1. Verify RJ11 (handset) cable is seated correctly
2. Try headset jack as alternative
3. Phone may be in "Do Not Disturb" mode — press DND button to toggle off

---

## Escalation Triggers — Route to Mark

- New phone system selection or migration (this is a sales opportunity — Mark earns commission)
- Number porting from current carrier
- Multi-site call routing setup (auto-attendant trees, hunt groups, IVR)
- SIP trunk provisioning
- Verizon One Talk setup (Mark sells this directly through Verizon Business)
- Teams Operator Connect configuration
- Contact center / call queue setup
- Any RingCentral admin portal changes affecting billing or plan tier
