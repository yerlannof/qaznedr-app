'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Menu, Shield } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import BrandLogo from '@/components/brand/BrandLogo';
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
];

/** Fixed 56/64 px header. Page content starts below it. */
export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname() || '/';
  const { t, locale } = useTranslation();
  const { data: session } = useSession();

  const switchLocalePath = (newLocale: string) => {
    const segments = pathname.split('/');
    if (['ru', 'kz', 'en', 'zh'].includes(segments[1])) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    return segments.join('/') || `/${newLocale}`;
  };

  const navLinks = [
    { label: t('navigation.leads'), href: `/${locale}/leads` },
    { label: t('navigation.services'), href: `/${locale}/services` },
    { label: t('navigation.insights'), href: `/${locale}/insights` },
    { label: t('navigation.about'), href: `/${locale}/about` },
  ];
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label={t('common.menu')}
      className="fixed inset-x-0 top-0 z-50 border-b border-brand-line bg-brand-bg text-brand-ink"
    >
      <div className="brand-container flex h-14 items-center justify-between gap-4 lg:h-16">
        <Link
          href={`/${locale}`}
          className="brand-focus inline-flex min-h-11 items-center shrink-0"
          aria-label="QAZNEDR HOLDING"
        >
          <BrandLogo className="w-40" />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`brand-focus inline-flex min-h-11 items-center px-2 text-sm hover:text-brand-ink ${
                isActive(link.href)
                  ? 'font-semibold text-brand-ink'
                  : 'text-brand-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-1 lg:flex">
          <div
            className="flex items-center"
            aria-label={t('footer.language.title')}
          >
            {languages.map(({ code, label }) => (
              <Link
                key={code}
                href={switchLocalePath(code)}
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
                className="brand-focus inline-flex min-h-11 items-center gap-1 px-2 text-sm text-brand-muted hover:text-brand-ink"
              >
                <Shield aria-hidden="true" className="size-4" />
                {t('navigation.admin')}
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
            href={`/${locale}/contact`}
            className="brand-button brand-focus ml-2 inline-flex min-h-11 items-center px-4 text-sm"
          >
            {t('navigation.contact')}
          </Link>
        </div>

        <div className="lg:hidden">
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
                    href={`/${locale}/contact`}
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
