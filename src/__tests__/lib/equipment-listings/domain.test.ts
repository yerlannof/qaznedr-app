import {
  archiveListing,
  editListing,
  moderateListing,
  ownerDraftSchema,
  ownerSubmissionSchema,
  projectPublicListing,
  submitListing,
  type EquipmentListing,
} from '@/lib/equipment-listings/domain';

const complete = {
  offerType: 'RENT',
  category: 'drill',
  title: 'Буровая установка XY-1',
  city: 'Караганда',
  region: 'Карагандинская',
  price: 180000,
  currency: 'KZT',
  priceUnit: 'SHIFT',
  availability: 'Доступна',
  contactName: 'Иван',
  phone: '+7 0000000000',
  contactVisibility: 'PRIVATE',
  method: 'CORE',
  diameter: 76,
};

function listing(overrides: Partial<EquipmentListing> = {}): EquipmentListing {
  return {
    id: 'listing-1',
    ownerId: 'owner-1',
    status: 'DRAFT',
    revision: 1,
    data: ownerSubmissionSchema.parse(complete),
    ...overrides,
  };
}

describe('equipment listing owner input', () => {
  it('permits an incomplete draft and requires explicit submission contact policy', () => {
    expect(ownerDraftSchema.safeParse({ offerType: 'RENT' }).success).toBe(
      true
    );
    expect(
      ownerSubmissionSchema.safeParse({
        ...complete,
        contactVisibility: undefined,
      }).success
    ).toBe(false);
    expect(ownerSubmissionSchema.safeParse(complete).success).toBe(true);
  });

  it('rejects server-controlled fields and unknown fields', () => {
    for (const field of [
      'ownerId',
      'status',
      'moderatorId',
      'moderationNotes',
      'revision',
      'isTrustedSeller',
    ]) {
      expect(
        ownerDraftSchema.safeParse({ ...complete, [field]: 'injected' }).success
      ).toBe(false);
    }
  });

  it('enforces offer/category/price-unit compatibility and positive numbers', () => {
    expect(
      ownerSubmissionSchema.safeParse({ ...complete, offerType: 'SERVICE' })
        .success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({
        ...complete,
        offerType: 'SALE',
        priceUnit: 'SHIFT',
      }).success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({
        ...complete,
        offerType: 'SALE',
        priceUnit: 'ITEM',
      }).success
    ).toBe(true);
    expect(
      ownerDraftSchema.safeParse({ ...complete, diameter: 0 }).success
    ).toBe(false);
    expect(ownerDraftSchema.safeParse({ ...complete, price: -1 }).success).toBe(
      false
    );
    expect(
      ownerDraftSchema.safeParse({
        ...complete,
        category: 'excavator',
        diameter: 76,
      }).success
    ).toBe(false);
    expect(
      ownerDraftSchema.safeParse({ ...complete, category: 'drill', bucket: 1 })
        .success
    ).toBe(false);
  });

  it('requires 7–15 actual digits in an international phone number', () => {
    expect(
      ownerSubmissionSchema.safeParse({ ...complete, phone: '+7------' })
        .success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({ ...complete, phone: '+123456' }).success
    ).toBe(false);
    expect(
      ownerSubmissionSchema.safeParse({
        ...complete,
        phone: '+1234567890123456',
      }).success
    ).toBe(false);
    expect(ownerSubmissionSchema.safeParse(complete).success).toBe(true);
  });
});

