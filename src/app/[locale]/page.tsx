import { loadHomeSnapshot } from '@/lib/leads/home';
import { LOCALES, toLocale } from '@/lib/seo/site';
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

// Lead counts change only on import; regenerate at most every 5 minutes.
export const revalidate = 300;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = toLocale((await params).locale);
  const snapshot = await loadHomeSnapshot();
  return <HomePageContent locale={locale} snapshot={snapshot} />;
}
