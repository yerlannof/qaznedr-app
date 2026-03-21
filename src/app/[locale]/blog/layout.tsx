import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Блог — статьи о геологии и недропользовании | QAZNEDR.KZ',
  description:
    'Статьи, памятки для инвесторов, гайды по получению лицензий, обзоры регионов и новости геологической отрасли Казахстана.',
  openGraph: {
    title: 'Блог — статьи о геологии и недропользовании | QAZNEDR.KZ',
    description:
      'Статьи, памятки для инвесторов, гайды по получению лицензий, обзоры регионов и новости геологической отрасли Казахстана.',
    type: 'website',
    siteName: 'QAZNEDR.KZ',
  },
  twitter: {
    card: 'summary',
    title: 'Блог QAZNEDR',
    description: 'Статьи о геологии и недропользовании Казахстана',
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
