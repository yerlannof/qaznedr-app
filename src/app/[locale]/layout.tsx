import { notFound } from 'next/navigation';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { WebVitalsTracker } from '@/components/monitoring/WebVitalsTracker';
import MobileTabBar from '@/components/layouts/MobileTabBar';
import type { Metadata, Viewport } from 'next';
import '../../styles/globals.css';

const BASE_URL = 'https://qaznedr.kz';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: {
      default: 'QAZNEDR.KZ — Площадка недропользования Казахстана',
      template: '%s | QAZNEDR.KZ',
    },
    description:
      'B2B маркетплейс для покупки и продажи месторождений, лицензий на недропользование и геологических услуг в Казахстане. Для инвесторов, недропользователей и сервис-провайдеров.',
    keywords: [
      'месторождения Казахстан',
      'недропользование',
      'mining licenses Kazakhstan',
      'mineral deposits',
      '矿产资源哈萨克斯坦',
      'лицензии на добычу',
      'геология',
    ],
    openGraph: {
      title: 'QAZNEDR.KZ — Площадка недропользования Казахстана',
      description:
        'B2B маркетплейс для покупки и продажи месторождений в Казахстане',
      url: `${BASE_URL}/${locale}`,
      siteName: 'QAZNEDR.KZ',
      locale:
        locale === 'kz'
          ? 'kk_KZ'
          : locale === 'zh'
            ? 'zh_CN'
            : locale === 'en'
              ? 'en_US'
              : 'ru_KZ',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'QAZNEDR — Платформа геологической отрасли Казахстана',
      description:
        'Превращаем природные богатства Казахстана в экономический рост',
      site: '@qaznedr',
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        ru: `${BASE_URL}/ru`,
        en: `${BASE_URL}/en`,
        kk: `${BASE_URL}/kz`,
        zh: `${BASE_URL}/zh`,
        'x-default': `${BASE_URL}/ru`,
      },
    },
    robots: {
      index: true,
      follow: true,
    },
    // Set GOOGLE_SITE_VERIFICATION / YANDEX_VERIFICATION in Vercel env to emit the
    // verification meta tags. Omitted entirely when unset (no broken placeholder tags).
    verification: {
      ...(process.env.GOOGLE_SITE_VERIFICATION
        ? { google: process.env.GOOGLE_SITE_VERIFICATION }
        : {}),
      ...(process.env.YANDEX_VERIFICATION
        ? { yandex: process.env.YANDEX_VERIFICATION }
        : {}),
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

// Editorial display serif for the portal welcome hero (gravitas + character).
const fraunces = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['300', '400', '600'],
  style: ['normal'],
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

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${fraunces.variable} ${inter.className} antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-gray-900 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
        >
          Перейти к содержимому
        </a>
        <ThemeProvider>
          <AuthProvider>
            <WebVitalsTracker pageName={`/${locale}`} />
            <main id="main" className="pb-16 md:pb-0">
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
