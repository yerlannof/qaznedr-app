'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return <span aria-hidden className="inline-block w-11 h-11" />;
  const dark = resolvedTheme === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="brand-focus inline-flex min-h-11 min-w-11 items-center justify-center text-brand-ink hover:bg-brand-surface"
      aria-label={t('common.toggleTheme')}
    >
      {dark ? (
        <Sun aria-hidden className="w-5 h-5" />
      ) : (
        <Moon aria-hidden className="w-5 h-5" />
      )}
    </button>
  );
}
