import Image from 'next/image';
import { keepWords } from '@/lib/i18n/keep-words';
import Link from 'next/link';
import { translate } from '@/lib/i18n/translations';
import { MINERAL_HUBS, hubMineralName } from '@/lib/leads/minerals';
import { leadMineralName } from '@/lib/seo/lead-metadata';
import { SPECIMENS } from '@/lib/brand/photos';
import type { Locale } from '@/lib/seo/site';

/** Commodity rail: specimen illustrations linking to the mineral hubs. */
export default function HomeMinerals({ locale }: { locale: Locale }) {
  const t = (key: string) => translate(locale, key);
  const items = [
    ...MINERAL_HUBS.map((hub) => ({
      key: hub.slug,
      name: hubMineralName(hub.slug, locale),
      symbol: hub.symbols.join(' '),
      href: `/${locale}/minerals/${hub.slug}`,
      src: SPECIMENS[hub.slug],
    })),
    {
      key: 'coal',
      name: leadMineralName('COAL', locale),
      symbol: 'C',
      href: `/${locale}/leads?commodity=coal`,
      src: SPECIMENS.coal,
    },
  ];
  return (
    <section
      className="holding-section holding-dark"
      aria-labelledby="home-minerals"
    >
      <div className="brand-container">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 mb-10 lg:mb-14">
          <div>
            <span className="holding-eyebrow">
              {t('homeV2.mineralsEyebrow')}
            </span>
            <h2 id="home-minerals" className="holding-title mt-4">
              {keepWords(t('homeV2.mineralsTitle'), locale)}
            </h2>
          </div>
          <p className="text-sm text-brand-muted">{t('homeV2.mineralsNote')}</p>
        </div>
        <ul className="-mx-5 md:mx-0 flex md:grid md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-pl-5 px-5 md:px-0 pb-2 md:pb-0 [scrollbar-width:none]">
          {items.map((item) => (
            <li
              key={item.key}
              className="shrink-0 basis-[62%] sm:basis-[40%] md:basis-auto snap-start"
            >
              <Link href={item.href} className="group grid gap-3">
                <span className="photo-tile block aspect-[3/4]">
                  <Image
                    src={item.src}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 62vw, (max-width: 1023px) 25vw, 180px"
                    className="object-cover"
                  />
                </span>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-serif text-xl">{item.name}</span>
                  <span className="text-xs text-brand-muted">
                    {item.symbol}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
