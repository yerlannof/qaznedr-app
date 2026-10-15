import 'server-only';
import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { renderEmailLayout } from '@/lib/email/layout';
import { sendEmail } from '@/lib/email/resend';
import { translate } from '@/lib/i18n/translations';
import { SITE_URL, toLocale } from '@/lib/seo/site';
import { searchEquipmentCatalog } from './catalog-repository';
import { ipHash } from './engagement';
import { parseEquipmentSearchQuery } from './search';
import { cardTag, placeText, priceText } from './present';

type Db = { from(table: string): any }; // eslint-disable-line @typescript-eslint/no-explicit-any
const db = async () => (await createServiceClient()) as unknown as Db;
const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');
const token = () => randomBytes(32).toString('base64url');
const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const base = () => new URL(process.env.NEXTAUTH_URL || SITE_URL).origin;

/** Only the main catalogue filters can be subscribed to. */
const FILTER_KEYS = [
  'offerType',
  'category',
  'region',
  'kind',
  'serviceMethod',
] as const;
export type SubscriptionFilters = Partial<
  Record<(typeof FILTER_KEYS)[number], string>
>;
export function cleanFilters(raw: unknown): SubscriptionFilters | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value === 'string' && value) params.set(key, value);
  }
  try {
    // Reuse the catalogue validation: unknown or incompatible values fail.
    parseEquipmentSearchQuery(params);
  } catch {
    return null;
  }
  return Object.fromEntries(params.entries());
}

export type SubscribeResult = 'sent' | 'invalid' | 'rate_limited';

export async function subscribe(input: {
  email: unknown;
  filters: unknown;
  locale: string;
  ip: string;
}): Promise<SubscribeResult> {
  const email = z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(254)
    .safeParse(input.email);
  const filters = cleanFilters(input.filters);
  if (!email.success || !filters) return 'invalid';
  const locale = toLocale(input.locale);
  const client = await db();
  const hashedIp = ipHash(input.ip);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [byIp, byEmail] = await Promise.all([
    client
      .from('equipment_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', hashedIp)
      .gte('created_at', hourAgo),
    client
      .from('equipment_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('email', email.data),
  ]);
  if (byIp.error || byEmail.error) throw new Error('Subscriptions unavailable');
  if ((byIp.count ?? 0) >= 5 || (byEmail.count ?? 0) >= 10)
    return 'rate_limited';
  const confirm = token();
  const { error } = await client.from('equipment_subscriptions').insert({
    email: email.data,
    filters,
    locale,
    confirm_hash: sha256(confirm),
    unsubscribe_hash: sha256(token()),
    ip_hash: hashedIp,
  });
  if (error) throw new Error('Subscriptions unavailable');
  const t = (key: string) => translate(locale, `equipmentSubscribe.${key}`);
  await sendEmail({
    to: email.data,
    subject: t('confirmSubject'),
    ...renderEmailLayout({
      lang: locale,
      paragraphs: [t('confirmIntro')],
      button: {
        label: t('confirmButton'),
        href: `${base()}/${locale}/equipment/subscription#confirm=${confirm}`,
      },
      footnotes: [t('confirmIgnore')],
    }),
  });
  return 'sent';
}

/** Confirms the subscription; returns false for unknown tokens. */
export async function confirmSubscription(raw: unknown): Promise<boolean> {
  const parsed = tokenSchema.safeParse(raw);
  if (!parsed.success) return false;
  const client = await db();
  const { data, error } = await client
    .from('equipment_subscriptions')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('confirm_hash', sha256(parsed.data))
    .select('id');
  if (error) throw new Error('Subscriptions unavailable');
  return Array.isArray(data) && data.length > 0;
}

export async function unsubscribe(raw: unknown): Promise<boolean> {
  const parsed = tokenSchema.safeParse(raw);
  if (!parsed.success) return false;
  const client = await db();
  const { data, error } = await client
    .from('equipment_subscriptions')
    .delete()
    .eq('unsubscribe_hash', sha256(parsed.data))
    .select('id');
  if (error) throw new Error('Subscriptions unavailable');
  return Array.isArray(data) && data.length > 0;
}

const dueRow = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  filters: z.record(z.string(), z.string()),
  locale: z.enum(['ru', 'kz', 'en', 'zh']),
  confirmed_at: z.string(),
  last_sent_at: z.string().nullable(),
});

/**
 * Daily digest: new or updated listings since the last letter. A fresh
 * unsubscribe token is issued per letter, so old links stop working.
 */
export async function sendDigests(
  limit = 100
): Promise<{ checked: number; sent: number }> {
  const client = await db();
  const { data, error } = await client
    .from('equipment_subscriptions')
    .select('id,email,filters,locale,confirmed_at,last_sent_at')
    .not('confirmed_at', 'is', null)
    .order('last_sent_at', { ascending: true, nullsFirst: true })
    .limit(limit);
  if (error) throw new Error('Subscriptions unavailable');
  let sent = 0;
  const rows = z.array(dueRow).parse(data ?? []);
  for (const row of rows) {
    const since = new Date(row.last_sent_at ?? row.confirmed_at);
    // Never more than one letter a day per subscription.
    if (Date.now() - since.getTime() < 20 * 60 * 60 * 1000 && row.last_sent_at)
      continue;
    const params = new URLSearchParams(row.filters);
    params.set('limit', '20');
    const result = await searchEquipmentCatalog(
      parseEquipmentSearchQuery(params)
    );
    const fresh = result.items.filter(
      (item) => new Date(item.updatedAt) > since
    );
    const now = new Date().toISOString();
    if (!fresh.length) {
      await client
        .from('equipment_subscriptions')
        .update({ last_sent_at: now })
        .eq('id', row.id);
      continue;
    }
    const stop = token();
    await client
      .from('equipment_subscriptions')
      .update({ last_sent_at: now, unsubscribe_hash: sha256(stop) })
      .eq('id', row.id);
    const locale = row.locale;
    const t = (key: string, values?: Record<string, string | number>) =>
      translate(locale, `equipmentSubscribe.${key}`, values);
    const catalogue = `${base()}/${locale}/equipment?${new URLSearchParams(
      row.filters
    ).toString()}`;
    await sendEmail({
      to: row.email,
      subject: t('digestSubject', { count: fresh.length }),
      ...renderEmailLayout({
        lang: locale,
        paragraphs: [
          t('digestIntro'),
          ...fresh.map((item) =>
            [
              item.title,
              cardTag(item, locale),
              placeText(item, locale),
              priceText(item, locale),
              `${base()}/${locale}/equipment/${item.id}`,
            ]
              .filter(Boolean)
              .join(' · ')
          ),
        ],
        button: { label: t('digestButton'), href: catalogue },
        footnotes: [
          `${t('unsubscribe')}: ${base()}/${locale}/equipment/subscription#unsubscribe=${stop}`,
        ],
      }),
    });
    sent++;
  }
  return { checked: rows.length, sent };
}
