import 'server-only';
import { createHash } from 'crypto';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { normalizePhone, validPhone } from './intake-form';

type Db = {
  from(table: string): any; // eslint-disable-line @typescript-eslint/no-explicit-any
  rpc(
    name: string,
    args: Record<string, unknown>
  ): Promise<{
    data: unknown;
    error: unknown;
  }>;
};
const db = async () => (await createServiceClient()) as unknown as Db;

export const ipHash = (ip: string) =>
  createHash('sha256')
    .update(`${process.env.NEXTAUTH_SECRET || ''}:${ip}`)
    .digest('hex');

/** Crawlers and link previews must not inflate an author's numbers. */
export const BOT_AGENT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|monitor/i;

export async function recordListingEvent(
  listingId: string,
  kind: 'view' | 'contact'
): Promise<void> {
  if (!z.string().uuid().safeParse(listingId).success) return;
  const client = await db();
  const { error } = await client.rpc('record_equipment_listing_event', {
    p_listing_id: listingId,
    p_kind: kind,
  });
  if (error) throw new Error('Unable to record listing event');
}

export type ListingStats = { views: number; contacts: number };

/** Last 30 days per listing, for the author's cabinet. */
export async function statsFor(
  listingIds: string[]
): Promise<Record<string, ListingStats>> {
  if (!listingIds.length) return {};
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const client = await db();
  const { data, error } = await client
    .from('equipment_listing_stats')
    .select('listing_id,views,contact_clicks')
    .in('listing_id', listingIds)
    .gte('day', since);
  if (error) throw new Error('Unable to load listing stats');
  const rows = z
    .array(
      z.object({
        listing_id: z.string().uuid(),
        views: z.number().int().nonnegative(),
        contact_clicks: z.number().int().nonnegative(),
      })
    )
    .parse(data ?? []);
  const result: Record<string, ListingStats> = {};
  for (const row of rows) {
    const total = (result[row.listing_id] ??= { views: 0, contacts: 0 });
    total.views += row.views;
    total.contacts += row.contact_clicks;
  }
  return result;
}

export const responseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z
    .string()
    .max(40)
    .refine(validPhone)
    .transform((value) => normalizePhone(value).replace(/[^\d+]/g, '')),
  message: z.string().trim().min(1).max(2000),
});
export type ResponseInput = z.infer<typeof responseSchema>;
export type ResponseResult = 'saved' | 'not_found' | 'rate_limited';

export async function submitResponse(
  listingId: string,
  input: ResponseInput,
  ip: string
): Promise<ResponseResult> {
  const client = await db();
  const { data, error } = await client.rpc('submit_equipment_response', {
    p_listing_id: listingId,
    p_name: input.name,
    p_phone: input.phone,
    p_message: input.message,
    p_ip_hash: ipHash(ip),
  });
  if (error) throw new Error('Unable to save response');
  return z.enum(['saved', 'not_found', 'rate_limited']).parse(data);
}

const responseRow = z.object({
  id: z.string().uuid(),
  listing_id: z.string().uuid(),
  name: z.string(),
  phone: z.string(),
  message: z.string(),
  created_at: z.string(),
});
export type ListingResponse = {
  id: string;
  name: string;
  phone: string;
  message: string;
  createdAt: string;
};

/** Responses to the author's own requests; the caller must pass only owned ids. */
export async function responsesFor(
  listingIds: string[]
): Promise<Record<string, ListingResponse[]>> {
  if (!listingIds.length) return {};
  const client = await db();
  const { data, error } = await client
    .from('equipment_responses')
    .select('id,listing_id,name,phone,message,created_at')
    .in('listing_id', listingIds)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw new Error('Unable to load responses');
  const result: Record<string, ListingResponse[]> = {};
  for (const row of z.array(responseRow).parse(data ?? []))
    (result[row.listing_id] ??= []).push({
      id: row.id,
      name: row.name,
      phone: row.phone,
      message: row.message,
      createdAt: row.created_at,
    });
  return result;
}

/** Contact address of a listing's author (for response notifications). */
export async function ownerOfActiveListing(
  listingId: string
): Promise<{ ownerId: string; title: string } | null> {
  const client = await db();
  const { data, error } = await client
    .from('equipment_listings')
    .select('owner_id,data')
    .eq('id', listingId)
    .eq('status', 'ACTIVE')
    .maybeSingle();
  if (error || !data) return null;
  const row = z
    .object({
      owner_id: z.string(),
      data: z.object({ title: z.string().optional() }).passthrough(),
    })
    .safeParse(data);
  return row.success
    ? { ownerId: row.data.owner_id, title: row.data.data.title ?? '' }
    : null;
}
