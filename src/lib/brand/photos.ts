// Generated illustration photos (Higgsfield, 2026-10-20). They show the
// look of a commodity or of our work, never an actual area: every use carries
// the «Иллюстрация» label and no caption may tie a photo to a card's place.

export const SPECIMENS = {
  gold: '/brand/photo/specimen-gold.webp',
  copper: '/brand/photo/specimen-copper.webp',
  coal: '/brand/photo/specimen-coal.webp',
  'lead-zinc': '/brand/photo/specimen-lead-zinc.webp',
  tungsten: '/brand/photo/specimen-tungsten.webp',
  molybdenum: '/brand/photo/specimen-molybdenum.webp',
  iron: '/brand/photo/specimen-iron.webp',
} as const;

export type SpecimenKey = keyof typeof SPECIMENS;

const BY_SYMBOL: Record<string, SpecimenKey> = {
  Au: 'gold',
  Cu: 'copper',
  coal: 'coal',
  Pb: 'lead-zinc',
  Zn: 'lead-zinc',
  W: 'tungsten',
  Mo: 'molybdenum',
  Fe: 'iron',
};

/** The specimen for a card's first known commodity symbol, if any. */
export function specimenFor(commodity: readonly string[]): SpecimenKey | null {
  for (const symbol of commodity) {
    const key = BY_SYMBOL[symbol];
    if (key) return key;
  }
  return null;
}

export const SCENES = {
  mapDesk: '/brand/photo/scene-map-desk.webp',
  coreStore: '/brand/photo/scene-core-store.webp',
  fieldCamp: '/brand/photo/scene-field-camp.webp',
  geologists: '/brand/photo/scene-geologists.webp',
  drillRig: '/brand/photo/scene-drill-rig.webp',
  coreStill: '/brand/photo/scene-core-still.webp',
  foothills: '/brand/photo/foothills.webp',
  folds: '/brand/photo/folds.webp',
  geologist: '/brand/photo/geologist.webp',
  ridges: '/brand/photo/hero-ridges.webp',
} as const;
