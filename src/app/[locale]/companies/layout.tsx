import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Каталог компаний',
  description:
    'Компании геологической отрасли Казахстана: недропользователи, поставщики услуг, инвесторы.',
  openGraph: {
    title: 'Каталог компаний | QAZNEDR.KZ',
    description:
      'Компании геологической отрасли Казахстана: недропользователи, поставщики услуг, инвесторы.',
    type: 'website',
    siteName: 'QAZNEDR.KZ',
  },
  twitter: {
    card: 'summary',
    title: 'Каталог компаний | QAZNEDR.KZ',
    description:
      'Компании геологической отрасли Казахстана: недропользователи, поставщики услуг, инвесторы.',
  },
};

export default function CompaniesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
