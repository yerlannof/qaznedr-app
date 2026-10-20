import Image from 'next/image';
import Link from 'next/link';
import { Bell, Camera, MessageCircle } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import { regionLabel } from '@/lib/data/filter-config';
import { SCENES } from '@/lib/brand/photos';
import { whatsappLink } from '@/lib/config/contacts';
import type { PublicEquipmentListing } from '@/lib/equipment-listings/catalog-repository';
import {
  CATEGORY_GROUPS,
  OFFER_TYPES,
  REGION_IDS,
  groupOf,
  kindsFor,
  offerTypesFor,
  serviceMethodsFor,
  type CategoryGroup,
  type OfferType,
} from '@/lib/equipment-listings/taxonomy';
import { codeLabel, intakeLabel } from '@/lib/equipment-listings/present';
import PhotoBand from '@/components/home/PhotoBand';
import AutoSubmitForm from './AutoSubmitForm';
import EquipmentCard from './EquipmentCard';
import SubscribeForm from './SubscribeForm';

export type CatalogFilters = {
  offerType?: string;
  category?: string;
  group?: CategoryGroup | null;
  region?: string;
  kind?: string;
  serviceMethod?: string;
  accredited?: boolean;
  page: number;
};

export type CatalogCounts = {
  /** Published listings in each section (region filter applied). */
  groups: Record<CategoryGroup, number>;
  /** Published listings per offer type within the current section and region. */
  offers: Record<OfferType | 'all', number>;
  /** All published listings, no filters. */
  total: number;
};

type Result = {
  items: PublicEquipmentListing[];
  total: number;
  limit: number;
} | null;

const GROUPS = Object.keys(CATEGORY_GROUPS) as CategoryGroup[];
const TILE_PHOTO: Record<CategoryGroup, string> = {
  machinery: SCENES.drillRig,
  toolsInstruments: SCENES.tools,
  services: SCENES.lab,
  people: SCENES.geologists,
};
const FILTER_KEYS = [
  'offerType',
  'category',
  'group',
  'region',
  'kind',
  'serviceMethod',
] as const;

const selectClass =
  'brand-focus mt-1.5 min-h-12 w-full rounded-none border border-brand-line bg-brand-bg px-3.5 text-base text-brand-ink';
const labelClass = 'block min-w-0 text-[13px] font-medium';
const chipClass =
  'brand-focus inline-flex min-h-11 flex-none items-center gap-2 border px-[18px] text-[15px]';

