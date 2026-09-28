import { notFound } from 'next/navigation';
import localFont from 'next/font/local';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { WebVitalsTracker } from '@/components/monitoring/WebVitalsTracker';
import AttributionCapture from '@/components/analytics/AttributionCapture';
import ConsentManager from '@/components/analytics/ConsentManager';
import MobileTabBar from '@/components/layouts/MobileTabBar';
import type { Metadata, Viewport } from 'next';
import '../../styles/globals.css';
import { getServerTranslation } from '@/lib/i18n/translations';
import {
  HREFLANG,
  OG_LOCALE,
  SITE_NAME,
  SITE_URL,
  toLocale,
} from '@/lib/seo/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const { t } = getServerTranslation(locale);

  const otherVerification: Record<string, string> = {};
  if (process.env.BING_SITE_VERIFICATION) {
    otherVerification['msvalidate.01'] = process.env.BING_SITE_VERIFICATION;
  }
  if (process.env.BAIDU_SITE_VERIFICATION) {
    otherVerification['baidu-site-verification'] =
      process.env.BAIDU_SITE_VERIFICATION;
  }

  // Pages set their own canonical/hreflang via buildPageMetadata — the layout
  // must NOT, otherwise every page inherits the home canonical.
  return {
    metadataBase: new URL(SITE_URL),
    icons: { icon: '/brand/favicon.svg', apple: '/brand/apple-touch-icon.png' },
    title: { default: t('seo.site.title'), template: `%s | ${SITE_NAME}` },
    description: t('seo.site.description'),
    openGraph: {
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      type: 'website',
    },
    robots: { index: true, follow: true },
    // Set *_VERIFICATION env vars in Vercel to emit the verification meta tags.
    verification: {
      ...(process.env.GOOGLE_SITE_VERIFICATION
        ? { google: process.env.GOOGLE_SITE_VERIFICATION }
        : {}),
      ...(process.env.YANDEX_VERIFICATION
        ? { yandex: process.env.YANDEX_VERIFICATION }
        : {}),
      ...(Object.keys(otherVerification).length
        ? { other: otherVerification }
        : {}),
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const inter = localFont({
  src: [
    {
      path: '../../../public/brand/fonts/IBMPlexSans-Regular.woff2',
      weight: '400',
    },
    {
      path: '../../../public/brand/fonts/IBMPlexSans-SemiBold.woff2',
      weight: '600',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
});
const fraunces = localFont({
  src: '../../../public/brand/fonts/SourceSerif4Display-Regular.ttf.woff2',
  variable: '--font-fraunces',
  weight: '400',
  display: 'swap',
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming locale is valid
  const validLocales = ['ru', 'kz', 'en', 'zh'];
  if (!validLocales.includes(locale)) {
    notFound();
  }
  const lang = HREFLANG[toLocale(locale)];
  const { t } = getServerTranslation(locale);

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <meta httpEquiv="content-language" content={lang} />
      </head>
      <body
        className={`${inter.variable} ${fraunces.variable} ${inter.className} antialiased bg-brand-bg text-brand-ink`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-gray-900 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
        >
          {t('common.skipToContent')}
        </a>
        <ThemeProvider>
          <AuthProvider>
            <WebVitalsTracker pageName={`/${locale}`} />
            <AttributionCapture />
            <ConsentManager locale={locale} />
            <main id="main" tabIndex={-1} className="pb-24 md:pb-0">
              {children}
            </main>
            <MobileTabBar />
            <Toaster position="top-right" richColors />
            <Analytics />
            <SpeedInsights />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
