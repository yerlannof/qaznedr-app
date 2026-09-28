import 'server-only';

import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import {
  EQUIPMENT_STATUSES,
  ownerDraftSchema,
  ownerSubmissionSchema,
  type EquipmentListing,
} from './domain';

const rowSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().min(1),
  status: z.enum(EQUIPMENT_STATUSES),
  revision: z.number().int().positive(),
  data: z.unknown(),
  moderation_notes: z.string().nullable(),
});

type DbResult = { data: unknown; error: { code?: string } | null };
type Query = PromiseLike<DbResult> & {
  select(columns: string): Query;
  insert(values: Record<string, unknown>): Query;
  eq(column: string, value: string): Query;
  order(column: string, options: { ascending: boolean }): Query;
  limit(count: number): Query;
  maybeSingle(): Promise<DbResult>;
  single(): Promise<DbResult>;
};
type EquipmentClient = {
  from(table: 'equipment_listings'): Query;
  rpc(
    name: 'transition_equipment_listing',
    args: Record<string, unknown>
  ): Promise<DbResult>;
};

async function client(): Promise<EquipmentClient> {
  return (await createServiceClient()) as unknown as EquipmentClient;
}

export class RepositoryError extends Error {
  constructor(public readonly code: 'NOT_FOUND' | 'CONFLICT' | 'UNAVAILABLE') {
    super(code);
    this.name = 'RepositoryError';
  }
}

function check(error: DbResult['error']): void {
  if (!error) return;
  if (error.code === '40001') throw new RepositoryError('CONFLICT');
  throw new RepositoryError('UNAVAILABLE');
}

function hydrate(value: unknown): EquipmentListing {
  try {
    const row = rowSchema.parse(value);
    const data = requiresSubmission(row.status)
      ? ownerSubmissionSchema.parse(row.data)
      : ownerDraftSchema.parse(row.data);
    return {
      id: row.id,
      ownerId: row.owner_id,
      status: row.status,
      revision: row.revision,
      data,
      ...(row.moderation_notes
        ? { moderationNotes: row.moderation_notes }
        : {}),
    };
  } catch {
    throw new RepositoryError('UNAVAILABLE');
  }
}

function requiresSubmission(status: EquipmentListing['status']): boolean {
  return status === 'PENDING_MODERATION' || status === 'ACTIVE';
}

function hydrateList(value: unknown): EquipmentListing[] {
  if (!Array.isArray(value)) throw new RepositoryError('UNAVAILABLE');
  return value.map(hydrate);
}

function requireId(value: string): void {
  if (!value) throw new RepositoryError('NOT_FOUND');
}

export const equipmentRepository = {
  async createDraft(
    ownerId: string,
    input: unknown
  ): Promise<EquipmentListing> {
    requireId(ownerId);
    const data = ownerDraftSchema.parse(input);
    const db = await client();
    const result = await db
      .from('equipment_listings')
      .insert({ owner_id: ownerId, data })
      .select('id,owner_id,status,revision,data,moderation_notes')
      .single();
    check(result.error);
    return hydrate(result.data);
  },

  async listOwned(ownerId: string): Promise<EquipmentListing[]> {
    requireId(ownerId);
    const db = await client();
    const result = await db
      .from('equipment_listings')
      .select('id,owner_id,status,revision,data,moderation_notes')
      .eq('owner_id', ownerId)
      .order('updated_at', { ascending: false })
      .limit(100);
    check(result.error);
    return hydrateList(result.data);
  },

  async getOwned(
    id: string,
    ownerId: string
  ): Promise<EquipmentListing | null> {
    requireId(id);
    requireId(ownerId);
    const db = await client();
    const result = await db
      .from('equipment_listings')
      .select('id,owner_id,status,revision,data,moderation_notes')
      .eq('id', id)
      .eq('owner_id', ownerId)
      .maybeSingle();
    check(result.error);
    return result.data === null ? null : hydrate(result.data);
  },

  async listPending(): Promise<EquipmentListing[]> {
    const db = await client();
    const result = await db
      .from('equipment_listings')
      .select('id,owner_id,status,revision,data,moderation_notes')
      .eq('status', 'PENDING_MODERATION')
      .order('updated_at', { ascending: true })
      .limit(100);
    check(result.error);
    return hydrateList(result.data);
  },

  async getForModeration(id: string): Promise<EquipmentListing | null> {
    requireId(id);
    const db = await client();
    const result = await db
      .from('equipment_listings')
      .select('id,owner_id,status,revision,data,moderation_notes')
      .eq('id', id)
      .eq('status', 'PENDING_MODERATION')
      .maybeSingle();
    check(result.error);
    return result.data === null ? null : hydrate(result.data);
  },

  async saveTransition(
    previous: EquipmentListing,
    next: EquipmentListing,
    actorId: string
  ): Promise<EquipmentListing> {
    if (
      !actorId ||
      previous.id !== next.id ||
      previous.ownerId !== next.ownerId ||
      next.revision !== previous.revision + 1
    )
      throw new RepositoryError('CONFLICT');
    const data = requiresSubmission(next.status)
      ? ownerSubmissionSchema.parse(next.data)
      : ownerDraftSchema.parse(next.data);
    const db = await client();
    const result = await db.rpc('transition_equipment_listing', {
      p_id: previous.id,
      p_expected_owner_id: previous.ownerId,
      p_expected_status: previous.status,
      p_expected_revision: previous.revision,
      p_next_status: next.status,
      p_next_revision: next.revision,
      p_next_data: data,
      p_next_moderation_notes: next.moderationNotes ?? null,
      p_actor_id: actorId,
    });
    check(result.error);
    return hydrate(result.data);
  },
};

export const {
  createDraft,
  listOwned,
  getOwned,
  listPending,
  getForModeration,
  saveTransition,
} = equipmentRepository;
