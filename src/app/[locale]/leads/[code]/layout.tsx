import type { Metadata } from 'next';
import { getPublishedLeadByCode } from '@/lib/leads/public-queries';
import { translate } from '@/lib/i18n/translations';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { leadSeoText } from '@/lib/seo/lead-metadata';
import { parseShowcase } from '@/lib/leads/showcase';
import { showcaseSeoText } from '@/lib/seo/showcase-seo';
import { toLocale } from '@/lib/seo/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, code } = await params;
  const locale = toLocale(rawLocale);
  const lead = await getPublishedLeadByCode(code);
  if (!lead) {
    return {
      title: translate(locale, 'seo.lead.notFound'),
      robots: { index: false, follow: false },
    };
  }
  const showcase = parseShowcase(lead.showcase);
  const { title, description } = showcase
    ? showcaseSeoText(showcase, locale)
    : leadSeoText(lead, locale);
  return buildPageMetadata({
    locale,
    path: `/leads/${lead.code}`,
    title,
    description,
  });
}

export default function LeadDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
