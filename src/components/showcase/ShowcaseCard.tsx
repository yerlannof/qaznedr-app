import Link from 'next/link';
import { ArrowRight, MessageCircle, ShieldCheck } from 'lucide-react';
import HeadlineBlock from './HeadlineBlock';
import ScanFigure from './ScanFigure';
import ShowcaseWhatsAppLink from './ShowcaseWhatsAppLink';
import ZoneMap from './ZoneMap';
import { translate } from '@/lib/i18n/translations';
import { whatsappLink, type ContactConfig } from '@/lib/config/contacts';
import {
  commodityLabel,
  formatRightsDate,
  pickList,
  pickText,
  type Showcase,
} from '@/lib/leads/showcase';
import { showcaseRegionId } from '@/lib/leads/showcase-regions';
import type { Locale } from '@/lib/seo/site';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** One showcase card in the list: number, caveats, rights, contact, scheme, scan. */
export default function ShowcaseCard({
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
  const satellite = card.satellite ? pickList(card.satellite, locale) : null;
  const scan = card.images[0];
  const detailHref = `/${locale}/leads/${code}`;
  const waText = pickText(card.whatsapp_text, locale).text;
  const useWhatsApp = locale !== 'zh' && contacts.whatsappNumber;
  return (
    <article
      id={code}
      className="grid gap-x-10 gap-y-4 border-b border-brand-line py-8 md:grid-cols-[minmax(0,1fr)_340px] lg:py-10"
    >
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-3 text-sm">
          <span className="bg-brand-accent px-2 py-0.5 font-semibold tracking-wide text-brand-slate">
            {code}
          </span>
          <h2 className="font-semibold">
            {commodityLabel(card.commodity, locale, card.commodity_ru)}
          </h2>
        </p>
        <p className="mt-2 text-brand-muted">
          <span lang={oblast.lang}>{oblast.text}</span>
          {objectType && (
            <>
              {' · '}
              <span lang={objectType.lang}>{capitalize(objectType.text)}</span>
            </>
          )}
        </p>
        <div className="mt-4">
          <HeadlineBlock
            text={headline.text}
            lang={headline.lang}
            type={card.headline_type}
          />
        </div>
        <ul lang={facts.lang} className="mt-3">
          {facts.items.map((fact) => (
            <li
              key={fact}
              className="border-t border-brand-line py-2 text-[15px] leading-relaxed"
            >
              {fact}
            </li>
          ))}
        </ul>
        {satellite && satellite.items.length > 0 && (
          <ul lang={satellite.lang}>
            {satellite.items.map((line) => (
              <li
                key={line}
                className="border-t border-brand-line py-2 text-[15px] leading-relaxed"
              >
                {line}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex gap-2 text-sm text-brand-muted">
          <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
          <div>
            <p lang={rights.lang}>{rights.text}</p>
            <p>
              {t('showcase.rightsChecked', {
                date: formatRightsDate(card.rights.checked_at),
              })}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {useWhatsApp ? (
            <ShowcaseWhatsAppLink
              href={whatsappLink(contacts.whatsappNumber!, waText)}
              label={t('showcase.whatsappCta', { code })}
              locale={locale}
              code={code}
            />
          ) : (
            <Link
              href={`${detailHref}#contact`}
              className="brand-button brand-focus w-full sm:w-auto"
            >
              <MessageCircle aria-hidden className="size-4" />
              {t('showcase.wechatCta', { code })}
            </Link>
          )}
          <Link
            href={detailHref}
            className="brand-focus inline-flex min-h-11 items-center gap-2 underline underline-offset-4"
          >
            {t('showcase.more')}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
      <figure className="m-0 md:row-span-1">
        <ZoneMap
          zones={[card.zone]}
          highlight={showcaseRegionId(card.oblast.ru)}
          view="region"
          label={t('showcase.cardMapLabel', { oblast: oblast.text })}
          className="border border-brand-line bg-brand-bg"
        />
        <figcaption className="mt-2 text-sm text-brand-muted">
          {t('showcase.cardMapCaption', { oblast: oblast.text })}
        </figcaption>
      </figure>
      {scan && (
        <div className="md:col-span-2">
          <ScanFigure
            url={scan.url}
            v={scan.v}
            width={scan.width}
            height={scan.height}
            caption={pickText(scan.caption, locale).text}
            captionLang={pickText(scan.caption, locale).lang}
            openLabel={t('showcase.openScan')}
          />
        </div>
      )}
    </article>
  );
}
