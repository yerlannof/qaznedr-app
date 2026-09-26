import { translate } from '@/lib/i18n/translations';
import { leadSeoText, type LeadSeoInput } from './lead-metadata';
import { localeUrl, type Locale } from './site';

/**
 * Structured data for a lead teaser. A Place, not a Product/Offer: the holding
 * does not own or sell these areas (pivot spec §3, red line 1).
 */
export function leadJsonLd(lead: LeadSeoInput, locale: Locale) {
  const { title, description } = leadSeoText(lead, locale);
  const url = localeUrl(locale, `/leads/${lead.code}`);
  return {
    place: {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: title,
      description,
      url,
      containedInPlace: { '@type': 'Country', name: 'Kazakhstan' },
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
          name: translate(locale, 'leadDetail.breadcrumbLeads'),
          item: localeUrl(locale, '/leads'),
        },
        { '@type': 'ListItem', position: 3, name: title, item: url },
      ],
    },
  };
}
