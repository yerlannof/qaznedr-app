import {
  normalizeIntake,
  normalizePhone,
  validateIntakeStep,
  emptyIntake,
  fromDraft,
} from '@/lib/equipment-listings/intake-form';
import { ownerSubmissionSchema } from '@/lib/equipment-listings/domain';

describe('equipment intake mapping', () => {
  it('requires the region but leaves city and availability optional', () => {
    const value = {
      ...emptyIntake(),
      offerType: 'RENT',
      category: 'drill',
      title: 'Rig',
    };
    const errors = validateIntakeStep(value, 2);
    expect(errors).toContain('region');
    expect(errors).not.toContain('city');
    expect(errors).not.toContain('availability');
  });

  it.each([
    ['8 701 123 45 67', '+77011234567'],
    ['87011234567', '+77011234567'],
    ['7011234567', '+77011234567'],
    ['+7 (701) 123-45-67', '+77011234567'],
    ['+86 138 0013 8000', '+8613800138000'],
  ])('normalizes phone %s', (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
  });

  it('needs a drilling method to move on, except for a request', () => {
    const blankRow = {
      method: '',
      depth: '',
      diameter: '',
      coreSize: '',
      source: '',
    };
    const value = {
      ...emptyIntake(),
      offerType: 'SERVICE',
      category: 'drillService',
      title: 'Буровые работы',
      region: 'abai',
      serviceArea: ['ALL_KZ'],
      capabilities: [blankRow],
    };
    expect(validateIntakeStep(value, 2)).toContain('capabilities');
    // A draft may still be saved without it.
    expect(validateIntakeStep(value, 2, { draft: true })).toEqual([]);
    expect(
      validateIntakeStep({ ...value, offerType: 'WANTED' }, 2)
    ).not.toContain('capabilities');
    expect(
      validateIntakeStep(
        { ...value, capabilities: [{ ...blankRow, method: 'RC' }] },
        2
      )
    ).toEqual([]);
  });

  it('accepts a local phone number at the contact step', () => {
    const value = {
      ...emptyIntake(),
      offerType: 'RENT',
      category: 'drill',
      title: 'Rig',
      region: 'karagandy',
      contactName: 'Ерлан',
      phone: '8 701 123 45 67',
      contactVisibility: 'PUBLIC',
    };
    expect(validateIntakeStep(value, 3)).not.toContain('phone');
    expect(normalizeIntake(value).phone).toBe('+77011234567');
  });

  const submit = (patch: Record<string, string>, arrays = {}) =>
    ownerSubmissionSchema.safeParse(
      normalizeIntake({
        ...emptyIntake(),
        title: 'T',
        region: 'karagandy',
        contactName: 'A',
        phone: '87011234567',
        contactVisibility: 'PUBLIC',
        ...patch,
        ...arrays,
      })
    );

  it('accepts a vacancy and a CV with people fields', () => {
    expect(
      submit({
        category: 'staff',
        offerType: 'WANTED',
        kind: 'DRILLER_HELPER',
        workFormat: 'ROTATION',
        price: '600000',
        currency: 'KZT',
        priceUnit: 'MONTH',
      }).success
    ).toBe(true);
    const cv = normalizeIntake({
      ...emptyIntake(),
      category: 'staff',
      offerType: 'SERVICE',
      kind: 'GEOLOGIST',
      experienceYears: '0',
      brand: 'ignored',
      ownCrew: 'true',
    });
    expect(cv.experienceYears).toBe(0);
    expect(cv).not.toHaveProperty('brand');
    expect(cv).not.toHaveProperty('ownCrew');
  });

  it('accepts requests and new tool and instrument sections', () => {
    expect(
      submit({
        category: 'drill',
        offerType: 'WANTED',
        price: '5000000',
        currency: 'KZT',
        priceUnit: 'ITEM',
      }).success
    ).toBe(true);
    expect(
      submit(
        { category: 'geophysService', offerType: 'WANTED' },
        { serviceMethods: ['IP'] }
      ).success
    ).toBe(true);
    expect(
      submit({ category: 'tools', offerType: 'SALE', kind: 'CORE_BITS' })
        .success
    ).toBe(true);
    expect(
      submit({ category: 'instruments', offerType: 'RENT', kind: 'DRONE' })
        .success
    ).toBe(true);
  });

  it('rejects actions a section does not allow', () => {
    expect(
      submit({ category: 'tools', offerType: 'RENT', kind: 'CORE_BITS' })
        .success
    ).toBe(false);
    expect(
      submit({ category: 'staff', offerType: 'SALE', kind: 'DRIVER' }).success
    ).toBe(false);
    expect(submit({ category: 'drill', offerType: 'SERVICE' }).success).toBe(
      false
    );
    expect(
      ownerSubmissionSchema.safeParse({
        ...normalizeIntake({
          ...emptyIntake(),
          title: 'T',
          region: 'karagandy',
          contactName: 'A',
          phone: '87011234567',
          contactVisibility: 'PUBLIC',
          category: 'drill',
          offerType: 'RENT',
        }),
        workFormat: 'ROTATION',
      }).success
    ).toBe(false);
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
