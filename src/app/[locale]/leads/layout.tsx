import { Metadata } from 'next';

const BASE_URL = 'https://qaznedr.kz';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const url = `${BASE_URL}/${locale}/leads`;
  const title = 'Свободные участки с золотом — закрытые геологические наводки';
  const description =
    'Каталог проверенных золотоносных участков Казахстана из госархивов: свободные по лицензии, с честными грейдами. Тизер открыт, полные данные — после заявки.';
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ru: `${BASE_URL}/ru/leads`,
        en: `${BASE_URL}/en/leads`,
        kk: `${BASE_URL}/kz/leads`,
        zh: `${BASE_URL}/zh/leads`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'QAZNEDR.KZ',
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
