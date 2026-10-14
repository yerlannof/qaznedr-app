import 'server-only';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { ownerSubmissionSchema, projectPublicListing } from './domain';
import { equipmentSearchRpcArgs, type EquipmentSearchQuery } from './search';

const wireRow = z.object({
  id: z.string().uuid(),
  owner_id: z.string().min(1).max(160),
  status: z.literal('ACTIVE'),
  revision: z.number().int().positive(),
  data: ownerSubmissionSchema,
  moderation_notes: z.string().nullable(),
  updated_at: z.string().datetime({ offset: true }),
});
const wireResult = z.object({
  rows: z.array(wireRow).max(50),
  total: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
});

export async function searchEquipmentCatalog(query: EquipmentSearchQuery) {
  try {
    const client = await createServiceClient();
    const { data, error } = await client.rpc(
      'search_equipment_catalog' as never,
      equipmentSearchRpcArgs(query) as never
    );
    if (error) throw error;
    const result = wireResult.parse(data);
    if (result.total < result.rows.length || result.rows.length > query.limit)
      throw new Error('Invalid catalogue result');
    const items = result.rows.map((row) => ({
      // Rows are ACTIVE (checked by wireRow), so the projection is never null.
      ...projectPublicListing({
        id: row.id,
        ownerId: row.owner_id,
        status: row.status,
        revision: row.revision,
        data: row.data,
      })!,
      updatedAt: row.updated_at,
    }));
    return { items, total: result.total, page: query.page, limit: query.limit };
  } catch {
    // Never expose DB details or silently serve a partial/empty catalogue.
    throw new Error('Equipment catalogue unavailable');
  }
}

const firstImageRow = z.object({
  id: z.string().uuid(),
  listing_id: z.string().uuid(),
  position: z.number().int(),
});

/** First photo per listing for catalogue cards. Only ids leave this boundary. */
export async function coverImagesFor(
  ids: string[]
): Promise<Record<string, string>> {
  if (!ids.length) return {};
  try {
    const client = (await createServiceClient()) as unknown as {
      from(table: string): {
        select(columns: string): {
          in(
            column: string,
            values: string[]
          ): PromiseLike<{
            data: unknown;
            error: unknown;
          }>;
        };
      };
    };
    const { data, error } = await client
      .from('equipment_listing_images')
      .select('id,listing_id,position')
      .in('listing_id', ids);
    if (error) throw error;
    const covers: Record<string, { id: string; position: number }> = {};
    for (const row of z.array(firstImageRow).parse(data))
      if (
        !covers[row.listing_id] ||
        row.position < covers[row.listing_id].position
      )
        covers[row.listing_id] = { id: row.id, position: row.position };
    return Object.fromEntries(
      Object.entries(covers).map(([listing, cover]) => [listing, cover.id])
    );
  } catch {
    // Cards still render without photos.
    return {};
  }
}

/** One published listing for its public page; null when absent or not ACTIVE. */
export async function getActiveListing(id: string) {
  if (!z.string().uuid().safeParse(id).success) return null;
  const client = await createServiceClient();
  const { data, error } = await (
    client as unknown as {
      from(table: string): {
        select(columns: string): {
          eq(
            column: string,
            value: string
          ): {
            eq(
              column: string,
              value: string
            ): {
              maybeSingle(): Promise<{ data: unknown; error: unknown }>;
            };
          };
        };
      };
    }
  )
    .from('equipment_listings')
    .select('id,owner_id,status,revision,data,moderation_notes,updated_at')
    .eq('id', id)
    .eq('status', 'ACTIVE')
    .maybeSingle();
  if (error) throw new Error('Equipment catalogue unavailable');
  if (data === null) return null;
  const row = wireRow.parse(data);
  return {
    ...projectPublicListing({
      id: row.id,
      ownerId: row.owner_id,
      status: row.status,
      revision: row.revision,
      data: row.data,
    })!,
    updatedAt: row.updated_at,
  };
}

export type PublicEquipmentListing = NonNullable<
  Awaited<ReturnType<typeof getActiveListing>>
>;
