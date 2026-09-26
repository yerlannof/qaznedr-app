import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Каталог услуг для недропользователей',
  description:
    'Полный каталог сервисных компаний и услуг в области недропользования Казахстана: бурение, геология, лабораторные анализы, оборудование и юридическое сопровождение.',
};

export default function ServicesCatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
