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
      ...projectPublicListing({
        id: row.id,
        ownerId: row.owner_id,
        status: row.status,
        revision: row.revision,
        data: row.data,
      }),
      updatedAt: row.updated_at,
    }));
    return { items, total: result.total, page: query.page, limit: query.limit };
  } catch {
    // Never expose DB details or silently serve a partial/empty catalogue.
    throw new Error('Equipment catalogue unavailable');
  }
}
