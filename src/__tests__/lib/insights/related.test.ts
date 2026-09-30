import { listArticles } from '@/lib/insights/content';
import { orderRelatedArticles, RELATED_GUIDES } from '@/lib/insights/related';
import { GUIDE, INSIGHTS } from '@/lib/insights/registry';
import { LOCALES } from '@/lib/seo/site';

describe('related guides', () => {
  it('defines only distinct, existing neighbours for all twelve guides', () => {
    expect(Object.keys(RELATED_GUIDES).sort()).toEqual(
      INSIGHTS.map((entry) => entry.slug).sort()
    );
    for (const [slug, neighbours] of Object.entries(RELATED_GUIDES)) {
      expect(neighbours.length).toBeGreaterThan(0);
      expect(new Set(neighbours).size).toBe(neighbours.length);
      expect(neighbours).not.toContain(slug);
      for (const neighbour of neighbours) {
        expect(INSIGHTS.map((entry) => entry.slug)).toContain(neighbour);
      }
    }
  });

  it.each(LOCALES)(
    'keeps every other %s card with its original facts and fallback',
    (locale) => {
      const cards = listArticles(locale);
      for (const current of INSIGHTS) {
        const ordered = orderRelatedArticles(current.slug, cards);
        expect(ordered).toHaveLength(cards.length - 1);
        expect(ordered).toEqual(
          expect.arrayContaining(
            cards.filter((card) => card.slug !== current.slug)
          )
        );
        expect(new Set(ordered.map((card) => card.slug)).size).toBe(
          ordered.length
        );
        expect(ordered.some((card) => card.slug === current.slug)).toBe(false);
        expect(
          ordered
            .slice(0, RELATED_GUIDES[current.slug].length)
            .map((card) => card.slug)
        ).toEqual(RELATED_GUIDES[current.slug]);
        const rest = ordered.slice(RELATED_GUIDES[current.slug].length);
        expect(rest).toEqual(
          cards.filter(
            (card) =>
              card.slug !== current.slug &&
              !RELATED_GUIDES[current.slug].includes(card.slug)
          )
        );
      }
    }
  );

  it('puts licensing/legal neighbours first and map/field geology neighbours first', () => {
    const cards = listArticles('ru');
    expect(orderRelatedArticles(GUIDE.foreignInvestor, cards)[0].slug).toBe(
      GUIDE.explorationLicence
    );
    expect(orderRelatedArticles(GUIDE.geologicalMap, cards)[0].slug).toBe(
      GUIDE.eastKazakhstanGoldMap
    );
  });
});
