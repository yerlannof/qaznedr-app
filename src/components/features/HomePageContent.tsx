'use client';

import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import LeadsHomeHero from '@/components/features/LeadsHomeHero';
import PortalWelcomeHero from '@/components/features/PortalWelcomeHero';
import { useTranslation } from '@/hooks/useTranslation';

export default function HomePageContent() {
  const { locale } = useTranslation();

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'QAZNEDR HOLDING',
    url: 'https://qaznedr.kz',
    description:
      'Kazakhstan mineral exploration holding: prepared free subsoil areas and licensing/deal support for investors.',
    areaServed: { '@type': 'Country', name: 'Kazakhstan' },
    knowsAbout: [
      'Mineral exploration in Kazakhstan',
      'Subsoil use licensing',
      'Gold',
      'Copper',
      'Zinc',
      'Tin',
      'Nickel',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      url: 'https://qaznedr.kz/en/contact',
      availableLanguage: ['ru', 'kk', 'en', 'zh'],
    },
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'QAZNEDR HOLDING',
    url: 'https://qaznedr.kz',
    inLanguage: ['ru', 'kk', 'en', 'zh-CN'],
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <Navigation />

      <PortalWelcomeHero locale={locale} />

      <LeadsHomeHero locale={locale} />

      <Footer />
    </div>
  );
}
