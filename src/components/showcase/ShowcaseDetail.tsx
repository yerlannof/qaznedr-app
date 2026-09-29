import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import ContactChannels from '@/components/features/ContactChannels';
import HeadlineBlock from './HeadlineBlock';
import ScanFigure from './ScanFigure';
import ShowcaseDisclaimer from './ShowcaseDisclaimer';
import ZoneMap from './ZoneMap';
import { translate } from '@/lib/i18n/translations';
import type { ContactConfig } from '@/lib/config/contacts';
import {
  commodityLabel,
  formatRightsDate,
  pickList,
  pickText,
  type Showcase,
} from '@/lib/leads/showcase';
import { showcaseRegionId } from '@/lib/leads/showcase-regions';
import type { Locale } from '@/lib/seo/site';

const h2 = 'font-serif text-2xl lg:text-3xl leading-tight';
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Full showcase card page body (approved review 14 layout). */
export default function ShowcaseDetail({
  showcase: card,
  locale,
  contacts,
}: {
  showcase: Showcase;
  locale: Locale;
  contacts: ContactConfig;
}) {
  const t = (key: string, params?: Record<string, unknown>) =>
    translate(locale, key, params);
  const code = card.card_id;
  const oblast = pickText(card.oblast, locale);
  const objectType = card.object_type
    ? pickText(card.object_type, locale)
    : null;
  const headline = pickText(card.headline, locale);
  const facts = pickList(card.facts, locale);
  const rights = pickText(card.rights.status, locale);
  const source = card.source ? pickText(card.source, locale) : null;
  return (
    <div className="brand-container pb-12 lg:pb-20">
      <nav
        aria-label={t('navigation.home')}
        className="flex flex-wrap items-center gap-3 py-6 text-sm text-brand-muted"
      >
        <Link
          className="brand-focus min-h-11 inline-flex items-center underline underline-offset-4"
          href={`/${locale}/leads`}
        >
          {t('leadDetail.breadcrumbLeads')}
        </Link>
        <span aria-hidden>/</span>
        <span>{code}</span>
      </nav>
      <p className="text-sm uppercase tracking-wider text-brand-muted">
        {code}
        {objectType && (
          <>
            {' · '}
            <span lang={objectType.lang}>{capitalize(objectType.text)}</span>
          </>
        )}
      </p>
      <h1 className="holding-title mt-3 max-w-4xl">
        {commodityLabel(card.commodity, locale)} —{' '}
        <span lang={oblast.lang}>{oblast.text}</span>
      </h1>
      <div className="mt-8 grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <HeadlineBlock
            text={headline.text}
            lang={headline.lang}
            type={card.headline_type}
            size="lg"
          />
          <ul lang={facts.lang} className="mt-3">
            {facts.items.map((fact) => (
              <li
                key={fact}
                className="border-t border-brand-line py-2.5 leading-relaxed"
              >
                {fact}
              </li>
            ))}
          </ul>
          <h2 className={`${h2} mt-10`}>{t('showcase.scansHeading')}</h2>
          <div className="mt-5 grid gap-6">
            {card.images.map((img) => {
              const caption = pickText(img.caption, locale);
              return (
                <ScanFigure
                  key={img.url}
                  url={img.url}
                  v={img.v}
                  width={img.width}
                  height={img.height}
                  caption={caption.text}
                  captionLang={caption.lang}
                  openLabel={t('showcase.openScan')}
                />
              );
            })}
          </div>
          {source && (
            <p lang={source.lang} className="mt-4 text-sm text-brand-muted">
              {source.text}
            </p>
          )}
          <h2 className={`${h2} mt-10`}>{t('leadDetail.locationHeading')}</h2>
          <figure className="m-0 mt-5">
            <ZoneMap
              zones={[card.zone]}
              highlight={showcaseRegionId(card.oblast.ru)}
              view="region"
              label={t('showcase.cardMapLabel', { oblast: oblast.text })}
              className="border border-brand-line bg-brand-bg"
            />
            <figcaption className="mt-2 text-sm text-brand-muted">
              {t('showcase.detailMapCaption')}
              <span className="mt-1 block text-xs">
                {t('showcase.mapCredit')}
              </span>
            </figcaption>
          </figure>
        </div>
        <aside className="space-y-4">
          <section className="border border-brand-line bg-brand-surface p-5">
            <h2 className="font-semibold">{t('showcase.rightsHeading')}</h2>
            <div className="mt-3 flex gap-2 text-sm">
              <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
              <div>
                <p lang={rights.lang}>{rights.text}</p>
                <p className="mt-1 text-brand-muted">
                  {t('showcase.rightsChecked', {
                    date: formatRightsDate(card.rights.checked_at),
                  })}
                </p>
              </div>
            </div>
          </section>
          <section
            id="contact"
            className="scroll-mt-24 border border-brand-line bg-brand-surface p-5"
          >
            <h2 className="font-semibold">{t('showcase.contactHeading')}</h2>
            <p className="mt-2 mb-4 text-sm text-brand-muted">
              {t('showcase.contactNote')}
            </p>
            <ContactChannels
              config={contacts}
              locale={locale}
              leadCode={code}
            />
          </section>
        </aside>
      </div>
      <ShowcaseDisclaimer locale={locale} />
    </div>
  );
}
