'use client';

import type { ReactNode } from 'react';
import { safeTrack } from '@/lib/analytics/events';

/**
 * WhatsApp link that counts `click_whatsapp` in Vercel Analytics, so server
 * components can keep their markup and stay server components.
 */
export default function TrackedWhatsAppLink({
  href,
  locale,
  place,
  lead,
  contact = false,
  className,
  children,
}: {
  href: string;
  locale: string;
  place: string;
  lead?: string;
  /** Marks the link for the listing ContactBeacon (data-contact). */
  contact?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-contact={contact ? '' : undefined}
      onClick={() => safeTrack('click_whatsapp', { locale, place, lead })}
      className={className}
    >
      {children}
    </a>
  );
}
