import { translate } from '@/lib/i18n/translations';
import { regionLabel } from '@/lib/data/filter-config';
import { groupOf } from './taxonomy';
import type { PublicEquipmentListing } from './catalog-repository';

/** Display helpers shared by the public catalogue card and listing page. */
type Listing = PublicEquipmentListing;

const UNITS = {
  m: { ru: 'м', kz: 'м', en: 'm', zh: '米' },
  mm: { ru: 'мм', kz: 'мм', en: 'mm', zh: '毫米' },
  t: { ru: 'т', kz: 'т', en: 't', zh: '吨' },
  m3: { ru: 'м³', kz: 'м³', en: 'm³', zh: '立方米' },
  kw: { ru: 'кВт', kz: 'кВт', en: 'kW', zh: '千瓦' },
  h: { ru: 'ч', kz: 'сағ', en: 'h', zh: '小时' },
} as const;

export function unit(locale: string, key: keyof typeof UNITS): string {
  const names: Record<string, string> = UNITS[key];
  return names[locale] ?? names.ru;
}

function measure(
  value: number,
  key: keyof typeof UNITS,
  locale: string
): string {
  return `${formatNumber(value, locale)} ${unit(locale, key)}`;
}

const NUMBER_LOCALE: Record<string, string> = {
  ru: 'ru-RU',
  kz: 'kk-KZ',
  en: 'en-US',
  zh: 'zh-CN',
};

export function intakeLabel(locale: string, key: string): string {
  const name = key === 'title' ? 'listingTitle' : key;
  const text = translate(locale, `equipmentIntake.${name}`);
  return text.startsWith('equipmentIntake.') ? key : text;
}

export function codeLabel(locale: string, value: string): string {
  const text = translate(locale, `equipmentIntake.codes.${value}`);
  return text.startsWith('equipmentIntake.') ? value : text;
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[locale] ?? 'ru-RU', {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(NUMBER_LOCALE[locale] ?? 'ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Almaty',
  }).format(date);
}

export function priceText(listing: Listing, locale: string): string {
  if (listing.price === undefined || !listing.currency)
    return translate(locale, 'equipmentCatalog.priceOnRequest');
  const amount = new Intl.NumberFormat(NUMBER_LOCALE[locale] ?? 'ru-RU', {
    style: 'currency',
    currency: listing.currency,
    currencyDisplay: listing.currency === 'KZT' ? 'narrowSymbol' : 'symbol',
    maximumFractionDigits: 0,
  }).format(listing.price);
  const unit = listing.priceUnit
    ? codeLabel(locale, listing.priceUnit).toLowerCase()
    : '';
  const shift =
    listing.priceUnit === 'SHIFT' && listing.shiftHours
      ? ` (${measure(listing.shiftHours, 'h', locale)})`
      : '';
  return translate(locale, 'equipmentCatalog.price', {
    price: amount,
    unit: unit + shift,
  }).trim();
}

/** Small uppercase tag: "Техника · Аренда" / "Услуги · Геофизика" / "Люди · Вакансия". */
export function cardTag(listing: Listing, locale: string): string {
  const group = groupOf(listing.category) ?? 'machinery';
  const wanted = listing.offerType === 'WANTED';
  const detail =
    group === 'people'
      ? translate(
          locale,
          `equipmentCatalog.${wanted ? 'vacancy' : 'lookingForWork'}`
        )
      : wanted
        ? intakeLabel(locale, 'WANTED')
        : group === 'services'
          ? intakeLabel(locale, String(listing.category))
          : intakeLabel(locale, String(listing.offerType));
  return [translate(locale, `equipmentIntake.groups.${group}`), detail].join(
    ' · '
  );
}

/** The one or two most useful figures for a card, by section. */
export function keyFacts(listing: Listing, locale: string): string[] {
  const facts: string[] = [];
  if (listing.kind) facts.push(codeLabel(locale, listing.kind));
  const deepest = (listing.capabilities ?? []).reduce<
    { method: string; depth?: number } | undefined
  >(
    (best, row) => (!best || (row.depth ?? 0) > (best.depth ?? 0) ? row : best),
    undefined
  );
  if (deepest)
    facts.push(
      [
        codeLabel(locale, deepest.method),
        deepest.depth ? measure(deepest.depth, 'm', locale) : null,
      ]
        .filter(Boolean)
        .join(', ')
    );
  if (listing.serviceMethods?.length)
    facts.push(
      listing.serviceMethods
        .slice(0, 2)
        .map((method) => codeLabel(locale, method))
        .join(', ') + (listing.serviceMethods.length > 2 ? '…' : '')
    );
  if (listing.bucket) facts.push(measure(listing.bucket, 'm3', locale));
  if (listing.mass) facts.push(measure(listing.mass, 't', locale));
  if (listing.payload) facts.push(measure(listing.payload, 't', locale));
  if (listing.powerKw) facts.push(measure(listing.powerKw, 'kw', locale));
  if (listing.accredited)
    facts.push(translate(locale, 'equipmentCatalog.accredited'));
  return facts.slice(0, 3);
}

export function placeText(listing: Listing, locale: string): string {
  return [
    listing.city,
    listing.region ? regionLabel(listing.region, locale) : null,
  ]
    .filter(Boolean)
    .join(', ');
}

export function workAreaText(listing: Listing, locale: string): string | null {
  if (!listing.serviceArea?.length) return null;
  return listing.serviceArea
    .map((area) =>
      area === 'ALL_KZ' ? codeLabel(locale, area) : regionLabel(area, locale)
    )
    .join(', ');
}

const SPEC_KEYS = [
  'kind',
  'brand',
  'model',
  'chassis',
  'machineYear',
  'machineCondition',
  'bucket',
  'mass',
  'pressure',
  'flow',
  'payload',
  'powerKw',
  'purposes',
  'trajectory',
  'site',
  'serviceMethods',
  'accredited',
  'accreditationNumber',
  'ownCrew',
  'operator',
  'delivery',
  'availability',
  'priceIncludes',
] as const;

/** Label/value rows for the listing page, in a fixed, readable order. */
export function specRows(
  listing: Listing,
  locale: string
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  for (const key of SPEC_KEYS) {
    const value = (listing as Record<string, unknown>)[key];
    if (value === undefined || value === null || value === '') continue;
    const text = Array.isArray(value)
      ? value.map((item) => codeLabel(locale, String(item))).join(', ')
      : typeof value === 'number'
        ? key === 'machineYear'
          ? String(value)
          : formatNumber(value, locale)
        : codeLabel(locale, String(value));
    rows.push({ label: intakeLabel(locale, key), value: text });
  }
  for (const row of listing.capabilities ?? [])
    rows.push({
      label: intakeLabel(locale, 'capabilities'),
      value: [
        codeLabel(locale, row.method),
        row.depth ? measure(row.depth, 'm', locale) : null,
        row.diameter ? `Ø ${measure(row.diameter, 'mm', locale)}` : null,
        row.coreSize ?? null,
      ]
        .filter(Boolean)
        .join(' · '),
    });
  return rows;
}
