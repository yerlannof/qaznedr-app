// Showcase oblast names (pre-2022 grid, as delivered) → map shape id and the
// short region value stored in leads.region for filters and labels.
const OBLASTS: Record<string, { id: string; region: string }> = {
  'Акмолинская область': { id: 'akmola', region: 'Акмолинская' },
  'Актюбинская область': { id: 'aktobe', region: 'Актюбинская' },
  'Алматинская область': { id: 'almaty-region', region: 'Алматинская' },
  'Атырауская область': { id: 'atyrau', region: 'Атырауская' },
  'Восточно-Казахстанская область': { id: 'east-kz', region: 'ВКО' },
  'Жамбылская область': { id: 'zhambyl', region: 'Жамбылская' },
  'Западно-Казахстанская область': {
    id: 'west-kz',
    region: 'Западно-Казахстанская',
  },
  'Карагандинская область': { id: 'karagandy', region: 'Карагандинская' },
  'Костанайская область': { id: 'kostanay', region: 'Костанайская' },
  'Кызылординская область': { id: 'kyzylorda', region: 'Кызылординская' },
  'Мангистауская область': { id: 'mangystau', region: 'Мангистауская' },
  'Павлодарская область': { id: 'pavlodar', region: 'Павлодарская' },
  'Северо-Казахстанская область': {
    id: 'north-kz',
    region: 'Северо-Казахстанская',
  },
  'Туркестанская область': { id: 'south-kz', region: 'Туркестанская' },
  'Южно-Казахстанская область': { id: 'south-kz', region: 'Туркестанская' },
};

export function showcaseRegionId(oblastRu: string): string | undefined {
  return OBLASTS[oblastRu]?.id;
}

export function showcaseRegionValue(oblastRu: string): string | undefined {
  return OBLASTS[oblastRu]?.region;
}
