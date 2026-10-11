import raw from './offers.v1.json';
import { parseOffer, type AssetOffer } from './contract';

// Cards ship with the code (small, owner-approved, anonymised). A card that
// fails the contract is dropped, never half-rendered.
const ALL: AssetOffer[] = (raw as unknown[]).flatMap((row) => {
  const offer = parseOffer(row);
  return offer ? [offer] : [];
});

export function listPublishedOffers(): AssetOffer[] {
  return ALL.filter((o) => o.status === 'published');
}

export function getOffer(code: string): AssetOffer | null {
  return ALL.find((o) => o.code === code) ?? null;
}
