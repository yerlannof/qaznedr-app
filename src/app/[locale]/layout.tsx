import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Geist, Geist_Mono } from 'next/font/google';
import NavigationSimple from '@/components/layouts/NavigationSimple';
import QueryProvider from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SessionProvider } from '@/components/features/SessionProvider';
import { FavoritesProvider } from '@/contexts/favorites-context';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import '@/styles/globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

// Define locales directly to avoid build issues
const locales = ['ru', 'kz', 'en', 'zh'] as const;

// Temporarily disable static generation to fix deployment
// export function generateStaticParams() {
//   return locales.map((locale) => ({ locale }));
// }

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate the locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body>
        <h1>Test Page - Locale: {locale}</h1>
        <div>
          {children}
        </div>
      </body>
    </html>
  );
}