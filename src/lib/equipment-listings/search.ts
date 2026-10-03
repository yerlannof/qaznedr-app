import { z } from 'zod';
import {
  DRILLING_METHODS,
  DRILLING_PURPOSES,
  CORE_SIZES,
  DRILLING_SITES,
  DRILLING_TRAJECTORIES,
  CHASSIS_TYPES,
  MACHINE_CONDITIONS,
} from './taxonomy';

const amount = (max: number) => z.coerce.number().finite().positive().max(max);
const integer = (max: number, fallback: number) =>
  z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().max(max))
    .default(fallback);
const boolean = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const querySchema = z
  .object({
    q: z
      .string()
      .trim()
      .max(160)
      .refine((value) => !/[\u0000-\u001f\u007f]/.test(value))
      .optional(),
    offerType: z.enum(['RENT', 'SALE', 'SERVICE']).optional(),
    category: z
      .enum([
        'drill',
        'excavator',
        'compressor',
        'transport',
        'drillService',
        'geoService',
      ])
      .optional(),
    region: z.string().trim().min(1).max(160).optional(),
    method: z.enum(DRILLING_METHODS).optional(),
    purpose: z.enum(DRILLING_PURPOSES).optional(),
    coreSize: z.enum(CORE_SIZES).optional(),
    site: z.enum(DRILLING_SITES).optional(),
    trajectory: z.enum(DRILLING_TRAJECTORIES).optional(),
    chassis: z.enum(CHASSIS_TYPES).optional(),
    machineCondition: z.enum(MACHINE_CONDITIONS).optional(),
    minYear: z.coerce.number().int().min(1900).max(2100).optional(),
    maxYear: z.coerce.number().int().min(1900).max(2100).optional(),
    depth: amount(20000).optional(),
    diameter: amount(5000).optional(),
    bucket: amount(100).optional(),
    mass: amount(2000).optional(),
    pressure: amount(1000).optional(),
    flow: amount(1000).optional(),
    payload: amount(2000).optional(),
    operator: boolean.optional(),
    delivery: boolean.optional(),
    currency: z.enum(['KZT', 'USD', 'CNY']).optional(),
    priceUnit: z
      .enum(['HOUR', 'SHIFT', 'DAY', 'METER', 'OBJECT', 'ITEM'])
      .optional(),
    shiftHours: amount(24).optional(),
    sort: z.enum(['NEWEST', 'PRICE_ASC']).default('NEWEST'),
    page: integer(1000, 1),
    limit: integer(50, 20),
  })
  .strict()
  .superRefine((data, ctx) => {
    const issue = (path: string) =>
      ctx.addIssue({
        code: 'custom',
        path: [path],
        message: 'Incompatible search filter',
      });
    const service =
      data.category === 'drillService' || data.category === 'geoService';
    if (
      data.category &&
      data.offerType &&
      (data.offerType === 'SERVICE') !== service
    )
      issue('category');
    if (data.sort === 'PRICE_ASC') {
      if (!data.currency) issue('currency');
      if (!data.priceUnit) issue('priceUnit');
      if (data.priceUnit === 'SHIFT' && !data.shiftHours) issue('shiftHours');
    }
    if (data.shiftHours !== undefined && data.priceUnit !== 'SHIFT')
      issue('shiftHours');
    if (data.coreSize && data.method && data.method !== 'CORE')
      issue('coreSize');
    if (data.minYear && data.maxYear && data.minYear > data.maxYear)
      issue('minYear');
    if (data.offerType && data.offerType !== 'SALE') {
      for (const field of ['machineCondition', 'minYear', 'maxYear'] as const)
        if (data[field] !== undefined) issue(field);
    }
    if (
      data.offerType === 'SALE' &&
      data.priceUnit &&
      data.priceUnit !== 'ITEM'
    )
      issue('priceUnit');
    if (
      data.offerType === 'RENT' &&
      data.priceUnit &&
      !['HOUR', 'SHIFT', 'DAY'].includes(data.priceUnit)
    )
      issue('priceUnit');
    if (data.offerType === 'SERVICE' && data.priceUnit === 'ITEM')
      issue('priceUnit');
    if (
      data.category &&
      data.category !== 'drillService' &&
      data.priceUnit === 'METER'
    )
      issue('priceUnit');
    if (!data.category) return;
    const drilling =
      data.category === 'drill' || data.category === 'drillService';
    if (!drilling)
      for (const field of [
        'method',
        'purpose',
        'depth',
        'diameter',
        'coreSize',
        'site',
        'trajectory',
      ] as const)
        if (data[field] !== undefined) issue(field);
    if (!['drill', 'excavator'].includes(data.category) && data.chassis)
      issue('chassis');
    if (data.category !== 'excavator')
      for (const field of ['mass', 'bucket'] as const)
        if (data[field] !== undefined) issue(field);
    if (data.category !== 'compressor')
      for (const field of ['pressure', 'flow'] as const)
        if (data[field] !== undefined) issue(field);
    if (data.category !== 'transport' && data.payload !== undefined)
      issue('payload');
  });

// Only exact method aliases, never a claim that every drilling technique is equivalent.
const aliases: Record<string, string> = {
  керновое: 'core',
  керновой: 'core',
  колонковое: 'core',
  coring: 'core',
  шнековое: 'auger',
  шнековый: 'auger',
  пневмоударное: 'dth',
  соник: 'sonic',
};

export function normalizeEquipmentSearchText(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim()
    .split(/\s+/)
    .map((word) => aliases[word] ?? word)
    .join(' ');
}

export function parseEquipmentSearchQuery(params: URLSearchParams) {
  const raw: Record<string, string> = {};
  for (const [key, value] of params) {
    if (Object.prototype.hasOwnProperty.call(raw, key))
      throw new Error('Duplicate search parameter');
    Object.defineProperty(raw, key, {
      value,
      enumerable: true,
      configurable: true,
    });
  }
  const data = querySchema.parse(raw);
  const tokens = data.q
    ? normalizeEquipmentSearchText(data.q).split(' ').filter(Boolean)
    : [];
  return {
    ...data,
    region: data.region ? normalizeEquipmentSearchText(data.region) : undefined,
    tokens,
  };
}

export type EquipmentSearchQuery = ReturnType<typeof parseEquipmentSearchQuery>;

/** Named, parameterized RPC arguments. Free text never becomes SQL/PostgREST syntax. */
export function equipmentSearchRpcArgs(query: EquipmentSearchQuery) {
  return {
    p_offer_type: query.offerType ?? null,
    p_category: query.category ?? null,
    p_region: query.region ?? null,
    p_method: query.method ?? null,
    p_purpose: query.purpose ?? null,
    p_core_size: query.coreSize ?? null,
    p_site: query.site ?? null,
    p_trajectory: query.trajectory ?? null,
    p_chassis: query.chassis ?? null,
    p_machine_condition: query.machineCondition ?? null,
    p_min_year: query.minYear ?? null,
    p_max_year: query.maxYear ?? null,
    p_depth: query.depth ?? null,
    p_diameter: query.diameter ?? null,
    p_bucket: query.bucket ?? null,
    p_mass: query.mass ?? null,
    p_pressure: query.pressure ?? null,
    p_flow: query.flow ?? null,
    p_payload: query.payload ?? null,
    p_operator: query.operator ?? null,
    p_delivery: query.delivery ?? null,
    p_currency: query.currency ?? null,
    p_price_unit: query.priceUnit ?? null,
    p_shift_hours: query.shiftHours ?? null,
    p_sort: query.sort,
    p_tokens: query.tokens,
    p_limit: query.limit,
    p_offset: (query.page - 1) * query.limit,
  };
}
