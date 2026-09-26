import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Юридические услуги в недропользовании',
  description:
    'Юридическое сопровождение в сфере недропользования Казахстана: оформление и продление лицензий, соблюдение требований законодательства, разрешения и сопровождение сделок.',
};

export default function ServicesLegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
