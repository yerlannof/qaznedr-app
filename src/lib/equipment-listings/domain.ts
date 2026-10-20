import { z } from 'zod';
import {
  CAPABILITY_SOURCES,
  CHASSIS_TYPES,
  CORE_SIZES,
  DRILLING_METHODS,
  DRILLING_PURPOSES,
  DRILLING_SITES,
  DRILLING_TRAJECTORIES,
  MACHINE_CONDITIONS,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_KINDS,
  ALL_SERVICE_METHODS,
  LISTING_CATEGORIES,
  PRICE_UNITS,
  REGION_IDS,
  SERVICE_AREAS,
  OFFER_TYPES,
  WORK_FORMATS,
  isPeopleCategory,
  isServiceCategory,
  kindsFor,
  offerTypesFor,
  priceUnitsFor,
  serviceMethodsFor,
} from './taxonomy';

export const EQUIPMENT_STATUSES = [
  'DRAFT',
  'PENDING_MODERATION',
  'ACTIVE',
  'REJECTED',
  'ARCHIVED',
] as const;
export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];

const equipmentCategories = EQUIPMENT_CATEGORIES;
const positive = z.number().finite().positive();
const shortText = z.string().trim().min(1).max(160);
const bounded = (max: number) => positive.max(max);
const capability = z
  .object({
    method: z.enum(DRILLING_METHODS),
    depth: bounded(15000).optional(), // m
    diameter: bounded(3000).optional(), // borehole mm, not core diameter
    coreSize: z.enum(CORE_SIZES).optional(),
    source: z.enum(CAPABILITY_SOURCES).optional(),
  })
  .strict()
  .superRefine((row, ctx) => {
    if (row.coreSize && row.method !== 'CORE')
      ctx.addIssue({
        code: 'custom',
        path: ['coreSize'],
        message: 'Core size requires CORE method',
      });
  });

const fields = z
  .object({
    offerType: z.enum(OFFER_TYPES).optional(),
    category: z.enum(LISTING_CATEGORIES).optional(),
    title: shortText.optional(),
    description: z.string().trim().max(5000).optional(),
    region: z.enum(REGION_IDS).optional(),
    city: shortText.optional(),
    price: positive.optional(),
    currency: z.enum(['KZT', 'USD', 'CNY']).optional(),
    priceUnit: z.enum(PRICE_UNITS).optional(),
    availability: shortText.optional(),
    conditions: z.string().trim().max(3000).optional(),
    sourceLanguage: z.enum(['ru', 'kz', 'en', 'zh']).optional(),
    contactName: shortText.optional(),
    company: z.string().trim().max(160).optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+\d[\d\s()\-]*$/)
      .refine((value) => {
        const digits = value.replace(/\D/g, '').length;
        return digits >= 7 && digits <= 15;
      }, 'Use 7–15 digits including country code')
      .max(40)
      .optional(),
    contactVisibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
    method: z.enum(['CORE', 'RC', 'AUGER']).optional(),
    diameter: positive.optional(),
    depth: positive.optional(),
    bucket: positive.optional(),
    mass: positive.optional(),
    schemaVersion: z.literal(2).optional(),
    capabilities: z.array(capability).min(1).max(12).optional(),
    purposes: z
      .array(z.enum(DRILLING_PURPOSES))
      .min(1)
      .max(DRILLING_PURPOSES.length)
      .optional(),
    trajectory: z.enum(DRILLING_TRAJECTORIES).optional(),
    site: z.enum(DRILLING_SITES).optional(),
    brand: shortText.optional(),
    model: shortText.optional(),
    chassis: z.enum(CHASSIS_TYPES).optional(),
    operator: z.boolean().optional(),
    delivery: z.boolean().optional(),
    pressure: bounded(1000).optional(), // bar
    flow: bounded(1000).optional(), // m3/min
    payload: bounded(1000).optional(), // t
    machineYear: z.number().int().min(1900).max(2100).optional(),
    machineCondition: z.enum(MACHINE_CONDITIONS).optional(),
    shiftHours: bounded(24).optional(),
    priceIncludes: z.string().trim().min(1).max(1000).optional(),
    kind: z.enum(EQUIPMENT_KINDS).optional(),
    serviceMethods: z
      .array(z.enum(ALL_SERVICE_METHODS))
      .min(1)
      .max(ALL_SERVICE_METHODS.length)
      .refine((rows) => new Set(rows).size === rows.length, 'Duplicate method')
      .optional(),
    accredited: z.boolean().optional(),
    accreditationNumber: z.string().trim().min(1).max(80).optional(),
    serviceArea: z
      .array(z.enum(SERVICE_AREAS))
      .min(1)
      .max(SERVICE_AREAS.length)
      .refine((rows) => new Set(rows).size === rows.length, 'Duplicate region')
      .optional(),
    ownCrew: z.boolean().optional(),
    powerKw: bounded(5000).optional(),
    experienceYears: z.number().int().min(0).max(60).optional(),
    workFormat: z.enum(WORK_FORMATS).optional(),
  })
  .strict();

