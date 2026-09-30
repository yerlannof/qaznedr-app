import type { ArticleCard } from './content';
import { GUIDE } from './registry';

/** Editorial neighbours for the twelve published guides. The remaining cards
 * keep their registry order, so every guide remains reachable. */
export const RELATED_GUIDES: Readonly<Record<string, readonly string[]>> = {
  [GUIDE.foreignInvestor]: [
    GUIDE.explorationLicence,
    GUIDE.rightsTransfer,
    GUIDE.pugfn,
  ],
  [GUIDE.explorationLicence]: [
    GUIDE.foreignInvestor,
    GUIDE.artisanalMining,
    GUIDE.pugfn,
  ],
  [GUIDE.reserveClassification]: [
    GUIDE.geologicalDueDiligence,
    GUIDE.coreDrilling,
    GUIDE.whatIsGeology,
  ],
  [GUIDE.rightsTransfer]: [
    GUIDE.foreignInvestor,
    GUIDE.explorationLicence,
    GUIDE.pugfn,
  ],
  [GUIDE.geologicalMap]: [
    GUIDE.eastKazakhstanGoldMap,
    GUIDE.satelliteGoldMap,
    GUIDE.whatIsGeology,
  ],
  [GUIDE.eastKazakhstanGoldMap]: [
    GUIDE.geologicalMap,
    GUIDE.satelliteGoldMap,
    GUIDE.coreDrilling,
  ],
  [GUIDE.whatIsGeology]: [
    GUIDE.geologicalMap,
    GUIDE.coreDrilling,
    GUIDE.geologicalDueDiligence,
  ],
  [GUIDE.geologicalDueDiligence]: [
    GUIDE.reserveClassification,
    GUIDE.coreDrilling,
    GUIDE.geologicalMap,
  ],
  [GUIDE.coreDrilling]: [
    GUIDE.geologicalDueDiligence,
    GUIDE.reserveClassification,
    GUIDE.whatIsGeology,
  ],
  [GUIDE.satelliteGoldMap]: [
    GUIDE.geologicalMap,
    GUIDE.eastKazakhstanGoldMap,
    GUIDE.geologicalDueDiligence,
  ],
  [GUIDE.artisanalMining]: [
    GUIDE.explorationLicence,
    GUIDE.foreignInvestor,
    GUIDE.pugfn,
  ],
  [GUIDE.pugfn]: [
    GUIDE.explorationLicence,
    GUIDE.foreignInvestor,
    GUIDE.rightsTransfer,
  ],
};

export function orderRelatedArticles(
  currentSlug: string,
  cards: readonly ArticleCard[]
): ArticleCard[] {
  const others = cards.filter((card) => card.slug !== currentSlug);
  const preferred = RELATED_GUIDES[currentSlug] ?? [];
  const bySlug = new Map(others.map((card) => [card.slug, card]));
  const related = preferred.flatMap((slug) => {
    const card = bySlug.get(slug);
    if (!card) return [];
    bySlug.delete(slug);
    return [card];
  });
  return [...related, ...others.filter((card) => bySlug.has(card.slug))];
}
