'use client';

import { usePathname } from 'next/navigation';
import { isPublicPath } from '@/lib/analytics/attribution';

export const OPEN_CONSENT_SETTINGS = 'qaznedr:open-consent-settings';

export default function ConsentSettingsButton({ label }: { label: string }) {
  const pathname = usePathname();
  if (!pathname || !isPublicPath(pathname)) return null;
  return (
    <button
      type="button"
      data-consent-settings-button
      className="brand-focus min-h-11 text-xs text-brand-muted underline underline-offset-4 hover:text-brand-ink"
      onClick={() => document.dispatchEvent(new Event(OPEN_CONSENT_SETTINGS))}
    >
      {label}
    </button>
  );
}
