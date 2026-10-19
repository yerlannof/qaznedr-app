import Image from 'next/image';
import { keepWords } from '@/lib/i18n/keep-words';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import { SCENES } from '@/lib/brand/photos';
import type { ServiceTopic } from '@/lib/services/topics';
import type { Locale } from '@/lib/seo/site';

const TILES: { topic: ServiceTopic; path: string; src: string }[] = [
  { topic: 'licensing', path: '/services/legal', src: SCENES.mapDesk },
  {
    topic: 'due-diligence',
    path: '/services#due-diligence',
    src: SCENES.coreStore,
  },
  { topic: 'geology', path: '/services/geological', src: SCENES.fieldCamp },
];

/** Three photo-led service tiles; analytics stays a text link. */
export default function HomeServices({ locale }: { locale: Locale }) {
  const t = (key: string) => translate(locale, key);
  return (
    <section className="holding-section" aria-labelledby="home-services">
      <div className="brand-container">
        <span className="holding-eyebrow">{t('navigation.services')}</span>
        <h2
          id="home-services"
          className="holding-title mt-4 mb-10 lg:mb-14 max-w-[18ch]"
        >
          {keepWords(t('homeV2.servicesTitle'), locale)}
        </h2>
        <ul className="grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
          {TILES.map((tile) => (
            <li key={tile.topic}>
              <Link
                href={`/${locale}${tile.path}`}
                className="group grid gap-4"
              >
                <span className="photo-tile block aspect-[16/11]">
                  <Image
                    src={tile.src}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <span className="photo-chip">{t('homeV2.illustration')}</span>
                </span>
                <span className="flex items-start justify-between gap-4">
                  <span className="font-serif text-2xl lg:text-[28px] leading-tight">
                    {t(`holdingServices.${tile.topic}.title`)}
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className="mt-1 size-5 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </span>
                <span className="text-brand-muted leading-relaxed">
                  {t(`holdingServices.${tile.topic}.description`)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={`/${locale}/services#analytics`}
          className="mt-10 inline-flex min-h-11 items-center gap-2 border-b border-brand-ink font-medium"
        >
          {t('holdingServices.analytics.title')}
          <ArrowUpRight aria-hidden className="size-4" />
        </Link>
      </div>
    </section>
  );
}
