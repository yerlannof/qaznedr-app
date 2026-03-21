import { Metadata } from 'next';
import { getPrisma } from '@/lib/prisma';

const BASE_URL = 'https://qaznedr.kz';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;

  try {
    const prisma = getPrisma();
    const deposit = await prisma.kazakhstanDeposit.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        mineral: true,
        region: true,
        type: true,
      },
    });

    if (!deposit) {
      return {
        title: 'Объявление не найдено',
      };
    }

    const title = deposit.title;
    const description = deposit.description.slice(0, 160);
    const url = `${BASE_URL}/${locale}/listings/${id}`;

    return {
      title,
      description,
      openGraph: {
        title: `${title} | QAZNEDR.KZ`,
        description,
        type: 'website',
        url,
        siteName: 'QAZNEDR.KZ',
        locale:
          locale === 'kz'
            ? 'kk_KZ'
            : locale === 'zh'
              ? 'zh_CN'
              : `${locale}_${locale === 'ru' ? 'KZ' : 'US'}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | QAZNEDR.KZ`,
        description,
      },
      alternates: {
        canonical: url,
        languages: {
          ru: `${BASE_URL}/ru/listings/${id}`,
          en: `${BASE_URL}/en/listings/${id}`,
          kk: `${BASE_URL}/kz/listings/${id}`,
          zh: `${BASE_URL}/zh/listings/${id}`,
        },
      },
    };
  } catch {
    return {
      title: 'QAZNEDR.KZ',
    };
  }
}

export default function ListingDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
