import { z } from 'zod';

export const INQUIRY_CHANNELS = [
  'wechat',
  'whatsapp',
  'email',
  'phone',
  'telegram',
] as const;
export const INQUIRY_STATUSES = [
  'NEW',
  'CONTACTED',
  'MEETING',
  'DEAL',
  'REJECTED',
] as const;
export type InquiryChannel = (typeof INQUIRY_CHANNELS)[number];
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

const text = (max: number) => z.string().trim().max(max);
const utmValue = z.string().max(200).optional();

export const inquirySchema = z.object({
  name: text(120).min(1),
  company: text(160).default(''),
  country: text(80).default(''),
  channel: z.enum(INQUIRY_CHANNELS),
  contact: text(160).min(3),
  message: text(2000).default(''),
  leadCode: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Z0-9]{1,8}(-[A-Z0-9]{1,16}){1,3}$/)
    .optional(),
  locale: z.enum(['ru', 'kz', 'en', 'zh']),
  sourcePath: text(300).default(''),
  utm: z
    .object({
      source: utmValue,
      medium: utmValue,
      campaign: utmValue,
      term: utmValue,
      content: utmValue,
    })
    .optional(),
  // Honeypot: real users never see or fill this field.
  website: z.string().max(200).default(''),
  // Time between form render and submit, measured client-side.
  elapsedMs: z.number().int().nonnegative(),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

const MIN_FILL_MS = 2000;

export function isLikelySpam(input: InquiryInput): boolean {
  return input.website.trim() !== '' || input.elapsedMs < MIN_FILL_MS;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** PATCH body of the admin inbox: a uuid and a known status, else null. */
export function parseStatusUpdate(
  body: unknown
): { id: string; status: InquiryStatus } | null {
  if (!body || typeof body !== 'object') return null;
  const { id, status } = body as { id?: unknown; status?: unknown };
  if (typeof id !== 'string' || !UUID.test(id)) return null;
  if (!(INQUIRY_STATUSES as readonly unknown[]).includes(status)) return null;
  return { id, status: status as InquiryStatus };
}

/** `?status=` of the admin inbox: missing → NEW, ALL, a known status, else null. */
export function parseStatusFilter(
  param: string | null
): InquiryStatus | 'ALL' | null {
  const value = param || 'NEW';
  if (value === 'ALL') return 'ALL';
  return (INQUIRY_STATUSES as readonly string[]).includes(value)
    ? (value as InquiryStatus)
    : null;
}
