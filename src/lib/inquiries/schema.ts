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
    .regex(/^[A-Z]{1,6}-[A-Z0-9]{3,12}$/)
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
  elapsedMs: z.number().int().nonnegative().optional(),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

const MIN_FILL_MS = 2000;

export function isLikelySpam(input: InquiryInput): boolean {
  return (
    input.website.trim() !== '' ||
    (input.elapsedMs !== undefined && input.elapsedMs < MIN_FILL_MS)
  );
}
