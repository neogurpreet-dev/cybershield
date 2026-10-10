import { useEffect, useState } from 'react';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked */
  }
}

export function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = read('cybershield_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  });
  const [contrast, setContrast] = useState(() => read('cybershield_contrast') === '1');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    write('cybershield_theme', dark ? 'dark' : 'light');
  }, [dark]);
  useEffect(() => write('cybershield_contrast', contrast ? '1' : '0'), [contrast]);

  return { dark, toggleDark: () => setDark((d) => !d), contrast, toggleContrast: () => setContrast((c) => !c) };
}

export type Theme = ReturnType<typeof useTheme>;
