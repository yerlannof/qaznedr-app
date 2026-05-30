'use client';

import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import { Search, FileText, Handshake } from 'lucide-react';
import LeadsHomeHero from '@/components/features/LeadsHomeHero';
import PortalWelcomeHero from '@/components/features/PortalWelcomeHero';
import AudienceSection from '@/components/features/AudienceSection';
import { useTranslation } from '@/hooks/useTranslation';

export default function Home() {
  const { t, locale } = useTranslation();

  const steps = [
    {
      step: '01',
      icon: Search,
      title: t('home.stepRegisterTitle'),
      desc: t('home.stepRegisterDesc'),
    },
    {
      step: '02',
      icon: FileText,
      title: t('home.stepPostTitle'),
      desc: t('home.stepPostDesc'),
    },
    {
      step: '03',
      icon: Handshake,
      title: t('home.stepPartnerTitle'),
      desc: t('home.stepPartnerDesc'),
    },
  ];

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'QAZNEDR',
    url: 'https://qaznedr.kz',
    description: 'Платформа геологической отрасли Казахстана',
    foundingDate: '2025',
    areaServed: {
      '@type': 'Country',
      name: 'Kazakhstan',
    },
    sameAs: [],
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'QAZNEDR',
    url: 'https://qaznedr.kz',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://qaznedr.kz/ru/listings?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd),
        }}
      />
      <Navigation />

      <PortalWelcomeHero locale={locale} />

      <LeadsHomeHero locale={locale} />

      <AudienceSection locale={locale} />

      {/* How It Works */}
      <section className="py-16 bg-gray-50 dark:bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 text-center">
            {t('home.howItWorks')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {steps.map((item) => (
              <div
                key={item.step}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-[#141414]"
              >
                <div className="text-xs font-medium text-gray-400">
                  {item.step}
                </div>
                <item.icon className="w-5 h-5 text-gray-400 mt-3 mb-3" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
