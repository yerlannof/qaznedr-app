'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Menu, Shield } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import BrandLogo from '@/components/brand/BrandLogo';
import { getServiceTopic, type ServiceTopic } from '@/lib/services/topics';
import {
  getGuideSlug,
  guideContactHref,
  guideFromPath,
  guideServiceHref,
  type ServicePath,
} from '@/lib/insights/contact-context';
import type { Locale } from '@/lib/seo/site';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

const languages = [
  { code: 'ru', label: 'RU' },
  { code: 'kz', label: 'KZ' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
] as const;

/**
 * Fixed 56/64 px header. Page content starts below it, except with `overlay`
 * (home): the header is transparent over the hero until the page scrolls.
 */
export default function Navigation({
  serviceTopic,
  guideSlug,
  overlay = false,
}: {
  serviceTopic?: ServiceTopic;
  guideSlug?: string;
  overlay?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [overlay]);
  const clear = overlay && !scrolled && !isOpen;
  const pathname = usePathname() || '/';
  const preserveHomeScroll = /^\/(ru|kz|en|zh)\/?$/.test(pathname);
  const { t, locale } = useTranslation();
  const { data: session } = useSession();
  const topic = getServiceTopic(serviceTopic);
  const guide = getGuideSlug(guideSlug) ?? guideFromPath(pathname);
  const contactHref = guideContactHref(locale, guide, topic);

  const servicePage =
    /^\/(ru|kz|en|zh)\/services(?:\/(?:legal|geological))?\/?$/.test(pathname);
  const switchLocalePath = (newLocale: Locale) => {
    const segments = pathname.split('/');
    if (['ru', 'kz', 'en', 'zh'].includes(segments[1])) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    const path = segments.join('/') || `/${newLocale}`;
    if (servicePage && guide) {
      const servicePath: ServicePath = pathname.includes('/services/legal')
        ? '/services/legal'
        : pathname.includes('/services/geological')
          ? '/services/geological'
          : '/services';
      return guideServiceHref(newLocale, servicePath, guide);
    }
    return pathname.split('/').filter(Boolean)[1] === 'contact'
      ? guideContactHref(newLocale, guide, topic)
      : path;
  };

  const navLinks = [
    { label: t('navigation.leads'), href: `/${locale}/leads` },
    {
      label: t('navigation.services'),
      href: guideServiceHref(locale, '/services', guide),
    },
    ...(process.env.NEXT_PUBLIC_EQUIPMENT_MENU === 'true'
      ? [
          {
            label: t('equipmentCatalog.eyebrow'),
            href: `/${locale}/equipment`,
          },
        ]
      : []),
    { label: t('navigation.insights'), href: `/${locale}/insights` },
    { label: t('navigation.about'), href: `/${locale}/about` },
  ];
  const isActive = (href: string) => {
    const route = href.split(/[?#]/)[0];
    return pathname === route || pathname.startsWith(`${route}/`);
  };

  return (
    <nav
      aria-label={t('common.menu')}
      data-clear={clear || undefined}
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        clear
          ? 'nav-clear border-transparent bg-transparent text-brand-chalk'
          : 'border-brand-line/40 bg-brand-bg text-brand-ink'
      }`}
    >
      <div className="brand-container flex h-14 items-center justify-between gap-4 lg:h-16">
        <Link
          href={`/${locale}`}
          className="brand-focus inline-flex min-h-11 items-center shrink-0"
          aria-label="QAZNEDR HOLDING"
        >
          <BrandLogo className="w-40" inverse={clear} />
        </Link>

        <div className="hidden items-center gap-1 xl:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`brand-focus inline-flex min-h-11 items-center whitespace-nowrap px-2 text-sm hover:text-brand-ink ${
                isActive(link.href)
                  ? 'font-semibold text-brand-ink'
                  : 'text-brand-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-1 xl:flex">
          <div
            className="flex items-center"
            aria-label={t('footer.language.title')}
          >
            {languages.map(({ code, label }) => (
              <Link
                key={code}
                href={switchLocalePath(code)}
                scroll={!preserveHomeScroll}
                hrefLang={code === 'kz' ? 'kk' : code === 'zh' ? 'zh' : code}
                lang={code === 'kz' ? 'kk' : code}
                aria-current={locale === code ? 'page' : undefined}
                className={`brand-focus inline-flex min-h-11 min-w-11 items-center justify-center px-1.5 text-xs ${
                  locale === code
                    ? 'font-semibold text-brand-ink'
                    : 'text-brand-muted hover:text-brand-ink'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <ThemeToggle />
          {session && (
            <>
              <Link
                href={`/${locale}/admin`}
                aria-label={t('navigation.admin')}
                title={t('navigation.admin')}
                className="brand-focus inline-flex min-h-11 min-w-11 items-center justify-center text-brand-muted hover:text-brand-ink"
              >
                <Shield aria-hidden="true" className="size-4" />
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: `/${locale}` })}
                aria-label={t('common.logout')}
                className="brand-focus inline-flex min-h-11 min-w-11 items-center justify-center text-brand-muted hover:text-brand-ink"
              >
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            </>
          )}
          <Link
            href={contactHref}
            className="brand-button brand-focus ml-2 inline-flex min-h-11 items-center whitespace-nowrap px-4 text-sm"
          >
            {t('navigation.contact')}
          </Link>
        </div>

        <div className="xl:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={t('common.menu')}
                aria-expanded={isOpen}
                aria-controls="mobile-nav-menu"
                className="brand-focus inline-flex min-h-11 min-w-11 items-center justify-center text-brand-ink"
              >
                <Menu aria-hidden="true" className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              closeLabel={t('common.close')}
              id="mobile-nav-menu"
              side="right"
              className="w-[min(22rem,90vw)] gap-0 border-brand-line bg-brand-bg p-0 text-brand-ink"
            >
              <SheetHeader className="border-b border-brand-line px-5 py-5">
                <SheetTitle className="text-left text-brand-ink">
                  {t('common.menu')}
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-1 flex-col overflow-y-auto px-5 py-4">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={isActive(link.href) ? 'page' : undefined}
                      className="brand-focus flex min-h-12 items-center border-b border-brand-line text-brand-ink"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                {session && (
                  <SheetClose asChild>
                    <Link
                      href={`/${locale}/admin`}
                      className="brand-focus flex min-h-12 items-center gap-2 border-b border-brand-line text-brand-ink"
                    >
                      <Shield aria-hidden="true" className="size-4" />
                      {t('navigation.admin')}
                    </Link>
                  </SheetClose>
                )}
                <div className="mt-7 text-xs text-brand-muted">
                  {t('footer.language.title')}
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1">
                  {languages.map(({ code, label }) => (
                    <SheetClose asChild key={code}>
                      <Link
                        href={switchLocalePath(code)}
                        scroll={!preserveHomeScroll}
                        hrefLang={
                          code === 'kz' ? 'kk' : code === 'zh' ? 'zh' : code
                        }
                        lang={code === 'kz' ? 'kk' : code}
                        aria-current={locale === code ? 'page' : undefined}
                        className={`brand-focus flex min-h-11 items-center justify-center border border-brand-line text-xs ${locale === code ? 'bg-brand-surface font-semibold text-brand-ink' : 'text-brand-muted'}`}
                      >
                        {label}
                      </Link>
                    </SheetClose>
                  ))}
                </div>
                <div className="mt-6">
                  <ThemeToggle />
                </div>
                <SheetClose asChild>
                  <Link
                    href={contactHref}
                    className="brand-button brand-focus mt-6 flex min-h-12 items-center justify-center"
                  >
                    {t('navigation.contact')}
                  </Link>
                </SheetClose>
                {session && (
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: `/${locale}` })}
                    className="brand-focus mt-4 flex min-h-11 items-center gap-2 text-brand-muted"
                  >
                    <LogOut aria-hidden="true" className="size-4" />
                    {t('common.logout')}
                  </button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
