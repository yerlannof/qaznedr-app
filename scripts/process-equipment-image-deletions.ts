/** Run manually after an explicit target review. Never scheduled by the app. */
import { createClient } from '@supabase/supabase-js';
import {
  createTimedCleanupFetch,
  processImageDeletionBatch,
} from '../src/lib/equipment-listings/image-cleanup';

async function main(): Promise<void> {
  if (process.env.QAZNEDR_EQUIPMENT_CLEANUP_CONFIRM !== 'YES')
    throw new Error('Explicit cleanup opt-in required');
  const url = process.env.QAZNEDR_EQUIPMENT_CLEANUP_URL;
  const key = process.env.QAZNEDR_EQUIPMENT_CLEANUP_SERVICE_ROLE_KEY;
  if (!url || !key || !/^https:\/\//.test(url))
    throw new Error('Explicit cleanup target required');
  const db = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: createTimedCleanupFetch(fetch) },
  });
  const result = await processImageDeletionBatch(db, 10, 120);
  process.stdout.write(
    `Claimed ${result.claimed}; completed ${result.completed}; failed ${result.failed}\n`
  );
}

main().catch(() => {
  process.stderr.write(
    'Equipment image cleanup failed; inspect the private queue.\n'
  );
  process.exitCode = 1;
});
