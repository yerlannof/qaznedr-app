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

export default function Home() {
  return <HomePageContent />;
}
