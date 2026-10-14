import {
  normalizeIntake,
  validateIntakeStep,
  emptyIntake,
  fromDraft,
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
      region: 'almaty-region',
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

describe('intake for the new sections', () => {
  it('keeps only fields relevant to the chosen section', () => {
    const lab = {
      ...emptyIntake(),
      offerType: 'SERVICE',
      category: 'labService',
      accredited: 'true',
      accreditationNumber: 'KZ.T.02.1234',
      ownCrew: 'true',
      kind: 'BULLDOZER',
      powerKw: '100',
      serviceMethods: ['FIRE_ASSAY'],
      serviceArea: ['ALL_KZ'],
    };
    expect(normalizeIntake(lab)).toMatchObject({
      accredited: true,
      accreditationNumber: 'KZ.T.02.1234',
      ownCrew: true,
      serviceMethods: ['FIRE_ASSAY'],
      serviceArea: ['ALL_KZ'],
    });
    expect(normalizeIntake(lab)).not.toHaveProperty('kind');
    expect(normalizeIntake(lab)).not.toHaveProperty('powerKw');
    const generator = {
      ...emptyIntake(),
      offerType: 'SALE',
      category: 'camp',
      kind: 'GENERATOR',
      powerKw: '120',
      serviceArea: ['abai'],
    };
    expect(normalizeIntake(generator)).toMatchObject({
      kind: 'GENERATOR',
      powerKw: 120,
    });
    expect(normalizeIntake(generator)).not.toHaveProperty('serviceArea');
  });

  it('asks for a machine type and service methods on the details step', () => {
    const base = {
      ...emptyIntake(),
      title: 'X',
      region: 'abai',
      city: 'Semey',
      availability: 'Now',
    };
    expect(
      validateIntakeStep(
        { ...base, offerType: 'RENT', category: 'excavator' },
        2
      )
    ).toContain('kind');
    expect(
      validateIntakeStep(
        { ...base, offerType: 'SERVICE', category: 'geophysService' },
        2
      )
    ).toContain('serviceMethods');
  });

  it('restores arrays from a saved draft', () => {
    const value = fromDraft({
      schemaVersion: 2,
      offerType: 'SERVICE',
      category: 'geochemService',
      serviceMethods: ['SOIL'],
      serviceArea: ['abai'],
      ownCrew: true,
    });
    expect(value.serviceMethods).toEqual(['SOIL']);
    expect(value.serviceArea).toEqual(['abai']);
    expect(value.ownCrew).toBe('true');
  });
});
