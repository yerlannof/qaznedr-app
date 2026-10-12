import raw from '@/lib/prospecting/plots.v1.json';
import {
  PLOT_CODE,
  getPublicPlot,
  isPublishable,
  listPublicPlots,
  parsePlotsFile,
  plotGeometry,
  type Plot,
} from '@/lib/prospecting/plots';

const visible = listPublicPlots();

describe('plots.v1.json', () => {
  it('validates against the qaznedr-prospecting-v1 contract', () => {
    expect(() => parsePlotsFile(raw)).not.toThrow();
  });

  it('has 20 licences with unique codes and licence numbers', () => {
    const plots = parsePlotsFile(raw);
    expect(plots).toHaveLength(20);
    expect(new Set(plots.map((p) => p.code)).size).toBe(20);
    expect(new Set(plots.map((p) => p.license_number)).size).toBe(20);
  });

  it('publishes the 18 readable licences only', () => {
    expect(visible).toHaveLength(18);
    const codes = visible.map((p) => p.code);
    for (const hidden of ['QN-P12', 'QN-P20']) {
      expect(codes).not.toContain(hidden);
    }
  });

  it.each(visible.map((p) => [p.code, p] as const))(
    '%s: outline area is within 5 %% of the licence area',
    (_code, plot) => {
      const { areaHa } = plotGeometry(plot);
      expect(Math.abs(areaHa / plot.area_ha - 1)).toBeLessThan(0.05);
    }
  );

  it.each(visible.map((p) => [p.code, p] as const))(
    '%s: is a legal prospecting plot (≤ 5 ha, valid dates, Kazakhstan)',
    (_code, plot) => {
      expect(plot.area_ha).toBeLessThanOrEqual(5);
      expect(plot.area_ha).toBeGreaterThanOrEqual(0.05);
      expect(plot.valid_until > plot.issued_at).toBe(true);
      const { center } = plotGeometry(plot);
      expect(center.lat).toBeGreaterThan(40);
      expect(center.lat).toBeLessThan(56);
      expect(center.lon).toBeGreaterThan(46);
      expect(center.lon).toBeLessThan(88);
    }
  );
});

describe('publication gate', () => {
  const base = visible[0];
  const variant = (patch: Partial<Plot>): Plot => ({ ...base, ...patch });

  it('hides plots marked hidden', () => {
    expect(isPublishable(variant({ status: 'hidden' }))).toBe(false);
  });

  it('hides plots without the holder confirmation date', () => {
    expect(isPublishable(variant({ holder_confirmed_at: null }))).toBe(false);
  });

  it('hides plots without a full outline', () => {
    expect(isPublishable(variant({ corners_dms: [] }))).toBe(false);
  });

  it('hides plots whose outline disagrees with the licence area', () => {
    expect(isPublishable(variant({ area_ha: base.area_ha * 2 }))).toBe(false);
  });

  it('keeps matched plots visible', () => {
    expect(isPublishable(variant({ status: 'matched' }))).toBe(true);
  });
});

describe('getPublicPlot', () => {
  it('finds a published plot by code', () => {
    expect(getPublicPlot('QN-P07')?.license_number).toBe('KZ00VZJ00000560');
  });

  it('returns null for hidden, unknown and malformed codes', () => {
    expect(getPublicPlot('QN-P12')).toBeNull();
    expect(getPublicPlot('QN-P99')).toBeNull();
    expect(getPublicPlot('../etc')).toBeNull();
  });

  it('accepts only QN-Pnn codes', () => {
    expect(PLOT_CODE.test('QN-P07')).toBe(true);
    expect(PLOT_CODE.test('QN-07')).toBe(false);
  });
});
