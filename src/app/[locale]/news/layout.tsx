import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Новости геологической отрасли',
  description:
    'Актуальные новости недропользования, горнодобычи и геологоразведки в Казахстане.',
  openGraph: {
    title: 'Новости геологической отрасли | QAZNEDR.KZ',
    description:
      'Актуальные новости недропользования, горнодобычи и геологоразведки в Казахстане.',
    type: 'website',
    siteName: 'QAZNEDR.KZ',
  },
  twitter: {
    card: 'summary',
    title: 'Новости геологической отрасли | QAZNEDR.KZ',
    description:
      'Актуальные новости недропользования, горнодобычи и геологоразведки в Казахстане.',
  },
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
