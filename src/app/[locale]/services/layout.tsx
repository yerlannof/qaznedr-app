import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Услуги для геологической отрасли',
  description:
    'Геологические, юридические, инвестиционные услуги и аренда оборудования для недропользователей Казахстана.',
  openGraph: {
    title: 'Услуги для геологической отрасли | QAZNEDR.KZ',
    description:
      'Геологические, юридические, инвестиционные услуги и аренда оборудования для недропользователей Казахстана.',
    type: 'website',
    siteName: 'QAZNEDR.KZ',
  },
  twitter: {
    card: 'summary',
    title: 'Услуги для геологической отрасли | QAZNEDR.KZ',
    description:
      'Геологические, юридические, инвестиционные услуги и аренда оборудования для недропользователей Казахстана.',
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
