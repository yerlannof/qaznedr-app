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
  'tools', // drilling tools, consumables and spare parts
  'instruments', // field and lab instruments
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
/** People: CVs (offer SERVICE) and vacancies (offer WANTED). */
export const PEOPLE_CATEGORIES = ['staff'] as const;
export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
export type PeopleCategory = (typeof PEOPLE_CATEGORIES)[number];
export type ListingCategory =
  | EquipmentCategory
  | ServiceCategory
  | PeopleCategory;
export const LISTING_CATEGORIES = [
  ...EQUIPMENT_CATEGORIES,
  ...SERVICE_CATEGORIES,
  ...PEOPLE_CATEGORIES,
] as const;

export function isServiceCategory(category: unknown): boolean {
  return (SERVICE_CATEGORIES as readonly unknown[]).includes(category);
}
export function isPeopleCategory(category: unknown): boolean {
  return (PEOPLE_CATEGORIES as readonly unknown[]).includes(category);
}

/** Groups shown in the intake and catalogue, in display order. */
export const CATEGORY_GROUPS = {
  machinery: ['drill', 'excavator', 'compressor', 'transport', 'camp'],
  toolsInstruments: ['tools', 'instruments'],
  services: SERVICE_CATEGORIES,
  people: PEOPLE_CATEGORIES,
} as const;
export type CategoryGroup = keyof typeof CATEGORY_GROUPS;
export function groupOf(category: unknown): CategoryGroup | null {
  for (const [group, items] of Object.entries(CATEGORY_GROUPS))
    if ((items as readonly unknown[]).includes(category))
      return group as CategoryGroup;
  return null;
}

/** WANTED is a request ("ищу"): equipment to rent/buy, a contractor, or staff. */
export const OFFER_TYPES = ['RENT', 'SALE', 'SERVICE', 'WANTED'] as const;
export type OfferType = (typeof OFFER_TYPES)[number];
export function offerTypesFor(category: unknown): readonly OfferType[] {
  if (category === 'tools') return ['SALE', 'WANTED'];
  if (isServiceCategory(category) || isPeopleCategory(category))
    return ['SERVICE', 'WANTED'];
  if ((EQUIPMENT_CATEGORIES as readonly unknown[]).includes(category))
    return ['RENT', 'SALE', 'WANTED'];
  return OFFER_TYPES;
}

export const WORK_FORMATS = ['ROTATION', 'PERMANENT', 'PROJECT'] as const;

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
  tools: [
    'CORE_BITS',
    'DRILL_RODS',
    'CORE_BARRELS',
    'CASING',
    'CORE_BOXES',
    'DRILLING_FLUIDS',
    'SPARE_PARTS',
    'OTHER',
  ],
  instruments: [
    'GEOPHYSICAL_INSTRUMENT',
    'GNSS_RECEIVER',
    'DRONE',
    'XRF_ANALYZER',
    'LAB_EQUIPMENT',
    'SAMPLE_PREP_EQUIPMENT',
    'OTHER',
  ],
  staff: [
    'GEOLOGIST',
    'DRILLER',
    'DRILLER_HELPER',
    'GEOPHYSICIST',
    'SURVEYOR',
    'LAB_TECHNICIAN',
    'MINING_ENGINEER',
    'MACHINE_OPERATOR',
    'DRIVER',
    'CAMP_STAFF',
    'OTHER',
  ],
} as const satisfies Partial<
  Record<EquipmentCategory | PeopleCategory, readonly string[]>
>;
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
  'MONTH',
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
  offerType?: OfferType
): readonly PriceUnit[] {
  if (isPeopleCategory(category)) return ['SHIFT', 'DAY', 'MONTH'];
  if (category === 'tools') return ['ITEM'];
  const service = isServiceCategory(category);
  // A request states a budget in the same units its offers use.
  if (offerType === 'WANTED') return priceUnitsFor(category);
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
