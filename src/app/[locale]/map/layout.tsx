import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Карта месторождений Казахстана',
  description:
    'Интерактивная карта месторождений полезных ископаемых и лицензионных участков Казахстана.',
  openGraph: {
    title: 'Карта месторождений Казахстана | QAZNEDR.KZ',
    description:
      'Интерактивная карта месторождений полезных ископаемых и лицензионных участков Казахстана.',
    type: 'website',
    siteName: 'QAZNEDR.KZ',
  },
  twitter: {
    card: 'summary',
    title: 'Карта месторождений Казахстана | QAZNEDR.KZ',
    description:
      'Интерактивная карта месторождений полезных ископаемых и лицензионных участков Казахстана.',
  },
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
