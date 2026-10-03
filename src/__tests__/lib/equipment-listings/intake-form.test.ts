import {
  normalizeIntake,
  validateIntakeStep,
  emptyIntake,
} from '@/lib/equipment-listings/intake-form';

describe('equipment intake mapping', () => {
  it('requires location and availability before preview', () => {
    const value = {
      ...emptyIntake(),
      offerType: 'RENT',
      category: 'drill',
      title: 'Rig',
      city: 'Almaty',
    };
    expect(validateIntakeStep(value, 2)).toEqual(
      expect.arrayContaining(['region', 'availability'])
    );
  });

  it('keeps capability parameters linked and clears irrelevant data', () => {
    const value = {
      ...emptyIntake(),
      offerType: 'RENT',
      category: 'compressor',
      capabilities: [{ method: 'CORE', depth: '200', diameter: '96' }],
      pressure: '8',
      price: '',
    };
    expect(normalizeIntake(value)).toMatchObject({
      schemaVersion: 2,
      pressure: 8,
    });
    expect(normalizeIntake(value).capabilities).toBeUndefined();
    expect(normalizeIntake(value).currency).toBeUndefined();
    expect(normalizeIntake(value).priceUnit).toBeUndefined();
  });

  it('rejects invalid raw numeric entries instead of deleting saved values', () => {
    const value = {
      ...emptyIntake(),
      offerType: 'SALE',
      category: 'excavator',
      payload: '-2',
      bucket: 'abc',
    };
    expect(validateIntakeStep(value, 2)).toContain('bucket');
  });

  it('drops drilling fields after a category switch and checks phone length', () => {
    const value = {
      ...emptyIntake(),
      offerType: 'RENT',
      category: 'compressor',
      title: 'Unit',
      region: 'Almaty',
      city: 'Almaty',
      availability: 'Now',
      trajectory: 'VERTICAL',
      site: 'SURFACE',
      capabilities: [
        { method: '', depth: '', diameter: '', coreSize: '', source: '' },
      ],
      phone: '+123',
    };
    expect(normalizeIntake(value)).not.toHaveProperty('trajectory');
    expect(normalizeIntake(value)).not.toHaveProperty('site');
    expect(validateIntakeStep(value, 2)).not.toContain('capabilities.0.method');
    expect(validateIntakeStep(value, 3)).toContain('phone');
  });
});
