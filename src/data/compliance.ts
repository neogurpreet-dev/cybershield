export interface Control {
  id: string;
  ref: string;
  title: string;
  question: string;
}

export interface Framework {
  id: string;
  name: string;
  short: string;
  description: string;
  controls: Control[];
}

/**
 * Self-assessment checklists. Control summaries are CyberShield's own plain-language
 * paraphrases to help you prepare. They are not the official standard text and
 * completing them is not a certification.
 */
export const FRAMEWORKS: Framework[] = [
  {
    id: 'iso27001',
    name: 'ISO/IEC 27001:2022 (selected Annex A themes)',
    short: 'ISO 27001',
    description: 'Information security management. These are high-value controls most small teams should cover first.',
    controls: [
      { id: 'a5-1', ref: 'A.5.1', title: 'Security policy', question: 'Do you have a written, approved information security policy that people have read?' },
      { id: 'a5-9', ref: 'A.5.9', title: 'Asset inventory', question: 'Do you keep a list of your devices, accounts, domains and important data, with an owner for each?' },
      { id: 'a5-15', ref: 'A.5.15', title: 'Access control', question: 'Does each person only get the access they need, and is access removed when they leave?' },
      { id: 'a5-17', ref: 'A.5.17', title: 'Authentication', question: 'Are strong unique passwords and two-step verification required for important accounts?' },
      { id: 'a5-24', ref: 'A.5.24', title: 'Incident response plan', question: 'Is there a written plan for who does what when a security incident happens?' },
      { id: 'a5-30', ref: 'A.5.30', title: 'Business continuity', question: 'Could you keep working (or recover quickly) if your main system or provider went down?' },
      { id: 'a6-3', ref: 'A.6.3', title: 'Security awareness', question: 'Do people get regular training on phishing, scams and safe handling of data?' },
      { id: 'a8-7', ref: 'A.8.7', title: 'Malware protection', question: 'Is anti-malware protection running and updated on every device?' },
      { id: 'a8-8', ref: 'A.8.8', title: 'Vulnerability management', question: 'Are operating systems, browsers and apps updated promptly when security fixes come out?' },
      { id: 'a8-13', ref: 'A.8.13', title: 'Backups', question: 'Are important files backed up automatically, and have you tested restoring them?' },
      { id: 'a8-15', ref: 'A.8.15', title: 'Logging', question: 'Are sign-ins and important actions logged so you can investigate later?' },
      { id: 'a8-24', ref: 'A.8.24', title: 'Encryption', question: 'Is sensitive data encrypted on devices and when sent over the internet?' },
    ],
  },
  {
    id: 'dpdp',
    name: 'India DPDP Act 2023 & GDPR essentials',
    short: 'Data privacy',
    description: 'Personal data protection duties shared by India’s Digital Personal Data Protection Act and the EU GDPR.',
    controls: [
      { id: 'p-notice', ref: 'Notice', title: 'Clear privacy notice', question: 'Do you tell people, in plain language, what personal data you collect and why?' },
      { id: 'p-consent', ref: 'Consent', title: 'Valid consent', question: 'Do you get clear, specific consent before using personal data, and is it easy to withdraw?' },
      { id: 'p-purpose', ref: 'Purpose', title: 'Purpose limitation', question: 'Is personal data only used for the purpose it was collected for?' },
      { id: 'p-minimise', ref: 'Minimisation', title: 'Collect only what you need', question: 'Have you removed data fields you do not actually need?' },
      { id: 'p-retention', ref: 'Retention', title: 'Delete when done', question: 'Is personal data deleted once it is no longer needed?' },
      { id: 'p-rights', ref: 'Rights', title: 'Access, correction and erasure', question: 'Can people see, correct and delete their data when they ask?' },
      { id: 'p-security', ref: 'Safeguards', title: 'Reasonable security safeguards', question: 'Is personal data protected with access control, encryption and monitoring?' },
      { id: 'p-breach', ref: 'Breach notice', title: 'Breach notification', question: 'Do you have a process to notify the regulator and affected people after a data breach?' },
      { id: 'p-processors', ref: 'Processors', title: 'Vendors and processors', question: 'Do contracts with vendors who handle your data require them to protect it?' },
      { id: 'p-children', ref: 'Children', title: 'Children’s data', question: 'If children may use your service, do you get verifiable parental consent and avoid tracking them?' },
    ],
  },
  {
    id: 'soc2',
    name: 'SOC 2 Trust Services Criteria (readiness)',
    short: 'SOC 2',
    description: 'Readiness checklist for the Security criteria auditors look at first.',
    controls: [
      { id: 's-gov', ref: 'CC1', title: 'Governance', question: 'Is someone accountable for security, with responsibilities written down?' },
      { id: 's-risk', ref: 'CC3', title: 'Risk assessment', question: 'Do you review security risks at least once a year and track how you address them?' },
      { id: 's-monitor', ref: 'CC4', title: 'Monitoring', question: 'Do you check that your controls are actually working (reviews, alerts, audits)?' },
      { id: 's-access', ref: 'CC6', title: 'Logical access', question: 'Is access granted, reviewed quarterly, and revoked promptly when someone leaves?' },
      { id: 's-ops', ref: 'CC7', title: 'System operations', question: 'Do you detect and respond to unusual activity and security events?' },
      { id: 's-change', ref: 'CC8', title: 'Change management', question: 'Are changes to systems reviewed and tested before going live?' },
      { id: 's-vendor', ref: 'CC9', title: 'Vendor risk', question: 'Do you assess the security of key vendors and review them periodically?' },
      { id: 's-avail', ref: 'A1', title: 'Availability', question: 'Do you have backups, capacity monitoring and a tested recovery plan?' },
    ],
  },
];
