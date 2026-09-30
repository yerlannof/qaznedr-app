import type { ArticleCard } from '@/lib/insights/content';
import { HREFLANG, localeUrl, type Locale } from './site';

/** Structured description of the same cards rendered on /insights. */
export function insightsCollectionJsonLd(
  locale: Locale,
  name: string,
  description: string,
  cards: readonly ArticleCard[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    inLanguage: HREFLANG[locale],
    url: localeUrl(locale, '/insights'),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: cards.length,
      itemListElement: cards.map((card, index) => {
        const url = localeUrl(card.locale, `/insights/${card.slug}`);
        return {
          '@type': 'ListItem',
          position: index + 1,
          name: card.title,
          url,
          item: {
            '@type': 'Article',
            name: card.title,
            url,
            inLanguage: HREFLANG[card.locale],
          },
        };
      }),
    },
  };
}
