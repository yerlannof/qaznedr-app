import 'server-only';

import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { RepositoryError } from './repository';
import { PRECHECK_FLAGS, PRECHECK_VERDICTS } from './precheck';

export const TRUST_MARKS = [
  'PHONE_CONFIRMED',
  'DOCUMENTS_REVIEWED',
  'VERIFIED_QAZNEDR',
] as const;
export type TrustMark = (typeof TRUST_MARKS)[number];

const markRow = z.object({
  listing_id: z.string().uuid(),
  mark: z.enum(TRUST_MARKS),
  set_at: z.string(),
});
const precheckRow = z.object({
  listing_id: z.string().uuid(),
  revision: z.number().int().positive(),
  verdict: z.enum(PRECHECK_VERDICTS),
  flags: z.array(z.object({ code: z.enum(PRECHECK_FLAGS), note: z.string() })),
  summary: z.string().nullable(),
  model: z.string(),
});

export type ListingTrustMark = { mark: TrustMark; setAt: string };
export type StoredPrecheck = z.infer<typeof precheckRow>;

type DbResult = { data: unknown; error: { code?: string } | null };
type Query = PromiseLike<DbResult> & {
  select(columns: string): Query;
  upsert(
    values: Record<string, unknown>,
    options?: { onConflict?: string }
  ): Query;
  delete(): Query;
  eq(column: string, value: string | number): Query;
  in(column: string, values: string[]): Query;
};
type ModerationClient = {
  from(table: 'equipment_trust_marks' | 'equipment_prechecks'): Query;
};

async function client(): Promise<ModerationClient> {
  return (await createServiceClient()) as unknown as ModerationClient;
}

function check(error: DbResult['error']): void {
  if (error) throw new RepositoryError('UNAVAILABLE');
}

/** Trust marks for many listings at once; public pages show only the mark and date. */
export async function trustMarksFor(
  ids: string[]
): Promise<Record<string, ListingTrustMark[]>> {
  if (!ids.length) return {};
  const db = await client();
  const result = await db
    .from('equipment_trust_marks')
    .select('listing_id,mark,set_at')
    .in('listing_id', ids);
  check(result.error);
  const rows = z.array(markRow).parse(result.data);
  const byListing: Record<string, ListingTrustMark[]> = {};
  for (const row of rows)
    (byListing[row.listing_id] ??= []).push({
      mark: row.mark,
      setAt: row.set_at,
    });
  return byListing;
}

/** Call only after requireModerator. */
export async function setTrustMark(
  listingId: string,
  mark: TrustMark,
  enabled: boolean,
  actorId: string,
  note?: string
): Promise<void> {
  const db = await client();
  const result = enabled
    ? await db.from('equipment_trust_marks').upsert(
        {
          listing_id: listingId,
          mark,
          set_by: actorId,
          set_at: new Date().toISOString(),
          note: note?.trim() || null,
        },
        { onConflict: 'listing_id,mark' }
      )
    : await db
        .from('equipment_trust_marks')
        .delete()
        .eq('listing_id', listingId)
        .eq('mark', mark);
  check(result.error);
}

export async function savePrecheck(
  listingId: string,
  revision: number,
  result: {
    verdict: StoredPrecheck['verdict'];
    flags: StoredPrecheck['flags'];
    summary: string;
    model: string;
  }
): Promise<void> {
  const db = await client();
  const saved = await db.from('equipment_prechecks').upsert(
    {
      listing_id: listingId,
      revision,
      verdict: result.verdict,
      flags: result.flags,
      summary: result.summary || null,
      model: result.model,
    },
    { onConflict: 'listing_id,revision' }
  );
  check(saved.error);
}

/** Latest pre-check per listing for the given revisions (one row each). */
export async function prechecksFor(
  listings: { id: string; revision: number }[]
): Promise<Record<string, StoredPrecheck>> {
  if (!listings.length) return {};
  const db = await client();
  const result = await db
    .from('equipment_prechecks')
    .select('listing_id,revision,verdict,flags,summary,model')
    .in(
      'listing_id',
      listings.map((row) => row.id)
    );
  check(result.error);
  const wanted = new Map(listings.map((row) => [row.id, row.revision]));
  const byListing: Record<string, StoredPrecheck> = {};
  for (const row of z.array(precheckRow).parse(result.data))
    if (wanted.get(row.listing_id) === row.revision)
      byListing[row.listing_id] = row;
  return byListing;
}

/** Contact address of the listing author's marketplace account, if any. */
export async function ownerEmailFor(ownerId: string): Promise<string | null> {
  const client = await createServiceClient();
  const { data, error } = await client
    .from('marketplace_accounts' as never)
    .select('email')
    .eq('id', ownerId)
    .maybeSingle();
  if (error) throw new RepositoryError('UNAVAILABLE');
  const parsed = z
    .object({ email: z.string().email() })
    .safeParse(data ?? undefined);
  return parsed.success ? parsed.data.email : null;
}
