/* ============ WORLDS & MISSIONS ============
   Step types:
   - {type:"lesson", obj}                      → intel card from LESSONS
   - {type:"q", qid}                           → question from QUESTION_BANK
   - {type:"inline", q:{...}}                  → bespoke question (same formats)
   - {type:"detective", ...}                   → clue investigation + diagnosis
   - {type:"config", ...}                      → configuration builder
   - {type:"code", code, intro}                → escape-room final code entry
   Escape missions: set escape:true; steps can carry digit:"N" (revealed on success).
   To add a mission: push an object into a world's missions array. */

const WORLDS = [
/* ================= WORLD 1 ================= */
{
  id: "w1", ico: "🏢", name: "The Identity Vault",
  domain: "d1", sub: "Prepare infrastructure for devices",
  story: "TechCore's lobby is in chaos. New devices can't get identities, enrollment is broken, and the security desk is unstaffed. Restore the foundation.",
  missions: [
  {
    id: "m1-1", ico: "🪪", title: "First Day: Badge Access", min: 5,
    brief: "Your first shift. The security desk's tech board is scrambled — prove you know the core tools before anyone gives you admin rights.",
    steps: [
      { type: "lesson", obj: "1A1" },
      { type: "inline", q: { obj:"1A1", type:"match", d:1,
        q:"The lobby tech board is scrambled! Drag each Microsoft technology onto its job.",
        pairs:[["Microsoft Intune","Device management"],
               ["Microsoft Entra ID","Identity and access management"],
               ["Windows Autopilot","Device provisioning"],
               ["Microsoft Defender for Endpoint","Endpoint security"]],
        explain:"Intune manages devices & apps, Entra ID handles identity and access, Autopilot provisions new Windows devices, Defender for Endpoint detects and responds to threats.",
        hints:["Autopilot 'flies' new devices through setup.","Defender… defends."] } },
      { type: "q", qid: "q101" },
      { type: "q", qid: "q103" },
      { type: "q", qid: "q104" },
    ],
  },
  {
    id: "m1-2", ico: "🚨", title: "The Enrollment Emergency", min: 6,
    brief: "Marketing's brand-new laptops joined Entra ID… and then nothing. No policies, no apps, not even listed in Intune. Find out why.",
    steps: [
      { type: "lesson", obj: "1B2" },
      { type: "detective", obj: "1B2",
        scenario: "Device <b>TC-MKT-014</b>: Entra joined ✅, visible in Entra ID ✅, but absent from Intune ❌. User Maya reports no policies and no Company Portal apps. Investigate the clues, then diagnose.",
        clues: [
          { label: "Check Maya's licenses", info: "Maya has Microsoft 365 E3 — includes Intune. License is fine. ✅" },
          { label: "Run dsregcmd /status on the device", info: "AzureAdJoined : YES — the Entra join genuinely succeeded. ✅" },
          { label: "Check Intune > Windows > Automatic enrollment", info: "MDM user scope: <b>Some</b> → group 'IT-Pilot'. Interesting… 🤔" },
          { label: "Check Maya's group memberships", info: "Maya is in 'Marketing-Users' and 'All-Staff'. She is NOT in 'IT-Pilot'. ❗" },
        ],
        question: "What is blocking TC-MKT-014 from enrolling into Intune?",
        choices: ["The device has a hardware fault",
                  "Maya isn't covered by the MDM user scope, so automatic enrollment never triggers",
                  "The Apple MDM push certificate expired",
                  "Intune is down"],
        answer: 1,
        explain: "Automatic enrollment only fires for users inside the <b>MDM user scope</b>. Maya isn't in 'IT-Pilot', so her device joins Entra but never enrolls. Fix: add Marketing to the scoped group (or set scope to All).",
        hints: ["Two clues together tell the story: the scope setting and Maya's groups.","Scope says 'Some: IT-Pilot'. Is Maya in it?"] },
      { type: "q", qid: "q110" },
      { type: "q", qid: "q107" },
    ],
  },
  {
    id: "m1-3", ico: "👥", title: "Grouping Protocol", min: 5,
    brief: "Hundreds of devices, zero organization. Build the dynamic group that tames the fleet.",
    steps: [
      { type: "lesson", obj: "1A4" },
      { type: "q", qid: "q105" },
      { type: "config", obj: "1A4",
        intro: "Build a group that automatically contains <b>every corporate Windows device</b> for policy targeting.",
        slots: [
          { label: "Group type", options: ["Microsoft 365 group", "Security group", "Distribution list"], correct: 1,
            why: "Device targeting uses Entra <b>security groups</b>." },
          { label: "Membership type", options: ["Assigned", "Dynamic User", "Dynamic Device"], correct: 2,
            why: "Devices should flow in automatically → <b>Dynamic Device</b>." },
          { label: "Membership rule", options: [
              "(user.department -eq \"IT\")",
              "(device.deviceOSType -eq \"Windows\") and (device.deviceOwnership -eq \"Company\")",
              "(device.displayName -eq \"Windows\")"], correct: 1,
            why: "Filter on <b>device</b> properties: OS type Windows + ownership Company." },
        ],
        explain: "Security group + Dynamic Device + a device-property rule = self-maintaining targeting. Remember: dynamic groups need Entra ID P1 and take time to populate.",
        hints: ["A rule about 'user.department' can't fill a DEVICE group.","Two conditions: what OS, and who owns it."] },
      { type: "q", qid: "q106" },
    ],
  },
  {
    id: "m1-4", ico: "🍎", title: "Apple Orchard Down", min: 6,
    brief: "Every iPhone and iPad in the company went silent overnight. New ones won't enroll. The CEO's iPad is 'broken'. Save the orchard.",
    steps: [
      { type: "lesson", obj: "1B3" },
      { type: "detective", obj: "1B3",
        scenario: "Since 02:00 last night: existing iPhones stopped checking in ❌, new iPhones can't enroll ❌, Android and Windows are fine ✅. Investigate.",
        clues: [
          { label: "Check Android & Windows management", info: "Both platforms healthy — this is Apple-specific. ✅" },
          { label: "Open Intune > Tenant status", info: "Connector status: <b>Apple MDM Push certificate — EXPIRED yesterday</b>. ❗" },
          { label: "Check the Apple VPP token", info: "VPP token valid for 4 more months. Apps aren't the problem. ✅" },
          { label: "Ask who manages the Apple ID", info: "The cert was created by former admin Dana… with Dana's PERSONAL Apple ID. 😬" },
        ],
        question: "What happened, and what's the correct recovery?",
        choices: ["The VPP token died — buy new licenses",
                  "The APNs certificate expired — renew it with the SAME Apple ID that created it",
                  "Apple is having an outage — wait",
                  "Re-enroll every device immediately"],
        answer: 1,
        explain: "ALL Apple management rides the APNs certificate. It expired → every Apple device went dark. Renew with the <b>same Apple ID</b> (hence: always use a shared corporate Apple ID, never a personal one). A new cert from a different ID would force re-enrolling everything.",
        hints: ["Tenant status told you exactly which connector died.","Renewal has one golden rule about identity."] },
      { type: "q", qid: "q116" },
      { type: "q", qid: "q115" },
    ],
  },
  {
    id: "m1-5", ico: "🤖", title: "Android Armada", min: 6,
    brief: "A shipment of 300 Android devices just arrived: kiosks for the lobby, phones for execs, and staff want work apps on personal phones. Sort the armada.",
    steps: [
      { type: "lesson", obj: "1B4" },
      { type: "q", qid: "q113" },
      { type: "config", obj: "1B4",
        intro: "Configure enrollment for the <b>50 lobby kiosk tablets</b> (no assigned user, single app, corporate-owned, bought via an approved reseller).",
        slots: [
          { label: "Prerequisite connection", options: ["Apple Business Manager", "Managed Google Play account", "WSUS server"], correct: 1,
            why: "Android Enterprise management requires linking Intune to <b>Managed Google Play</b>." },
          { label: "Enrollment profile type", options: ["Personally-owned work profile", "Corporate-owned dedicated device", "Corporate-owned with work profile (COPE)"], correct: 1,
            why: "Kiosks = no user, locked purpose → <b>dedicated device</b>." },
          { label: "Zero-touch option", options: ["Samsung Knox Mobile Enrollment / Google zero-touch via the reseller", "Email users a QR code", "USB provisioning packages"], correct: 0,
            why: "Reseller-registered devices auto-enroll on first boot via KME/zero-touch." },
          { label: "Policy targeting", options: ["User groups", "Device groups"], correct: 1,
            why: "Dedicated devices have NO user affinity — only device groups work." },
        ],
        explain: "Kiosk recipe: Managed Google Play link → dedicated device profile → zero-touch via the reseller → device-group targeting.",
        hints: ["Who signs into a lobby kiosk? Nobody — that rules several options out."] },
      { type: "q", qid: "q114" },
      { type: "q", qid: "q117" },
    ],
  },
  {
    id: "m1-6", ico: "🔐", title: "The Vault: Admin Lockdown", min: 7, escape: true,
    brief: "You're locked inside the admin vault. The door keypad needs a 4-digit code — each correct answer about identity & admin control reveals one digit.",
    steps: [
      { type: "q", qid: "q118", digit: "7" },
      { type: "q", qid: "q119", digit: "2" },
      { type: "q", qid: "q120", digit: "4" },
      { type: "q", qid: "q121", digit: "9" },
      { type: "code", code: "7249",
        intro: "The keypad glows. Enter the 4-digit code assembled from the digits you unlocked." },
    ],
  },
  {
    id: "m1-7", ico: "✅", title: "Compliance Checkpoint", min: 7,
    brief: "The new Conditional Access rollout is blocking half the company. Angry tickets are flooding in. Untangle compliance from chaos.",
    steps: [
      { type: "lesson", obj: "1C4" },
      { type: "q", qid: "q122" },
      { type: "q", qid: "q123" },
      { type: "q", qid: "q125" },
      { type: "detective", obj: "1C5",
        scenario: "User Theo is blocked from Exchange Online: <i>'Your sign-in was blocked — device not compliant.'</i> His laptop LOOKS healthy. Investigate.",
        clues: [
          { label: "Check Theo's device in Intune", info: "TC-FIN-221: BitLocker ✅, Firewall ✅, OS version ✅ — but compliance state shows <b>'Not evaluated'</b>. 🤔" },
          { label: "Check device check-in time", info: "Last check-in: <b>9 days ago</b>. The device hasn't synced since the new compliance policy shipped. ❗" },
          { label: "Check the CA policy", info: "CA policy 'Require compliant device' — enabled, correctly scoped. Working as designed. ✅" },
          { label: "Check license", info: "Theo has Entra ID P1 + Intune. ✅" },
        ],
        question: "What's the fastest correct fix for Theo?",
        choices: ["Exclude Theo from Conditional Access forever",
                  "Have the device sync (Company Portal or remote Sync action) so compliance is evaluated and reported to Entra",
                  "Reinstall Windows",
                  "Disable the compliance policy"],
        answer: 1,
        explain: "A device that hasn't checked in can't prove compliance — CA correctly blocks it. Force a <b>sync</b>, compliance evaluates, Entra learns the device is healthy, access returns. Excluding users or disabling policies defeats the security model.",
        hints: ["The device is healthy but Intune doesn't KNOW yet.","When did the device last talk to Intune?"] },
    ],
  },
  {
    id: "m1-8", ico: "👋", title: "Hello, TechCore", min: 6,
    brief: "Quick-fire round! Passwordless sign-in and local admin control — rapid questions, instant feedback. Go!",
    quickfire: true,
    steps: [
      { type: "lesson", obj: "1C6" },
      { type: "q", qid: "q127" },
      { type: "q", qid: "q128" },
      { type: "q", qid: "q129" },
      { type: "q", qid: "q130" },
      { type: "q", qid: "q126" },
    ],
  },
]},

/* ================= WORLD 2 ================= */
{
  id: "w2", ico: "🛠️", name: "Deployment Bay",
  domain: "d2", sub: "Manage and maintain devices",
  story: "The deployment bay is jammed: 400 new laptops in boxes, broken provisioning, misfiring profiles, and a help desk drowning in tickets.",
  missions: [
  {
    id: "m2-1", ico: "✈️", title: "Autopilot Awakens", min: 6,
    brief: "400 sealed laptop boxes. Zero IT staff to image them. Good thing imaging is dead — wake up Autopilot.",
    steps: [
      { type: "lesson", obj: "2A2" },
      { type: "q", qid: "q202" },
      { type: "q", qid: "q203" },
      { type: "q", qid: "q205" },
      { type: "q", qid: "q201" },
    ],
  },
  {
    id: "m2-2", ico: "📺", title: "The Setup Screen Standoff", min: 7,
    brief: "Users are reaching their desktops before security tools install. Others are stuck at a spinning screen for hours. Tame the Enrollment Status Page.",
    steps: [
      { type: "lesson", obj: "2A5" },
      { type: "q", qid: "q209" },
      { type: "q", qid: "q208" },
      { type: "q", qid: "q206" },
      { type: "q", qid: "q207" },
      { type: "q", qid: "q204" },
    ],
  },
  {
    id: "m2-3", ico: "🧩", title: "Profile Puzzle", min: 7,
    brief: "The old admin left 300 Group Policies and a sticky note: 'good luck'. Modernize configuration without breaking everything.",
    steps: [
      { type: "lesson", obj: "2B1" },
      { type: "q", qid: "q215" },
      { type: "config", obj: "2B1",
        intro: "Pick the right tool for each configuration need on Windows devices.",
        slots: [
          { label: "Set the lock screen timeout (a standard Windows setting)", options: ["Settings Catalog profile", "Custom OMA-URI", "Win32 app"], correct: 0,
            why: "Standard settings → <b>Settings Catalog</b> first, always." },
          { label: "Manage Google Chrome enterprise settings", options: ["Settings Catalog", "Import the Chrome ADMX/ADML files", "Compliance policy"], correct: 1,
            why: "Third-party templates → <b>ADMX import</b>." },
          { label: "Assess which GPOs can migrate to Intune", options: ["Group Policy analytics", "Endpoint analytics", "Guess"], correct: 0,
            why: "<b>GP analytics</b> imports GPO XML and scores MDM support." },
          { label: "A truly exotic CSP setting nothing else exposes", options: ["Custom OMA-URI profile", "Security baseline", "Quiet Time policy"], correct: 0,
            why: "<b>Custom OMA-URI</b> is the documented last resort." },
        ],
        explain: "Order of preference: Settings Catalog → templates/ADMX import → custom OMA-URI last. GP analytics bridges the on-prem estate.",
        hints: ["'Last resort' is in the official docs for one of these."] },
      { type: "q", qid: "q216" },
      { type: "q", qid: "q217" },
    ],
  },
  {
    id: "m2-4", ico: "🎯", title: "Targeting Range", min: 6,
    brief: "Policies are hitting the wrong devices and missing the right ones. Time to master filters, supervision and specialty hardware.",
    steps: [
      { type: "lesson", obj: "2B6" },
      { type: "q", qid: "q222" },
      { type: "q", qid: "q223" },
      { type: "q", qid: "q219" },
      { type: "q", qid: "q221" },
      { type: "q", qid: "q218" },
    ],
  },
  {
    id: "m2-5", ico: "☁️", title: "Cloud PC Rescue", min: 6,
    brief: "The contractor team starts Monday with no hardware budget. Windows 365 to the rescue — if you can configure it.",
    steps: [
      { type: "lesson", obj: "2A7" },
      { type: "q", qid: "q212" },
      { type: "q", qid: "q213" },
      { type: "q", qid: "q211" },
      { type: "q", qid: "q214" },
    ],
  },
  {
    id: "m2-6", ico: "💼", title: "Suite Dreams", min: 7,
    brief: "The CISO bought the Intune Suite and wants every add-on working by Friday. EPM, Cloud PKI, Tunnel, Remote Help — all of it.",
    steps: [
      { type: "lesson", obj: "2C1" },
      { type: "q", qid: "q224" },
      { type: "q", qid: "q225" },
      { type: "q", qid: "q227" },
      { type: "q", qid: "q229" },
      { type: "q", qid: "q230" },
    ],
  },
  {
    id: "m2-7", ico: "🕹️", title: "Remote Control", min: 7, escape: true,
    brief: "You're locked in the operations console room. The terminal demands proof you can handle remote device actions. Four digits. Four answers.",
    steps: [
      { type: "q", qid: "q231", digit: "8" },
      { type: "q", qid: "q232", digit: "1" },
      { type: "q", qid: "q233", digit: "0" },
      { type: "q", qid: "q234", digit: "3" },
      { type: "code", code: "8103",
        intro: "The console unlocks the exit when you enter the 4-digit override code." },
    ],
  },
  {
    id: "m2-8", ico: "🔎", title: "Query Quest", min: 6,
    brief: "A mystery process is eating CPU across the fleet and keys need rotating. Interrogate devices without leaving your chair.",
    steps: [
      { type: "lesson", obj: "2D6" },
      { type: "q", qid: "q237" },
      { type: "q", qid: "q235" },
      { type: "q", qid: "q236" },
      { type: "q", qid: "q238" },
      { type: "q", qid: "q228" },
    ],
  },
]},
/* ================= WORLD 3 ================= */
{
  id: "w3", ico: "📦", name: "The App Factory",
  domain: "d4", sub: "Manage and secure applications",
  story: "The app pipeline has collapsed. Installs fail silently, BYOD phones leak data, and nobody can find Office. Restart the factory.",
  missions: [
  {
    id: "m3-1", ico: "📬", title: "Package Delivery", min: 7,
    brief: "A critical LOB app must reach 2,000 laptops silently, tonight. One wrong switch and 2,000 install wizards pop up at 9 AM.",
    steps: [
      { type: "lesson", obj: "4A1" },
      { type: "q", qid: "q401" },
      { type: "config", obj: "4A1",
        intro: "Build the Win32 deployment for <b>TechCore Reporter (setup.exe)</b> so it installs silently and reports correctly.",
        slots: [
          { label: "Packaging step", options: ["Upload setup.exe directly", "Wrap it with IntuneWinAppUtil into .intunewin", "Zip it"], correct: 1,
            why: "Win32 apps must be wrapped into <b>.intunewin</b> with the Content Prep Tool." },
          { label: "Install command", options: ["setup.exe", "setup.exe /quiet /norestart", "setup.exe /showui"], correct: 1,
            why: "Silent switches or 2,000 users meet an install wizard." },
          { label: "Detection rule", options: ["None — trust the exit code forever", "File exists: C:\\Program Files\\TechCore\\Reporter.exe (or registry/MSI check)", "Ping the vendor's website"], correct: 1,
            why: "Detection proves install state on every check-in — the most common failure point when wrong." },
          { label: "Assignment for mandatory rollout", options: ["Available for enrolled devices", "Required", "Uninstall"], correct: 1,
            why: "<b>Required</b> = forced install. Available would wait for users to ask." },
        ],
        explain: "Wrap → silent install command → accurate detection rule → Required assignment. Each piece failing produces a classic ticket pattern.",
        hints: ["'Silently' is the keyword for one slot.","How will Intune KNOW it worked?"] },
      { type: "q", qid: "q402" },
    ],
  },
  {
    id: "m3-2", ico: "🏪", title: "The Storefront", min: 6,
    brief: "Store apps, VPP licenses, private Android apps — the storefront shelves are empty and three platforms want stock.",
    steps: [
      { type: "lesson", obj: "4A2" },
      { type: "q", qid: "q403" },
      { type: "q", qid: "q404" },
      { type: "q", qid: "q405" },
      { type: "q", qid: "q412" },
      { type: "q", qid: "q413" },
    ],
  },
  {
    id: "m3-3", ico: "📄", title: "Office Space", min: 6,
    brief: "The entire company needs Microsoft 365 Apps — correct channel, no legacy wreckage, installed before first logon.",
    steps: [
      { type: "lesson", obj: "4A4" },
      { type: "q", qid: "q407" },
      { type: "q", qid: "q408" },
      { type: "q", qid: "q410" },
      { type: "q", qid: "q409" },
      { type: "q", qid: "q411" },
    ],
  },
  {
    id: "m3-4", ico: "📱", title: "BYOD Breach", min: 7,
    brief: "Confidential numbers from a board deck just appeared in an employee's personal notes app. Legal is calling. Contain the leak — without seizing anyone's phone.",
    steps: [
      { type: "lesson", obj: "4B1" },
      { type: "detective", obj: "4B1",
        scenario: "A screenshot of corporate financials was found in a PERSONAL notes app on an employee's own phone. The phone is not enrolled. Outlook mobile was used for work email. Investigate how the data escaped.",
        clues: [
          { label: "Check device enrollment", info: "The phone is unenrolled BYOD — no MDM policies apply. 📵" },
          { label: "Check app protection policies", info: "An APP exists… but it's assigned to a pilot group of 5 IT users only. The employee isn't covered. ❗" },
          { label: "Check what the user did", info: "User copied text from an Outlook work email and pasted it into their personal notes app. Nothing stopped them. ✂️" },
          { label: "Check Conditional Access", info: "No policy requires app protection — any app can connect to Exchange Online. ❗" },
        ],
        question: "Which combination actually closes this leak for all BYOD users?",
        choices: ["Force-enroll every personal phone into full MDM",
                  "Assign the app protection policy (blocking cut/copy/paste to unmanaged apps) to all users + a CA policy granting access only with 'Require app protection policy'",
                  "Block all mobile email access permanently",
                  "Send a strongly worded memo"],
        answer: 1,
        explain: "APP blocks org-data transfer to personal apps WITHOUT enrollment, and the CA grant '<b>Require app protection policy</b>' ensures only APP-covered apps (Outlook, not native mail) can touch the data. Full MDM on personal phones is overreach; memos don't stop paste.",
        hints: ["Two gaps: the policy's assignment, and nothing forcing protected apps.","MAM protects data IN apps; CA forces users INTO those apps."] },
      { type: "q", qid: "q417" },
      { type: "q", qid: "q418" },
      { type: "q", qid: "q419" },
      { type: "q", qid: "q420" },
    ],
  },
  {
    id: "m3-5", ico: "🔧", title: "The Install That Wasn't", min: 7,
    brief: "One app, 40% failure rate, zero useful error messages. Put on the detective hat and read the evidence like a pro.",
    steps: [
      { type: "lesson", obj: "4A9" },
      { type: "detective", obj: "4A9",
        scenario: "Win32 app 'TC-Designer' shows <b>Failed</b> on 800 of 2,000 devices. On a failed device the app is actually… INSTALLED and working?! Investigate.",
        clues: [
          { label: "Read IntuneManagementExtension.log on a failed device", info: "Install command ran, exit code 0 (success). Then: 'Detection rule not met after installation'. ❗" },
          { label: "Check the detection rule", info: "Rule: file exists <code>C:\\Program Files\\TC-Designer\\app.exe</code>. 🤔" },
          { label: "Check the actual install path on new devices", info: "Version 2.0 installs to <code>C:\\Program Files\\TechCore\\Designer\\app.exe</code> — the path CHANGED in v2.0. ❗" },
          { label: "Compare failing vs succeeding devices", info: "Succeeding devices all have v1.x (old path). Failing devices got v2.0. ✅" },
        ],
        question: "Why does Intune report failure on working installs, and what's the fix?",
        choices: ["The .intunewin file is corrupt — repackage everything",
                  "The detection rule points at the OLD install path; update it to match v2.0's path",
                  "The devices need more RAM",
                  "Users cancelled the install"],
        answer: 1,
        explain: "Intune judges success by the <b>detection rule</b>, not the exit code. v2.0 moved its folder, the rule misses it, so good installs read as failures (and may loop). Update the detection rule to the new path.",
        hints: ["Exit code said success. What contradicted it?","Two paths appear in the clues. Compare them."] },
      { type: "q", qid: "q414" },
      { type: "q", qid: "q415" },
      { type: "q", qid: "q406" },
    ],
  },
]},

/* ================= WORLD 4 ================= */
{
  id: "w4", ico: "🛡️", name: "Security Core",
  domain: "d3", sub: "Protect devices",
  story: "Alarms everywhere. An attempted breach exposed huge gaps: unencrypted laptops, naked firewalls, updates years behind. Fortify the core.",
  missions: [
  {
    id: "m4-1", ico: "🦠", title: "Shields Up", min: 6,
    brief: "The AV estate is a mess of defaults and dangerous exclusions. Rebuild antivirus policy from the Security Core console.",
    steps: [
      { type: "lesson", obj: "3A1" },
      { type: "q", qid: "q301" },
      { type: "q", qid: "q302" },
      { type: "q", qid: "q307" },
      { type: "q", qid: "q306" },
    ],
  },
  {
    id: "m4-2", ico: "🔑", title: "Encryption Station", min: 7,
    brief: "A laptop was left in a taxi last night. Legal asks ONE question: 'was it encrypted?' Make sure the answer is always yes.",
    steps: [
      { type: "lesson", obj: "3A2" },
      { type: "q", qid: "q303" },
      { type: "config", obj: "3A2",
        intro: "Design the BitLocker policy so every laptop encrypts WITHOUT user interaction and keys are always recoverable.",
        slots: [
          { label: "Policy location", options: ["Endpoint security > Disk encryption", "Apps > Quiet Time", "Devices > Enrollment"], correct: 0,
            why: "BitLocker lives under <b>Endpoint security > Disk encryption</b>." },
          { label: "Enable silently for standard users?", options: ["Impossible — users must be admins", "Yes — with TPM ready and no startup PIN required", "Only with a USB key"], correct: 1,
            why: "Silent enablement works for standard users when TPM is present and no interactive pre-boot auth is demanded." },
          { label: "Recovery key storage", options: ["A spreadsheet on a file share", "Escrow to Entra ID", "Printed labels on laptops"], correct: 1,
            why: "Escrow to <b>Entra ID</b> — admins see keys on the device blade; users self-serve at aka.ms/myrecoverykey." },
          { label: "After help desk reads a key aloud", options: ["Nothing", "Rotate the BitLocker recovery key (requires client-driven rotation enabled)", "Decrypt the drive"], correct: 1,
            why: "A disclosed key is burned — rotate it." },
        ],
        explain: "Silent enablement + Entra escrow + rotation-on-disclosure = encryption that's invisible to users and always recoverable.",
        hints: ["'Without user interaction' kills any option involving typing at boot."] },
      { type: "q", qid: "q304" },
    ],
  },
  {
    id: "m4-3", ico: "⚔️", title: "Attack Surface", min: 6,
    brief: "The phishing simulation got 31% click-through. Macros, scripts and wide-open firewalls everywhere. Shrink the attack surface before round two.",
    steps: [
      { type: "lesson", obj: "3A4" },
      { type: "q", qid: "q305" },
      { type: "q", qid: "q308" },
      { type: "q", qid: "q312" },
    ],
  },
  {
    id: "m4-4", ico: "🐺", title: "Defender Down", min: 7,
    brief: "Defender for Endpoint shows 12 devices. You manage 3,000. Wire Intune and MDE together properly — risk scores, EDR, the whole chain.",
    steps: [
      { type: "lesson", obj: "3A6" },
      { type: "q", qid: "q309" },
      { type: "q", qid: "q311" },
      { type: "q", qid: "q310" },
    ],
  },
  {
    id: "m4-5", ico: "🌀", title: "Update Uprising", min: 7,
    brief: "Patch Tuesday broke the sales app — on every machine simultaneously, because everyone updates on day zero. Never again. Build rings.",
    steps: [
      { type: "lesson", obj: "3B2" },
      { type: "q", qid: "q313" },
      { type: "config", obj: "3B1",
        intro: "Design TechCore's Windows update ring strategy.",
        slots: [
          { label: "Ring 1 — IT pilot (50 devices)", options: ["Quality deferral 0 days", "Quality deferral 30 days", "Updates paused"], correct: 0,
            why: "Pilot takes updates immediately to catch issues first." },
          { label: "Ring 3 — Broad (2,500 devices)", options: ["Quality deferral 0 days", "Quality deferral 10 days", "Feature updates from day one"], correct: 1,
            why: "Broad ring waits while earlier rings validate (e.g. 10 days)." },
          { label: "A patch breaks the sales app mid-rollout", options: ["Pause the affected ring (max 35 days) while you fix", "Wipe affected devices", "Uninstall Intune"], correct: 0,
            why: "Pause is the emergency brake — auto-expires after 35 days." },
          { label: "A critical zero-day must skip ALL deferrals", options: ["Wait for the rings", "An expedited quality update policy", "Email users a download link"], correct: 1,
            why: "Expedite exists precisely to bypass ring deferrals for emergencies." },
        ],
        explain: "Pilot fast, broad slow, pause for fires, expedite for zero-days — the complete ring playbook.",
        hints: ["Who should be hit first by a bad patch — IT or sales?"] },
      { type: "q", qid: "q314" },
      { type: "q", qid: "q315" },
      { type: "q", qid: "q316" },
    ],
  },
  {
    id: "m4-6", ico: "🩹", title: "Patch Patrol", min: 6,
    brief: "Windows is ringed and rolling — but Autopatch promises less work, hotpatch promises no reboots, and the Android/Apple fleets are patchless. Finish the job.",
    steps: [
      { type: "lesson", obj: "3B3" },
      { type: "q", qid: "q317" },
      { type: "q", qid: "q318" },
      { type: "q", qid: "q320" },
    ],
  },
  {
    id: "m4-7", ico: "🚪", title: "The Final Lock", min: 7, escape: true,
    brief: "The Security Core's blast door sealed itself during the incident. Prove mastery of device protection to generate the exit code.",
    steps: [
      { type: "q", qid: "q319", digit: "5" },
      { type: "q", qid: "q321", digit: "6" },
      { type: "q", qid: "q322", digit: "2" },
      { type: "code", code: "562",
        intro: "The blast door console accepts a 3-digit code built from your unlocked digits." },
    ],
  },
]},

/* ================= WORLD 5 ================= */
{
  id: "w5", ico: "📡", name: "Operations Command",
  domain: "d5", sub: "Optimize endpoint operations",
  story: "The crisis is over — now make sure it never happens again. Automation, analytics, AI agents and alerting: run TechCore like mission control.",
  missions: [
  {
    id: "m5-1", ico: "⚙️", title: "Script Protocol", min: 7,
    brief: "500 stale device records, a compliance check Intune can't do natively, and a 3 AM automation job. PowerShell and Graph are your new best friends.",
    steps: [
      { type: "lesson", obj: "5A1" },
      { type: "q", qid: "q501" },
      { type: "q", qid: "q502" },
      { type: "q", qid: "q506" },
      { type: "q", qid: "q507" },
    ],
  },
  {
    id: "m5-2", ico: "🤖", title: "Copilot Online", min: 5,
    brief: "A new AI teammate just logged into mission control. Learn what Security Copilot agents can (and shouldn't) do in Intune.",
    steps: [
      { type: "lesson", obj: "5A2" },
      { type: "q", qid: "q503" },
      { type: "q", qid: "q504" },
      { type: "q", qid: "q505" },
    ],
  },
  {
    id: "m5-3", ico: "📈", title: "Analytics Avenue", min: 7,
    brief: "'Computers are slow' is not a metric. Turn vague complaints into scores, root causes and self-healing scripts.",
    steps: [
      { type: "lesson", obj: "5B2" },
      { type: "q", qid: "q510" },
      { type: "q", qid: "q511" },
      { type: "q", qid: "q512" },
      { type: "q", qid: "q513" },
      { type: "q", qid: "q514" },
    ],
  },
  {
    id: "m5-4", ico: "🚨", title: "Mission Control", min: 7, escape: true,
    brief: "Final door of the operations tower. Reporting, tenant health and alerting — answer well and the tower is yours.",
    steps: [
      { type: "q", qid: "q509", digit: "4" },
      { type: "q", qid: "q508", digit: "0" },
      { type: "q", qid: "q515", digit: "8" },
      { type: "q", qid: "q516", digit: "5" },
      { type: "code", code: "4085",
        intro: "Mission control's master console awaits the 4-digit command code." },
    ],
  },
]},
];

/* Mission helpers */
const MISSION_INDEX = (() => {
  const idx = {};
  for (const w of WORLDS) for (const m of w.missions) idx[m.id] = { mission: m, world: w };
  return idx;
})();
function getQuestion(qid) { return QUESTION_BANK.find(q => q.id === qid); }

