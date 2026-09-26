import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Геологические услуги и разведка',
  description:
    'Геологоразведочные услуги в Казахстане: бурение скважин, геофизические исследования, опробование, подсчёт запасов и геологическое моделирование месторождений.',
};

export default function ServicesGeologicalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
