/* ============ MD-102 OFFICIAL EXAM OBJECTIVES ============
   Source: Microsoft study guide "Exam MD-102: Managing and Securing
   Microsoft 365 Endpoints by using Intune" — skills measured as of
   October 27, 2026. Every bullet below maps 1:1 to the official guide.
   To update when Microsoft changes the exam: edit this file only —
   the tracker, SRS and question tagging all key off these ids. */

const MD102_OBJECTIVES = [
{
  id: "d1", world: "w1", weight: [20, 25], name: "Prepare infrastructure for devices",
  groups: [
    { id: "1A", name: "Add devices to Microsoft Entra ID", objectives: [
      { id: "1A1", text: "Choose an appropriate device join type (device registration vs Microsoft Entra join)" },
      { id: "1A2", text: "Join devices to Microsoft Entra ID" },
      { id: "1A3", text: "Register devices to Microsoft Entra ID" },
      { id: "1A4", text: "Plan and implement device groups in Entra ID, including dynamic membership rules" },
    ]},
    { id: "1B", name: "Enroll devices to Microsoft Intune", objectives: [
      { id: "1B1", text: "Configure enrollment settings in Microsoft Intune" },
      { id: "1B2", text: "Configure automatic enrollment for Windows" },
      { id: "1B3", text: "Configure personal enrollment for macOS, iOS, and iPadOS" },
      { id: "1B4", text: "Configure Android enrollment profiles (fully managed, dedicated, COPE), enrollment restrictions, and troubleshoot enrollment failures" },
      { id: "1B5", text: "Configure corporate enrollment for macOS/iOS by integrating Intune with Apple Business Manager" },
      { id: "1B6", text: "Configure Android enrollment with Samsung Knox Mobile Enrollment or Google zero-touch" },
    ]},
    { id: "1C", name: "Implement identity and compliance", objectives: [
      { id: "1C1", text: "Manage built-in and custom roles for Intune and Windows 365, including role assignments" },
      { id: "1C2", text: "Configure scope tags and scoped administration for multi-admin environments" },
      { id: "1C3", text: "Implement and manage multi-admin approval" },
      { id: "1C4", text: "Implement compliance policies for all supported device platforms by using Intune" },
      { id: "1C5", text: "Implement Microsoft Entra Conditional Access policies that require a compliance status" },
      { id: "1C6", text: "Configure Windows Hello for Business by using Intune" },
      { id: "1C7", text: "Implement and manage Windows LAPS by using Intune and Entra ID" },
      { id: "1C8", text: "Manage the membership of local groups on Windows devices by using Intune" },
    ]},
  ],
},
{
  id: "d2", world: "w2", weight: [25, 30], name: "Manage and maintain devices",
  groups: [
    { id: "2A", name: "Deploy and upgrade Windows clients by using cloud-based tools", objectives: [
      { id: "2A1", text: "Choose between Windows Autopilot deployment profiles and device preparation policies" },
      { id: "2A2", text: "Choose between Autopilot deployment modes: user-driven, pre-provisioning, and self-deploying" },
      { id: "2A3", text: "Apply a device name template by using Windows Autopilot" },
      { id: "2A4", text: "Implement Windows client deployment by using Windows Autopilot" },
      { id: "2A5", text: "Create an Enrollment Status Page (ESP)" },
      { id: "2A6", text: "Plan and implement device upgrades for Windows 11 by using Intune" },
      { id: "2A7", text: "Provision and configure Windows 365 Cloud PCs (provisioning policies, network connections, image management)" },
      { id: "2A8", text: "Implement Windows Backup by using Intune" },
    ]},
    { id: "2B", name: "Plan and implement device configuration profiles", objectives: [
      { id: "2B1", text: "Create configuration profiles for Windows, including importing ADMX files and using Group Policy analytics" },
      { id: "2B2", text: "Create device configuration profiles for Android devices" },
      { id: "2B3", text: "Create device configuration profiles for iOS/iPadOS devices" },
      { id: "2B4", text: "Create device configuration profiles for macOS devices" },
      { id: "2B5", text: "Create profiles for specialty devices: Microsoft Teams Rooms, HoloLens 2, Zebra" },
      { id: "2B6", text: "Target a profile by using assignment filters and enrollment time grouping" },
    ]},
    { id: "2C", name: "Implement Microsoft Intune Suite add-on capabilities", objectives: [
      { id: "2C1", text: "Configure Endpoint Privilege Management (elevation policies, monitoring elevations, EPM settings)" },
      { id: "2C2", text: "Manage applications by using the Enterprise App Catalog" },
      { id: "2C3", text: "Configure Microsoft Intune Remote Help" },
      { id: "2C4", text: "Plan and implement Microsoft Cloud PKI (cloud CA, automated certificate issuance, certificate health)" },
      { id: "2C5", text: "Implement Microsoft Tunnel for Mobile Application Management (VPN Gateway, MAM devices, monitoring)" },
      { id: "2C6", text: "Implement Intune Advanced Analytics (anomaly detection, proactive insights, risk-based recommendations)" },
    ]},
    { id: "2D", name: "Perform remote actions on devices", objectives: [
      { id: "2D1", text: "Sync, restart, retire, or wipe devices" },
      { id: "2D2", text: "Perform bulk remote actions" },
      { id: "2D3", text: "Update Microsoft Defender Antivirus security intelligence remotely" },
      { id: "2D4", text: "Rotate BitLocker recovery keys" },
      { id: "2D5", text: "Rotate local administrator passwords" },
      { id: "2D6", text: "Run a device query by using KQL" },
      { id: "2D7", text: "Collect device diagnostics and logs, including the Troubleshooting blade" },
    ]},
  ],
},
{
  id: "d3", world: "w4", weight: [15, 20], name: "Protect devices",
  groups: [
    { id: "3A", name: "Configure endpoint security", objectives: [
      { id: "3A1", text: "Create antivirus policies by using Microsoft Intune" },
      { id: "3A2", text: "Create and manage disk encryption policies (BitLocker recovery keys, self-service recovery, compliance monitoring)" },
      { id: "3A3", text: "Create firewall policies by using Microsoft Intune" },
      { id: "3A4", text: "Configure Attack surface reduction policies, applying Zero Trust principles" },
      { id: "3A5", text: "Plan and implement security baselines by using Microsoft Intune" },
      { id: "3A6", text: "Integrate Intune with Microsoft Defender for Endpoint (EDR policies, investigate threats, triage incidents)" },
      { id: "3A7", text: "Onboard devices into Microsoft Defender for Endpoint" },
      { id: "3A8", text: "Configure App Control for Business policies by using Intune" },
    ]},
    { id: "3B", name: "Manage device updates", objectives: [
      { id: "3B1", text: "Plan for device updates by using Intune" },
      { id: "3B2", text: "Create and manage update rings, feature updates, and quality updates for Windows" },
      { id: "3B3", text: "Implement Windows Autopatch and configure Hotpatch policies" },
      { id: "3B4", text: "Create and manage update policies for iOS/iPadOS and macOS by using the Settings Catalog" },
      { id: "3B5", text: "Manage Android updates by using configuration profiles or FOTA deployments" },
      { id: "3B6", text: "Configure Windows client Delivery Optimization by using Intune" },
      { id: "3B7", text: "Monitor device updates by using Intune" },
    ]},
  ],
},
{
  id: "d4", world: "w3", weight: [15, 20], name: "Manage and secure applications",
  groups: [
    { id: "4A", name: "Deploy and update apps", objectives: [
      { id: "4A1", text: "Prepare applications for deployment by using Intune" },
      { id: "4A2", text: "Deploy apps by using Intune: Win32 apps, line-of-business (LOB) apps, and Microsoft Store apps" },
      { id: "4A3", text: "Configure Quiet Time policies for Android and iOS apps" },
      { id: "4A4", text: "Deploy Microsoft 365 Apps by using Intune" },
      { id: "4A5", text: "Configure policies for Microsoft 365 apps using Intune or the Microsoft 365 Apps admin center" },
      { id: "4A6", text: "Deploy Microsoft 365 Apps in a Windows Autopilot deployment (ODT or Intune)" },
      { id: "4A7", text: "Manage Microsoft 365 Apps by using the Microsoft 365 Apps admin center" },
      { id: "4A8", text: "Deploy apps from platform stores: Apple Business Manager and Managed Google Play" },
      { id: "4A9", text: "Monitor app deployment status and troubleshoot installation failures" },
    ]},
    { id: "4B", name: "Plan and implement app protection and app configuration policies", objectives: [
      { id: "4B1", text: "Plan and implement app protection policies for managed and unmanaged (BYOD) devices" },
      { id: "4B2", text: "Implement Entra Conditional Access policies for app protection policies" },
      { id: "4B3", text: "Plan and implement app configuration policies for managed apps and managed devices" },
    ]},
  ],
},
{
  id: "d5", world: "w5", weight: [10, 15], name: "Optimize endpoint operations by using automation, monitoring, and reporting",
  groups: [
    { id: "5A", name: "Automate management tasks", objectives: [
      { id: "5A1", text: "Automate Intune management tasks by using PowerShell and Microsoft Graph" },
      { id: "5A2", text: "Investigate threats identified by Security Copilot agents in Intune" },
      { id: "5A3", text: "Analyze device performance by using Security Copilot agents in Intune" },
      { id: "5A4", text: "Review and respond to Security Copilot agent recommendations" },
      { id: "5A5", text: "Extend device compliance by using PowerShell (custom compliance)" },
    ]},
    { id: "5B", name: "Monitor and optimize health", objectives: [
      { id: "5B1", text: "Implement reporting and data visibility in Intune (custom reports, filters, workbooks, exporting data)" },
      { id: "5B2", text: "Monitor endpoint performance by using Endpoint analytics (Remediations, device health scores, app startup)" },
      { id: "5B3", text: "Configure and manage remediation scripts (detect and fix issues, schedule runs)" },
      { id: "5B4", text: "Analyze endpoint reliability and user experience scores (startup performance, restart frequency, app reliability)" },
      { id: "5B5", text: "Monitor tenant health and Intune service communications (service health dashboard, message center, baselines)" },
      { id: "5B6", text: "Configure alerts and notifications (compliance drift, enrollment failures, configuration conflicts)" },
    ]},
  ],
},
];

/* Quick lookup helpers */
const OBJ_INDEX = (() => {
  const idx = {};
  for (const d of MD102_OBJECTIVES)
    for (const g of d.groups)
      for (const o of g.objectives)
        idx[o.id] = { ...o, group: g, domain: d };
  return idx;
})();
function objName(id) { return OBJ_INDEX[id] ? OBJ_INDEX[id].text : id; }
