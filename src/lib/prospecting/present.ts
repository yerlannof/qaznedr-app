import { translate } from '@/lib/i18n/translations';
import { localeUrl, type Locale } from '@/lib/seo/site';
import type { Point } from './coords';
import { plotGeometry, type Plot } from './plots';

// Display helpers shared by the plot card, the plot page and its SEO.

const NUMBER_LOCALE: Record<Locale, string> = {
  ru: 'ru',
  kz: 'kk',
  en: 'en',
  zh: 'zh',
};

export const PROSPECTING_PATH = '/prospecting';
export const plotPath = (code: string) => `${PROSPECTING_PATH}/${code}`;

/** 4,859 / 4.859 — keeps the precision printed in the licence. */
export function formatArea(ha: number, locale: Locale): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[locale], {
    maximumFractionDigits: 4,
  }).format(ha);
}

/**
 * 2029-04-05 → 05.04.2029, as dates are printed in Kazakh licences;
 * Chinese readers get 2029年4月5日.
 */
export function formatDate(iso: string, locale: Locale): string {
  const [y, m, d] = iso.split('-');
  if (locale === 'zh') return `${y}年${Number(m)}月${Number(d)}日`;
  return `${d}.${m}.${y}`;
}

export function regionName(plot: Plot, locale: Locale): string {
  return translate(locale, `prospecting.regions.${plot.region}`);
}

/** "Алакольский район, область Жетісу · с. Коктума". */
export function placeLine(plot: Plot, locale: Locale): string {
  const where = `${plot.district[locale]}, ${regionName(plot, locale)}`;
  const spot = plot.plot_name?.[locale] ?? plot.locality?.[locale];
  return spot ? `${where} · ${spot}` : where;
}

export function plotTitle(plot: Plot, locale: Locale): string {
  return translate(locale, 'prospecting.title', {
    code: plot.code,
    area: formatArea(plot.area_ha, locale),
  });
}

export function plotSeoText(
  plot: Plot,
  locale: Locale
): { title: string; description: string } {
  const params = {
    code: plot.code,
    area: formatArea(plot.area_ha, locale),
    district: plot.district[locale],
    region: regionName(plot, locale),
    date: formatDate(plot.valid_until, locale),
  };
  return {
    title: translate(locale, 'prospecting.seoTitle', params),
    // Neighbouring plots can share a district and licence term. Include their
    // already-public identifier so descriptions do not collapse into duplicates.
    description: `${plot.code}. ${translate(locale, 'prospecting.seoDescription', params)}`,
  };
}

export function whatsappText(plot: Plot, locale: Locale): string {
  return translate(locale, 'prospecting.whatsappText', {
    code: plot.code,
    district: plot.district[locale],
  });
}

const fixed = (n: number) => n.toFixed(6);

export function mapLinks(center: Point): { google: string; twoGis: string } {
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${fixed(center.lat)},${fixed(center.lon)}`,
    twoGis: `https://2gis.kz/?m=${fixed(center.lon)},${fixed(center.lat)}/16`,
  };
}

/**
 * Place with the licence outline. Not a Product/Offer/JobPosting: the right
 * is not sold (Subsoil Code art. 263) and the holder, not QAZNEDR, employs.
 */
export function plotJsonLd(plot: Plot, locale: Locale) {
  const { title, description } = plotSeoText(plot, locale);
  const { points, center } = plotGeometry(plot);
  const url = localeUrl(locale, plotPath(plot.code));
  const ring = [...points, points[0]]
    .map((p) => `${fixed(p.lat)} ${fixed(p.lon)}`)
    .join(' ');
  return {
    place: {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: title,
      description,
      url,
      geo: {
        '@type': 'GeoShape',
        polygon: ring,
      },
      latitude: Number(fixed(center.lat)),
      longitude: Number(fixed(center.lon)),
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: translate(locale, 'prospecting.factArea'),
          value: plot.area_ha,
          unitCode: 'HAR',
        },
        {
          '@type': 'PropertyValue',
          name: translate(locale, 'prospecting.factValidUntil'),
          value: plot.valid_until,
        },
        {
          '@type': 'PropertyValue',
          name: translate(locale, 'prospecting.factLicense'),
          value: plot.license_number,
        },
      ],
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: `${plot.district[locale]}, ${regionName(plot, locale)}`,
        containedInPlace: { '@type': 'Country', name: 'Kazakhstan' },
      },
    },
    breadcrumb: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: translate(locale, 'navigation.home'),
          item: localeUrl(locale),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: translate(locale, 'prospecting.breadcrumb'),
          item: localeUrl(locale, PROSPECTING_PATH),
        },
        { '@type': 'ListItem', position: 3, name: title, item: url },
      ],
    },
  };
}
