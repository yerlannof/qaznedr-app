import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import ContactChannels from '@/components/features/ContactChannels';
import InquiryForm from '@/components/features/InquiryForm';
import { getContactConfig, hasAnyChannel } from '@/lib/config/contacts';
import { getServerTranslation } from '@/lib/i18n/translations';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';
import { getServiceTopic } from '@/lib/services/topics';
import { SITE_NAME, SITE_URL, localeUrl, toLocale } from '@/lib/seo/site';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, '/contact', 'contact');
}
export default async function ContactPage({ params, searchParams }: Props) {
  const locale = toLocale((await params).locale);
  const { t } = getServerTranslation(locale);
  const config = getContactConfig();
  const topic = getServiceTopic((await searchParams)?.service);
  const subject = topic ? t(`holdingServices.${topic}.title`) : '';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: t('contact.title'),
    url: localeUrl(locale, '/contact'),
    mainEntity: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };
  return (
    <>
      <Navigation serviceTopic={topic} />
      <div className="bg-brand-bg text-brand-ink pt-20 lg:pt-24">
        <div className="brand-container py-12 lg:py-20">
          <header className="max-w-3xl">
            <h1 className="holding-title">{t('contact.title')}</h1>
            <p className="holding-lead mt-6">{t('contact.subtitle')}</p>
          </header>
          {topic && (
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-brand-line py-4">
              <p>
                <span className="text-brand-muted">
                  {t('navigation.services')} ·{' '}
                </span>
                {subject}
              </p>
              <Link
                className="brand-focus inline-flex min-h-11 items-center underline underline-offset-4"
                href={`/${locale}/contact`}
              >
                {t('leadsCatalog.reset')}
              </Link>
            </div>
          )}
          <div
            className={`mt-12 grid gap-10 ${hasAnyChannel(config) ? 'lg:grid-cols-2' : 'max-w-2xl'}`}
          >
            {hasAnyChannel(config) && (
              <section aria-labelledby="channels-heading">
                <h2 id="channels-heading" className="mb-6 font-serif text-3xl">
                  {t('contact.channelsHeading')}
                </h2>
                <ContactChannels
                  key={`${locale}-${topic ?? ''}`}
                  config={config}
                  locale={locale}
                  serviceTopic={topic}
                />
              </section>
            )}
            <section className="border-t border-brand-line pt-6">
              <h2 className="mb-6 font-serif text-3xl">
                {t('contact.formTitle')}
              </h2>
              <InquiryForm
                key={`${locale}-${topic ?? ''}`}
                locale={locale}
                initialMessage={subject}
              />
            </section>
          </div>
        </div>
      </div>
      <Footer serviceTopic={topic} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
        }}
      />
    </>
  );
}
