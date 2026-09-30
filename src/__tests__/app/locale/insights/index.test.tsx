/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import InsightsPage from '@/app/[locale]/insights/page';
import { listArticles } from '@/lib/insights/content';
import { translate } from '@/lib/i18n/translations';
import { formatCheckDate } from '@/lib/leads/check-date';
import type { Locale } from '@/lib/seo/site';
import { HREFLANG, localeUrl } from '@/lib/seo/site';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('@/lib/insights/content', () => {
  const actual = jest.requireActual('@/lib/insights/content');
  return { ...actual, listArticles: jest.fn(actual.listArticles) };
});

function collectionAndLinks(html: string) {
  const scripts = [
    ...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g),
  ].map((match) => JSON.parse(match[1]));
  const collection = scripts.find((data) => data['@type'] === 'CollectionPage');
  const links = [
    ...html.matchAll(/<a(?=[^>]*class="insight-index-row)[^>]*href="([^"]+)"/g),
  ].map((match) => match[1]);
  return { scripts, collection, links };
}

it.each(['ru', 'kz', 'en', 'zh'])(
  'renders the full %s article index as editorial rows with existing facts and links',
  async (rawLocale) => {
    const locale = rawLocale as Locale;
    const html = renderToStaticMarkup(
      await InsightsPage({ params: Promise.resolve({ locale }) })
    );
    const visible = html
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');
    const cards = listArticles(locale);
    expect(html.match(/class="insight-index-row/g) ?? []).toHaveLength(
      cards.length
    );
    for (const card of cards) {
      expect(html).toContain(`href="/${card.locale}/insights/${card.slug}"`);
      expect(visible).toContain(card.title);
      expect(visible).toContain(card.description);
      expect(html).toContain(
        translate(locale, `insights.categories.${card.category}`)
      );
      expect(html).toContain(formatCheckDate(card.updated, locale));
      expect(html).toContain(
        translate(locale, 'insights.readingTime', { n: card.readingMinutes })
      );
    }
    expect(html).not.toContain('/brand/archive-to-field');

    const { scripts, collection, links } = collectionAndLinks(html);
    expect(scripts.some((data) => data['@type'] === 'BreadcrumbList')).toBe(
      true
    );
    expect(collection).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: translate(locale, 'insights.title'),
      description: translate(locale, 'insights.subtitle'),
      url: localeUrl(locale, '/insights'),
      inLanguage: HREFLANG[locale],
    });
    expect(collection.mainEntity.numberOfItems).toBe(cards.length);
    expect(collection.mainEntity.itemListElement).toHaveLength(links.length);
    expect(
      collection.mainEntity.itemListElement.map(
        (item: {
          position: number;
          name: string;
          url: string;
          item: { inLanguage: string };
        }) => ({
          position: item.position,
          name: item.name,
          url: item.url,
          inLanguage: item.item.inLanguage,
        })
      )
    ).toEqual(
      cards.map((card, index) => ({
        position: index + 1,
        name: card.title,
        url: new URL(links[index], 'https://qaznedr.kz').href,
        inLanguage: HREFLANG[card.locale],
      }))
    );
  }
);

it('serializes an escaped fallback card without closing the JSON-LD script', async () => {
  const original = jest
    .requireActual('@/lib/insights/content')
    .listArticles('zh');
  const cards = [
    {
      ...original[0],
      locale: 'ru' as const,
      title: '</script><script>alert(1)</script> & test',
    },
  ];
  const mock = listArticles as jest.MockedFunction<typeof listArticles>;
  mock.mockReturnValueOnce(cards);
  const html = renderToStaticMarkup(
    await InsightsPage({ params: Promise.resolve({ locale: 'zh' }) })
  );
  const { collection, links } = collectionAndLinks(html);
  expect(html).not.toContain('</script><script>alert(1)');
  expect(collection.mainEntity.itemListElement[0].item).toMatchObject({
    name: cards[0].title,
    url: localeUrl('ru', `/insights/${cards[0].slug}`),
    inLanguage: 'ru',
  });
  expect(links).toEqual([`/ru/insights/${cards[0].slug}`]);
});
