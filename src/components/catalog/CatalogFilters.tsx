'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import {
  activeFilterCount,
  catalogQuery,
  EMPTY_PARAMS,
  facetCounts,
  filterCatalog,
  type CatalogParams,
  type CatalogSort,
} from '@/lib/catalog/filter';
import {
  CATALOG_KINDS,
  CATALOG_STAGES,
  COMMODITY_GROUPS,
  type CatalogItem,
} from '@/lib/catalog/types';

export interface FilterOption {
  id: string;
  label: string;
}

type ListKey = 'kinds' | 'groups' | 'commodities' | 'regions' | 'stages';

interface Props {
  locale: string;
  params: CatalogParams;
  items: CatalogItem[];
  commodities: FilterOption[];
  regions: FilterOption[];
  sorts: CatalogSort[];
}

function toggle(p: CatalogParams, key: ListKey, id: string): CatalogParams {
  const list = p[key] as string[];
  const next = list.includes(id) ? list.filter((v) => v !== id) : [...list, id];
  return { ...p, [key]: next } as CatalogParams;
}

/**
 * Facet filters of the unified catalogue (approved design 18): a sidebar on
 * desktop that applies on every change, a bottom sheet on phones that applies
 * with one "Show N" button. State lives in the URL; the sidebar is a plain GET
 * form, so it also works before JavaScript loads.
 */
