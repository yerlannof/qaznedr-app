import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MessageCircle, ShieldCheck, Video } from 'lucide-react';
import ShowcaseWhatsAppLink from '@/components/showcase/ShowcaseWhatsAppLink';
import { translate } from '@/lib/i18n/translations';
import { whatsappLink, type ContactConfig } from '@/lib/config/contacts';
import { formatRightsDate, pickText } from '@/lib/leads/showcase';
import { formatPrice, type AssetOffer } from '@/lib/offers/contract';
import type { Locale } from '@/lib/seo/site';

export function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** An operating asset for sale in the unified catalogue (approved design 18). */
export default function OfferCard({
  offer,
  locale,
  contacts,
}: {
  offer: AssetOffer;
  locale: Locale;
  contacts: ContactConfig;
}) {
  const t = (key: string, params?: Record<string, unknown>) =>
    translate(locale, key, params);
  const pick = (v: Parameters<typeof pickText>[0]) => pickText(v, locale);
  const { code } = offer;
  const detailHref = `/${locale}/offers/${code}`;
  const badge = pick(offer.badge);
  const title = pick(offer.title);
  const summary = pick(offer.summary_line);
  const cardLine = pick(offer.rights.card_line);
  const basis = pick(offer.rights.basis);
  const waText = pick(offer.whatsapp_text).text;
  const useWhatsApp = locale !== 'zh' && contacts.whatsappNumber;
  const cover = offer.video
    ? {
        src: offer.video.poster,
        width: offer.video.width,
        height: offer.video.height,
      }
    : offer.images[0]
      ? {
          src: offer.images[0].url,
          width: offer.images[0].width,
          height: offer.images[0].height,
        }
      : null;
  return (
    <article
      id={code}
      className="grid gap-x-10 gap-y-4 border-b border-brand-line py-8 md:grid-cols-[minmax(0,1fr)_340px] lg:py-10"
    >
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-3 text-sm">
          <span className="bg-brand-accent px-2 py-0.5 font-semibold tracking-wide text-brand-slate">
            {code}
          </span>
          <span
            lang={badge.lang}
            className="border border-brand-line px-2 py-0.5"
          >
            {badge.text}
          </span>
        </p>
        <h2
          lang={title.lang}
          className="mt-3 text-xl font-semibold leading-snug"
        >
          {title.text}
        </h2>
        <p lang={summary.lang} className="mt-2 text-brand-muted">
          {summary.text}
        </p>
        <dl className="mt-4 grid border-t border-brand-line sm:grid-cols-3">
          {offer.key_figures.map((fig, i) => {
            const value = pick(fig.value);
            const label = pick(fig.label);
            return (
              <div
                key={i}
                className={`flex items-baseline gap-3 border-brand-line py-2.5 sm:flex-col-reverse sm:items-stretch sm:gap-0 sm:py-3 ${i ? 'border-t sm:border-l sm:border-t-0 sm:pl-4' : 'sm:pr-3'}`}
              >
                <dt
                  lang={label.lang}
                  className="order-2 text-sm leading-snug text-brand-muted sm:order-none sm:mt-1"
                >
                  {label.text}
                </dt>
                <dd
                  lang={value.lang}
                  className="order-1 m-0 shrink-0 font-serif text-xl leading-tight sm:order-none sm:text-2xl"
                >
                  {value.text}
                </dd>
              </div>
            );
          })}
        </dl>
        {offer.price && (
          <p className="mt-3 font-semibold">
            {t('offer.price', { price: formatPrice(offer.price, locale) })}
          </p>
        )}
        <div className="mt-3 flex gap-2 text-sm text-brand-muted">
          <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
          <div>
            <p lang={cardLine.lang}>{cardLine.text}</p>
            <p lang={basis.lang}>
              {t('offer.rightsChecked', {
                date: formatRightsDate(offer.rights.checked_at),
                basis: basis.text,
              })}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {useWhatsApp ? (
            <ShowcaseWhatsAppLink
              href={whatsappLink(contacts.whatsappNumber!, waText)}
              label={t('offer.cta', { code })}
              locale={locale}
              code={code}
            />
          ) : (
            <Link
              href={`${detailHref}#contact`}
              className="brand-button brand-focus w-full sm:w-auto"
            >
              <MessageCircle aria-hidden className="size-4" />
              {t('offer.cta', { code })}
            </Link>
          )}
          <Link
            href={detailHref}
            className="brand-focus inline-flex min-h-11 items-center gap-2 underline underline-offset-4"
          >
            {t('offer.more')}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
      {cover && (
        <Link
          href={detailHref}
          className="brand-focus relative block self-start overflow-hidden border border-brand-line md:order-none"
        >
          <Image
            src={cover.src}
            width={cover.width}
            height={cover.height}
            alt=""
            unoptimized
            sizes="(max-width: 768px) 100vw, 340px"
            className="block aspect-[16/10] h-auto w-full object-cover"
          />
          <span className="absolute bottom-0 left-0 flex items-center gap-1.5 bg-brand-slate/90 px-2 py-1 text-xs text-[#E9ECE6]">
            {offer.video && <Video aria-hidden className="size-3.5" />}
            {offer.video
              ? `${t('offer.videoBadge', { duration: formatDuration(offer.video.duration_s) })} · ${t('offer.photoCredit')}`
              : t('offer.photoCredit')}
          </span>
        </Link>
      )}
    </article>
  );
}
