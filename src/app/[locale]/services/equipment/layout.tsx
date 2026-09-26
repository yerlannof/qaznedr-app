import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Аренда горного и бурового оборудования',
  description:
    'Аренда и покупка бурового, горного и лабораторного оборудования в Казахстане. Буровые установки, спецтехника и приборы для геологоразведки от проверенных поставщиков.',
};

export default function ServicesEquipmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
