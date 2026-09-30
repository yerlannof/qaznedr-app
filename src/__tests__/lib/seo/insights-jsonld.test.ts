import { insightsCollectionJsonLd } from '@/lib/seo/insights-jsonld';
import { localeUrl } from '@/lib/seo/site';
import type { ArticleCard } from '@/lib/insights/content';

it('builds a CollectionPage from visible cards, with fallback language and safe values intact', () => {
  const cards: ArticleCard[] = [
    {
      slug: 'a',
      locale: 'zh',
      title: 'A <script> & B',
      description: 'One',
      category: 'geology',
      updated: '2026-09-29',
      readingMinutes: 2,
    },
    {
      slug: 'b',
      locale: 'ru',
      title: 'Русский',
      description: 'Two',
      category: 'law',
      updated: '2026-09-29',
      readingMinutes: 3,
    },
  ];
  const schema = insightsCollectionJsonLd(
    'zh',
    'Guides <test>',
    'Description & more',
    cards
  );
  expect(schema).toMatchObject({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Guides <test>',
    description: 'Description & more',
    inLanguage: 'zh-CN',
    url: localeUrl('zh', '/insights'),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: 2,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: cards[0].title,
          url: localeUrl('zh', '/insights/a'),
          item: {
            '@type': 'Article',
            name: cards[0].title,
            url: localeUrl('zh', '/insights/a'),
            inLanguage: 'zh-CN',
          },
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: cards[1].title,
          url: localeUrl('ru', '/insights/b'),
          item: {
            '@type': 'Article',
            name: cards[1].title,
            url: localeUrl('ru', '/insights/b'),
            inLanguage: 'ru',
          },
        },
      ],
    },
  });
});
