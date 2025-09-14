import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Geist, Geist_Mono } from 'next/font/google';
import Navigation from '@/components/layouts/Navigation';
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
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//vercel.live" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <SessionProvider>
            <FavoritesProvider>
              <ThemeProvider>
                <NextIntlClientProvider locale={locale} messages={messages}>
                  <QueryProvider>
                    <div className="flex min-h-screen flex-col">
                      <Navigation />
                      <main className="flex-1">
                        {children}
                      </main>
                    </div>
                  </QueryProvider>
                </NextIntlClientProvider>
              </ThemeProvider>
            </FavoritesProvider>
          </SessionProvider>
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}