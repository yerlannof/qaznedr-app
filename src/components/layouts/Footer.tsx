'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import BrandLogo from '@/components/brand/BrandLogo';
import { getServiceTopic, type ServiceTopic } from '@/lib/services/topics';

const languages = [
  { code: 'ru', label: 'Русский' },
  { code: 'kz', label: 'Қазақша' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
];

export default function Footer({
  serviceTopic,
}: {
  serviceTopic?: ServiceTopic;
}) {
  const { t, locale } = useTranslation();
  const pathname = usePathname() || '/';
  const topic = getServiceTopic(serviceTopic);

  const switchLocalePath = (newLocale: string) => {
    const segments = pathname.split('/');
    if (['ru', 'kz', 'en', 'zh'].includes(segments[1])) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    const path = segments.join('/') || `/${newLocale}`;
    return topic && pathname.split('/').filter(Boolean)[1] === 'contact'
      ? `${path}?service=${topic}`
      : path;
  };

  const platformLinks = [
    { href: `/${locale}/leads`, label: t('footerNav.platform.leads') },
    { href: `/${locale}/services`, label: t('footerNav.platform.services') },
    { href: `/${locale}/insights`, label: t('navigation.insights') },
  ];
  const infoLinks = [
    { href: `/${locale}/about`, label: t('footerNav.info.about') },
    { href: `/${locale}/contact`, label: t('footerNav.info.contacts') },
    { href: `/${locale}/faq`, label: t('footerNav.info.faq') },
    { href: `/${locale}/legal/terms`, label: t('footerNav.info.terms') },
  ];

  return (
    <footer className="border-t border-brand-line bg-brand-surface pb-20 text-brand-ink md:pb-0">
      <div className="brand-container py-12 lg:py-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link
              href={`/${locale}`}
              className="brand-focus inline-block"
              aria-label="QAZNEDR HOLDING"
            >
              <BrandLogo className="w-40" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-muted">
              {t('footer.company.description')}
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-muted">
              {t('footerNav.platform.title')}
            </h2>
            <ul>
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="brand-focus flex min-h-11 items-center text-sm text-brand-ink hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-muted">
              {t('footerNav.info.title')}
            </h2>
            <ul>
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="brand-focus flex min-h-11 items-center text-sm text-brand-ink hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-muted">
              {t('footer.language.title')}
            </h2>
            <ul>
              {languages.map(({ code, label }) => (
                <li key={code}>
                  <Link
                    href={switchLocalePath(code)}
                    hrefLang={code === 'kz' ? 'kk' : code}
                    lang={code === 'kz' ? 'kk' : code}
                    aria-current={locale === code ? 'page' : undefined}
                    className={`brand-focus flex min-h-11 items-center text-sm hover:underline ${locale === code ? 'font-semibold text-brand-ink' : 'text-brand-muted'}`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-2 border-t border-brand-line pt-5 text-xs text-brand-muted">
          <span>{t('footerNav.bottom.rights', { year: '2026' })}</span>
          <span>{t('footerNav.bottom.city')}</span>
        </div>
      </div>
    </footer>
  );
}
