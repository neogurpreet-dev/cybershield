import React, { useState } from 'react';
import { FileText, Printer } from 'lucide-react';
import { Button, Card, CardHeader } from '../../ui/ui';

const UPDATED = '10 October 2026';

const SECTIONS: Record<string, { title: string; body: [string, string[]][] }> = {
  privacy: {
    title: 'Privacy policy',
    body: [
      ['What we store', [
        'Your Google account name, email and profile photo, used to sign you in.',
        'Things you create: incidents, tasks, goals, monitored domains and their scan results, SOS contacts, compliance answers, notifications, and a history of the checks you run.',
        'Your vault entries, which are encrypted in your browser with your passphrase before they are saved. We cannot read them.',
      ]],
      ['Where it is stored', [
        'Google Firebase (Cloud Firestore) in the asia-south1 (Mumbai) region, protected by security rules so only your signed-in account can read or change your data.',
        'A copy is cached in your browser so CyberShield works offline.',
      ]],
      ['Who else receives data', [
        'Link checks: the link you paste is sent to our server, which looks it up (DNS, domain registry via rdap.org, the website itself) and asks Google Gemini for an assessment.',
        'Domain checks: DNS questions go to Google Public DNS; certificate and header checks run on our server (Vercel).',
        'Password checks: only the first 5 characters of a hash are sent to Have I Been Pwned. Your password never leaves your device.',
        'Location: used on your device. Street address look-ups go to OpenStreetMap Nominatim, nearby places to the Overpass API, and approximate location (if GPS fails) to ipwho.is.',
        'SOS: when you start an SOS, your name and location are saved to a live-tracking page that anyone with the link can view, until you end the SOS.',
      ]],
      ['Your choices', [
        'Download everything we store about you, or delete it all, from Profile → Your data.',
        'We do not sell your data, show ads, or use third-party tracking or analytics.',
      ]],
    ],
  },
  terms: {
    title: 'Terms of use',
    body: [
      ['What CyberShield is', [
        'A personal toolkit to help you check links and passwords, monitor your domains, track incidents and get help in emergencies.',
        'It is not antivirus software and cannot scan or clean your device.',
      ]],
      ['No guarantees', [
        'Link and domain assessments combine automated checks with AI and can be wrong. Use your judgement, especially when money or passwords are involved.',
        'Emergency features depend on your device, browser permissions, internet connection and third-party maps. Always call 112 in an emergency.',
      ]],
      ['Acceptable use', [
        'Only monitor domains you own or are allowed to test. Do not use CyberShield to probe or attack systems.',
        'Keep your vault passphrase safe. If you forget it, your vault cannot be recovered by anyone.',
      ]],
    ],
  },
  security: {
    title: 'How your data is protected',
    body: [
      ['In transit and at rest', ['All traffic uses HTTPS. Firestore encrypts data at rest.', 'Server functions only accept requests from signed-in users and refuse to contact private or internal network addresses.']],
      ['Vault encryption', ['AES-256-GCM with a key derived from your passphrase using PBKDF2-SHA256 (600,000 iterations). The key exists only in your browser’s memory while the vault is unlocked.']],
      ['Access control', ['Firestore security rules allow each account to access only its own records. SOS tracking pages are readable only by someone who has the exact, randomly generated link.']],
    ],
  },
};

export const Policies: React.FC = () => {
  const [tab, setTab] = useState<keyof typeof SECTIONS>('privacy');
  const s = SECTIONS[tab];
  return (
    <Card className="space-y-4">
      <CardHeader
        icon={<FileText className="w-4 h-4 text-slate-500" />}
        title="CyberShield policies"
        subtitle={`How this app handles your data · last updated ${UPDATED}`}
        action={<Button size="sm" variant="secondary" icon={<Printer className="w-3.5 h-3.5" />} onClick={() => window.print()}>Print</Button>}
      />
      <div className="flex gap-1 border-b border-slate-100 dark:border-slate-800 text-xs">
        {Object.entries(SECTIONS).map(([id, v]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-3 py-2 -mb-px border-b-2 font-semibold cursor-pointer ${tab === id ? 'border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'border-transparent text-slate-500'}`}>
            {v.title}
          </button>
        ))}
      </div>
      <div className="space-y-4 text-xs">
        {s.body.map(([heading, items]) => (
          <div key={heading}>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1.5">{heading}</h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400 leading-relaxed">
              {items.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
};
