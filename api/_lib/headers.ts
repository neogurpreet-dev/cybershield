export interface HeaderCheck {
  key: string;
  label: string;
  present: boolean;
  value?: string;
  advice: string;
}

const CHECKS: { key: string; label: string; weight: number; advice: string }[] = [
  { key: 'strict-transport-security', label: 'HSTS (force HTTPS)', weight: 25, advice: 'Add "Strict-Transport-Security: max-age=31536000; includeSubDomains" so browsers always use HTTPS.' },
  { key: 'content-security-policy', label: 'Content Security Policy', weight: 25, advice: 'Add a Content-Security-Policy to limit which scripts can run, which blocks most XSS attacks.' },
  { key: 'x-content-type-options', label: 'X-Content-Type-Options', weight: 15, advice: 'Add "X-Content-Type-Options: nosniff" so browsers do not guess file types.' },
  { key: 'x-frame-options', label: 'Clickjacking protection', weight: 15, advice: 'Add "X-Frame-Options: DENY" (or CSP frame-ancestors) so other sites cannot embed yours invisibly.' },
  { key: 'referrer-policy', label: 'Referrer-Policy', weight: 10, advice: 'Add "Referrer-Policy: strict-origin-when-cross-origin" to avoid leaking full URLs to other sites.' },
  { key: 'permissions-policy', label: 'Permissions-Policy', weight: 10, advice: 'Add a Permissions-Policy to switch off camera, microphone, etc. when you do not use them.' },
];

export function gradeHeaders(headers: Headers) {
  const csp = headers.get('content-security-policy') || '';
  let score = 0;
  const checks: HeaderCheck[] = CHECKS.map((c) => {
    let value = headers.get(c.key) || undefined;
    let present = Boolean(value);
    if (c.key === 'x-frame-options' && !present && /frame-ancestors/i.test(csp)) {
      present = true;
      value = 'via CSP frame-ancestors';
    }
    if (present) score += c.weight;
    return { key: c.key, label: c.label, present, value, advice: c.advice };
  });
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 55 ? 'C' : score >= 35 ? 'D' : 'F';
  return { score, grade, checks, server: headers.get('server') || undefined };
}
