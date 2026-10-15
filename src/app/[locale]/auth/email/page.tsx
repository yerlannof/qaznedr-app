import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import EmailLinkConfirm from '@/components/equipment/EmailLinkConfirm';
import { emailLinkEnabled, safeCallbackPath } from '@/lib/auth/email-link';
import { translate } from '@/lib/i18n/translations';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { toLocale } from '@/lib/seo/site';

export const dynamic = 'force-dynamic';
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  return {
    ...buildPageMetadata({
      locale,
      path: '/auth/email',
      title: translate(locale, 'marketplaceSignIn.metaTitle'),
      description: translate(locale, 'marketplaceSignIn.metaDescription'),
      noindex: true,
    }),
    robots: { index: false, follow: false },
  };
}

export default async function EmailLinkPage({ params, searchParams }: Props) {
  if (!emailLinkEnabled()) notFound();
  const locale = toLocale((await params).locale);
  const { next } = await searchParams;
  return (
    <>
      <Navigation />
      <main className="bg-brand-bg pt-20 text-brand-ink lg:pt-24">
        <EmailLinkConfirm
          locale={locale}
          next={safeCallbackPath(locale, Array.isArray(next) ? next[0] : next)}
        />
      </main>
      <Footer />
    </>
  );
}
