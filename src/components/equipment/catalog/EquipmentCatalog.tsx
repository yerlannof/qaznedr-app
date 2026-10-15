import Link from 'next/link';
import { translate } from '@/lib/i18n/translations';
import { regionLabel } from '@/lib/data/filter-config';
import type { PublicEquipmentListing } from '@/lib/equipment-listings/catalog-repository';
import {
  CATEGORY_GROUPS,
  REGION_IDS,
  kindsFor,
  offerTypesFor,
  serviceMethodsFor,
  type CategoryGroup,
} from '@/lib/equipment-listings/taxonomy';
import { codeLabel, intakeLabel } from '@/lib/equipment-listings/present';
import AutoSubmitForm from './AutoSubmitForm';
import EquipmentCard from './EquipmentCard';
import SubscribeForm from './SubscribeForm';

export type CatalogFilters = {
  offerType?: string;
  category?: string;
  region?: string;
  kind?: string;
  serviceMethod?: string;
  accredited?: boolean;
  page: number;
};

type Result = {
  items: PublicEquipmentListing[];
  total: number;
  limit: number;
} | null;

const selectClass =
  'brand-focus mt-1 min-h-11 w-full rounded border border-brand-line bg-brand-surface px-3 text-brand-ink';
const labelClass = 'block text-sm font-semibold';

export default function EquipmentCatalog({
  locale,
  filters,
  result,
  covers,
  marks,
  subscribeEnabled = false,
}: {
  locale: string;
  filters: CatalogFilters;
  result: Result;
  covers: Record<string, string>;
  marks: Record<string, string[]>;
  subscribeEnabled?: boolean;
}) {
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(locale, `equipmentCatalog.${key}`, params);
  const base = `/${locale}/equipment`;
  const kinds = kindsFor(filters.category);
  const methods = serviceMethodsFor(filters.category);
  const offerTypes = offerTypesFor(filters.category);
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    for (const key of [
      'offerType',
      'category',
      'region',
      'kind',
      'serviceMethod',
    ] as const)
      if (filters[key]) params.set(key, String(filters[key]));
    if (filters.accredited) params.set('accredited', 'true');
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  };
  const pages = result ? Math.ceil(result.total / result.limit) : 0;

  return (
    <div className="brand-container py-10 lg:py-14">
      <nav aria-label={t('eyebrow')} className="flex flex-wrap gap-2">
        <span
          aria-current="page"
          className="inline-flex min-h-11 items-center rounded border border-brand-ink bg-brand-ink px-5 font-semibold text-brand-bg"
        >
          {t('tabCatalog')}
        </span>
        <Link
          href={`${base}/new`}
          className="brand-button-secondary brand-focus"
        >
          {t('tabSubmit')}
        </Link>
        <Link
          href={`${base}/my`}
          className="brand-button-secondary brand-focus"
        >
          {translate(locale, 'equipmentCabinet.tab')}
        </Link>
      </nav>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
            {t('eyebrow')}
          </p>
          <h1 className="holding-title mt-3">{t('title')}</h1>
          <p className="mt-4 max-w-2xl text-brand-muted">{t('intro')}</p>
        </div>
        <aside className="border-l-4 border-brand-accent bg-brand-surface p-5">
          <h2 className="font-semibold">{t('ctaTitle')}</h2>
          <p className="mt-2 text-sm text-brand-muted">{t('ctaText')}</p>
          <Link href={`${base}/new`} className="brand-button brand-focus mt-4">
            {t('ctaButton')}
          </Link>
        </aside>
      </div>

      <AutoSubmitForm
        action={base}
        className="mt-10 grid gap-4 border-t border-brand-line pt-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className={labelClass}>
          {t('what')}
          <select
            name="category"
            defaultValue={filters.category ?? ''}
            className={selectClass}
          >
            <option value="">{t('all')}</option>
            {(Object.keys(CATEGORY_GROUPS) as CategoryGroup[]).map((group) => (
              <optgroup
                key={group}
                label={intakeLabel(locale, `groups.${group}`)}
              >
                {CATEGORY_GROUPS[group].map((category) => (
                  <option key={category} value={category}>
                    {intakeLabel(locale, category)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {offerTypes.length > 1 && (
          <label className={labelClass}>
            {t('offerType')}
            <select
              name="offerType"
              defaultValue={filters.offerType ?? ''}
              className={selectClass}
            >
              <option value="">{t('all')}</option>
              {offerTypes.map((type) => (
                <option key={type} value={type}>
                  {intakeLabel(locale, type)}
                </option>
              ))}
            </select>
          </label>
        )}
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
          <label className="flex min-h-11 items-center gap-3 self-end text-sm font-semibold">
            <input
              type="checkbox"
              name="accredited"
              value="true"
              defaultChecked={filters.accredited === true}
            />
            {t('accredited')}
          </label>
        )}
        <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="brand-button brand-focus">
            {t('apply')}
          </button>
          <Link href={base} className="brand-button-secondary brand-focus">
            {t('reset')}
          </Link>
        </div>
      </AutoSubmitForm>

      <section className="mt-10" aria-live="polite">
        {!result ? (
          <p role="status">{t('unavailable')}</p>
        ) : (
          <>
            <h2 className="text-xl font-semibold">
              {t('found', { count: result.total })}
            </h2>
            {result.items.length === 0 ? (
              <p className="mt-4 text-brand-muted">{t('empty')}</p>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                className="mt-8 flex items-center gap-4"
              >
                {filters.page > 1 && (
                  <Link
                    href={pageHref(filters.page - 1)}
                    className="brand-button-secondary brand-focus"
                  >
                    {t('prev')}
                  </Link>
                )}
                <span>{t('page', { page: filters.page })}</span>
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
        <SubscribeForm
          locale={locale}
          filters={Object.fromEntries(
            (
              [
                'offerType',
                'category',
                'region',
                'kind',
                'serviceMethod',
              ] as const
            )
              .filter((key) => filters[key])
              .map((key) => [key, String(filters[key])])
          )}
        />
      )}
      <p className="mt-12 max-w-3xl border-t border-brand-line pt-6 text-sm text-brand-muted">
        {t('disclaimer')}
      </p>
    </div>
  );
}
