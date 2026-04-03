# Verizon Business — Device Troubleshooting Knowledge Base

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

#### Jetpack MiFi 8800L (Older Model)
- Admin page: `http://192.168.1.1`
- APN path: Settings → Network → APN Settings
- Factory reset: hold power + volume down for 10 seconds

---

## Verizon Business Internet (Fios / LTE Backup)

### Fios Business — No Internet
1. Check ONT box (white box, usually on wall) — power light should be solid green
2. Router: power cycle (unplug 30 seconds, replug) — wait 3 minutes for full restart
3. Check all ethernet cables are firmly seated
4. If ONT shows red/amber: likely a Verizon network issue → call 1-800-VERIZON (business line)

### 4G/5G LTE Business Internet Router (e.g., Verizon LTE Business Internet)
1. Check signal on router display — needs 3+ bars
2. Router placement: elevate to window if possible, away from microwaves/cordless phones
3. Power cycle router
4. Admin panel: typically `http://192.168.0.1` or check device label
5. Verify APN: `vzwinternet` in router admin settings

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
- MDM policy configuration (Knox/BMM policy setup, not enrollment)
- Device doesn't activate after SIM swap
- "Suspended" account notice
- Porting a number from another carrier
