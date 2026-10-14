import {
  ownerDraftSchema,
  ownerSubmissionSchema,
  projectPublicListing,
} from '@/lib/equipment-listings/domain';
import {
  CATEGORY_KINDS,
  REGION_IDS,
  SERVICE_METHODS,
  priceUnitsFor,
} from '@/lib/equipment-listings/taxonomy';
import { REGIONS } from '@/lib/data/filter-config';

const contact = {
  schemaVersion: 2,
  title: 'Listing',
  city: 'Karaganda',
  region: 'karagandy',
  availability: 'Now',
  contactName: 'Owner',
  phone: '+77001234567',
  contactVisibility: 'PUBLIC',
};
const service = (category: string, extra: Record<string, unknown> = {}) => ({
  ...contact,
  offerType: 'SERVICE',
  category,
  ...extra,
});
const machine = (category: string, extra: Record<string, unknown> = {}) => ({
  ...contact,
  offerType: 'RENT',
  category,
  ...extra,
});
const ok = (data: unknown) => ownerSubmissionSchema.safeParse(data).success;

describe('marketplace sections', () => {
  it('uses the same region ids as the site filters', () => {
    expect([...REGION_IDS].sort()).toEqual(REGIONS.map((r) => r.id).sort());
    expect(
      ok({
        ...machine('excavator', { kind: 'BULLDOZER' }),
        region: 'Караганда',
      })
    ).toBe(false);
  });

  it('requires a machine type that belongs to the section', () => {
    expect(ok(machine('excavator'))).toBe(false);
    expect(ok(machine('excavator', { kind: 'BULLDOZER', mass: 25 }))).toBe(
      true
    );
    expect(ok(machine('excavator', { kind: 'DUMP_TRUCK' }))).toBe(false);
    expect(ok(machine('camp', { kind: 'GENERATOR', powerKw: 100 }))).toBe(true);
    expect(
      ok(machine('transport', { kind: 'WATER_TRUCK', powerKw: 100 }))
    ).toBe(false);
    // Drafts may stay incomplete.
    expect(ownerDraftSchema.safeParse(machine('excavator')).success).toBe(true);
    for (const kinds of Object.values(CATEGORY_KINDS))
      expect(kinds).toContain('OTHER');
  });

  it('requires service methods from the chosen service section', () => {
    expect(ok(service('geophysService'))).toBe(false);
    expect(
      ok(service('geophysService', { serviceMethods: ['IP', 'MAGNETIC'] }))
    ).toBe(true);
    expect(
      ok(service('geophysService', { serviceMethods: ['FIRE_ASSAY'] }))
    ).toBe(false);
    expect(
      ok(service('geophysService', { serviceMethods: ['IP', 'IP'] }))
    ).toBe(false);
    for (const category of Object.keys(SERVICE_METHODS))
      expect(ok(service(category, { serviceMethods: ['OTHER'] }))).toBe(true);
  });

  it('keeps lab accreditation on labs only', () => {
    expect(
      ok(
        service('labService', {
          serviceMethods: ['FIRE_ASSAY'],
          accredited: true,
          accreditationNumber: 'KZ.T.02.1234',
        })
      )
    ).toBe(true);
    expect(
      ok(
        service('labService', {
          serviceMethods: ['XRF'],
          accreditationNumber: 'X',
        })
      )
    ).toBe(false);
    expect(
      ok(
        service('geochemService', {
          serviceMethods: ['SOIL'],
          accredited: true,
        })
      )
    ).toBe(false);
  });

  it('accepts a service area of regions or the whole country, not for sale', () => {
    const geo = { serviceMethods: ['SOIL'] };
    expect(
      ok(service('geochemService', { ...geo, serviceArea: ['ALL_KZ'] }))
    ).toBe(true);
    expect(
      ok(
        service('geochemService', { ...geo, serviceArea: ['abai', 'zhetysu'] })
      )
    ).toBe(true);
    expect(
      ok(service('geochemService', { ...geo, serviceArea: ['ALL_KZ', 'abai'] }))
    ).toBe(false);
    expect(
      ok({
        ...machine('excavator', { kind: 'LOADER' }),
        offerType: 'SALE',
        serviceArea: ['abai'],
      })
    ).toBe(false);
    expect(ok(machine('drill', { ownCrew: true }))).toBe(false);
    expect(ok(service('geochemService', { ...geo, ownCrew: true }))).toBe(true);
  });

  it('allows section-specific price units', () => {
    const priced = (category: string, priceUnit: string, extra = {}) =>
      ok(
        service(category, {
          serviceMethods: ['OTHER'],
          price: 5000,
          currency: 'KZT',
          priceUnit,
          ...extra,
        })
      );
    expect(priced('labService', 'SAMPLE')).toBe(true);
    expect(priced('geophysService', 'LINE_KM')).toBe(true);
    expect(priced('surveyService', 'HECTARE')).toBe(true);
    expect(priced('labService', 'LINE_KM')).toBe(false);
    expect(priced('designService', 'SAMPLE')).toBe(false);
    expect(priceUnitsFor('drillService', 'SERVICE')).toContain('METER');
    expect(priceUnitsFor('excavator', 'RENT')).toEqual([
      'HOUR',
      'SHIFT',
      'DAY',
    ]);
  });

  it('publishes the new section fields', () => {
    const data = service('labService', {
      serviceMethods: ['FIRE_ASSAY'],
      accredited: true,
      accreditationNumber: 'KZ.T.02.1234',
      serviceArea: ['ALL_KZ'],
      ownCrew: true,
    });
    expect(
      projectPublicListing({
        id: 'x',
        ownerId: 'o',
        status: 'ACTIVE',
        revision: 2,
        data: data as never,
      })
    ).toMatchObject({
      category: 'labService',
      serviceMethods: ['FIRE_ASSAY'],
      accredited: true,
      accreditationNumber: 'KZ.T.02.1234',
      serviceArea: ['ALL_KZ'],
      ownCrew: true,
    });
  });
});
