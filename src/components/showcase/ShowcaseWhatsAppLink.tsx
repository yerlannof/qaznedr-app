'use client';

import { MessageCircle } from 'lucide-react';
import { safeTrack } from '@/lib/analytics/events';

export default function ShowcaseWhatsAppLink({
  href,
  label,
  locale,
  code,
}: {
  href: string;
  label: string;
  locale: string;
  code: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        safeTrack('click_whatsapp', { locale, lead: code, place: 'showcase' })
      }
      className="brand-button brand-focus w-full sm:w-auto"
    >
      <MessageCircle aria-hidden className="size-4" />
      {label}
    </a>
  );
}
