import { Metadata } from 'next';
import { getPublishedLeadByCode } from '@/lib/leads/public-queries';

const BASE_URL = 'https://qaznedr.kz';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}): Promise<Metadata> {
  const { locale, code } = await params;
  const lead = await getPublishedLeadByCode(code);
  if (!lead) return { title: 'Наводка не найдена' };

  const title =
    lead.teaser_title ||
    `Золото · ${lead.region || 'Казахстан'} (${lead.code})`;
  const description = (
    lead.teaser_summary ||
    `Свободный золотоносный участок${lead.region ? `, ${lead.region}` : ''}. ${
      lead.grade_display ? `Содержание: ${lead.grade_display}. ` : ''
    }Проверенная наводка из госархива.`
  ).slice(0, 160);
  const url = `${BASE_URL}/${locale}/leads/${code}`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | QAZNEDR.KZ`,
      description,
      url,
      siteName: 'QAZNEDR.KZ',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | QAZNEDR.KZ`,
      description,
    },
    alternates: {
      canonical: url,
      languages: {
        ru: `${BASE_URL}/ru/leads/${code}`,
        en: `${BASE_URL}/en/leads/${code}`,
        kk: `${BASE_URL}/kz/leads/${code}`,
        zh: `${BASE_URL}/zh/leads/${code}`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default function LeadDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
