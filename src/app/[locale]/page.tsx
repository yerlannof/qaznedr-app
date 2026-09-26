import { loadHomeSnapshot } from '@/lib/leads/home';
import { toLocale } from '@/lib/seo/site';
import type { Metadata } from 'next';
import HomePageContent from '@/components/features/HomePageContent';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, '', 'home', {
    absoluteTitle: true,
  });
}

export const dynamic = 'force-dynamic';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = toLocale((await params).locale);
  const snapshot = await loadHomeSnapshot();
  return <HomePageContent locale={locale} snapshot={snapshot} />;
}
