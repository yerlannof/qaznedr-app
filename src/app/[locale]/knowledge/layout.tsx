import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'База знаний',
  description:
    'Техническая документация, стандарты и регламенты недропользования Республики Казахстан.',
  openGraph: {
    title: 'База знаний | QAZNEDR.KZ',
    description:
      'Техническая документация, стандарты и регламенты недропользования Республики Казахстан.',
    type: 'website',
    siteName: 'QAZNEDR.KZ',
  },
  twitter: {
    card: 'summary',
    title: 'База знаний | QAZNEDR.KZ',
    description:
      'Техническая документация, стандарты и регламенты недропользования Республики Казахстан.',
  },
};

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
