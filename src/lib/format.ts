import type { When } from '../types';

export function toDate(w: When | number | string | undefined | null): Date | null {
  if (w === null || w === undefined) return null;
  if (typeof w === 'number' || typeof w === 'string') return new Date(w);
  if (typeof (w as any).toDate === 'function') return (w as any).toDate();
  return null;
}

export function timeAgo(w: When | number | string | undefined | null): string {
  const d = toDate(w);
  if (!d) return 'just now';
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 0) {
    const f = -s;
    if (f < 3600) return `in ${Math.max(1, Math.round(f / 60))} min`;
    if (f < 86400) return `in ${Math.round(f / 3600)} h`;
    return `in ${Math.round(f / 86400)} days`;
  }
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)} days ago`;
  return d.toLocaleDateString();
}

export function formatDateTime(w: When | number | string | undefined | null): string {
  const d = toDate(w);
  if (!d) return '—';
  return d.toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function downloadFile(filename: string, content: BlobPart, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
