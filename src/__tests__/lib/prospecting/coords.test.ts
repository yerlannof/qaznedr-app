import {
  centroid,
  dmsToDecimal,
  formatDms,
  polygonAreaHa,
  toPoints,
  type Corner,
} from '@/lib/prospecting/coords';

// QN-P07: KZ00VZJ00000560, 4,96 га по лицензии.
const P07: Corner[] = [
  [45, 41, 8.8534, 81, 59, 6.0346],
  [45, 41, 4.914, 81, 59, 3.9586],
  [45, 41, 0.3133, 81, 59, 20.3544],
  [45, 41, 4.1584, 81, 59, 22.6428],
];

describe('dmsToDecimal', () => {
  it('converts degrees, minutes and seconds', () => {
    expect(dmsToDecimal(45, 41, 8.8534)).toBeCloseTo(45.685793, 6);
    expect(dmsToDecimal(81, 59, 6.0346)).toBeCloseTo(81.98501, 6);
  });
});

describe('toPoints', () => {
  it('returns lat/lon pairs in decimal degrees', () => {
    const [first] = toPoints(P07);
    expect(first.lat).toBeCloseTo(45.685793, 6);
    expect(first.lon).toBeCloseTo(81.98501, 6);
  });
});

describe('polygonAreaHa', () => {
  it('matches the licence area within 1 %', () => {
    expect(polygonAreaHa(toPoints(P07))).toBeCloseTo(4.96, 1);
  });

  it('gives a 100 × 100 m square one hectare', () => {
    const dLat = 100 / 111_195;
    const dLon = 100 / (111_195 * Math.cos((45 * Math.PI) / 180));
    const square = [
      { lat: 45, lon: 80 },
      { lat: 45 + dLat, lon: 80 },
      { lat: 45 + dLat, lon: 80 + dLon },
      { lat: 45, lon: 80 + dLon },
    ];
    expect(polygonAreaHa(square)).toBeCloseTo(1, 2);
  });
});

describe('centroid', () => {
  it('averages the corners', () => {
    const c = centroid(toPoints(P07));
    expect(c.lat).toBeCloseTo(45.6846, 4);
    expect(c.lon).toBeCloseTo(81.987, 3);
  });
});

describe('formatDms', () => {
  it('prints a corner as written in a licence', () => {
    expect(formatDms(45, 41, 8.8534)).toBe('45°41\'08.8534"');
    expect(formatDms(85, 50, 3)).toBe('85°50\'03"');
    expect(formatDms(79, 24, 15.5)).toBe('79°24\'15.5"');
  });
});
