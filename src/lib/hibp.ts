/**
 * Have I Been Pwned "Pwned Passwords" check using k-anonymity:
 * only the first 5 characters of the password's SHA-1 hash leave the device,
 * so neither CyberShield nor HIBP ever learns the password.
 */
export async function pwnedCount(password: string): Promise<number> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  const prefix = hex.slice(0, 5);
  const suffix = hex.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, { headers: { 'Add-Padding': 'true' } });
  if (!res.ok) throw new Error('Breach database is unreachable right now. Try again in a minute.');
  const text = await res.text();
  for (const line of text.split('\n')) {
    const [s, count] = line.trim().split(':');
    if (s === suffix) return Number(count) || 0;
  }
  return 0;
}

/** Rough strength estimate (entropy-style), 0-4. */
export function passwordStrength(pw: string): { score: number; label: string; tips: string[] } {
  const tips: string[] = [];
  if (!pw) return { score: 0, label: 'Empty', tips: ['Type a password.'] };
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/\d/.test(pw)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pw)) pool += 33;
  let bits = pw.length * Math.log2(Math.max(pool, 1));
  if (/(.)\1{2,}/.test(pw)) bits -= 10;
  if (/^(password|qwerty|123456|admin|welcome|iloveyou|india)/i.test(pw)) bits -= 30;
  if (pw.length < 12) tips.push('Use at least 12 characters, or a passphrase of 4+ random words.');
  if (!/[^A-Za-z0-9]/.test(pw) && pw.length < 16) tips.push('Add a symbol, or make it longer.');
  if (/\d{4}$/.test(pw)) tips.push('Avoid putting a year or PIN at the end.');
  const score = bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
  return { score, label: ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][score], tips };
}

export function generatePassword(length = 20, symbols = true): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789' + (symbols ? '!@#$%^&*-_=+?' : '');
  const out: string[] = [];
  const limit = 256 - (256 % chars.length);
  while (out.length < length) {
    const buf = crypto.getRandomValues(new Uint8Array(length * 2));
    for (const b of buf) {
      if (b < limit && out.length < length) out.push(chars[b % chars.length]);
    }
  }
  return out.join('');
}
