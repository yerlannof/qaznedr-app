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

export const metadata: Metadata = {
  title: {
    default: 'QAZNEDR.KZ — Площадка недропользования Казахстана',
    template: '%s | QAZNEDR.KZ',
  },
  description:
    'B2B маркетплейс для покупки и продажи месторождений, горнодобывающих лицензий и геологических услуг в Казахстане. Для инвесторов, недропользователей и сервис-провайдеров.',
  keywords: [
    'месторождения Казахстан',
    'горнодобыча',
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
    url: 'https://qaznedr.kz',
    siteName: 'QAZNEDR.KZ',
    locale: 'ru_KZ',
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
    canonical: 'https://qaznedr.kz',
    languages: {
      ru: 'https://qaznedr.kz/ru',
      en: 'https://qaznedr.kz/en',
      kk: 'https://qaznedr.kz/kz',
      zh: 'https://qaznedr.kz/zh',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'GOOGLE_VERIFICATION_CODE_HERE',
    yandex: 'YANDEX_VERIFICATION_CODE_HERE',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
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
        <ThemeProvider>
          <AuthProvider>
            <WebVitalsTracker pageName={`/${locale}`} />
            <div className="pb-16 md:pb-0">{children}</div>
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
