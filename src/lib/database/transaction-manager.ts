import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import { dataSyncService } from '@/lib/sync/data-sync-service';
import { redisCacheService } from '@/lib/cache/redis-cache-service';

type Transaction = any; // Supabase doesn't have built-in transactions, so we simulate them

// Transaction isolation levels
export enum IsolationLevel {
  READ_UNCOMMITTED = 'READ UNCOMMITTED',
  READ_COMMITTED = 'READ COMMITTED',
  REPEATABLE_READ = 'REPEATABLE READ',
  SERIALIZABLE = 'SERIALIZABLE',
}

// Transaction operation types
export interface TransactionOperation {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  conditions?: any;
  timestamp: string;
}

// Transaction context
export interface TransactionContext {
  id: string;
  operations: TransactionOperation[];
  rollbackData: Map<string, any>;
  isolationLevel: IsolationLevel;
  startTime: Date;
  status: 'active' | 'committed' | 'rolled_back' | 'failed';
  metadata: {
    userId?: string;
    sessionId?: string;
    description?: string;
  };
}

// Transaction result
export interface TransactionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  transactionId: string;
  operationsCount: number;
  duration: number;
}

// Compensating actions for rollback
interface CompensatingAction {
  type: 'restore' | 'delete' | 'update';
  table: string;
  id: string;
  data?: any;
}

export class DatabaseTransactionManager {
  private static instance: DatabaseTransactionManager;
  private activeTransactions = new Map<string, TransactionContext>();
  private supabase: SupabaseClient<Database>;

  private constructor() {
    this.supabase = createClient();
  }

  static getInstance(): DatabaseTransactionManager {
    if (!this.instance) {
      this.instance = new DatabaseTransactionManager();
    }
    return this.instance;
  }

  /**
   * Begin a new transaction
   */
  async beginTransaction(
    isolationLevel: IsolationLevel = IsolationLevel.READ_COMMITTED,
    metadata: TransactionContext['metadata'] = {}
  ): Promise<string> {
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const context: TransactionContext = {
      id: transactionId,
      operations: [],
      rollbackData: new Map(),
      isolationLevel,
      startTime: new Date(),
      status: 'active',
      metadata,
    };

    this.activeTransactions.set(transactionId, context);

    console.log(`🔄 Transaction started: ${transactionId}`);
    return transactionId;
  }

  /**
   * Execute multiple operations within a transaction
   */
  async executeTransaction<T>(
    operations: Array<() => Promise<any>>,
    options: {
      isolationLevel?: IsolationLevel;
      metadata?: TransactionContext['metadata'];
      maxRetries?: number;
      timeoutMs?: number;
    } = {}
  ): Promise<TransactionResult<T[]>> {
    const {
      isolationLevel = IsolationLevel.READ_COMMITTED,
      metadata = {},
      maxRetries = 3,
      timeoutMs = 30000,
    } = options;

    const startTime = Date.now();
    let attempt = 0;
    let lastError: any;

    while (attempt < maxRetries) {
      attempt++;
      const transactionId = await this.beginTransaction(isolationLevel, {
        ...metadata,
        attempt,
      });

      try {
        // Set up timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Transaction timeout')), timeoutMs);
        });

        // Execute operations with timeout
        const operationsPromise = this.executeOperationsWithRollback(
          transactionId,
          operations
        );

        const results = await Promise.race([operationsPromise, timeoutPromise]);

        // Commit if all operations succeeded
        await this.commitTransaction(transactionId);

        const duration = Date.now() - startTime;
        return {
          success: true,
          data: results as T[],
          transactionId,
          operationsCount: operations.length,
          duration,
        };
      } catch (error) {
        lastError = error;
        console.error(`❌ Transaction attempt ${attempt} failed:`, error);

        try {
          await this.rollbackTransaction(transactionId);
        } catch (rollbackError) {
          console.error('❌ Rollback failed:', rollbackError);
        }

        // Don't retry for certain types of errors
        if (this.isNonRetryableError(error)) {
          break;
        }

        // Exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    const duration = Date.now() - startTime;
    return {
      success: false,
      error: lastError?.message || 'Transaction failed after all retries',
      transactionId: '',
      operationsCount: operations.length,
      duration,
    };
  }

