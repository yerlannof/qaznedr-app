import {
  ownerDraftSchema,
  ownerSubmissionSchema,
  type OwnerDraft,
} from './domain';
import {
  DRILLING_METHODS,
  isPeopleCategory,
  kindsFor,
  serviceMethodsFor,
} from './taxonomy';

/**
 * Kazakhstan numbers as people type them: 8 701 123 45 67, 7012345678,
 * +7 (701) 123-45-67. Anything else is kept as typed for validation.
 */
export function normalizePhone(raw: string): string {
  const text = raw.trim();
  const digits = text.replace(/\D/g, '');
  if (text.startsWith('+')) return `+${digits}`;
  if (digits.length === 11 && /^[78]/.test(digits))
    return `+7${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith('7')) return `+7${digits}`;
  return text;
}
export function validPhone(raw: string): boolean {
  const phone = normalizePhone(raw);
  const digits = phone.replace(/\D/g, '').length;
  return /^\+\d[\d\s()\-]*$/.test(phone) && digits >= 7 && digits <= 15;
}

export type IntakeCapability = {
  method: string;
  depth: string;
  diameter: string;
  coreSize: string;
  source: string;
};
export type IntakeValue = Record<string, string> & {
  capabilities: IntakeCapability[];
  purposes: string[];
  serviceMethods: string[];
  serviceArea: string[];
};

export function emptyIntake(): IntakeValue {
  return {
    offerType: '',
    category: '',
    title: '',
    description: '',
    region: '',
    city: '',
    availability: '',
    conditions: '',
    price: '',
    currency: '',
    priceUnit: '',
    shiftHours: '',
    priceIncludes: '',
    brand: '',
    model: '',
    chassis: '',
    operator: '',
    delivery: '',
    pressure: '',
    flow: '',
    payload: '',
    bucket: '',
    mass: '',
    machineYear: '',
    machineCondition: '',
    trajectory: '',
    site: '',
    contactName: '',
    company: '',
    phone: '',
    contactVisibility: '',
    kind: '',
    accredited: '',
    accreditationNumber: '',
    ownCrew: '',
    powerKw: '',
    experienceYears: '',
    workFormat: '',
    capabilities: [],
    purposes: [],
    serviceMethods: [],
    serviceArea: [],
  } as unknown as IntakeValue;
}

const textFields = [
  'title',
  'description',
  'region',
  'city',
  'availability',
  'conditions',
  'priceIncludes',
  'contactName',
  'company',
  'phone',
  'brand',
  'model',
  'accreditationNumber',
] as const;
const numberFields = [
  'price',
  'shiftHours',
  'pressure',
  'flow',
  'payload',
  'bucket',
  'mass',
  'machineYear',
  'powerKw',
  'experienceYears',
] as const;
const selectFields = [
  'offerType',
  'category',
  'currency',
  'priceUnit',
  'chassis',
  'machineCondition',
  'trajectory',
  'site',
  'contactVisibility',
  'kind',
  'workFormat',
] as const;
const arrayFields = ['purposes', 'serviceMethods', 'serviceArea'] as const;

export function relevantFields(value: IntakeValue): Set<string> {
  const fields = new Set<string>([
    ...textFields,
    ...selectFields,
    'price',
    'shiftHours',
    'operator',
    'delivery',
  ]);
  const drilling =
    value.category === 'drill' || value.category === 'drillService';
  if (drilling)
    ['capabilities', 'purposes', 'trajectory', 'site'].forEach((key) =>
      fields.add(key)
    );
  else
    ['capabilities', 'purposes', 'trajectory', 'site'].forEach((key) =>
      fields.delete(key)
    );
  if (value.category === 'excavator')
    ['bucket', 'mass'].forEach((key) => fields.add(key));
  if (value.category === 'compressor')
    ['pressure', 'flow'].forEach((key) => fields.add(key));
  if (value.category === 'transport') fields.add('payload');
  const people = isPeopleCategory(value.category);
  if (value.offerType === 'SERVICE' || people)
    ['brand', 'model', 'operator', 'delivery'].forEach((key) =>
      fields.delete(key)
    );
  if (people) ['experienceYears', 'workFormat'].forEach((k) => fields.add(k));
  else ['experienceYears', 'workFormat'].forEach((k) => fields.delete(k));
  if (!['drill', 'excavator'].includes(value.category))
    fields.delete('chassis');
  if (value.offerType !== 'SALE')
    ['machineYear', 'machineCondition'].forEach((key) => fields.delete(key));
  else ['machineYear', 'machineCondition'].forEach((key) => fields.add(key));
  if (!value.price.trim())
    ['currency', 'priceUnit', 'shiftHours'].forEach((key) =>
      fields.delete(key)
    );
  if (value.priceUnit !== 'SHIFT') fields.delete('shiftHours');
  if (!kindsFor(value.category).length) fields.delete('kind');
  if (serviceMethodsFor(value.category).length) fields.add('serviceMethods');
  if (value.category === 'labService') {
    fields.add('accredited');
    if (value.accredited === 'true') fields.add('accreditationNumber');
    else fields.delete('accreditationNumber');
  } else fields.delete('accreditationNumber');
  if (value.offerType === 'RENT' || value.offerType === 'SERVICE')
    fields.add('serviceArea');
  if (value.offerType === 'SERVICE' && !people) fields.add('ownCrew');
  if (value.category === 'camp') fields.add('powerKw');
  return fields;
}

export function normalizeIntake(value: IntakeValue): OwnerDraft {
  const relevant = relevantFields(value);
  const result: Record<string, unknown> = { schemaVersion: 2 };
  for (const key of [...textFields, ...selectFields]) {
    if (relevant.has(key) && value[key]?.trim())
      result[key] =
        key === 'phone' ? normalizePhone(value[key]) : value[key].trim();
  }
  for (const key of numberFields) {
    if (relevant.has(key) && value[key]?.trim()) {
      const parsed = Number(value[key]);
      if (Number.isFinite(parsed)) result[key] = parsed;
    }
  }
  if (relevant.has('operator') && value.operator)
    result.operator = value.operator === 'true';
  if (relevant.has('delivery') && value.delivery)
    result.delivery = value.delivery === 'true';
  for (const key of ['accredited', 'ownCrew'] as const)
    if (relevant.has(key) && value[key]) result[key] = value[key] === 'true';
  for (const key of arrayFields)
    if (relevant.has(key) && value[key].length) result[key] = value[key];
  if (relevant.has('capabilities') && value.capabilities.length) {
    result.capabilities = value.capabilities
      .filter((row) => row.method)
      .map((row) => {
        const item: Record<string, unknown> = { method: row.method };
        for (const key of ['depth', 'diameter'] as const)
          if (row[key].trim() && Number.isFinite(Number(row[key])))
            item[key] = Number(row[key]);
        if (row.method === 'CORE' && row.coreSize) item.coreSize = row.coreSize;
        if (row.source) item.source = row.source;
        return item;
      });
    if (!(result.capabilities as unknown[]).length) delete result.capabilities;
  }
  return result as OwnerDraft;
}

/** `draft` checks only what a saved draft needs; moving on also needs the required choices. */
export function validateIntakeStep(
  value: IntakeValue,
  step: number,
  { draft = false } = {}
): string[] {
  const errors: string[] = [];
  if (step >= 1 && (!value.offerType || !value.category))
    errors.push('category');
  if (step >= 2) {
    for (const key of ['title', 'region'])
      if (!value[key]?.trim()) errors.push(key);
    if (kindsFor(value.category).length && !value.kind) errors.push('kind');
    if (
      serviceMethodsFor(value.category).length &&
      !value.serviceMethods.length
    )
      errors.push('serviceMethods');
    for (const key of numberFields) {
      if (!relevantFields(value).has(key) || !value[key]?.trim()) continue;
      const n = Number(value[key]);
      if (
        !Number.isFinite(n) ||
        n < 0 ||
        (n === 0 && key !== 'experienceYears') ||
        (['machineYear', 'experienceYears'].includes(key) &&
          !Number.isInteger(n))
      )
        errors.push(key);
    }
    if (value.price.trim() && (!value.currency || !value.priceUnit))
      errors.push('priceUnit');
    if (
      value.price.trim() &&
      value.priceUnit === 'SHIFT' &&
      !value.shiftHours.trim()
    )
      errors.push('shiftHours');
    const drillingRows = relevantFields(value).has('capabilities')
      ? value.capabilities
      : [];
    drillingRows.forEach((row, index) => {
      // The row shown by default may stay blank; it is dropped on save.
      if (!row.method && !row.depth.trim() && !row.diameter.trim()) return;
      if (
        !row.method ||
        !DRILLING_METHODS.includes(
          row.method as (typeof DRILLING_METHODS)[number]
        )
      )
        errors.push(`capabilities.${index}.method`);
      for (const key of ['depth', 'diameter'] as const)
        if (
          row[key].trim() &&
          (!Number.isFinite(Number(row[key])) || Number(row[key]) <= 0)
        )
          errors.push(`capabilities.${index}.${key}`);
    });
    if (
      relevantFields(value).has('capabilities') &&
      (value.capabilities.length > 12 ||
        (!draft &&
          value.offerType !== 'WANTED' &&
          !drillingRows.some((row) => row.method)))
    )
      errors.push('capabilities');
    const parsed = ownerDraftSchema.safeParse(normalizeIntake(value));
    if (!parsed.success)
      for (const issue of parsed.error.issues)
        errors.push(String(issue.path[0] ?? 'details'));
  }
  if (step >= 3) {
    for (const key of ['contactName', 'phone', 'contactVisibility'])
      if (!value[key]?.trim()) errors.push(key);
    if (value.phone && !validPhone(value.phone)) errors.push('phone');
  }
  if (step >= 4) {
    const parsed = ownerSubmissionSchema.safeParse(normalizeIntake(value));
    if (!parsed.success)
      for (const issue of parsed.error.issues)
        errors.push(String(issue.path[0] ?? 'preview'));
  }
  return [...new Set(errors)];
}

export function fromDraft(data: OwnerDraft): IntakeValue {
  const value = emptyIntake();
  for (const [key, field] of Object.entries(data)) {
    if (
      key === 'capabilities' ||
      key === 'schemaVersion' ||
      (arrayFields as readonly string[]).includes(key)
    )
      continue;
    if (field !== undefined && field !== null) value[key] = String(field);
  }
  value.capabilities = (data.capabilities ?? []).map((row) => ({
    method: row.method,
    depth: String(row.depth ?? ''),
    diameter: String(row.diameter ?? ''),
    coreSize: row.coreSize ?? '',
    source: row.source ?? '',
  }));
  value.purposes = data.purposes ?? [];
  value.serviceMethods = data.serviceMethods ?? [];
  value.serviceArea = data.serviceArea ?? [];
  return value;
}
