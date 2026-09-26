'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { regionLabel } from '@/lib/data/filter-config';
import { translate } from '@/lib/i18n/translations';
import { MINERAL_HUBS, hubMineralName, mineralHub } from '@/lib/leads/minerals';
import type { LeadListFilters } from '@/lib/leads/public-queries';
import type { LeadType } from '@/lib/leads/types';
import { toLocale } from '@/lib/seo/site';

type Filters = LeadListFilters & { type?: LeadType };

export default function LeadFilters({
  locale,
  filters,
  regions,
}: {
  locale: string;
  filters: Filters;
  regions: string[];
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const loc = toLocale(locale);
  const t = (key: string) => translate(loc, key);
  const action = `/${loc}/leads`;
  const fieldClass =
    'brand-focus min-h-11 w-full border border-brand-line bg-brand-bg px-3 text-sm text-brand-ink';

  function Fields({ prefix }: { prefix: string }) {
    return (
      <>
        <input type="hidden" name="tier" value={filters.tier ?? ''} />
        <div>
          <label
            htmlFor={`${prefix}-mineral`}
            className="mb-1 block text-sm text-brand-ink"
          >
            {t('listingsFilters.mineral')}
          </label>
          <select
            id={`${prefix}-mineral`}
            name="mineral"
            defaultValue={filters.mineral ?? ''}
            className={fieldClass}
          >
            <option value="">{t('listingsFilters.allMinerals')}</option>
            {MINERAL_HUBS.map(({ slug }) => (
              <option key={slug} value={slug}>
                {hubMineralName(slug, loc)}
              </option>
            ))}
            {filters.mineral && !mineralHub(filters.mineral) && (
              <option value={filters.mineral}>{filters.mineral}</option>
            )}
          </select>
        </div>
        <div>
          <label
            htmlFor={`${prefix}-region`}
            className="mb-1 block text-sm text-brand-ink"
          >
            {t('leadsCatalog.region')}
          </label>
          <select
            id={`${prefix}-region`}
            name="region"
            defaultValue={filters.region ?? ''}
            className={fieldClass}
          >
            <option value="">{t('leadsCatalog.allRegions')}</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {regionLabel(region, loc)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor={`${prefix}-type`}
            className="mb-1 block text-sm text-brand-ink"
          >
            {t('leadsCatalog.type')}
          </label>
          <select
            id={`${prefix}-type`}
            name="type"
            defaultValue={filters.type ?? ''}
            className={fieldClass}
          >
            <option value="">{t('leadsCatalog.allTypes')}</option>
            {(['placer', 'bedrock', 'other'] as const).map((type) => (
              <option key={type} value={type}>
                {t(`leadCard.types.${type}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor={`${prefix}-sort`}
            className="mb-1 block text-sm text-brand-ink"
          >
            {t('leadsCatalog.sort')}
          </label>
          <select
            id={`${prefix}-sort`}
            name="sort"
            defaultValue={filters.sort ?? 'newest'}
            className={fieldClass}
          >
            <option value="newest">{t('leadsCatalog.sortNewest')}</option>
            <option value="value_desc">
              {t('leadsCatalog.sortValueDesc')}
            </option>
            <option value="confidence_desc">
              {t('leadsCatalog.sortConfidenceDesc')}
            </option>
          </select>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm text-brand-ink">
          <input
            type="checkbox"
            name="free"
            value="1"
            defaultChecked={filters.freeOnly}
            className="brand-focus size-5 accent-brand-slate"
          />
          {t('leadsCatalog.freeOnly')}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="brand-button brand-focus min-h-11 flex-1 text-sm"
          >
            {t('leadsCatalog.apply')}
          </button>
          <Link
            href={action}
            className="brand-button-secondary brand-focus min-h-11 text-sm"
          >
            {t('leadsCatalog.reset')}
          </Link>
        </div>
      </>
    );
  }

  const selected = [
    filters.tier &&
      (filters.tier === 'TIER1_PLACER'
        ? t('leadsCatalog.typePlacer')
        : filters.tier === 'TIER2_BOMB'
          ? t('leadsCatalog.typeInvest')
          : filters.tier),
    filters.mineral &&
      (mineralHub(filters.mineral)
        ? hubMineralName(filters.mineral, loc)
        : filters.mineral),
    filters.region && regionLabel(filters.region, loc),
    filters.type && t(`leadCard.types.${filters.type}`),
    filters.freeOnly && t('leadsCatalog.freeOnly'),
  ].filter(
    (value): value is string => typeof value === 'string' && value.length > 0
  );

  return (
    <div className="border-y border-brand-line py-5">
      <form
        method="get"
        action={action}
        data-testid="desktop-lead-filters"
        className="hidden items-end gap-3 lg:grid lg:grid-cols-4 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto]"
      >
        <Fields prefix="desktop" />
      </form>
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              ref={triggerRef}
              type="button"
              className="brand-button-secondary brand-focus inline-flex min-h-11 items-center gap-2 text-sm"
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              {t('leadsCatalog.filters')}
            </button>
          </SheetTrigger>
          <SheetContent
            aria-describedby={undefined}
            side="right"
            closeLabel={t('common.close')}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              triggerRef.current?.focus();
            }}
            className="w-[min(24rem,90vw)] overflow-y-auto border-brand-line bg-brand-bg text-brand-ink"
          >
            <SheetHeader>
              <SheetTitle className="text-brand-ink">
                {t('leadsCatalog.filters')}
              </SheetTitle>
            </SheetHeader>
            <form method="get" action={action} className="space-y-4 px-4 pb-8">
              <Fields prefix="mobile" />
            </form>
          </SheetContent>
        </Sheet>
      </div>
      {selected.length > 0 && (
        <div
          data-testid="selected-lead-filters"
          className="mt-4 flex flex-wrap items-center gap-2 text-sm"
        >
          {selected.map((value) => (
            <span
              key={value}
              className="border border-brand-line px-3 py-2 text-brand-ink"
            >
              {value}
            </span>
          ))}
          <Link
            href={action}
            className="brand-focus inline-flex min-h-11 items-center px-2 text-brand-ink underline"
          >
            {t('leadsCatalog.resetFilters')}
          </Link>
        </div>
      )}
    </div>
  );
}
