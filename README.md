# CyberShield

Personal security and emergency toolkit. Live at **https://cybershield-tau-one.vercel.app**.

Every feature works on real data and is private to each signed-in user. Nothing is simulated.

## Features

| Area | What it actually does |
|---|---|
| **Protection** | **Link checker**: the server measures domain registration age (RDAP), the TLS certificate, the redirect chain, page signals and URL red flags, then Gemini weighs the evidence and explains the verdict in plain English. Dangerous links open an incident automatically. **Password leak check**: Have I Been Pwned with k-anonymity, so the password never leaves the device. **Browser checkup**: browser version against official release feeds, Windows 10 end-of-support, WebRTC local-IP leak, Global Privacy Control, and SOS permissions. |
| **Incidents** | Per-user incidents with auto-generated recovery checklists, a timeline, status and severity tracking, and **PDF / Word export**. "Ask AI about this" opens the assistant with the incident as context. |
| **Domains** | Live DNS records (DNS-over-HTTPS), DNSSEC, SPF/DMARC, a real TLS certificate check, HTTP security-header grading, HTTP→HTTPS redirect check, ownership verification via a TXT record, and change detection between scans with alerts. |
| **Emergency SOS** | GPS, then Wi-Fi, then IP fallback, clearly labelled and never with invented coordinates. A 5-second countdown, a siren, and a **public live-tracking link** (`/track/<id>`) that updates while SOS is active. One-tap WhatsApp/SMS/call to your contacts, real nearby hospitals, police and fire stations (OpenStreetMap Overpass), and a dispatcher script in English and Hindi. |
| **Vault** | Zero-knowledge: AES-256-GCM with a PBKDF2-SHA256 (600k) key derived from your passphrase in the browser. Only ciphertext is stored. Auto-lock, password generator, breach check per entry, encrypted backup and import, and passphrase change. |
| **Compliance** | A saved self-assessment for ISO 27001 (selected Annex A), India DPDP / GDPR and SOC 2, with CSV export. Truthful privacy policy and terms for this app. |
| **Overview** | Activity chart built from your real checks, status cards, safety-habit checklist, tasks with due-date reminders, and goals. |
| **Safety Guide** | Gemini assistant for plain-English security and scam questions. |

## Stack

- React 19, Vite, Tailwind CSS v4, Recharts, Leaflet (OpenStreetMap), jsPDF, docx
- **Firebase**: Google Auth, plus Cloud Firestore (asia-south1) with offline persistence and per-user security rules (`firestore.rules`)
- **Vercel Functions** (`api/`): `url-check`, `site-check`, `assistant`, `status`. Every endpoint except `status` requires a Firebase ID token (verified with Google's public keys, so no service-account secret is needed) and refuses private or internal network targets.

## Run locally

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY
npm run dev                  # http://localhost:3000
```

`npm run lint` type-checks the app and the API. `npm run build` builds the site into `dist/`.

## Deploy

1. Vercel project settings: add the environment variable `GEMINI_API_KEY`.
2. Firebase console: add your deployed domain under Authentication → Settings → Authorised domains.
3. Publish `firestore.rules` in Firestore → Rules.

## Honest limits

A website cannot scan your disk or remove malware. Use Windows Security or your phone's built-in protection for that. AI verdicts can be wrong. SOS cannot send SMS by itself: it opens WhatsApp or SMS with the message ready to send. In an emergency in India, call **112**. For cyber fraud, call **1930**.