type OwnerFields = z.infer<typeof fields>;

function compatible(
  data: OwnerFields,
  ctx: z.RefinementCtx,
  submitted = false
): void {
  const issue = (path: string, message: string) =>
    ctx.addIssue({
      code: 'custom',
      path: [path],
      message,
    });
  const people = isPeopleCategory(data.category);
  if (
    data.offerType &&
    data.category &&
    !offerTypesFor(data.category).includes(data.offerType)
  )
    issue('category', 'Offer type is not valid for this category');
  if (data.offerType === 'SALE' && data.priceUnit && data.priceUnit !== 'ITEM')
    issue('priceUnit', 'Sale price must be per item');
  if (
    (data.offerType === 'RENT' || data.offerType === 'SERVICE') &&
    data.priceUnit === 'ITEM'
  )
    issue('priceUnit', 'Per-item price is only for sale');
  if (!people)
    for (const field of ['experienceYears', 'workFormat'] as const)
      if (data[field] !== undefined) issue(field, 'Field is only for people');
  if (data.schemaVersion === 2) {
    for (const field of ['method', 'diameter', 'depth'] as const)
      if (data[field] !== undefined)
        issue(field, 'Use linked capabilities in v2');
    const drilling =
      data.category === 'drill' || data.category === 'drillService';
    for (const field of [
      'capabilities',
      'purposes',
      'trajectory',
      'site',
    ] as const)
      if (!drilling && data[field] !== undefined)
        issue(field, 'Field is not relevant to category');
    // A drilling offer without a method cannot be found by the main filter.
    if (
      submitted &&
      drilling &&
      data.offerType !== 'WANTED' &&
      !data.capabilities?.length
    )
      issue('capabilities', 'Choose a drilling method');
    if (data.category === 'drillService' && data.chassis !== undefined)
      issue('chassis', 'Field is not relevant to category');
    if (
      !['drill', 'excavator'].includes(data.category ?? '') &&
      data.chassis !== undefined
    )
      issue('chassis', 'Field is not relevant to category');
    if (data.offerType === 'SERVICE' || people) {
      for (const field of ['brand', 'model', 'operator', 'delivery'] as const)
        if (data[field] !== undefined)
          issue(field, 'Field is not relevant to service');
    }
    if (!['compressor'].includes(data.category ?? ''))
      for (const field of ['pressure', 'flow'] as const)
        if (data[field] !== undefined)
          issue(field, 'Field is not relevant to category');
    if (data.category !== 'transport' && data.payload !== undefined)
      issue('payload', 'Field is not relevant to category');
    const kinds = kindsFor(data.category);
    if (data.kind !== undefined && !kinds.includes(data.kind))
      issue('kind', 'Type is not valid for this category');
    if (submitted && kinds.length && data.kind === undefined)
      issue('kind', 'Choose a type');
    const methods = serviceMethodsFor(data.category);
    if (
      data.serviceMethods?.some((method) => !methods.includes(method)) ??
      false
    )
      issue('serviceMethods', 'Method is not valid for this category');
    if (submitted && methods.length && !data.serviceMethods?.length)
      issue('serviceMethods', 'Choose at least one method');
    if (data.category !== 'labService')
      for (const field of ['accredited', 'accreditationNumber'] as const)
        if (data[field] !== undefined)
          issue(field, 'Field is not relevant to category');
    if (data.accreditationNumber !== undefined && data.accredited !== true)
      issue('accreditationNumber', 'Number requires accreditation');
    if (data.serviceArea !== undefined) {
      if (data.offerType === 'SALE' || data.offerType === 'WANTED')
        issue('serviceArea', 'Service area is not used for sale or requests');
      if (data.serviceArea.includes('ALL_KZ') && data.serviceArea.length > 1)
        issue('serviceArea', 'Whole country excludes single regions');
    }
    if ((data.offerType !== 'SERVICE' || people) && data.ownCrew !== undefined)
      issue('ownCrew', 'Field is only for services');
    if (data.category !== 'camp' && data.powerKw !== undefined)
      issue('powerKw', 'Field is not relevant to category');
    if (data.offerType !== 'SALE')
      for (const field of ['machineYear', 'machineCondition'] as const)
        if (data[field] !== undefined) issue(field, 'Field is only for sale');
    if (
      data.offerType === 'SALE' &&
      !equipmentCategories.includes(
        data.category as (typeof equipmentCategories)[number]
      )
    )
      for (const field of ['machineYear', 'machineCondition'] as const)
        if (data[field] !== undefined) issue(field, 'Field requires equipment');
    for (const [field, max] of [
      ['bucket', 100],
      ['mass', 1000],
      ['price', 1_000_000_000_000],
    ] as const)
      if (data[field] !== undefined && data[field] > max)
        issue(field, 'Value exceeds supported range');
    if (data.price === undefined) {
      if (data.currency !== undefined)
        issue('currency', 'Omit currency when price is on request');
      if (data.priceUnit !== undefined)
        issue('priceUnit', 'Omit unit when price is on request');
      if (data.shiftHours !== undefined)
        issue('shiftHours', 'Shift hours require a priced shift');
    } else {
      if (submitted && !data.currency)
        issue('currency', 'Currency required with price');
      if (submitted && !data.priceUnit)
        issue('priceUnit', 'Unit required with price');
      if (data.priceUnit === 'SHIFT') {
        if (submitted && !data.shiftHours)
          issue('shiftHours', 'Shift duration required');
      } else if (data.shiftHours !== undefined)
        issue('shiftHours', 'Shift hours require SHIFT unit');
    }
    if (data.priceUnit) {
      const allowed: readonly string[] = data.category
        ? priceUnitsFor(data.category, data.offerType)
        : data.offerType === 'SALE'
          ? ['ITEM']
          : data.offerType === 'RENT'
            ? ['HOUR', 'SHIFT', 'DAY']
            : data.offerType === 'WANTED'
              ? ['HOUR', 'SHIFT', 'DAY', 'OBJECT', 'ITEM', 'MONTH']
              : ['HOUR', 'SHIFT', 'DAY', 'OBJECT'];
      if (!allowed.includes(data.priceUnit))
        issue('priceUnit', 'Unit is not valid for this offer');
    }
  } else {
    for (const field of [
      'capabilities',
      'purposes',
      'trajectory',
      'site',
      'brand',
      'model',
      'chassis',
      'operator',
      'delivery',
      'pressure',
      'flow',
      'payload',
      'machineYear',
      'machineCondition',
      'shiftHours',
      'priceIncludes',
      'kind',
      'serviceMethods',
      'accredited',
      'accreditationNumber',
      'serviceArea',
      'ownCrew',
      'powerKw',
      'experienceYears',
      'workFormat',
    ] as const)
      if (data[field] !== undefined)
        issue(field, 'Field requires schemaVersion 2');
    if (submitted) {
      if (!data.currency)
        issue('currency', 'Currency required for legacy listing');
      if (!data.priceUnit)
        issue('priceUnit', 'Unit required for legacy listing');
    }
  }
  if (data.category) {
    const drilling =
      data.category === 'drill' || data.category === 'drillService';
    if (!drilling && data.method !== undefined)
      issue('method', 'Field is not relevant to category');
    if (!drilling && data.diameter !== undefined)
      issue('diameter', 'Field is not relevant to category');
    if (!drilling && data.depth !== undefined)
      issue('depth', 'Field is not relevant to category');
    if (data.category !== 'excavator' && data.bucket !== undefined)
      issue('bucket', 'Field is not relevant to category');
    if (data.category !== 'excavator' && data.mass !== undefined)
      issue('mass', 'Field is not relevant to category');
  } else if (
    [data.method, data.diameter, data.depth, data.bucket, data.mass].some(
      (value) => value !== undefined
    )
  ) {
    issue('category', 'Choose a category before characteristics');
  }
}

