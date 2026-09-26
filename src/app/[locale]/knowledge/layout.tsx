import type { Metadata } from 'next';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, '/knowledge', 'knowledge');
}

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
