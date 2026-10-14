/** Persisted v2 codes. Units are fixed by field, never supplied by an owner. */
export const DRILLING_METHODS = [
  'CORE',
  'RC',
  'AUGER',
  'ROTARY',
  'DTH',
  'SONIC',
  'OTHER',
] as const;
export type DrillingMethod = (typeof DRILLING_METHODS)[number];
export const DRILLING_PURPOSES = [
  'MINERAL_EXPLORATION',
  'WATER',
  'GEOTECHNICAL',
  'BLASTHOLE',
  'GEOTHERMAL',
  'HDD',
  'OTHER',
] as const;
export const DRILLING_TRAJECTORIES = [
  'VERTICAL',
  'INCLINED',
  'HORIZONTAL',
  'DIRECTIONAL',
] as const;
export const DRILLING_SITES = ['SURFACE', 'UNDERGROUND'] as const;
export const CORE_SIZES = ['BQ', 'NQ', 'HQ', 'PQ', 'OTHER'] as const;
export const CAPABILITY_SOURCES = ['MANUFACTURER', 'OWNER'] as const;
export const CHASSIS_TYPES = ['TRACKED', 'WHEELED', 'TRAILER', 'SKID'] as const;
export const MACHINE_CONDITIONS = ['NEW', 'USED', 'REFURBISHED'] as const;
export const EQUIPMENT_UNITS = {
  depth: 'm',
  diameter: 'mm',
  pressure: 'bar',
  flow: 'm3/min',
  payload: 't',
  mass: 't',
  bucket: 'm3',
} as const;

/** Sections of the marketplace. Equipment is rented or sold; services are performed. */
export const EQUIPMENT_CATEGORIES = [
  'drill',
  'excavator', // earthmoving: excavators, bulldozers, loaders, graders
  'compressor', // compressors and pumps
  'transport',
  'camp', // field camp: trailers, generators, lighting
] as const;
export const SERVICE_CATEGORIES = [
  'drillService',
  'geochemService',
  'geophysService',
  'labService',
  'surveyService',
  'hydroService',
  'designService',
  'geoService', // other geological services
] as const;
export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
export type ListingCategory = EquipmentCategory | ServiceCategory;
export const LISTING_CATEGORIES = [
  ...EQUIPMENT_CATEGORIES,
  ...SERVICE_CATEGORIES,
] as const;

export function isServiceCategory(category: unknown): boolean {
  return (SERVICE_CATEGORIES as readonly unknown[]).includes(category);
}

/** Machine type inside an equipment section; required on submission where listed. */
export const CATEGORY_KINDS = {
  excavator: ['EXCAVATOR', 'BULLDOZER', 'LOADER', 'GRADER', 'BACKHOE', 'OTHER'],
  compressor: ['COMPRESSOR', 'PUMP', 'OTHER'],
  transport: [
    'DUMP_TRUCK',
    'WATER_TRUCK',
    'FUEL_TRUCK',
    'CREW_BUS',
    'LOWBED',
    'FLATBED',
    'OTHER',
  ],
  camp: ['CAMP_TRAILER', 'GENERATOR', 'LIGHT_TOWER', 'WATER_TANK', 'OTHER'],
} as const satisfies Partial<Record<EquipmentCategory, readonly string[]>>;
export const EQUIPMENT_KINDS = [
  ...new Set(Object.values(CATEGORY_KINDS).flat()),
] as [string, ...string[]];

export function kindsFor(category: unknown): readonly string[] {
  return (
    (CATEGORY_KINDS as Record<string, readonly string[]>)[String(category)] ??
    []
  );
}

/** Methods offered by a service section (drilling services use capabilities instead). */
export const SERVICE_METHODS = {
  geochemService: [
    'SOIL',
    'STREAM_SEDIMENT',
    'ROCK_CHIP',
    'LITHOGEOCHEM',
    'BIOGEOCHEM',
    'OTHER',
  ],
  geophysService: [
    'MAGNETIC',
    'GRAVITY',
    'IP',
    'RESISTIVITY',
    'ELECTROMAGNETIC',
    'SEISMIC',
    'GPR',
    'RADIOMETRIC',
    'BOREHOLE_LOGGING',
    'OTHER',
  ],
  labService: [
    'SAMPLE_PREP',
    'FIRE_ASSAY',
    'ICP_MS',
    'ICP_OES',
    'AAS',
    'XRF',
    'MINERALOGY',
    'OTHER',
  ],
  surveyService: [
    'TOPOGRAPHIC',
    'MINE_SURVEY',
    'DRONE_MAPPING',
    'GNSS',
    'OTHER',
  ],
  hydroService: ['WATER_WELLS', 'HYDRO_SURVEY', 'WATER_ANALYSIS', 'OTHER'],
  designService: [
    'EXPLORATION_PROJECT',
    'RESERVES_REPORT',
    'KAZRC_REPORT',
    'EIA',
    'MINING_PROJECT',
    'OTHER',
  ],
  geoService: [
    'GEOLOGICAL_MAPPING',
    'CORE_LOGGING',
    'SAMPLING',
    'CONSULTING',
    'OTHER',
  ],
} as const satisfies Partial<Record<ServiceCategory, readonly string[]>>;
export const ALL_SERVICE_METHODS = [
  ...new Set(Object.values(SERVICE_METHODS).flat()),
] as [string, ...string[]];

export function serviceMethodsFor(category: unknown): readonly string[] {
  return (
    (SERVICE_METHODS as Record<string, readonly string[]>)[String(category)] ??
    []
  );
}

/** Region ids shared with src/lib/data/filter-config.ts REGIONS (17 oblasts). */
export const REGION_IDS = [
  'abai',
  'akmola',
  'aktobe',
  'almaty-region',
  'atyrau',
  'east-kz',
  'karagandy',
  'kostanay',
  'kyzylorda',
  'mangystau',
  'north-kz',
  'pavlodar',
  'south-kz',
  'ulytau',
  'west-kz',
  'zhambyl',
  'zhetysu',
] as const;
/** A service area is a list of regions or the whole country. */
export const SERVICE_AREAS = [...REGION_IDS, 'ALL_KZ'] as const;

export const PRICE_UNITS = [
  'HOUR',
  'SHIFT',
  'DAY',
  'METER',
  'OBJECT',
  'ITEM',
  'SAMPLE',
  'LINE_KM',
  'HECTARE',
] as const;
export type PriceUnit = (typeof PRICE_UNITS)[number];

const serviceUnitExtras: Partial<Record<ServiceCategory, PriceUnit[]>> = {
  drillService: ['METER'],
  geochemService: ['SAMPLE', 'HECTARE'],
  geophysService: ['LINE_KM', 'HECTARE'],
  labService: ['SAMPLE'],
  surveyService: ['HECTARE'],
};

/**
 * Price units valid for a section and offer type. Unknown offer type means any
 * offer the section allows (used by search filters).
 */
export function priceUnitsFor(
  category: unknown,
  offerType?: 'RENT' | 'SALE' | 'SERVICE'
): readonly PriceUnit[] {
  const service = isServiceCategory(category);
  if (offerType === 'SALE') return service ? [] : ['ITEM'];
  if (offerType === 'RENT') return service ? [] : ['HOUR', 'SHIFT', 'DAY'];
  if (offerType === 'SERVICE' || service) {
    if (!service) return [];
    return [
      'HOUR',
      'SHIFT',
      'DAY',
      'OBJECT',
      ...(serviceUnitExtras[category as ServiceCategory] ?? []),
    ];
  }
  return ['HOUR', 'SHIFT', 'DAY', 'ITEM'];
}