/** Strict owner request body. Identity, status and moderation metadata are never accepted here. */
export const ownerDraftSchema = fields.superRefine(compatible);

const requiredFields = fields.required({
  offerType: true,
  category: true,
  title: true,
  region: true,
  contactName: true,
  phone: true,
  contactVisibility: true,
});

/** Submission requires a deliberate contact choice; omitted price means price on request. */
export const ownerSubmissionSchema = requiredFields.superRefine((data, ctx) =>
  compatible(data, ctx, true)
);
export type OwnerDraft = z.infer<typeof ownerDraftSchema>;
export type OwnerSubmission = z.infer<typeof ownerSubmissionSchema>;

// PATCH validates only field types. Cross-field rules apply after merging with
// the saved record, so a characteristic can be updated without resending its category.
const patchFields = Object.fromEntries(
  Object.entries(fields.shape).map(([key, schema]) => [key, schema.nullable()])
) as Record<string, z.ZodType>;
export const ownerPatchSchema = z.object(patchFields).strict();

export interface EquipmentListing {
  id: string;
  ownerId: string;
  status: EquipmentStatus;
  revision: number;
  data: OwnerDraft;
  moderationNotes?: string;
  accountEmail?: string;
}

/** actorId must come from trusted server session context, never the owner request body. */
function assertOwner(listing: EquipmentListing, actorId: string): void {
  if (!actorId || listing.ownerId !== actorId)
    throw new Error('Not listing owner');
}

