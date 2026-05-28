// Types for the closed-leads feature. LeadTeaser is the ONLY shape exposed publicly —
// it physically omits every private field. LeadPrivate is server-only (gated render).

export type LeadTier = 'TIER1_PLACER' | 'TIER2_BOMB';
export type LeadExclusivity = 'MASS' | 'EXCLUSIVE';
export type LeadStatus = 'DRAFT' | 'PUBLISHED' | 'SOLD' | 'ARCHIVED';
export type LeadType = 'placer' | 'bedrock' | 'other';

/** Public teaser — safe to ship to the browser and index. NO name/coords/source. */
export interface LeadTeaser {
  code: string;
  mineral: string;
  type: LeadType;
  region: string | null;
  tier: LeadTier;
  exclusivity: LeadExclusivity;
  teaser_title: string | null;
  teaser_summary: string | null;
  grade_display: string | null;
  grade_label: string | null;
  byproducts_display: string | null;
  reserve_categories: string[] | null;
  license_status: string | null;
  last_verified: string | null;
  distance_band: string | null;
  map_centroid: { lat: number; lon: number } | null;
  fair_value_min_usd_m: number | null;
  fair_value_max_usd_m: number | null;
  jorc_potential_usd_m: number | null;
  price_display: string | null;
  confidence: number | null;
  status: LeadStatus;
  sold_count: number;
}

/** Explicit allow-list of teaser columns — used in every public .select() (never `*`). */
export const TEASER_COLUMNS =
  'code,mineral,type,region,tier,exclusivity,teaser_title,teaser_summary,' +
  'grade_display,grade_label,byproducts_display,reserve_categories,license_status,' +
  'last_verified,distance_band,map_centroid,fair_value_min_usd_m,fair_value_max_usd_m,' +
  'jorc_potential_usd_m,price_display,confidence,status,sold_count';

/** Gated — server-only. Never imported into a client component. */
export interface LeadPrivate {
  lead_id: string;
  registry_ref: string;
  name: string | null;
  name_variants: string | null;
  raion: string | null;
  locality: string | null;
  lat: number | null;
  lon: number | null;
  gps_accuracy_km: number | null;
  grade_full: string | null;
  reserves_full: unknown;
  holder: string | null;
  contract_id: string | null;
  source_books: string | null;
  our_files: string | null;
  methodology: string | null;
  ssot_doc: string | null;
  extraction_notes: string | null;
}

export const TIER_LABELS: Record<LeadTier, string> = {
  TIER1_PLACER: 'Россыпь (старателю)',
  TIER2_BOMB: 'Инвест-объект',
};

export const TYPE_LABELS: Record<LeadType, string> = {
  placer: 'Россыпь',
  bedrock: 'Коренное',
  other: 'Объект',
};

export const EXCLUSIVITY_LABELS: Record<LeadExclusivity, string> = {
  MASS: 'Массовый доступ',
  EXCLUSIVE: 'Эксклюзив (один покупатель)',
};

/** FREE-ish license statuses get the gold "СВОБОДЕН" badge. */
export function isFreeStatus(s: string | null): boolean {
  return !!s && /free/i.test(s) && !/occup/i.test(s);
}