export default function CatalogFilters({
  locale,
  params,
  items,
  commodities,
  regions,
  sorts,
}: Props) {
  const t = (key: string, vars?: Record<string, unknown>) =>
    translate(locale, key, vars);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CatalogParams>(params);
  const sheetRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setDraft(params), [params]);

  const go = (next: CatalogParams) =>
    router.push(`/${locale}/leads${catalogQuery(next)}`, { scroll: false });

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sheetRef.current?.querySelector<HTMLElement>('button, input')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
      openerRef.current?.focus();
    };
  }, [open]);

  const liveCounts = useMemo(() => facetCounts(items, params), [items, params]);
  const draftCounts = useMemo(() => facetCounts(items, draft), [items, draft]);
  const draftTotal = useMemo(
    () => filterCatalog(items, draft).length,
    [items, draft]
  );
  const active = activeFilterCount(params);

  const kindOptions = CATALOG_KINDS.filter((k) =>
    items.some((i) => i.kind === k)
  ).map((k) => ({ id: k, label: t(`catalog.kinds.${k}`) }));
  const groupOptions = COMMODITY_GROUPS.filter((g) =>
    items.some((i) => i.commodityGroup === g)
  ).map((g) => ({ id: g, label: t(`catalog.groups.${g}`) }));
  const stageOptions = CATALOG_STAGES.filter((s) =>
    items.some((i) => i.stage === s)
  ).map((s) => ({ id: s, label: t(`catalog.stages.${s}`) }));
  const hasInfra = items.some((i) => i.hasInfrastructure);

  const groups = (
    p: CatalogParams,
    counts: ReturnType<typeof facetCounts>,
    onToggle: (key: ListKey, id: string) => void,
    onInfra: () => void,
    withKinds: boolean,
    idPrefix: string
  ) => {
    const fieldset = (
      key: ListKey,
      name: string,
      legend: string,
      options: FilterOption[]
    ) =>
      options.length > 1 || (p[key] as string[]).length ? (
        <div
          key={key}
          role="group"
          aria-labelledby={`${idPrefix}-${key}`}
          className="border-b border-brand-line py-4"
        >
          <p id={`${idPrefix}-${key}`} className="mb-1 text-sm font-semibold">
            {legend}
          </p>
          {options.map((o) => {
            const n = (counts[key] as Record<string, number>)[o.id] ?? 0;
            const checked = (p[key] as string[]).includes(o.id);
            return (
              <label
                key={o.id}
                className={`flex min-h-11 cursor-pointer items-center gap-3 text-[15px] ${!n && !checked ? 'text-brand-muted' : ''}`}
              >
                <input
                  type="checkbox"
                  name={name}
                  value={o.id}
                  checked={checked}
                  onChange={() => onToggle(key, o.id)}
                  className="size-[18px] shrink-0 accent-[#253740]"
                />
                <span className="min-w-0 flex-1">{o.label}</span>
                <span className="text-sm tabular-nums text-brand-muted">
                  {n}
                </span>
              </label>
            );
          })}
        </div>
      ) : null;
    return (
      <>
        {withKinds &&
          fieldset('kinds', 'kind', t('catalog.kindLabel'), kindOptions)}
        {fieldset('groups', 'group', t('catalog.groupsLabel'), groupOptions)}
        {fieldset(
          'commodities',
          'commodity',
          t('catalog.commoditiesLabel'),
          commodities
        )}
        {fieldset('regions', 'region', t('catalog.regionsLabel'), regions)}
        {fieldset('stages', 'stage', t('catalog.stagesLabel'), stageOptions)}
        {hasInfra && (
          <div
            role="group"
            aria-labelledby={`${idPrefix}-infra`}
            className="border-b border-brand-line py-4"
          >
            <p id={`${idPrefix}-infra`} className="mb-1 text-sm font-semibold">
              {t('catalog.infraLabel')}
            </p>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
              <input
                type="checkbox"
                name="infra"
                value="1"
                checked={p.infra}
                onChange={onInfra}
                className="size-[18px] shrink-0 accent-[#253740]"
              />
              <span className="min-w-0 flex-1">{t('catalog.infraOption')}</span>
              <span className="text-sm tabular-nums text-brand-muted">
                {counts.infra}
              </span>
            </label>
          </div>
        )}
      </>
    );
  };

  const sortSelect = (id: string) =>
    sorts.length > 1 ? (
      <label className="flex min-w-0 items-center gap-2 text-sm text-brand-muted">
        <span className="sr-only sm:not-sr-only">{t('catalog.sortLabel')}</span>
        <select
          id={id}
          name="sort"
          value={params.sort}
          onChange={(e) =>
            go({ ...params, sort: e.target.value as CatalogSort })
          }
          className="brand-focus min-h-11 min-w-0 max-w-[11rem] border border-brand-line bg-brand-surface px-2 text-brand-ink sm:max-w-none"
        >
          {sorts.map((s) => (
            <option key={s} value={s}>
              {t(`catalog.sorts.${s}`)}
            </option>
          ))}
        </select>
      </label>
    ) : null;

  return (
    <>
      {/* Phone: one filter button + sort, filters in a bottom sheet. */}
      <div className="flex gap-2 lg:hidden">
        <button
          ref={openerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="brand-button-secondary brand-focus min-h-11 flex-1"
        >
          <SlidersHorizontal aria-hidden className="size-4" />
          {t('catalog.filters')}
          {active > 0 && ` · ${active}`}
        </button>
        {sortSelect('catalog-sort-mobile')}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t('catalog.close')}
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[#17272e]/50"
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('catalog.filters')}
            className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col border-t border-brand-line bg-brand-surface text-brand-ink"
          >
            <div className="flex items-center justify-between border-b border-brand-line px-4 py-2">
              <h2 className="font-semibold">{t('catalog.filters')}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('catalog.close')}
                className="brand-focus grid size-11 place-items-center border border-brand-line"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain px-4">
              {groups(
                draft,
                draftCounts,
                (key, id) => setDraft((d) => toggle(d, key, id)),
                () => setDraft((d) => ({ ...d, infra: !d.infra })),
                true,
                'sheet'
              )}
            </div>
            <div className="flex gap-3 border-t border-brand-line px-4 py-3">
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...EMPTY_PARAMS,
                    sort: draft.sort,
                    view: draft.view,
                  })
                }
                className="brand-button-secondary brand-focus min-h-12 flex-1"
              >
                {t('catalog.resetShort')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  go(draft);
                }}
                className="brand-button brand-focus min-h-12 flex-1"
              >
                {t('catalog.apply', { count: draftTotal })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: sidebar applies on change; a plain GET form without JS. */}
      <form
        method="get"
        action={`/${locale}/leads`}
        aria-label={t('catalog.filters')}
        className="hidden border-t border-brand-line lg:block"
        onSubmit={(e) => e.preventDefault()}
      >
        {params.kinds.map((k) => (
          <input key={k} type="hidden" name="kind" value={k} />
        ))}
        {params.view === 'list' && (
          <input type="hidden" name="view" value="list" />
        )}
        {groups(
          params,
          liveCounts,
          (key, id) => go(toggle(params, key, id)),
          () => go({ ...params, infra: !params.infra }),
          false,
          'side'
        )}
        <noscript>
          <button type="submit" className="brand-button mt-4 w-full">
            {t('catalog.apply', { count: '' })}
          </button>
        </noscript>
        {active > 0 && (
          <a
            href={`/${locale}/leads`}
            onClick={(e) => {
              e.preventDefault();
              go({ ...EMPTY_PARAMS, sort: params.sort, view: params.view });
            }}
            className="brand-focus mt-3 inline-flex min-h-11 items-center text-sm text-brand-muted underline underline-offset-4"
          >
            {t('catalog.reset')}
          </a>
        )}
      </form>
    </>
  );
}

export function SortSelect(
  props: Omit<Props, 'items' | 'commodities' | 'regions'>
) {
  const { locale, params, sorts } = props;
  const router = useRouter();
  if (sorts.length < 2) return null;
  return (
    <label className="hidden items-center gap-2 text-sm text-brand-muted lg:flex">
      {translate(locale, 'catalog.sortLabel')}
      <select
        value={params.sort}
        onChange={(e) =>
          router.push(
            `/${locale}/leads${catalogQuery({ ...params, sort: e.target.value as CatalogSort })}`,
            { scroll: false }
          )
        }
        className="brand-focus min-h-11 border border-brand-line bg-brand-surface px-2 text-brand-ink"
      >
        {sorts.map((s) => (
          <option key={s} value={s}>
            {translate(locale, `catalog.sorts.${s}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
