# Microsoft 365 — Business Troubleshooting Knowledge Base

## Account & Sign-In

### Can't Sign In / Password Issues
1. Go to `https://login.microsoftonline.com` → use full email (e.g., user@company.com)
2. Forgot password: click "Forgot password" → verify via backup email or phone
3. If locked out: admin must reset at `https://admin.microsoft.com` → Users → Active Users → select user → Reset password
4. If no admin access: contact Mark — he can escalate to Microsoft Business Support

### MFA (Multi-Factor Authentication) Issues
**Lost phone / can't receive MFA code:**
1. Use backup codes (if previously saved) — found in Microsoft Security settings
2. Admin can bypass MFA temporarily: admin.microsoft.com → Users → select user → Manage multifactor authentication → Disable for that user → user logs in → re-enables
3. Microsoft Authenticator app lost: admin resets auth methods → user re-enrolls at `aka.ms/mfasetup`

**MFA prompt loops endlessly:**
1. Clear browser cache and cookies → retry
2. Try different browser (Edge is most compatible with M365)
3. Disable browser extensions temporarily
4. Check if Conditional Access policy is blocking the device (route to Mark if suspected)

---

## Outlook (Desktop & Web)

### Email Not Sending / Stuck in Outbox
1. Check internet connection
2. Outlook desktop: File → Office Account → verify signed in with correct account
3. Send/Receive → Send/Receive All Folders (F9)
4. If email stuck: right-click outbox message → delete → resend
5. Check if message is over 25MB attachment limit (M365 max)
6. Outlook Web (`outlook.office.com`): if desktop fails, verify web works — isolates desktop vs. account issue

### Outlook Keeps Asking for Password
1. Windows Credential Manager: Control Panel → Credential Manager → Windows Credentials → find any Microsoft/Office entries → Remove all → restart Outlook
2. File → Office Account → Sign Out → Sign In again
3. If on shared/domain computer: IT policy may be forcing re-auth — route to Mark

### Outlook Not Receiving Emails
1. Check Junk folder — sender may be filtered
2. Check rules: Home → Rules → Manage Rules & Alerts — accidental rule may be moving mail
3. Check mailbox size: File → Info → Mailbox Settings — if full (50GB standard), archive old emails
4. Clutter/Focused Inbox: View → Show Focused Inbox — toggle to see all mail

### Calendar Not Syncing
1. Outlook desktop: Send/Receive → Send/Receive All
2. Mobile: delete and re-add account in phone mail app
3. Shared calendar not showing: Calendar → Add Calendar → From Address Book → search colleague name

---

## Microsoft Teams

### Can't Join / Start Meetings
1. Check camera/microphone permissions: browser or Teams app → Settings → Devices
2. Test audio/video: Teams → Settings → Devices → Make a test call
3. If joining from browser: use Edge or Chrome (Firefox has limitations)
4. "Meeting not found" error: link may be expired or wrong tenant — request new invite

### Teams Notifications Not Working
1. Teams → Settings → Notifications → set to "Banner and email" for important channels
2. Windows: Settings → Notifications → Microsoft Teams → enable
3. Do Not Disturb mode overrides notifications — check status bubble in Teams

### Teams Status Always Shows "Away"
1. Teams → Settings → General → uncheck "Register Teams as the chat app for Office"
2. Power settings: ensure PC isn't going to sleep during work hours
3. Mobile Teams app keeps device "active" — useful if desktop shows away

---

## OneDrive & SharePoint

### Files Not Syncing
1. Check OneDrive icon in system tray — if red X, click → fix errors shown
2. OneDrive: Settings → Account → verify signed into correct account
3. File path too long (Windows limit is 260 characters) — shorten folder names
4. Pause sync → resume: OneDrive tray → Pause syncing → Resume syncing
5. If folder shows "Processing changes" for hours: OneDrive → Settings → Reset OneDrive

### "File is locked for editing" Error
1. Another user has the file open — check who: in Word/Excel → Info → "Shared with"
2. File may be "checked out" in SharePoint: Library → Files → Check Out → Check In
3. If solo user: close all instances of the file → wait 2 minutes → reopen

---

## Microsoft 365 Admin — Common Tasks (For Mark)

### Add New User
1. admin.microsoft.com → Users → Active Users → Add a user
2. Assign license (Business Basic $6/mo, Business Standard $12.50/mo, Business Premium $22/mo)
3. Send welcome email with temporary password

### Remove User / Off-boarding
1. admin.microsoft.com → Users → Active Users → select user → Delete user
2. Before deleting: assign their mailbox to another user or convert to shared mailbox
3. Remove from all groups/Teams

### License Not Assigned (User Can't Access Apps)
1. admin.microsoft.com → Users → Active Users → select user → Licenses and Apps tab
2. Check that correct license is checked → Save
3. Apps may take up to 24h to activate after license assignment

---

## Escalation Triggers — Route to Mark

- Tenant-level configuration (domain setup, DNS records, MX records)
- Conditional Access / Azure AD policy issues
- Microsoft 365 subscription billing, contract, or volume licensing
- Data migration from another platform (Google Workspace → M365)
- Teams Phone / calling plan setup (requires Verizon or carrier integration)
- Security & Compliance center issues (eDiscovery, DLP policies)
- User reports account was compromised / hacked
