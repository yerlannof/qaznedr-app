import { REGIONS } from '@/lib/data/filter-config';
import { translate } from '@/lib/i18n/translations';
import { formatCheckDate } from '@/lib/leads/check-date';
import type { Locale } from './site';

export interface LeadSeoInput {
  code: string;
  mineral: string | null;
  region: string | null;
  license_status: string | null;
  last_verified?: string | null;
}

// Chemical symbols used by the leads export → localized names.
const MINERALS: Record<string, Record<Locale, string>> = {
  AU: { ru: 'Золото', kz: 'Алтын', en: 'Gold', zh: '金' },
  CU: { ru: 'Медь', kz: 'Мыс', en: 'Copper', zh: '铜' },
  ZN: { ru: 'Цинк', kz: 'Мырыш', en: 'Zinc', zh: '锌' },
  SN: { ru: 'Олово', kz: 'Қалайы', en: 'Tin', zh: '锡' },
  NI: { ru: 'Никель', kz: 'Никель', en: 'Nickel', zh: '镍' },
  W: { ru: 'Вольфрам', kz: 'Вольфрам', en: 'Tungsten', zh: '钨' },
  PB: { ru: 'Свинец', kz: 'Қорғасын', en: 'Lead', zh: '铅' },
  AG: { ru: 'Серебро', kz: 'Күміс', en: 'Silver', zh: '银' },
  MO: { ru: 'Молибден', kz: 'Молибден', en: 'Molybdenum', zh: '钼' },
  FE: { ru: 'Железо', kz: 'Темір', en: 'Iron', zh: '铁' },
  MN: { ru: 'Марганец', kz: 'Марганец', en: 'Manganese', zh: '锰' },
  CR: { ru: 'Хром', kz: 'Хром', en: 'Chromium', zh: '铬' },
  U: { ru: 'Уран', kz: 'Уран', en: 'Uranium', zh: '铀' },
};

// Region spellings used by the leads export that differ from filter-config.
const REGION_ALIASES: Record<string, string> = {
  вко: 'восточно-казахстанская',
  костанай: 'костанайская',
  'семипалатинская/абайская': 'абайская',
};

/**
 * Registry commodity → localized name. Handles 'Au', 'Pb-Zn', 'Au+Cu' and
 * annotated values like 'Au россыпь'; unknown values are returned as-is.
 */
export function leadMineralName(
  mineral: string | null | undefined,
  locale: Locale
): string {
  const raw = (mineral ?? '').trim();
  const head = raw.split(/\s+/)[0] ?? '';
  const names = head
    .split(/[+\-–\/]/)
    .filter(Boolean)
    .map((part) => MINERALS[part.toUpperCase()]?.[locale]);
  if (!names.length || names.some((n) => !n)) return raw;
  const parts = names as string[];
  if (locale === 'zh') return parts.join('');
  if (locale === 'en') return parts.join('-');
  return [parts[0], ...parts.slice(1).map((n) => n.toLowerCase())].join('-');
}

/** Localized region name, or '' when the export value is not a known region. */
export function leadRegionName(
  region: string | null | undefined,
  locale: Locale
): string {
  const raw = (region ?? '').trim().toLowerCase();
  if (!raw) return '';
  const key = REGION_ALIASES[raw] ?? raw;
  const match = REGIONS.find(
    (r) =>
      r.id === key || Object.values(r.name).some((n) => n.toLowerCase() === key)
  );
  return match ? match.name[locale] : '';
}

export function leadSeoText(
  lead: LeadSeoInput,
  locale: Locale
): { title: string; description: string } {
  const mineral = leadMineralName(lead.mineral, locale);
  const region = leadRegionName(lead.region, locale);
  const where = region
    ? translate(locale, 'seo.lead.where', { region })
    : translate(locale, 'seo.lead.whereNone');
  const params = {
    mineral,
    where,
    code: lead.code,
    checked: formatCheckDate(lead.last_verified, locale),
  };
  const free = (lead.license_status ?? '').startsWith('FREE');
  const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
  return {
    title: clean(translate(locale, 'seo.lead.title', params)),
    description: clean(
      translate(
        locale,
        free ? 'seo.lead.descriptionFree' : 'seo.lead.descriptionOther',
        params
      )
    ).slice(0, 200),
  };
}
