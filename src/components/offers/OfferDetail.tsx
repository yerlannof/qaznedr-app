import Image from 'next/image';
import Link from 'next/link';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import ContactChannels from '@/components/features/ContactChannels';
import { translate } from '@/lib/i18n/translations';
import { hasAnyChannel, type ContactConfig } from '@/lib/config/contacts';
import { formatRightsDate, pickList, pickText } from '@/lib/leads/showcase';
import { formatPrice, mediaSrc, type AssetOffer } from '@/lib/offers/contract';
import type { Locale } from '@/lib/seo/site';

const h2 = 'font-serif text-2xl lg:text-3xl leading-tight';

/** Asset page body in the order of approved design 18. */
export default function OfferDetail({
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
  const badge = pick(offer.badge);
  const h1 = pick(offer.h1);
  const intro = pick(offer.intro);
  const reserveNote = pick(offer.reserve_note);
  const rights = pickList(offer.rights.items, locale);
  const basis = pick(offer.rights.basis);
  const nda = pickList(offer.nda_documents, locale);
  const legal = pick(offer.legal);
  const credit = pick(offer.media_credit);
  const assetsNote = offer.assets_note ? pick(offer.assets_note) : null;
  const caption = offer.video ? pick(offer.video.caption) : null;
  const contactNote = offer.contact_note
    ? pick(offer.contact_note).text
    : t('offer.contactNote');
  // Without a video the first photo leads the page.
  const heroImage = offer.video ? null : (offer.images[0] ?? null);
  const heroAlt = heroImage ? pick(heroImage.alt) : null;
  return (
    <div className="brand-container pb-12 lg:pb-20">
      <nav
        aria-label={t('navigation.home')}
        className="flex flex-wrap items-center gap-3 py-6 text-sm text-brand-muted"
      >
        <Link
          className="brand-focus inline-flex min-h-11 items-center underline underline-offset-4"
          href={`/${locale}/leads`}
        >
          {t('navigation.leads')}
        </Link>
        <span aria-hidden>/</span>
        <Link
          className="brand-focus inline-flex min-h-11 items-center underline underline-offset-4"
          href={`/${locale}/leads?kind=asset`}
        >
          {t('offer.breadcrumb')}
        </Link>
        <span aria-hidden>/</span>
        <span>{code}</span>
      </nav>

      <div
        className={`grid items-start gap-x-10 gap-y-8 ${
          offer.video || heroImage
            ? 'lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]'
            : 'max-w-3xl'
        }`}
      >
        <div className="lg:order-2">
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
          <h1 lang={h1.lang} className="holding-title mt-4">
            {h1.text}
          </h1>
          <p
            lang={intro.lang}
            className="mt-5 leading-relaxed text-brand-muted"
          >
            {intro.text}
          </p>
          {offer.price && (
            <p className="mt-5 font-serif text-2xl leading-tight">
              {t('offer.price', { price: formatPrice(offer.price, locale) })}
            </p>
          )}
          <a
            href="#contact"
            className="brand-button brand-focus mt-6 w-full sm:w-auto"
          >
            {t('offer.cta', { code })}
          </a>
        </div>
        {offer.video && (
          <figure className="m-0 lg:order-1">
            <video
              controls
              muted
              playsInline
              preload="none"
              poster={mediaSrc({ url: offer.video.poster, v: offer.video.v })}
              width={offer.video.width}
              height={offer.video.height}
              className="block aspect-video h-auto w-full bg-brand-slate"
            >
              <source src={mediaSrc(offer.video)} type="video/mp4" />
            </video>
            {caption && (
              <figcaption
                lang={caption.lang}
                className="mt-2 text-sm text-brand-muted"
              >
                {caption.text}
              </figcaption>
            )}
          </figure>
        )}
        {heroImage && heroAlt && (
          <figure className="m-0 lg:order-1">
            <Image
              src={heroImage.url}
              width={heroImage.width}
              height={heroImage.height}
              alt={heroAlt.text}
              unoptimized
              priority
              sizes="(max-width: 1024px) 100vw, 640px"
              className="block aspect-[4/3] h-auto w-full border border-brand-line object-cover"
            />
            <figcaption
              lang={credit.lang}
              className="mt-2 text-sm text-brand-muted"
            >
              {credit.text}
            </figcaption>
          </figure>
        )}
      </div>

      <div className="mt-12 grid gap-x-12 gap-y-10 border-t border-brand-line pt-8 lg:grid-cols-2">
        <section>
          <h2 className={h2}>{t('offer.keyFigures')}</h2>
          <table className="mt-5 w-full border-collapse text-[15px]">
            <tbody>
              {offer.facts_table.map((row, i) => {
                const label = pick(row.label);
                const value = pick(row.value);
                return (
                  <tr key={i} className="border-t border-brand-line align-top">
                    <th
                      lang={label.lang}
                      scope="row"
                      className="w-[46%] py-2.5 pr-4 text-left font-normal text-brand-muted"
                    >
                      {label.text}
                    </th>
                    <td lang={value.lang} className="py-2.5 font-semibold">
                      {value.text}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p lang={reserveNote.lang} className="mt-3 text-sm text-brand-muted">
            {reserveNote.text}
          </p>
        </section>
        <section>
          <h2 className={h2}>{t('offer.rightsHeading')}</h2>
          <ul lang={rights.lang} className="mt-5">
            {rights.items.map((line) => (
              <li
                key={line}
                className="flex gap-2 border-t border-brand-line py-2.5 leading-relaxed"
              >
                <ShieldCheck aria-hidden className="mt-1 size-4 shrink-0" />
                {line}
              </li>
            ))}
            <li
              lang={basis.lang}
              className="flex gap-2 border-t border-brand-line py-2.5 text-sm text-brand-muted"
            >
              <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
              {t('offer.rightsChecked', {
                date: formatRightsDate(offer.rights.checked_at, locale),
                basis: basis.text,
              })}
            </li>
          </ul>
          <h3 className="mt-8 font-semibold">{t('offer.ndaHeading')}</h3>
          <ul lang={nda.lang} className="mt-3">
            {nda.items.map((doc) => (
              <li
                key={doc}
                className="flex gap-2 py-1.5 text-sm text-brand-muted"
              >
                <LockKeyhole aria-hidden className="mt-0.5 size-4 shrink-0" />
                {doc}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div
        className={`mt-12 grid gap-x-10 gap-y-8 border-t border-brand-line pt-8 ${
          offer.sections.length % 3 ? 'md:grid-cols-2' : 'md:grid-cols-3'
        }`}
      >
        {offer.sections.map((section, i) => {
          const title = pick(section.title);
          const items = pickList(section.items, locale);
          return (
            <section key={i}>
              <h2 lang={title.lang} className="text-lg font-semibold">
                {title.text}
              </h2>
              <ul lang={items.lang} className="mt-3">
                {items.items.map((item) => (
                  <li
                    key={item}
                    className="border-t border-brand-line py-2.5 text-[15px] leading-relaxed"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {assetsNote && (
        <p lang={assetsNote.lang} className="mt-4 text-sm text-brand-muted">
          {assetsNote.text}
        </p>
      )}

      {offer.images.length > 0 && (
        <section className="mt-12">
          <h2 className={h2}>{t('offer.galleryHeading')}</h2>
          <ul className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
            {offer.images.map((img) => {
              const alt = pick(img.alt);
              // Plain path: next/image rejects unconfigured query strings.
              const src = img.url;
              return (
                <li key={img.url}>
                  <a
                    href={src}
                    target="_blank"
                    rel="noopener"
                    aria-label={`${t('offer.openImage')}: ${alt.text}`}
                    className="brand-focus block overflow-hidden border border-brand-line"
                  >
                    <Image
                      src={src}
                      width={img.width}
                      height={img.height}
                      alt={alt.text}
                      unoptimized
                      loading="lazy"
                      sizes="(max-width: 768px) 50vw, 300px"
                      className="block aspect-[4/3] h-auto w-full object-cover"
                    />
                  </a>
                </li>
              );
            })}
          </ul>
          <p lang={credit.lang} className="mt-2 text-sm text-brand-muted">
            {credit.text}
          </p>
        </section>
      )}

      <p
        lang={legal.lang}
        className="mt-10 border border-brand-line bg-brand-surface p-5 text-sm leading-relaxed text-brand-muted"
      >
        {legal.text}
      </p>

      <section
        id="contact"
        className="mt-10 scroll-mt-24 border-t border-brand-line pt-8"
      >
        <h2 className={h2}>{t('offer.contactHeading', { code })}</h2>
        <p className="mt-2 mb-5 max-w-2xl text-brand-muted">{contactNote}</p>
        <div className="max-w-3xl">
          {hasAnyChannel(contacts) ? (
            <ContactChannels
              config={contacts}
              locale={locale}
              leadCode={code}
              message={pick(offer.whatsapp_text).text}
            />
          ) : (
            <Link
              href={`/${locale}/contact`}
              className="brand-button brand-focus"
            >
              {t('offer.cta', { code })}
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
