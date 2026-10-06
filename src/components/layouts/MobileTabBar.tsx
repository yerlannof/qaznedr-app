'use client';

import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { translate } from '@/lib/i18n/translations';
import type { ServiceTopic } from '@/lib/services/topics';
import {
  guideContactHref,
  guideFromPath,
  getGuideSlug,
} from '@/lib/insights/contact-context';

function ContactAction({ locale, href }: { locale: string; href: string }) {
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

function ServiceContactAction({
  locale,
  serviceTopic,
}: {
  locale: string;
  serviceTopic?: ServiceTopic;
}) {
  const searchParams = useSearchParams();
  const guide =
    searchParams?.getAll('guide').length === 1
      ? getGuideSlug(searchParams.get('guide'))
      : undefined;
  return (
    <ContactAction
      locale={locale}
      href={guideContactHref(locale, guide, serviceTopic)}
    />
  );
}

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
    ) ||
    (section === 'equipment' && segments[2] === 'new')
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
  if (section === 'services' && (segments.length === 2 || serviceTopic)) {
    return (
      <Suspense
        fallback={
          <ContactAction
            locale={locale}
            href={guideContactHref(locale, undefined, serviceTopic)}
          />
        }
      >
        <ServiceContactAction locale={locale} serviceTopic={serviceTopic} />
      </Suspense>
    );
  }

  const href = isTeaser
    ? `${pathname.replace(/\/$/, '')}#contact-channels`
    : guideContactHref(locale, guideFromPath(pathname));
  return <ContactAction locale={locale} href={href} />;
}