describe('equipment listing lifecycle', () => {
  it('submits only a complete owned draft, then permits revision-bound admin review', () => {
    expect(() => submitListing(listing(), 'other-owner')).toThrow();
    const pending = submitListing(listing(), 'owner-1');
    expect(pending.status).toBe('PENDING_MODERATION');
    expect(pending.revision).toBe(2);
    expect(() =>
      moderateListing(
        pending,
        { actorId: 'owner-1', isAdmin: false },
        'APPROVE',
        2
      )
    ).toThrow();
    const active = moderateListing(
      pending,
      { actorId: 'admin-1', isAdmin: true },
      'APPROVE',
      2
    );
    expect(active.status).toBe('ACTIVE');
    expect(active.revision).toBe(3);
  });

  it('moves material active edits back to review and invalidates stale approvals', () => {
    const active = listing({ status: 'ACTIVE' });
    const edited = editListing(active, 'owner-1', { title: 'Новая буровая' });
    expect(edited.status).toBe('PENDING_MODERATION');
    expect(edited.revision).toBe(2);
    const again = editListing(edited, 'owner-1', { city: 'Астана' });
    expect(again.revision).toBe(3);
    expect(() =>
      moderateListing(
        again,
        { actorId: 'admin-1', isAdmin: true },
        'APPROVE',
        2
      )
    ).toThrow();
    expect(() =>
      editListing(active, 'other-owner', { title: 'Tamper' })
    ).toThrow();
    expect(() =>
      editListing(active, 'owner-1', { phone: undefined })
    ).toThrow();
    expect(() =>
      editListing(edited, 'owner-1', { contactVisibility: undefined })
    ).toThrow();
  });

  it('applies a field patch against the saved category, and null clears optional data', () => {
    const active = listing({ status: 'ACTIVE' });
    const diameter = editListing(active, 'owner-1', { diameter: 80 });
    expect(diameter.data.diameter).toBe(80);
    expect(diameter.status).toBe('PENDING_MODERATION');

    const onRequest = editListing(diameter, 'owner-1', { price: null });
    expect(onRequest.data).not.toHaveProperty('price');
    expect(onRequest.revision).toBe(3);

    const excavator = editListing(onRequest, 'owner-1', {
      category: 'excavator',
      method: null,
      diameter: null,
      depth: null,
      bucket: 1.2,
    });
    expect(excavator.data).toMatchObject({
      category: 'excavator',
      bucket: 1.2,
    });
    expect(excavator.data).not.toHaveProperty('method');
    expect(excavator.data).not.toHaveProperty('diameter');

    for (const field of [
      'ownerId',
      'status',
      'moderatorId',
      'moderationNotes',
      'revision',
    ]) {
      expect(() => editListing(active, 'owner-1', { [field]: null })).toThrow();
    }
    expect(() => editListing(active, 'owner-1', { phone: null })).toThrow();
  });

  it('keeps rejected edits private until resubmission and allows owner archival', () => {
    const rejected = listing({ status: 'REJECTED' });
    expect(editListing(rejected, 'owner-1', { title: 'Revised' }).status).toBe(
      'REJECTED'
    );
    expect(submitListing(rejected, 'owner-1').status).toBe(
      'PENDING_MODERATION'
    );
    expect(archiveListing(rejected, 'owner-1').status).toBe('ARCHIVED');
    expect(() =>
      submitListing(archiveListing(rejected, 'owner-1'), 'owner-1')
    ).toThrow();
  });

  it('rejects moderator self-approval and requires a rejection reason', () => {
    const pending = listing({ status: 'PENDING_MODERATION' });
    expect(() =>
      moderateListing(
        pending,
        { actorId: 'owner-1', isAdmin: true },
        'APPROVE',
        1
      )
    ).toThrow();
    expect(() =>
      moderateListing(
        pending,
        { actorId: 'admin-1', isAdmin: true },
        'REJECT',
        1
      )
    ).toThrow();
    expect(
      moderateListing(
        pending,
        { actorId: 'admin-1', isAdmin: true },
        'REJECT',
        1,
        'Need evidence'
      ).status
    ).toBe('REJECTED');
  });
});

describe('public projection', () => {
  it('returns only active allowlisted content and honors contact privacy', () => {
    const privateListing = listing({
      status: 'ACTIVE',
      moderationNotes: 'private',
      accountEmail: 'private@example.com',
    });
    expect(projectPublicListing(listing())).toBeNull();
    const publicData = projectPublicListing(privateListing);
    expect(publicData).toBeTruthy();
    expect(publicData).not.toHaveProperty('ownerId');
    expect(publicData).not.toHaveProperty('moderationNotes');
    expect(publicData).not.toHaveProperty('accountEmail');
    expect(publicData).not.toHaveProperty('phone');
    expect(publicData).not.toHaveProperty('contactName');
    const optedIn = listing({
      status: 'ACTIVE',
      data: ownerSubmissionSchema.parse({
        ...complete,
        contactVisibility: 'PUBLIC',
      }),
    });
    expect(projectPublicListing(optedIn)).toMatchObject({
      contactName: 'Иван',
      phone: '+7 0000000000',
    });
  });
});
