import { z } from 'zod';

const BUCKET = 'equipment-images';
const claimSchema = z
  .object({
    image_id: z.string().uuid(),
    listing_id: z.string().uuid(),
    storage_path: z.string(),
    claim_token: z.string().uuid(),
    attempts: z.number().int().min(1).max(5),
  })
  .strict();

type RpcResult = { data: unknown; error: unknown };
export type CleanupClient = {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<RpcResult>;
  storage: {
    from(bucket: string): {
      remove(paths: string[]): PromiseLike<{ error: unknown }>;
    };
  };
};

/** Bound each RPC and Storage request independently, including caller cancellation. */
export function createTimedCleanupFetch(
  baseFetch: typeof fetch,
  timeoutMs = 20_000
): typeof fetch {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 20_000)
    throw new ImageCleanupError();
  return (input, init) => {
    const timeout = AbortSignal.timeout(timeoutMs);
    const signals = [timeout];
    if (init?.signal) signals.push(init.signal);
    if (input instanceof Request) signals.push(input.signal);
    const signal = AbortSignal.any(signals);
    return baseFetch(input, { ...init, signal });
  };
}

export class ImageCleanupError extends Error {
  constructor() {
    super('Equipment image cleanup unavailable');
    this.name = 'ImageCleanupError';
  }
}

function requireSuccess(result: RpcResult): unknown {
  if (result.error) throw new ImageCleanupError();
  return result.data;
}

/** One bounded pass; caller decides when to run another pass. */
export async function processImageDeletionBatch(
  client: CleanupClient,
  limit = 10,
  leaseSeconds = 120
): Promise<{ claimed: number; completed: number; failed: number }> {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 20 ||
    !Number.isInteger(leaseSeconds) ||
    leaseSeconds < 30 ||
    leaseSeconds > 300
  )
    throw new ImageCleanupError();

  let claimed = 0;
  let completed = 0;
  let failed = 0;
  for (let index = 0; index < limit; index++) {
    let raw: unknown;
    try {
      raw = requireSuccess(
        await client.rpc('claim_equipment_image_deletions', {
          p_limit: 1,
          p_lease_seconds: leaseSeconds,
        })
      );
    } catch {
      throw new ImageCleanupError();
    }
    const parsed = z.array(claimSchema).max(1).safeParse(raw);
    if (!parsed.success) throw new ImageCleanupError();
    if (parsed.data.length === 0) break;
    const row = parsed.data[0];
    if (row.storage_path !== `${row.listing_id}/${row.image_id}.webp`)
      throw new ImageCleanupError();
    claimed++;
    let removed = false;
    try {
      const result = await client.storage
        .from(BUCKET)
        .remove([row.storage_path]);
      removed = !result.error;
    } catch {
      removed = false;
    }
    const args = { p_image_id: row.image_id, p_claim_token: row.claim_token };
    const rpc = removed
      ? 'ack_equipment_image_deletion'
      : 'fail_equipment_image_deletion';
    let accepted: unknown;
    try {
      accepted = requireSuccess(await client.rpc(rpc, args));
    } catch {
      throw new ImageCleanupError();
    }
    if (accepted !== true) throw new ImageCleanupError();
    if (removed) completed++;
    else failed++;
  }
  return { claimed, completed, failed };
}
