import { createClient } from '@/lib/supabase/server';
import { elasticsearchService } from '@/lib/search/elasticsearch-service';
import { Database } from '@/lib/supabase/database.types';

type Deposit = Database['public']['Tables']['kazakhstan_deposits']['Row'];

// Sync operation types
export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncEvent {
  id: string;
  operation: SyncOperation;
  table: string;
  record: any;
  timestamp: string;
  retryCount?: number;
}

// Sync queue for batch processing
class SyncQueue {
  private queue: SyncEvent[] = [];
  private processing = false;
  private maxBatchSize = 50;
  private processingInterval = 5000; // 5 seconds

  constructor() {
    // Start processing queue
    this.startProcessing();
  }

  add(event: SyncEvent): void {
    this.queue.push(event);
    console.log(
      `🔄 Added sync event: ${event.operation} ${event.table} ${event.id}`
    );
  }

  private async startProcessing(): Promise<void> {
    setInterval(async () => {
      if (!this.processing && this.queue.length > 0) {
        await this.processBatch();
      }
    }, this.processingInterval);
  }

  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const batch = this.queue.splice(0, this.maxBatchSize);

    try {
      console.log(`🔄 Processing sync batch of ${batch.length} events`);
      await DataSyncService.processSyncBatch(batch);
      console.log(`✅ Successfully processed ${batch.length} sync events`);
    } catch (error) {
      console.error('❌ Failed to process sync batch:', error);

      // Re-queue failed events with retry logic
      const retryEvents = batch
        .map((event) => ({
          ...event,
          retryCount: (event.retryCount || 0) + 1,
        }))
        .filter((event) => (event.retryCount || 0) < 3); // Max 3 retries

      this.queue.unshift(...retryEvents);
    } finally {
      this.processing = false;
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }
}

export class DataSyncService {
  private static syncQueue = new SyncQueue();
  private static supabase = createClient();

  /**
   * Handle deposit changes and sync to Elasticsearch
   */
  static async handleDepositChange(
    operation: SyncOperation,
    deposit: Deposit | { id: string }
  ): Promise<void> {
    const event: SyncEvent = {
      id: deposit.id,
      operation,
      table: 'kazakhstan_deposits',
      record: deposit,
      timestamp: new Date().toISOString(),
    };

    // Add to sync queue for batch processing
    this.syncQueue.add(event);

    // For critical operations, also sync immediately
    if (operation === 'delete' || (deposit as Deposit).featured) {
      await this.syncToElasticsearchImmediate(event);
    }
  }

  /**
   * Process a batch of sync events
   */
  static async processSyncBatch(events: SyncEvent[]): Promise<void> {
    // Group events by operation for efficiency
    const createEvents = events.filter((e) => e.operation === 'create');
    const updateEvents = events.filter((e) => e.operation === 'update');
    const deleteEvents = events.filter((e) => e.operation === 'delete');

    // Process deletes first
    if (deleteEvents.length > 0) {
      await Promise.all(
        deleteEvents.map((event) =>
          elasticsearchService.deleteDeposit(event.id)
        )
      );
    }

    // Process creates and updates together (bulk upsert)
    const upsertEvents = [...createEvents, ...updateEvents];
    if (upsertEvents.length > 0) {
      const deposits = upsertEvents.map((event) => event.record as Deposit);
      await elasticsearchService.bulkSyncDeposits(deposits);
    }

    // Log sync statistics
    console.log(
      `📊 Sync batch completed: ${createEvents.length} creates, ${updateEvents.length} updates, ${deleteEvents.length} deletes`
    );
  }

  /**
   * Immediate sync for critical operations
   */
  private static async syncToElasticsearchImmediate(
    event: SyncEvent
  ): Promise<void> {
    try {
      switch (event.operation) {
        case 'create':
        case 'update':
          await elasticsearchService.syncDeposit(event.record as Deposit);
          break;
        case 'delete':
          await elasticsearchService.deleteDeposit(event.id);
          break;
      }
    } catch (error) {
      console.error(
        `❌ Immediate sync failed for ${event.operation} ${event.id}:`,
        error
      );
    }
  }

