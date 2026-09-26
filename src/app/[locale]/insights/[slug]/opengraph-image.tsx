import { ImageResponse } from 'next/og';
import { OG_FONTS } from '@/lib/seo/og-fonts';
import { translate } from '@/lib/i18n/translations';
import { getArticle } from '@/lib/insights/content';
import { INSIGHTS, findInsight } from '@/lib/insights/registry';
import { OG_ALT, OG_SIZE } from '@/lib/seo/og';
import { ogCard } from '@/lib/seo/og-card';
import { toLocale } from '@/lib/seo/site';

// Built with the article pages: one card per written language of a guide.
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return INSIGHTS.flatMap((entry) =>
    entry.locales.map((locale) => ({ locale, slug: entry.slug }))
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = toLocale(raw);
  const entry = findInsight(slug);
  const article = entry && raw === locale ? getArticle(slug, locale) : null;
  if (!entry || !article) return new Response('Not found', { status: 404 });
  const category = translate(locale, `insights.categories.${entry.category}`);
  return new ImageResponse(
    ogCard({
      eyebrow: `${category} · ${translate(locale, 'insights.eyebrow')}`,
      title: article.title,
      footer: 'QAZNEDR HOLDING · qaznedr.kz',
    }),
    { ...OG_SIZE, fonts: OG_FONTS }
  );
}
