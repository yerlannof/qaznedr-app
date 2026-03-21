import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Объявления — месторождения и лицензии',
  description:
    'Каталог объявлений: горнодобывающие лицензии, участки разведки и минеральные проявления Казахстана.',
  openGraph: {
    title: 'Объявления — месторождения и лицензии | QAZNEDR.KZ',
    description:
      'Каталог объявлений: горнодобывающие лицензии, участки разведки и минеральные проявления Казахстана.',
    type: 'website',
    siteName: 'QAZNEDR.KZ',
  },
  twitter: {
    card: 'summary',
    title: 'Объявления — месторождения и лицензии | QAZNEDR.KZ',
    description:
      'Каталог объявлений: горнодобывающие лицензии, участки разведки и минеральные проявления Казахстана.',
  },
};

export default function ListingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