export function submitListing(
  listing: EquipmentListing,
  actorId: string
): EquipmentListing {
  assertOwner(listing, actorId);
  if (listing.status !== 'DRAFT' && listing.status !== 'REJECTED')
    throw new Error('Cannot submit from current status');
  const data = ownerSubmissionSchema.parse(listing.data);
  return {
    ...listing,
    data,
    status: 'PENDING_MODERATION',
    revision: listing.revision + 1,
  };
}

export function editListing(
  listing: EquipmentListing,
  actorId: string,
  input: unknown
): EquipmentListing {
  assertOwner(listing, actorId);
  if (listing.status === 'ARCHIVED')
    throw new Error('Archived listing cannot be edited');
  const patch = ownerPatchSchema.parse(input);
  const merged: Record<string, unknown> = { ...listing.data };
  for (const [field, value] of Object.entries(patch)) {
    if (value === null) delete merged[field];
    else merged[field] = value;
  }
  if (listing.data.schemaVersion === 2 && merged.schemaVersion !== 2)
    throw new Error('Cannot downgrade v2 listing');
  const data =
    listing.status === 'ACTIVE' || listing.status === 'PENDING_MODERATION'
      ? ownerSubmissionSchema.parse(merged)
      : ownerDraftSchema.parse(merged);
  if (JSON.stringify(data) === JSON.stringify(listing.data)) return listing;
  // Every accepted owner field affects public content or the contact choice.
  const status =
    listing.status === 'ACTIVE' ? 'PENDING_MODERATION' : listing.status;
  return { ...listing, data, status, revision: listing.revision + 1 };
}

