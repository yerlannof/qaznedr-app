import {
  DRILLING_METHODS,
  DRILLING_PURPOSES,
  DRILLING_SITES,
  DRILLING_TRAJECTORIES,
  EQUIPMENT_UNITS,
} from '@/lib/equipment-listings/taxonomy';

it('keeps stable drilling codes and explicit measurement units', () => {
  expect(DRILLING_METHODS).toEqual([
    'CORE',
    'RC',
    'AUGER',
    'ROTARY',
    'DTH',
    'SONIC',
    'OTHER',
  ]);
  expect(DRILLING_PURPOSES).toEqual([
    'MINERAL_EXPLORATION',
    'WATER',
    'GEOTECHNICAL',
    'BLASTHOLE',
    'GEOTHERMAL',
    'HDD',
    'OTHER',
  ]);
  expect(DRILLING_TRAJECTORIES).toEqual([
    'VERTICAL',
    'INCLINED',
    'HORIZONTAL',
    'DIRECTIONAL',
  ]);
  expect(DRILLING_SITES).toEqual(['SURFACE', 'UNDERGROUND']);
  expect(EQUIPMENT_UNITS).toEqual({
    depth: 'm',
    diameter: 'mm',
    pressure: 'bar',
    flow: 'm3/min',
    payload: 't',
    mass: 't',
    bucket: 'm3',
  });
});
