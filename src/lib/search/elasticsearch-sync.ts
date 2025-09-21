import { createClient } from '@/lib/supabase/server';
import { elasticsearchClient } from './elasticsearch-client';
import { RealtimeChannel } from '@supabase/supabase-js';

export class ElasticsearchSyncService {
  private supabase: any;
  private syncChannel: RealtimeChannel | null = null;
  private isSyncing = false;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Initialize real-time sync between Supabase and Elasticsearch
   */
  async initializeSync(): Promise<void> {
    try {
      // Initialize Elasticsearch index
      await elasticsearchClient.initializeIndex();

      // Perform initial bulk sync
      await this.performInitialSync();

      // Setup real-time sync
      this.setupRealtimeSync();

      console.log('Elasticsearch sync initialized successfully');
    } catch (error) {
      console.error('Error initializing Elasticsearch sync:', error);
      throw error;
    }
  }

  /**
   * Perform initial bulk sync from Supabase to Elasticsearch
   */
  private async performInitialSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    this.isSyncing = true;

    try {
      console.log('Starting initial Elasticsearch sync...');

      // Fetch all deposits from Supabase
      const { data: deposits, error } = await this.supabase
        .from('kazakhstan_deposits')
        .select('*')
        .eq('status', 'ACTIVE');

      if (error) {
        throw error;
      }

      if (!deposits || deposits.length === 0) {
        console.log('No deposits to sync');
        return;
      }

      // Transform data for Elasticsearch
      const documents = deposits.map(this.transformDepositForElasticsearch);

      // Bulk index to Elasticsearch
      await elasticsearchClient.bulkIndex(documents);

      console.log(
        `Initial sync complete: ${deposits.length} documents indexed`
      );
    } catch (error) {
      console.error('Error during initial sync:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Setup real-time sync for changes
   */
  private setupRealtimeSync(): void {
    // Subscribe to changes in kazakhstan_deposits table
    this.syncChannel = this.supabase
      .channel('elasticsearch-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kazakhstan_deposits',
        },
        async (payload: any) => {
          console.log('Database change detected:', payload.eventType);

          try {
            switch (payload.eventType) {
              case 'INSERT':
                await this.handleInsert(payload.new);
                break;
              case 'UPDATE':
                await this.handleUpdate(payload.new);
                break;
              case 'DELETE':
                await this.handleDelete(payload.old);
                break;
            }
          } catch (error) {
            console.error('Error syncing change to Elasticsearch:', error);
            // Implement retry logic or dead letter queue here
          }
        }
      )
      .subscribe((status: string) => {
        console.log('Realtime subscription status:', status);
      });
  }

  /**
   * Handle INSERT events
   */
  private async handleInsert(deposit: any): Promise<void> {
    const document = this.transformDepositForElasticsearch(deposit);
    await elasticsearchClient.indexDocument(document);
    console.log(`Document ${deposit.id} indexed in Elasticsearch`);
  }

  /**
   * Handle UPDATE events
   */
  private async handleUpdate(deposit: any): Promise<void> {
    const document = this.transformDepositForElasticsearch(deposit);
    await elasticsearchClient.updateDocument(deposit.id, document);
    console.log(`Document ${deposit.id} updated in Elasticsearch`);
  }

  /**
   * Handle DELETE events
   */
  private async handleDelete(deposit: any): Promise<void> {
    await elasticsearchClient.deleteDocument(deposit.id);
    console.log(`Document ${deposit.id} deleted from Elasticsearch`);
  }

  /**
   * Transform Supabase deposit to Elasticsearch document
   */
  private transformDepositForElasticsearch(deposit: any): any {
    return {
      id: deposit.id,
      type: deposit.type,
      title: deposit.title,
      description: deposit.description,
      price: deposit.price,
      region: deposit.region,
      minerals: deposit.minerals || [],
      coordinates: deposit.coordinates,
      area_hectares: deposit.area_hectares,
      reserves_tons: deposit.reserves_tons,
      license_number: deposit.license_number,
      license_expiry: deposit.license_expiry,
      license_subtype: deposit.license_subtype,
      exploration_stage: deposit.exploration_stage,
      exploration_budget: deposit.exploration_budget,
      exploration_period: deposit.exploration_period,
      geological_confidence: deposit.geological_confidence,
      discovery_date: deposit.discovery_date,
      estimated_reserves: deposit.estimated_reserves,
      status: deposit.status,
      created_at: deposit.created_at,
      updated_at: deposit.updated_at,
      seller_id: deposit.seller_id,
      view_count: deposit.view_count || 0,
      favorite_count: deposit.favorite_count || 0,
      images: deposit.images || [],
      documents: deposit.documents || [],
      accessibility_rating: deposit.accessibility_rating,
      environmental_status: deposit.environmental_status,
    };
  }

  /**
   * Manually sync a specific document
   */
  async syncDocument(depositId: string): Promise<void> {
    try {
      const { data: deposit, error } = await this.supabase
        .from('kazakhstan_deposits')
        .select('*')
        .eq('id', depositId)
        .single();

      if (error) {
        throw error;
      }

      if (!deposit) {
        // If not found in database, delete from Elasticsearch
        await elasticsearchClient.deleteDocument(depositId);
        return;
      }

      // Update in Elasticsearch
      const document = this.transformDepositForElasticsearch(deposit);
      await elasticsearchClient.indexDocument(document);

      console.log(`Document ${depositId} manually synced`);
    } catch (error) {
      console.error(`Error syncing document ${depositId}:`, error);
      throw error;
    }
  }

  /**
   * Verify sync status
   */
  async verifySyncStatus(): Promise<{
    supabaseCount: number;
    elasticsearchCount: number;
    isSynced: boolean;
    missingInElasticsearch: string[];
  }> {
    try {
      // Get count from Supabase
      const { count: supabaseCount } = await this.supabase
        .from('kazakhstan_deposits')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

      // Get count from Elasticsearch
      const { total: elasticsearchCount } = await elasticsearchClient.search({
        pagination: { page: 1, size: 0 },
      });

      // Find missing documents if counts don't match
      let missingInElasticsearch: string[] = [];

      if (supabaseCount !== elasticsearchCount) {
        const { data: supabaseIds } = await this.supabase
          .from('kazakhstan_deposits')
          .select('id')
          .eq('status', 'ACTIVE');

        const { results: elasticsearchDocs } = await elasticsearchClient.search(
          {
            pagination: { page: 1, size: 10000 },
          }
        );

        const elasticsearchIds = new Set(
          elasticsearchDocs.map((doc) => doc.id)
        );
        missingInElasticsearch =
          supabaseIds
            ?.filter((doc) => !elasticsearchIds.has(doc.id))
            .map((doc) => doc.id) || [];
      }

      return {
        supabaseCount: supabaseCount || 0,
        elasticsearchCount,
        isSynced: supabaseCount === elasticsearchCount,
        missingInElasticsearch,
      };
    } catch (error) {
      console.error('Error verifying sync status:', error);
      throw error;
    }
  }

  /**
   * Re-sync all documents
   */
  async resyncAll(): Promise<void> {
    console.log('Starting full re-sync...');
    await this.performInitialSync();
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.syncChannel) {
      this.supabase.removeChannel(this.syncChannel);
      this.syncChannel = null;
    }
    console.log('Elasticsearch sync service cleaned up');
  }
}

// Export singleton instance
export const elasticsearchSyncService = new ElasticsearchSyncService();
