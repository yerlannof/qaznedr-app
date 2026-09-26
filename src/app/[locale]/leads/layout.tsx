import type { Metadata } from 'next';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, '/leads', 'leads');
}

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