export interface TrustedModeratorContext {
  actorId: string;
  isAdmin: boolean;
}

/** Context must be built after a server-side admin check; this function does not authenticate. */
export function moderateListing(
  listing: EquipmentListing,
  moderator: TrustedModeratorContext,
  decision: 'APPROVE' | 'REJECT',
  expectedRevision: number,
  rejectionReason?: string
): EquipmentListing {
  if (
    !moderator.isAdmin ||
    !moderator.actorId ||
    moderator.actorId === listing.ownerId
  )
    throw new Error('Moderator required');
  if (listing.status !== 'PENDING_MODERATION')
    throw new Error('Listing is not pending');
  if (listing.revision !== expectedRevision)
    throw new Error('Stale moderation revision');
  if (decision === 'REJECT' && !rejectionReason?.trim())
    throw new Error('Rejection reason required');
  const data = ownerSubmissionSchema.parse(listing.data);
  return {
    ...listing,
    data,
    status: decision === 'APPROVE' ? 'ACTIVE' : 'REJECTED',
    revision: listing.revision + 1,
    moderationNotes:
      decision === 'REJECT' ? rejectionReason!.trim() : undefined,
  };
}

export function archiveListing(
  listing: EquipmentListing,
  actorId: string
): EquipmentListing {
  assertOwner(listing, actorId);
  if (listing.status === 'ARCHIVED')
    throw new Error('Listing already archived');
  return { ...listing, status: 'ARCHIVED', revision: listing.revision + 1 };
}

/** Build a new public object from an explicit column allowlist. Call only after DB-level isolation. */
export function projectPublicListing(listing: EquipmentListing) {
  if (listing.status !== 'ACTIVE') return null;
  const data = ownerSubmissionSchema.parse(listing.data);
  const publicContact = data.contactVisibility === 'PUBLIC';
  return {
    id: listing.id,
    offerType: data.offerType,
    category: data.category,
    title: data.title,
    description: data.description,
    region: data.region,
    city: data.city,
    price: data.price,
    currency: data.currency,
    priceUnit: data.priceUnit,
    availability: data.availability,
    conditions: data.conditions,
    sourceLanguage: data.sourceLanguage,
    schemaVersion: data.schemaVersion,
    capabilities: data.capabilities?.map((row) => ({
      method: row.method,
      depth: row.depth,
      diameter: row.diameter,
      coreSize: row.coreSize,
      source: row.source,
    })),
    purposes: data.purposes,
    trajectory: data.trajectory,
    site: data.site,
    brand: data.brand,
    model: data.model,
    chassis: data.chassis,
    operator: data.operator,
    delivery: data.delivery,
    pressure: data.pressure,
    flow: data.flow,
    payload: data.payload,
    machineYear: data.machineYear,
    machineCondition: data.machineCondition,
    shiftHours: data.shiftHours,
    priceIncludes: data.priceIncludes,
    kind: data.kind,
    serviceMethods: data.serviceMethods,
    accredited: data.accredited,
    accreditationNumber: data.accreditationNumber,
    serviceArea: data.serviceArea,
    ownCrew: data.ownCrew,
    powerKw: data.powerKw,
    experienceYears: data.experienceYears,
    workFormat: data.workFormat,
    method: data.method,
    diameter: data.diameter,
    depth: data.depth,
    bucket: data.bucket,
    mass: data.mass,
    ...(publicContact
      ? {
          contactName: data.contactName,
          company: data.company,
          phone: data.phone,
        }
      : {}),
  };
}
