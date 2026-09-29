'use client';

import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { translate } from '@/lib/i18n/translations';
import {
  guideContactHref,
  guideFromPath,
} from '@/lib/insights/contact-context';

export default function MobileTabBar() {
  const pathname = usePathname() || '/';
  const segments = pathname.split('/').filter(Boolean);
  const locale = ['ru', 'kz', 'en', 'zh'].includes(segments[0])
    ? segments[0]
    : 'ru';
  const section = segments[1];

  if (
    ['contact', 'admin', 'auth', 'dashboard', 'login', 'register'].includes(
      section
    )
  ) {
    return null;
  }

  const isTeaser = section === 'leads' && segments.length === 3;
  const serviceTopic =
    section === 'services' && segments.length === 3
      ? segments[2] === 'legal'
        ? 'licensing'
        : segments[2] === 'geological'
          ? 'geology'
          : undefined
      : undefined;
  const href = isTeaser
    ? `${pathname.replace(/\/$/, '')}#contact-channels`
    : guideContactHref(locale, guideFromPath(pathname), serviceTopic);

  return (
    <div
      className="fixed bottom-0 right-0 z-40 p-5 md:hidden"
      style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
    >
      <Link
        href={href}
        className="brand-button brand-focus inline-flex min-h-12 items-center justify-center gap-2 px-5 text-sm shadow-md"
      >
        <MessageCircle aria-hidden="true" className="size-5" />
        {translate(locale, 'navigation.contact')}
      </Link>
    </div>
  );
}
