import type { Metadata } from 'next';
import {
  getPublishedLeadByCode,
  isWithdrawnShowcase,
} from '@/lib/leads/public-queries';
import { translate } from '@/lib/i18n/translations';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { leadSeoText } from '@/lib/seo/lead-metadata';
import { isShowcaseRow, parseShowcase } from '@/lib/leads/showcase';
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
  if (lead && isShowcaseRow(lead) && !parseShowcase(lead.showcase)) {
    return {
      title: translate(locale, 'seo.lead.notFound'),
      robots: { index: false, follow: false },
    };
  }
  if (!lead && (await isWithdrawnShowcase(code))) {
    return {
      title: translate(locale, 'showcase.withdrawn'),
      robots: { index: false, follow: false },
    };
  }
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
