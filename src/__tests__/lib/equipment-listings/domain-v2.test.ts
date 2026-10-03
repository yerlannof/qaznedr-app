import {
  editListing,
  ownerDraftSchema,
  ownerSubmissionSchema,
  projectPublicListing,
  submitListing,
  type EquipmentListing,
} from '@/lib/equipment-listings/domain';

const base = {
  schemaVersion: 2,
  offerType: 'RENT',
  category: 'drill',
  title: 'Drill',
  city: 'Karaganda',
  region: 'Karaganda',
  availability: 'Now',
  contactName: 'Owner',
  phone: '+77001234567',
  contactVisibility: 'PRIVATE',
  capabilities: [
    {
      method: 'CORE',
      diameter: 96,
      depth: 1200,
      coreSize: 'HQ',
      source: 'MANUFACTURER',
    },
  ],
};

function listing(
  data: Record<string, unknown>,
  status: EquipmentListing['status'] = 'DRAFT'
): EquipmentListing {
  return {
    id: 'v2',
    ownerId: 'owner',
    status,
    revision: 1,
    data: ownerSubmissionSchema.parse(data),
  };
}

describe('versioned equipment listing', () => {
  it('accepts request-price submission and requires complete priced terms', () => {
    expect(ownerSubmissionSchema.safeParse(base).success).toBe(true);
    expect(
      ownerSubmissionSchema.safeParse({ ...base, price: 100 }).success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({
        ...base,
        price: 100,
        currency: 'KZT',
        priceUnit: 'HOUR',
      }).success
    ).toBe(true);
    expect(
      ownerSubmissionSchema.safeParse({
        ...base,
        price: 100,
        currency: 'KZT',
        priceUnit: 'SHIFT',
      }).success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({
        ...base,
        price: 100,
        currency: 'KZT',
        priceUnit: 'SHIFT',
        shiftHours: 8,
      }).success
    ).toBe(true);
    expect(
      ownerSubmissionSchema.safeParse({ ...base, currency: 'KZT' }).success
    ).toBe(false);
  });

  it('validates capabilities as bounded linked rows and excludes legacy flat drilling fields', () => {
    expect(
      ownerSubmissionSchema.safeParse({ ...base, method: 'RC' }).success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({
        ...base,
        capabilities: Array(13).fill({ method: 'RC' }),
      }).success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({
        ...base,
        capabilities: [{ method: 'RC', coreSize: 'HQ' }],
      }).success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({
        ...base,
        capabilities: [{ method: 'DTH', depth: Infinity }],
      }).success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({
        ...base,
        capabilities: [{ method: 'DTH', diameter: 0 }],
      }).success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({
        ...base,
        capabilities: [{ method: 'DTH', depth: 15001 }],
      }).success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({
        ...base,
        capabilities: [{ method: 'DTH', ownerId: 'evil' }],
      }).success
    ).toBe(false);
    expect(
      ownerDraftSchema.safeParse({
        schemaVersion: 2,
        category: 'drill',
        capabilities: [{ method: 'SONIC' }],
      }).success
    ).toBe(true);
  });

  it('restricts v2 category and offer fields and price units', () => {
    expect(
      ownerSubmissionSchema.safeParse({ ...base, pressure: 15 }).success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({ ...base, capabilities: undefined })
        .success
    ).toBe(true);
    expect(
      ownerSubmissionSchema.safeParse({ ...base, capabilities: [] }).success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({
        ...base,
        capabilities: [{ depth: 1200 }],
      }).success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({ ...base, machineYear: 2020 }).success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({
        ...base,
        price: 100,
        currency: 'KZT',
        priceUnit: 'METER',
      }).success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({
        ...base,
        price: 100,
        currency: 'KZT',
        priceUnit: 'ITEM',
      }).success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({
        ...base,
        purposes: ['WATER'],
        trajectory: 'INCLINED',
        site: 'SURFACE',
        chassis: 'TRACKED',
        operator: true,
        delivery: false,
      }).success
    ).toBe(true);
    expect(
      ownerSubmissionSchema.safeParse({
        ...base,
        category: 'compressor',
        capabilities: undefined,
        pressure: 20,
        flow: 10,
      }).success
    ).toBe(true);
    expect(
      ownerSubmissionSchema.safeParse({
        ...base,
        category: 'transport',
        capabilities: undefined,
        payload: 12,
      }).success
    ).toBe(true);
    expect(
      ownerSubmissionSchema.safeParse({
        ...base,
        offerType: 'SALE',
        price: 100,
        currency: 'USD',
        priceUnit: 'ITEM',
        machineYear: 2020,
        machineCondition: 'USED',
      }).success
    ).toBe(true);
  });

  it('preserves v1 lifecycle and requires explicit clean upgrade without downgrade', () => {
    const v1 = listing({
      ...base,
      schemaVersion: undefined,
      capabilities: undefined,
      method: 'CORE',
      diameter: 96,
      currency: 'KZT',
      priceUnit: 'SHIFT',
    });
    expect(submitListing(v1, 'owner').status).toBe('PENDING_MODERATION');
    expect(() =>
      editListing(v1, 'owner', { capabilities: [{ method: 'CORE' }] })
    ).toThrow();
    const v2 = editListing(v1, 'owner', {
      schemaVersion: 2,
      method: null,
      diameter: null,
      currency: null,
      priceUnit: null,
      capabilities: [{ method: 'CORE', diameter: 96, depth: 1200 }],
    });
    expect(v2.data.schemaVersion).toBe(2);
    expect(() => editListing(v2, 'owner', { schemaVersion: null })).toThrow();
  });

  it('publishes safe v2 fields only and never private contact or injected nested values', () => {
    const active = listing(
      {
        ...base,
        price: 100,
        currency: 'KZT',
        priceUnit: 'SHIFT',
        shiftHours: 8,
        priceIncludes: 'Fuel',
      },
      'ACTIVE'
    );
    const projected = projectPublicListing(active);
    expect(projected).toMatchObject({
      schemaVersion: 2,
      capabilities: base.capabilities,
      shiftHours: 8,
      priceIncludes: 'Fuel',
    });
    expect(projected).not.toHaveProperty('ownerId');
    expect(projected).not.toHaveProperty('phone');
    expect(projected).not.toHaveProperty('contactName');
  });
});
