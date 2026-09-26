import { leadMineralName } from '@/lib/seo/lead-metadata';
import type { Locale } from '@/lib/seo/site';

export const MINERAL_HUBS = [
  { slug: 'gold', symbols: ['Au'] },
  { slug: 'copper', symbols: ['Cu'] },
  { slug: 'lead-zinc', symbols: ['Pb', 'Zn'] },
  { slug: 'molybdenum', symbols: ['Mo'] },
  { slug: 'tungsten', symbols: ['W'] },
  { slug: 'iron', symbols: ['Fe'] },
] as const;

export function mineralHub(slug: string) {
  return MINERAL_HUBS.find((hub) => hub.slug === slug);
}

export function matchesMineral(raw: string, slug: string): boolean {
  const hub = mineralHub(slug);
  if (!hub) return false;
  const symbols = raw
    .trim()
    .split(/\s+/)[0]
    .toUpperCase()
    .split(/[+\-–/]/);
  return hub.symbols.some((symbol) => symbols.includes(symbol.toUpperCase()));
}

export function hubMineralName(slug: string, locale: Locale): string {
  const hub = mineralHub(slug);
  return hub ? leadMineralName(hub.symbols.join('-'), locale) : '';
}
