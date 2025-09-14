import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { SessionProvider } from '@/components';
import { FavoritesProvider } from '@/contexts';
import { ThemeProvider } from '@/providers/ThemeProvider';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import Onboarding from '@/components/features/Onboarding';
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

export const metadata: Metadata = {
  title: 'QAZNEDR.KZ',
  description: 'Kazakhstan Mining Rights Portal',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://qaznedr.kz'
  ),
  keywords: [
    'Kazakhstan',
    'mining',
    'deposits',
    'licenses',
    'geology',
    'oil',
    'gas',
  ],
  authors: [{ name: 'QAZNEDR.KZ Team' }],
  creator: 'QAZNEDR.KZ',
  publisher: 'QAZNEDR.KZ',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This root layout should not contain html/body since we have locale-specific layouts
  return children;
}
