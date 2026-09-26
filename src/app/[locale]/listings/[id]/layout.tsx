import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = 'https://qaznedr.kz';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;

  try {
    const supabase = await createClient();
    const { data: deposit } = await supabase
      .from('kazakhstan_deposits')
      .select('title, description, mineral, region, type, status')
      .eq('id', id)
      .single();

    if (!deposit || (deposit as any).status !== 'ACTIVE') {
      return {
        title: 'Объявление не найдено | QAZNEDR.KZ',
        robots: { index: false, follow: false },
      };
    }

    const title = (deposit as any).title as string;
    const description = (((deposit as any).description as string) || '').slice(
      0,
      160
    );
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