/** Catalogue body under the photo header (design 21). */
export default function EquipmentCatalog({
  locale,
  filters,
  result,
  covers,
  marks,
  counts,
  subscribeEnabled = false,
  whatsappNumber = null,
}: {
  locale: string;
  filters: CatalogFilters;
  result: Result;
  covers: Record<string, string>;
  marks: Record<string, string[]>;
  counts: CatalogCounts | null;
  subscribeEnabled?: boolean;
  whatsappNumber?: string | null;
}) {
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(locale, `equipmentCatalog.${key}`, params);
  const base = `/${locale}/equipment`;
  const group = filters.category ? groupOf(filters.category) : filters.group;
  const kinds = kindsFor(filters.category);
  const methods = serviceMethodsFor(filters.category);
  const offerTypes: readonly OfferType[] = filters.category
    ? offerTypesFor(filters.category)
    : group
      ? OFFER_TYPES.filter((type) =>
          CATEGORY_GROUPS[group].some((category) =>
            offerTypesFor(category).includes(type)
          )
        )
      : OFFER_TYPES;
  const filtered = FILTER_KEYS.some((key) => filters[key]);
  const href = (
    change: Partial<Record<(typeof FILTER_KEYS)[number], string>>
  ) => {
    const params = new URLSearchParams();
    for (const key of FILTER_KEYS) {
      const value = key in change ? change[key] : filters[key];
      if (value) params.set(key, String(value));
    }
    if (filters.accredited && !('category' in change))
      params.set('accredited', 'true');
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  };
  const pageHref = (page: number) => {
    const link = href({});
    if (page < 2) return link;
    return `${link}${link.includes('?') ? '&' : '?'}page=${page}`;
  };
  const pages = result ? Math.ceil(result.total / result.limit) : 0;
  const subscribeFilters = Object.fromEntries(
    (['offerType', 'category', 'region', 'kind', 'serviceMethod'] as const)
      .filter((key) => filters[key])
      .map((key) => [key, String(filters[key])])
  );
  const assisted = whatsappNumber
    ? whatsappLink(
        whatsappNumber,
        translate(locale, 'equipmentIntake.assistedMessage')
      )
    : null;

  // Nothing published yet and no filters: invite the first authors.
  if (result && counts && counts.total === 0 && !filtered)
    return (
      <div className="brand-container">
        <section className="grid gap-7 pb-2 pt-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 lg:pt-14">
          <div className="grid gap-[18px]">
            <p className="holding-eyebrow text-brand-muted">
              {t('emptyEyebrow')}
            </p>
            <h2 className="text-[28px] font-light leading-[1.1] tracking-[-0.025em] md:text-[44px]">
              {t('emptyTitle')}
            </h2>
            <p className="max-w-[58ch] text-[17px] text-brand-muted">
              {t('emptyLede')}
            </p>
            <ul className="grid gap-3.5">
              <li className="flex items-start gap-3 text-[15px]">
                <Camera
                  aria-hidden
                  className="mt-0.5 size-5 flex-none text-brand-accent"
                />
                {t('emptyPhotos')}
              </li>
              {assisted && (
                <li className="flex items-start gap-3 text-[15px]">
                  <MessageCircle
                    aria-hidden
                    className="mt-0.5 size-5 flex-none text-brand-accent"
                  />
                  <a
                    href={assisted}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brand-focus underline decoration-brand-line underline-offset-4"
                  >
                    {t('emptyWhatsapp')}
                  </a>
                </li>
              )}
              {subscribeEnabled && (
                <li className="flex items-start gap-3 text-[15px]">
                  <Bell
                    aria-hidden
                    className="mt-0.5 size-5 flex-none text-brand-accent"
                  />
                  <a
                    href="#subscribe"
                    className="brand-focus underline decoration-brand-line underline-offset-4"
                  >
                    {t('emptySubscribe')}
                  </a>
                </li>
              )}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href={`${base}/new`} className="brand-button brand-focus">
                {t('tabSubmit')}
              </Link>
              <Link
                href={`${base}/new`}
                className="brand-button-secondary brand-focus"
              >
                {t('emptyRequest')}
              </Link>
            </div>
          </div>
          <div className="photo-tile relative aspect-[3/2]">
            <Image
              src={SCENES.fieldCamp}
              alt=""
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
            />
            <span className="absolute bottom-2.5 right-4 z-[1] text-[11px] text-brand-chalk/60">
              {translate(locale, 'homeV2.illustration')}
            </span>
          </div>
        </section>
        {subscribeEnabled && (
          <div id="subscribe">
            <SubscribeForm locale={locale} filters={{}} />
          </div>
        )}
        <p className="max-w-[72ch] pb-14 pt-7 text-[13px] text-brand-muted">
          {t('disclaimer')}
        </p>
      </div>
    );

  return (
    <>
      <div className="brand-container py-14 md:py-20">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <p className="holding-eyebrow text-brand-muted">
              {t('sectionsEyebrow')}
            </p>
            <h2 className="mt-2.5 text-[28px] font-light leading-[1.1] tracking-[-0.025em] md:text-[44px]">
              {t('what')}
            </h2>
          </div>
          <span className="text-[13px] text-brand-muted">
            {t('sectionsNote')}
          </span>
        </div>
        <nav
          aria-label={t('sectionsEyebrow')}
          className="-mx-5 grid snap-x snap-mandatory auto-cols-[74%] grid-flow-col gap-3 overflow-x-auto px-5 [scrollbar-width:none] md:mx-0 md:grid-flow-row md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0"
        >
          {GROUPS.map((item) => {
            const active = group === item;
            return (
              <Link
                key={item}
                href={href({
                  group: active ? '' : item,
                  category: '',
                  kind: '',
                  serviceMethod: '',
                  offerType: '',
                })}
                aria-current={active ? 'true' : undefined}
                className={`photo-tile brand-focus relative block aspect-[4/5] snap-start text-brand-chalk ${
                  active
                    ? 'outline outline-2 -outline-offset-2 outline-brand-accent'
                    : ''
                }`}
              >
                <Image
                  src={TILE_PHOTO[item]}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 25vw, 74vw"
                  className="object-cover"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-brand-deep/90"
                />
                {counts && (
                  <span className="absolute left-3.5 top-3.5 z-[1] bg-brand-deep/60 px-2.5 py-1 text-xs tabular-nums">
                    {counts.groups[item]}
                  </span>
                )}
                <span className="absolute inset-x-5 bottom-[18px] z-[1]">
                  <b className="block text-[22px] font-normal leading-tight tracking-[-0.015em]">
                    {intakeLabel(locale, `groups.${item}`)}
                  </b>
                  <span className="mt-1 block text-[13px] opacity-80">
                    {t(`groupHint_${item}`)}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <AutoSubmitForm
          action={base}
          className="mt-12 grid gap-4 bg-brand-surface p-5 lg:grid-cols-[auto_1fr] lg:items-end lg:px-5 lg:py-4"
        >
          <div
            role="group"
            aria-label={t('offerType')}
            className="-mx-1 flex gap-2 overflow-x-auto px-1 [scrollbar-width:none]"
          >
            {(['all', ...offerTypes] as const).map((type) => {
              const active = (filters.offerType ?? 'all') === type;
              return (
                <Link
                  key={type}
                  href={href({ offerType: type === 'all' ? '' : type })}
                  aria-current={active ? 'true' : undefined}
                  className={`${chipClass} ${
                    active
                      ? 'border-brand-ink bg-brand-ink text-brand-bg'
                      : 'border-brand-hair hover:border-brand-line'
                  }`}
                >
                  {type === 'all' ? t('all') : intakeLabel(locale, type)}
                  {counts && (
                    <small className="text-xs tabular-nums opacity-65">
                      {counts.offers[type]}
                    </small>
                  )}
                </Link>
              );
            })}
          </div>
          {filters.offerType && (
            <input type="hidden" name="offerType" value={filters.offerType} />
          )}
          {group && !filters.category && (
            <input type="hidden" name="group" value={group} />
          )}
          <div className="grid gap-3 min-[560px]:grid-cols-2 lg:grid-cols-[220px_220px_auto] lg:justify-end">
            <label className={labelClass}>
              {t('what')}
              <select
                name="category"
                defaultValue={filters.category ?? ''}
                className={selectClass}
              >
                <option value="">
                  {group
                    ? intakeLabel(locale, `groups.${group}`)
                    : t('allSections')}
                </option>
                {(group ? [group] : GROUPS).map((item) => (
                  <optgroup
                    key={item}
                    label={intakeLabel(locale, `groups.${item}`)}
                  >
                    {CATEGORY_GROUPS[item].map((category) => (
                      <option key={category} value={category}>
                        {intakeLabel(locale, category)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              {t('region')}
              <select
                name="region"
                defaultValue={filters.region ?? ''}
                className={selectClass}
              >
                <option value="">{t('allRegions')}</option>
                {REGION_IDS.map((region) => (
                  <option key={region} value={region}>
                    {regionLabel(region, locale)}
                  </option>
                ))}
              </select>
            </label>
            {kinds.length > 0 && (
              <label className={labelClass}>
                {t('kind')}
                <select
                  name="kind"
                  defaultValue={filters.kind ?? ''}
                  className={selectClass}
                >
                  <option value="">{t('any')}</option>
                  {kinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {codeLabel(locale, kind)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {methods.length > 0 && (
              <label className={labelClass}>
                {t('serviceMethod')}
                <select
                  name="serviceMethod"
                  defaultValue={filters.serviceMethod ?? ''}
                  className={selectClass}
                >
                  <option value="">{t('any')}</option>
                  {methods.map((method) => (
                    <option key={method} value={method}>
                      {codeLabel(locale, method)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {filters.category === 'labService' && (
              <label className="flex min-h-12 items-center gap-3 self-end text-sm font-medium">
                <input
                  type="checkbox"
                  name="accredited"
                  value="true"
                  defaultChecked={filters.accredited === true}
                  className="size-5 accent-brand-accent"
                />
                {t('accredited')}
              </label>
            )}
            <button
              type="submit"
              className="brand-button brand-focus self-end min-[560px]:col-span-2 lg:col-span-1"
            >
              {t('apply')}
            </button>
          </div>
        </AutoSubmitForm>

        <section aria-live="polite">
          {!result ? (
            <p role="status" className="mt-9">
              {t('unavailable')}
            </p>
          ) : (
            <>
              <div className="mb-5 mt-9 flex items-baseline justify-between gap-3">
                <h2 className="text-[22px] font-normal tracking-[-0.015em]">
                  {t('found', { count: result.total })}
                </h2>
                {filtered && (
                  <Link
                    href={base}
                    className="brand-focus text-[15px] underline decoration-brand-line underline-offset-4"
                  >
                    {t('reset')}
                  </Link>
                )}
              </div>
              {result.items.length === 0 ? (
                <div className="grid justify-items-start gap-4">
                  <p className="text-brand-muted">{t('empty')}</p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={base}
                      className="brand-button-secondary brand-focus"
                    >
                      {t('reset')}
                    </Link>
                    {subscribeEnabled && (
                      <a
                        href="#subscribe"
                        className="brand-button-secondary brand-focus"
                      >
                        {translate(locale, 'equipmentSubscribe.button')}
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
                  {result.items.map((listing) => (
                    <EquipmentCard
                      key={listing.id}
                      listing={listing}
                      locale={locale}
                      cover={covers[listing.id]}
                      marks={marks[listing.id] ?? []}
                    />
                  ))}
                </div>
              )}
              {pages > 1 && (
                <nav
                  aria-label={t('page', { page: filters.page })}
                  className="mt-10 flex items-center gap-4"
                >
                  {filters.page > 1 && (
                    <Link
                      href={pageHref(filters.page - 1)}
                      className="brand-button-secondary brand-focus"
                    >
                      {t('prev')}
                    </Link>
                  )}
                  <span className="tabular-nums">
                    {t('page', { page: filters.page })}
                  </span>
                  {filters.page < pages && (
                    <Link
                      href={pageHref(filters.page + 1)}
                      className="brand-button-secondary brand-focus"
                    >
                      {t('next')}
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </section>
        {subscribeEnabled && (
          <div id="subscribe">
            <SubscribeForm locale={locale} filters={subscribeFilters} />
          </div>
        )}
      </div>

      <PhotoBand
        src={SCENES.tools}
        label={translate(locale, 'homeV2.illustration')}
      >
        <div className="grid max-w-[58ch] gap-[18px]">
          <h2 className="text-[28px] font-light leading-[1.1] tracking-[-0.025em] md:text-[44px]">
            {t('ctaTitle')}
          </h2>
          <p className="text-[17px] text-brand-chalk/85">{t('ctaText')}</p>
          <div>
            <Link href={`${base}/new`} className="brand-button brand-focus">
              {t('ctaButton')}
            </Link>
          </div>
          {assisted && (
            <a
              href={assisted}
              target="_blank"
              rel="noopener noreferrer"
              className="brand-focus inline-flex items-center gap-2 text-sm text-brand-chalk/80 underline-offset-4 hover:underline"
            >
              <MessageCircle aria-hidden className="size-4 flex-none" />
              {translate(locale, 'equipmentIntake.assistedText')}
            </a>
          )}
        </div>
      </PhotoBand>
      <div className="brand-container">
        <p className="max-w-[72ch] pb-14 pt-7 text-[13px] text-brand-muted">
          {t('disclaimer')}
        </p>
      </div>
    </>
  );
}
