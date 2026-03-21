import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Обучение — курсы по геологии и недропользованию | QAZNEDR.KZ',
  description:
    'Образовательные программы, курсы и вебинары для специалистов геологической отрасли Казахстана.',
  openGraph: {
    title: 'Обучение — курсы по геологии и недропользованию | QAZNEDR.KZ',
    description:
      'Образовательные программы, курсы и вебинары для специалистов геологической отрасли Казахстана.',
    type: 'website',
    siteName: 'QAZNEDR.KZ',
  },
  twitter: {
    card: 'summary',
    title: 'Обучение QAZNEDR',
    description: 'Курсы по геологии и недропользованию Казахстана',
  },
};

export default function EducationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
