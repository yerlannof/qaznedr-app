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
