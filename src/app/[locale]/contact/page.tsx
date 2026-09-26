import type { Metadata } from 'next';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import ContactChannels from '@/components/features/ContactChannels';
import InquiryForm from '@/components/features/InquiryForm';
import { getContactConfig } from '@/lib/config/contacts';
import { getServerTranslation } from '@/lib/i18n/translations';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, '/contact', 'contact');
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getServerTranslation(locale);
  const config = getContactConfig();

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-16 lg:pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-tight text-gray-900 dark:text-gray-50">
            {t('contact.title')}
          </h1>
          <p className="mt-3 max-w-2xl text-gray-600 dark:text-gray-400">
            {t('contact.subtitle')}
          </p>
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ContactChannels config={config} locale={locale} />
            <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="font-serif text-xl text-gray-900 dark:text-gray-100 mb-4">
                {t('contact.formTitle')}
              </h2>
              <InquiryForm locale={locale} />
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
