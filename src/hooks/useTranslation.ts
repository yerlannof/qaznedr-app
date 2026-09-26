'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { translate } from '@/lib/i18n/translations';

export type { TranslationKeys } from '@/lib/i18n/translations';

export function useTranslation() {
  const pathname = usePathname();

  const locale = useMemo(() => {
    const segments = pathname.split('/');
    const localeFromPath = segments[1];
    return ['ru', 'kz', 'en', 'zh'].includes(localeFromPath)
      ? localeFromPath
      : 'ru';
  }, [pathname]);

  const t = useMemo(() => {
    return function translateKey(
      key: string,
      params?: Record<string, unknown>
    ): string {
      return translate(locale, key, params);
    };
  }, [locale]);

  return {
    t,
    locale,
  };
}
