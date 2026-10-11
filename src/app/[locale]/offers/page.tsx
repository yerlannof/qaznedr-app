import { permanentRedirect } from 'next/navigation';
import { toLocale } from '@/lib/seo/site';

/** There is no separate assets index: the catalogue filter is the list. */
export default async function OffersIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = toLocale((await params).locale);
  permanentRedirect(`/${locale}/leads?kind=asset`);
}
