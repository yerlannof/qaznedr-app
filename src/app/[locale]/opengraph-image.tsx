import { ImageResponse } from 'next/og';
import { OG_FONTS } from '@/lib/seo/og-fonts';
import { OG_ALT, OG_SIZE, ogHomeTitle } from '@/lib/seo/og';
import { ogCard } from '@/lib/seo/og-card';
import { toLocale } from '@/lib/seo/site';

export const runtime = 'nodejs';
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return new ImageResponse(
    ogCard({
      eyebrow: 'QAZNEDR HOLDING',
      title: ogHomeTitle(toLocale(locale)),
      footer: 'qaznedr.kz',
    }),
    { ...OG_SIZE, fonts: OG_FONTS }
  );
}