  /**
   * Full database sync to Elasticsearch
   */
  static async performFullSync(): Promise<{
    success: boolean;
    totalRecords: number;
    syncedRecords: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let totalRecords = 0;
    let syncedRecords = 0;

    try {
      console.log('🔄 Starting full database sync...');

      // Get total count
      const { count } = await this.supabase
        .from('kazakhstan_deposits')
        .select('*', { count: 'exact', head: true });

      totalRecords = count || 0;
      console.log(`📊 Found ${totalRecords} deposits to sync`);

      if (totalRecords === 0) {
        return { success: true, totalRecords: 0, syncedRecords: 0, errors: [] };
      }

      // Process in chunks to avoid memory issues
      const chunkSize = 100;
      const totalChunks = Math.ceil(totalRecords / chunkSize);

      for (let chunk = 0; chunk < totalChunks; chunk++) {
        const start = chunk * chunkSize;
        const end = start + chunkSize - 1;

        try {
          const { data: deposits, error } = await this.supabase
            .from('kazakhstan_deposits')
            .select('*')
            .range(start, end);

          if (error) {
            throw error;
          }

          if (deposits && deposits.length > 0) {
            await elasticsearchService.bulkSyncDeposits(deposits);
            syncedRecords += deposits.length;
            console.log(
              `✅ Synced chunk ${chunk + 1}/${totalChunks} (${syncedRecords}/${totalRecords})`
            );
          }
        } catch (error) {
          const errorMsg = `Failed to sync chunk ${chunk + 1}: ${error}`;
          console.error('❌', errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(
        `✅ Full sync completed: ${syncedRecords}/${totalRecords} records synced`
      );

      return {
        success: errors.length === 0,
        totalRecords,
        syncedRecords,
        errors,
      };
    } catch (error) {
      const errorMsg = `Full sync failed: ${error}`;
      console.error('❌', errorMsg);
      errors.push(errorMsg);

      return {
        success: false,
        totalRecords,
        syncedRecords,
        errors,
      };
    }
  }

  /**
   * Verify data consistency between Supabase and Elasticsearch
   */
  static async verifyDataConsistency(): Promise<{
    consistent: boolean;
    supabaseCount: number;
    elasticsearchCount: number;
    missingInES: string[];
    extraInES: string[];
  }> {
    try {
      console.log('🔍 Verifying data consistency...');

      // Get all IDs from Supabase
      const { data: supabaseDeposits } = await this.supabase
        .from('kazakhstan_deposits')
        .select('id');

      const supabaseIds = new Set(supabaseDeposits?.map((d) => d.id) || []);

      // Get all IDs from Elasticsearch
      const esHealth = await elasticsearchService.healthCheck();
      let elasticsearchIds = new Set<string>();

      if (esHealth.connected && esHealth.indexExists) {
        try {
          const response = await elasticsearchService.search({
            page: 1,
            limit: 10000, // Get all documents
          });
          elasticsearchIds = new Set(response.deposits.map((d) => d.id));
        } catch (error) {
          console.error('Failed to get Elasticsearch IDs:', error);
        }
      }

      // Find inconsistencies
      const missingInES = Array.from(supabaseIds).filter(
        (id) => !elasticsearchIds.has(id)
      );
      const extraInES = Array.from(elasticsearchIds).filter(
        (id) => !supabaseIds.has(id)
      );

      const consistent = missingInES.length === 0 && extraInES.length === 0;

      console.log(
        `📊 Consistency check: ${consistent ? '✅ Consistent' : '❌ Inconsistent'}`
      );
      console.log(`  Supabase: ${supabaseIds.size} records`);
      console.log(`  Elasticsearch: ${elasticsearchIds.size} records`);
      console.log(`  Missing in ES: ${missingInES.length}`);
      console.log(`  Extra in ES: ${extraInES.length}`);

      return {
        consistent,
        supabaseCount: supabaseIds.size,
        elasticsearchCount: elasticsearchIds.size,
        missingInES,
        extraInES,
      };
    } catch (error) {
      console.error('❌ Consistency verification failed:', error);
      return {
        consistent: false,
        supabaseCount: 0,
        elasticsearchCount: 0,
        missingInES: [],
        extraInES: [],
      };
    }
  }

  /**
   * Fix data inconsistencies
   */
  static async fixInconsistencies(): Promise<{
    success: boolean;
    fixed: number;
    errors: string[];
  }> {
    console.log('🔧 Fixing data inconsistencies...');

    const consistency = await this.verifyDataConsistency();
    const errors: string[] = [];
    let fixed = 0;

    try {
      // Sync missing records to Elasticsearch
      if (consistency.missingInES.length > 0) {
        console.log(
          `🔄 Syncing ${consistency.missingInES.length} missing records to Elasticsearch...`
        );

        for (const id of consistency.missingInES) {
          try {
            const { data: deposit } = await this.supabase
              .from('kazakhstan_deposits')
              .select('*')
              .eq('id', id)
              .single();

            if (deposit) {
              await elasticsearchService.syncDeposit(deposit);
              fixed++;
            }
          } catch (error) {
            const errorMsg = `Failed to sync missing record ${id}: ${error}`;
            console.error('❌', errorMsg);
            errors.push(errorMsg);
          }
        }
      }

      // Remove extra records from Elasticsearch
      if (consistency.extraInES.length > 0) {
        console.log(
          `🗑️ Removing ${consistency.extraInES.length} extra records from Elasticsearch...`
        );

        for (const id of consistency.extraInES) {
          try {
            await elasticsearchService.deleteDeposit(id);
            fixed++;
          } catch (error) {
            const errorMsg = `Failed to delete extra record ${id}: ${error}`;
            console.error('❌', errorMsg);
            errors.push(errorMsg);
          }
        }
      }

      console.log(`✅ Fixed ${fixed} inconsistencies`);

      return {
        success: errors.length === 0,
        fixed,
        errors,
      };
    } catch (error) {
      const errorMsg = `Failed to fix inconsistencies: ${error}`;
      console.error('❌', errorMsg);
      errors.push(errorMsg);

      return {
        success: false,
        fixed,
        errors,
      };
    }
  }

  /**
   * Get sync queue statistics
   */
  static getSyncStats(): {
    queueSize: number;
    processing: boolean;
  } {
    return {
      queueSize: this.syncQueue.getQueueSize(),
      processing: this.syncQueue['processing'], // Access private property
    };
  }

  /**
   * Clear sync queue (for testing/maintenance)
   */
  static clearSyncQueue(): void {
    this.syncQueue.clear();
    console.log('🗑️ Sync queue cleared');
  }

  /**
   * Health check for sync service
   */
  static async healthCheck(): Promise<{
    syncService: boolean;
    elasticsearch: boolean;
    supabase: boolean;
    queueSize: number;
  }> {
    try {
      // Check Elasticsearch
      const esHealth = await elasticsearchService.healthCheck();

      // Check Supabase
      let supabaseHealthy = false;
      try {
        await this.supabase.from('kazakhstan_deposits').select('id').limit(1);
        supabaseHealthy = true;
      } catch (error) {
        console.error('Supabase health check failed:', error);
      }

      return {
        syncService: true,
        elasticsearch: esHealth.connected,
        supabase: supabaseHealthy,
        queueSize: this.syncQueue.getQueueSize(),
      };
    } catch (error) {
      console.error('Sync service health check failed:', error);
      return {
        syncService: false,
        elasticsearch: false,
        supabase: false,
        queueSize: 0,
      };
    }
  }
}

// Export the sync service as singleton
export const dataSyncService = DataSyncService;