  /**
   * Execute operations with automatic rollback on failure
   */
  private async executeOperationsWithRollback(
    transactionId: string,
    operations: Array<() => Promise<any>>
  ): Promise<any[]> {
    const context = this.activeTransactions.get(transactionId);
    if (!context) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const results: any[] = [];

    try {
      for (let i = 0; i < operations.length; i++) {
        console.log(
          `🔄 Executing operation ${i + 1}/${operations.length} in transaction ${transactionId}`
        );

        const result = await operations[i]();
        results.push(result);

        // Track operation for potential rollback
        context.operations.push({
          id: `op_${i}`,
          type: 'update', // This would need to be determined based on the operation
          table: 'unknown', // This would need to be extracted from the operation
          data: result,
          timestamp: new Date().toISOString(),
        });
      }

      return results;
    } catch (error) {
      console.error(
        `❌ Operation failed in transaction ${transactionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Commit a transaction
   */
  async commitTransaction(transactionId: string): Promise<void> {
    const context = this.activeTransactions.get(transactionId);
    if (!context) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    if (context.status !== 'active') {
      throw new Error(`Transaction ${transactionId} is not active`);
    }

    try {
      // Trigger data synchronization for all affected records
      await this.triggerDataSync(context);

      // Clear cache for affected data
      await this.invalidateRelatedCaches(context);

      context.status = 'committed';
      this.activeTransactions.delete(transactionId);

      const duration = Date.now() - context.startTime.getTime();
      console.log(
        `✅ Transaction committed: ${transactionId} (${duration}ms, ${context.operations.length} operations)`
      );
    } catch (error) {
      context.status = 'failed';
      console.error(`❌ Transaction commit failed: ${transactionId}`, error);
      throw error;
    }
  }

  /**
   * Rollback a transaction
   */
  async rollbackTransaction(transactionId: string): Promise<void> {
    const context = this.activeTransactions.get(transactionId);
    if (!context) {
      console.warn(`Transaction ${transactionId} not found for rollback`);
      return;
    }

    if (context.status !== 'active') {
      console.warn(
        `Transaction ${transactionId} is not active, cannot rollback`
      );
      return;
    }

    try {
      console.log(`🔄 Rolling back transaction: ${transactionId}`);

      // Execute compensating actions
      const compensatingActions = this.generateCompensatingActions(context);

      for (const action of compensatingActions.reverse()) {
        try {
          await this.executeCompensatingAction(action);
        } catch (error) {
          console.error(`❌ Compensating action failed:`, error);
          // Continue with other actions even if one fails
        }
      }

      context.status = 'rolled_back';
      this.activeTransactions.delete(transactionId);

      const duration = Date.now() - context.startTime.getTime();
      console.log(
        `⏪ Transaction rolled back: ${transactionId} (${duration}ms)`
      );
    } catch (error) {
      context.status = 'failed';
      console.error(`❌ Transaction rollback failed: ${transactionId}`, error);
      throw error;
    }
  }

  /**
   * Generate compensating actions for rollback
   */
  private generateCompensatingActions(
    context: TransactionContext
  ): CompensatingAction[] {
    const actions: CompensatingAction[] = [];

    for (const operation of context.operations) {
      const rollbackData = context.rollbackData.get(operation.id);

      switch (operation.type) {
        case 'insert':
          actions.push({
            type: 'delete',
            table: operation.table,
            id: operation.data.id,
          });
          break;

        case 'update':
          if (rollbackData) {
            actions.push({
              type: 'restore',
              table: operation.table,
              id: operation.data.id,
              data: rollbackData,
            });
          }
          break;

        case 'delete':
          if (rollbackData) {
            actions.push({
              type: 'restore',
              table: operation.table,
              id: rollbackData.id,
              data: rollbackData,
            });
          }
          break;
      }
    }

    return actions;
  }

  /**
   * Execute a compensating action
   */
  private async executeCompensatingAction(
    action: CompensatingAction
  ): Promise<void> {
    try {
      switch (action.type) {
        case 'delete':
          await this.supabase
            .from(action.table as any)
            .delete()
            .eq('id', action.id);
          break;

        case 'restore':
        case 'update':
          if (action.data) {
            await this.supabase.from(action.table as any).upsert([action.data]);
          }
          break;
      }
    } catch (error) {
      console.error(`❌ Compensating action failed:`, error);
      throw error;
    }
  }

  /**
   * Trigger data synchronization for affected records
   */
  private async triggerDataSync(context: TransactionContext): Promise<void> {
    try {
      for (const operation of context.operations) {
        if (operation.table === 'kazakhstan_deposits' && operation.data?.id) {
          await dataSyncService.handleDepositChange(
            operation.type === 'delete' ? 'delete' : 'update',
            operation.data
          );
        }
      }
    } catch (error) {
      console.error('❌ Data sync trigger failed:', error);
      // Don't fail the transaction for sync issues
    }
  }

  /**
   * Invalidate related caches
   */
  private async invalidateRelatedCaches(
    context: TransactionContext
  ): Promise<void> {
    try {
      const affectedTables = new Set(context.operations.map((op) => op.table));

      if (affectedTables.has('kazakhstan_deposits')) {
        await redisCacheService.invalidateSearchCaches();
      }

      // Invalidate user-specific caches if user operations were performed
      if (context.metadata.userId) {
        await redisCacheService.invalidateUserCaches(context.metadata.userId);
      }
    } catch (error) {
      console.error('❌ Cache invalidation failed:', error);
      // Don't fail the transaction for cache issues
    }
  }

  /**
   * Check if error is non-retryable
   */
  private isNonRetryableError(error: any): boolean {
    const nonRetryableMessages = [
      'unique constraint',
      'foreign key constraint',
      'permission denied',
      'invalid input',
      'validation failed',
    ];

    const errorMessage = error?.message?.toLowerCase() || '';
    return nonRetryableMessages.some((msg) => errorMessage.includes(msg));
  }

  /**
   * Deposit-specific transaction operations
   */
  async createDepositWithTransaction(
    depositData: any,
    metadata: TransactionContext['metadata'] = {}
  ): Promise<TransactionResult<any>> {
    return this.executeTransaction(
      [
        async () => {
          // Validate data
          if (!depositData.title || !depositData.type) {
            throw new Error('Invalid deposit data: missing required fields');
          }

          // Insert deposit
          const { data, error } = await this.supabase
            .from('kazakhstan_deposits')
            .insert([depositData])
            .select()
            .single();

          if (error) throw error;
          return data;
        },

        async () => {
          // Create audit log entry
          const { error } = await this.supabase.from('audit_logs').insert([
            {
              table_name: 'kazakhstan_deposits',
              operation: 'INSERT',
              record_id: depositData.id,
              user_id: metadata.userId,
              timestamp: new Date().toISOString(),
            },
          ]);

          if (error) {
            console.warn('Audit log creation failed:', error);
            // Don't fail the transaction for audit log issues
          }
        },
      ],
      {
        metadata: {
          ...metadata,
          description: `Create deposit: ${depositData.title}`,
        },
      }
    );
  }

  /**
   * Update deposit with transaction
   */
  async updateDepositWithTransaction(
    depositId: string,
    updateData: any,
    metadata: TransactionContext['metadata'] = {}
  ): Promise<TransactionResult<any>> {
    return this.executeTransaction(
      [
        async () => {
          // Get existing data for rollback
          const { data: existing } = await this.supabase
            .from('kazakhstan_deposits')
            .select('*')
            .eq('id', depositId)
            .single();

          // Update deposit
          const { data, error } = await this.supabase
            .from('kazakhstan_deposits')
            .update(updateData)
            .eq('id', depositId)
            .select()
            .single();

          if (error) throw error;

          return { updated: data, previous: existing };
        },

        async () => {
          // Create audit log entry
          const { error } = await this.supabase.from('audit_logs').insert([
            {
              table_name: 'kazakhstan_deposits',
              operation: 'UPDATE',
              record_id: depositId,
              user_id: metadata.userId,
              timestamp: new Date().toISOString(),
            },
          ]);

          if (error) {
            console.warn('Audit log creation failed:', error);
          }
        },
      ],
      {
        metadata: {
          ...metadata,
          description: `Update deposit: ${depositId}`,
        },
      }
    );
  }

  /**
   * Get transaction status
   */
  getTransactionStatus(transactionId: string): TransactionContext | null {
    return this.activeTransactions.get(transactionId) || null;
  }

  /**
   * List active transactions
   */
  getActiveTransactions(): TransactionContext[] {
    return Array.from(this.activeTransactions.values());
  }

  /**
   * Cleanup stale transactions
   */
  async cleanupStaleTransactions(
    maxAgeMs: number = 5 * 60 * 1000
  ): Promise<void> {
    const now = Date.now();
    const staleTransactions: string[] = [];

    for (const [id, context] of this.activeTransactions.entries()) {
      if (now - context.startTime.getTime() > maxAgeMs) {
        staleTransactions.push(id);
      }
    }

    for (const id of staleTransactions) {
      console.warn(`🧹 Cleaning up stale transaction: ${id}`);
      try {
        await this.rollbackTransaction(id);
      } catch (error) {
        console.error(`Failed to rollback stale transaction ${id}:`, error);
        this.activeTransactions.delete(id);
      }
    }

    if (staleTransactions.length > 0) {
      console.log(
        `🧹 Cleaned up ${staleTransactions.length} stale transactions`
      );
    }
  }

  /**
   * Get transaction statistics
   */
  getTransactionStats(): {
    active: number;
    totalOperations: number;
    averageOperationsPerTransaction: number;
    oldestTransaction?: string;
  } {
    const transactions = Array.from(this.activeTransactions.values());
    const totalOperations = transactions.reduce(
      (sum, tx) => sum + tx.operations.length,
      0
    );

    let oldestTransaction: string | undefined;
    let oldestTime = Date.now();

    for (const [id, context] of this.activeTransactions.entries()) {
      if (context.startTime.getTime() < oldestTime) {
        oldestTime = context.startTime.getTime();
        oldestTransaction = id;
      }
    }

    return {
      active: transactions.length,
      totalOperations,
      averageOperationsPerTransaction:
        transactions.length > 0 ? totalOperations / transactions.length : 0,
      oldestTransaction,
    };
  }
}

// Export singleton instance
export const transactionManager = DatabaseTransactionManager.getInstance();

// Cleanup interval for stale transactions
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(() => {
    transactionManager.cleanupStaleTransactions();
  }, 60000); // Every minute
}
