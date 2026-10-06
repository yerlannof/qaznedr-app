import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import { SERVICE_TOPICS, type ServiceTopic } from '@/lib/services/topics';
import { breadcrumbJsonLd } from '@/lib/seo/article-jsonld';
import { localeUrl, SITE_NAME, SITE_URL, type Locale } from '@/lib/seo/site';
import {
  guideContactHref,
  guideServiceHref,
  type ServicePath,
} from '@/lib/insights/contact-context';

const detailPath: Partial<Record<ServiceTopic, ServicePath>> = {
  licensing: '/services/legal',
  geology: '/services/geological',
};

export function ServiceSchemas({
  locale,
  path,
  topics,
}: {
  locale: Locale;
  path: string;
  topics: readonly ServiceTopic[];
}) {
  const t = (key: string) => translate(locale, key);
  const crumbs = [
    { name: t('navigation.home'), url: localeUrl(locale) },
    { name: t('navigation.services'), url: localeUrl(locale, '/services') },
  ];
  if (path !== '/services') {
    const topic = topics[0];
    crumbs.push({
      name: t(`holdingServices.${topic}.title`),
      url: localeUrl(locale, path),
    });
  }
  const schemas = [
    ...topics.map((topic) => ({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: t(`holdingServices.${topic}.title`),
      description: t(`holdingServices.${topic}.description`),
      provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      url: localeUrl(locale, detailPath[topic] ?? `/services#${topic}`),
    })),
    breadcrumbJsonLd(crumbs),
  ];
  return schemas.map((schema, index) => (
    <script
      key={index}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
      }}
    />
  ));
}

export function ServiceDetail({
  locale,
  topic,
  guideSlug,
}: {
  locale: Locale;
  topic: ServiceTopic;
  guideSlug?: string;
}) {
  const t = (key: string) => translate(locale, key);
  return (
    <div className="grid gap-8 border-y border-brand-line py-8 md:grid-cols-2 md:gap-12">
      <p className="text-lg leading-relaxed text-brand-ink">
        {t(`holdingServices.${topic}.description`)}
      </p>
      <div className="flex flex-col items-start gap-6">
        <p className="text-base leading-relaxed text-brand-muted">
          {t(`holdingServices.${topic}.deliverable`)}
        </p>
        <Link
          href={guideContactHref(locale, guideSlug, topic)}
          className="brand-button brand-focus"
        >
          {t('navigation.contact')}{' '}
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </div>
  );
}

export default function HoldingServices({
  locale,
  guideSlug,
}: {
  locale: Locale;
  guideSlug?: string;
}) {
  const t = (key: string) => translate(locale, key);
  return (
    <div className="divide-y divide-brand-line border-y border-brand-line">
      {SERVICE_TOPICS.map((topic) => (
        <section
          id={topic}
          key={topic}
          className="grid scroll-mt-24 gap-5 py-8 md:grid-cols-2 md:gap-12 lg:py-12"
        >
          <div>
            <p className="text-xs font-semibold tabular-nums text-brand-muted">
              {String(SERVICE_TOPICS.indexOf(topic) + 1).padStart(2, '0')}
            </p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-brand-ink">
              {t(`holdingServices.${topic}.title`)}
            </h2>
          </div>
          <div>
            <p className="text-base leading-relaxed text-brand-ink">
              {t(`holdingServices.${topic}.description`)}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-brand-muted">
              {t(`holdingServices.${topic}.deliverable`)}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href={guideContactHref(locale, guideSlug, topic)}
                className="brand-button brand-focus"
              >
                {t('navigation.contact')}{' '}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
              {detailPath[topic] && (
                <Link
                  href={guideServiceHref(locale, detailPath[topic], guideSlug)}
                  className="brand-focus inline-flex min-h-11 items-center font-semibold text-brand-ink underline underline-offset-4"
                >
                  {t(`holdingServices.${topic}.title`)}
                </Link>
              )}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
