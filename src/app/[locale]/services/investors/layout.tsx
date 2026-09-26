import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Услуги для инвесторов в недропользование',
  description:
    'Инвестиционные услуги в области недропользования Казахстана: due diligence, оценка проектов, проектное финансирование и сопровождение сделок с месторождениями и лицензиями.',
};

export default function ServicesInvestorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
