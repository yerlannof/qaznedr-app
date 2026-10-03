import {
  ownerDraftSchema,
  ownerSubmissionSchema,
  type OwnerDraft,
} from './domain';
import { DRILLING_METHODS } from './taxonomy';

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
    capabilities: [],
    purposes: [],
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
] as const;

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
  if (value.offerType === 'SERVICE')
    ['brand', 'model', 'operator', 'delivery'].forEach((key) =>
      fields.delete(key)
    );
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
  return fields;
}

export function normalizeIntake(value: IntakeValue): OwnerDraft {
  const relevant = relevantFields(value);
  const result: Record<string, unknown> = { schemaVersion: 2 };
  for (const key of [...textFields, ...selectFields]) {
    if (relevant.has(key) && value[key]?.trim())
      result[key] = value[key].trim();
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
  if (relevant.has('purposes') && value.purposes.length)
    result.purposes = value.purposes;
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

export function validateIntakeStep(value: IntakeValue, step: number): string[] {
  const errors: string[] = [];
  if (step >= 1 && (!value.offerType || !value.category))
    errors.push('category');
  if (step >= 2) {
    for (const key of ['title', 'region', 'city', 'availability'])
      if (!value[key]?.trim()) errors.push(key);
    for (const key of numberFields) {
      if (!relevantFields(value).has(key) || !value[key]?.trim()) continue;
      const n = Number(value[key]);
      if (
        !Number.isFinite(n) ||
        n <= 0 ||
        (key === 'machineYear' && !Number.isInteger(n))
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
    (relevantFields(value).has('capabilities')
      ? value.capabilities
      : []
    ).forEach((row, index) => {
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
      value.capabilities.length > 12
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
    if (
      value.phone &&
      (!/^\+\d[\d\s()\-]*$/.test(value.phone.trim()) ||
        value.phone.replace(/\D/g, '').length < 7 ||
        value.phone.replace(/\D/g, '').length > 15)
    )
      errors.push('phone');
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
    if (key === 'capabilities' || key === 'purposes' || key === 'schemaVersion')
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
  return value;
}
