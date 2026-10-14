import { z } from 'zod';
import type { EquipmentListing } from './domain';

/**
 * Automatic pre-check of a submitted listing. It only advises the moderator:
 * nothing here approves, rejects or hides a listing.
 */
export const PRECHECK_FLAGS = [
  'CONTACT_IN_TEXT', // phone, e-mail or messenger handle outside the contact fields
  'LINK_IN_TEXT',
  'WRONG_SECTION',
  'IMPLAUSIBLE_VALUE',
  'SPAM_OR_AD',
  'PROHIBITED',
  'UNCLEAR',
  'OTHER',
] as const;
export const PRECHECK_VERDICTS = ['OK', 'REVIEW', 'REJECT_SUGGESTED'] as const;

export const precheckResultSchema = z
  .object({
    verdict: z.enum(PRECHECK_VERDICTS),
    flags: z
      .array(
        z
          .object({
            code: z.enum(PRECHECK_FLAGS),
            note: z.string().trim().max(300),
          })
          .strict()
      )
      .max(10),
    summary: z.string().trim().max(1000),
  })
  .strict();
export type PrecheckResult = z.infer<typeof precheckResultSchema>;
export type PrecheckFlag = PrecheckResult['flags'][number];

const PHONE = /(?:\+?\d[\s()\-]*){7,}/;
const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const MESSENGER =
  /(?:whats\s*app|вотсап|ватсап|telegram|телеграм|wechat|t\.me\/|@[a-z0-9_]{4,})/i;
const LINK = /(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:kz|ru|com|cn|net|org)\b)/i;

/** Owner-written free text that the public sees. Contact fields are excluded on purpose. */
export function publicText(listing: EquipmentListing): string {
  const data = listing.data;
  return [
    data.title,
    data.description,
    data.conditions,
    data.priceIncludes,
    data.availability,
  ]
    .filter((value): value is string => typeof value === 'string' && !!value)
    .join('\n');
}

/** Cheap deterministic rules that run even without an AI key. */
export function localPrecheck(listing: EquipmentListing): PrecheckFlag[] {
  const text = publicText(listing);
  const flags: PrecheckFlag[] = [];
  if (PHONE.test(text) || EMAIL.test(text) || MESSENGER.test(text))
    flags.push({
      code: 'CONTACT_IN_TEXT',
      note: 'Контакты в тексте объявления, а не в полях контакта',
    });
  if (LINK.test(text))
    flags.push({ code: 'LINK_IN_TEXT', note: 'Ссылка в тексте объявления' });
  return flags;
}

export const PRECHECK_MODEL = 'claude-haiku-5-5';

/** Only public listing content goes to the model; never contact name, phone or company. */
export function precheckPrompt(listing: EquipmentListing): string {
  const {
    contactName: _name,
    phone: _phone,
    company: _company,
    contactVisibility: _visibility,
    ...publicData
  } = listing.data;
  return [
    'Ты помогаешь модератору маркетплейса геологической техники и услуг в Казахстане (qaznedr.kz).',
    'Проверь объявление и верни ТОЛЬКО JSON без пояснений вида:',
    '{"verdict":"OK|REVIEW|REJECT_SUGGESTED","flags":[{"code":"…","note":"…"}],"summary":"…"}',
    `Коды флагов: ${PRECHECK_FLAGS.join(', ')}.`,
    'CONTACT_IN_TEXT — телефон, почта или мессенджер в тексте; LINK_IN_TEXT — ссылка;',
    'WRONG_SECTION — объявление не соответствует выбранному разделу или типу;',
    'IMPLAUSIBLE_VALUE — нереальные параметры (глубина, масса, цена и т. п.);',
    'SPAM_OR_AD — реклама не по теме, набор слов; PROHIBITED — запрещённое или незаконное;',
    'UNCLEAR — непонятно, что предлагается. Пиши note и summary по-русски, коротко.',
    'Не придумывай факты. Если всё в порядке — verdict OK и пустой flags.',
    '',
    'Объявление (JSON):',
    JSON.stringify(publicData),
  ].join('\n');
}

function mergeFlags(...lists: PrecheckFlag[][]): PrecheckFlag[] {
  const seen = new Set<string>();
  const merged: PrecheckFlag[] = [];
  for (const flag of lists.flat()) {
    if (seen.has(flag.code)) continue;
    seen.add(flag.code);
    merged.push(flag);
  }
  return merged.slice(0, 10);
}

type FetchLike = (
  url: string,
  init: RequestInit
) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

const messageSchema = z.object({
  content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
});

/** Ask Claude for advice; returns null on any failure so moderation is never blocked. */
export async function aiPrecheck(
  listing: EquipmentListing,
  apiKey: string | undefined,
  fetchImpl: FetchLike = fetch,
  timeoutMs = 20000
): Promise<PrecheckResult | null> {
  if (!apiKey) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: PRECHECK_MODEL,
        max_tokens: 600,
        messages: [{ role: 'user', content: precheckPrompt(listing) }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const message = messageSchema.parse(await res.json());
    const text = message.content
      .map((block) => block.text ?? '')
      .join('')
      .trim();
    const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    return precheckResultSchema.parse(JSON.parse(json));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Combine local rules with optional AI advice into one stored result. */
export async function runPrecheck(
  listing: EquipmentListing,
  apiKey: string | undefined,
  fetchImpl?: FetchLike
): Promise<PrecheckResult & { model: string }> {
  const local = localPrecheck(listing);
  const ai = await aiPrecheck(listing, apiKey, fetchImpl);
  const flags = mergeFlags(local, ai?.flags ?? []);
  const verdict: PrecheckResult['verdict'] =
    ai?.verdict === 'REJECT_SUGGESTED'
      ? 'REJECT_SUGGESTED'
      : flags.length || ai?.verdict === 'REVIEW'
        ? 'REVIEW'
        : 'OK';
  return {
    verdict,
    flags,
    summary: ai?.summary ?? '',
    model: ai ? PRECHECK_MODEL : 'rules',
  };
}
