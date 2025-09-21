import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthLevel } from '@/lib/middleware/auth-middleware';
import { withRateLimit } from '@/lib/middleware/rate-limiting';
import { withInputValidation } from '@/lib/middleware/input-validation';
import { dataSyncService } from '@/lib/sync/data-sync-service';
import { elasticsearchService } from '@/lib/search/elasticsearch-service';

// Health check endpoint
async function handleSyncHealth(request: NextRequest): Promise<NextResponse> {
  try {
    const [syncHealth, esHealth] = await Promise.all([
      dataSyncService.healthCheck(),
      elasticsearchService.healthCheck(),
    ]);

    const syncStats = dataSyncService.getSyncStats();

    return NextResponse.json({
      status: 'healthy',
      services: {
        syncService: syncHealth.syncService,
        elasticsearch: syncHealth.elasticsearch,
        supabase: syncHealth.supabase,
      },
      elasticsearch: {
        connected: esHealth.connected,
        cluster: esHealth.cluster,
        status: esHealth.status,
        indexExists: esHealth.indexExists,
        documentCount: esHealth.documentCount,
      },
      syncQueue: {
        size: syncStats.queueSize,
        processing: syncStats.processing,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync health check error:', error);
    return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
  }
}

// Full sync endpoint
async function handleFullSync(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔄 Starting full sync via API...');
    const result = await dataSyncService.performFullSync();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Full sync completed successfully',
        stats: {
          totalRecords: result.totalRecords,
          syncedRecords: result.syncedRecords,
          errors: result.errors,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Full sync completed with errors',
          stats: result,
        },
        { status: 207 } // Multi-status for partial success
      );
    }
  } catch (error) {
    console.error('Full sync error:', error);
    return NextResponse.json({ error: 'Full sync failed' }, { status: 500 });
  }
}

// Consistency check endpoint
async function handleConsistencyCheck(
  request: NextRequest
): Promise<NextResponse> {
  try {
    console.log('🔍 Starting consistency check via API...');
    const result = await dataSyncService.verifyDataConsistency();

    return NextResponse.json({
      consistent: result.consistent,
      summary: {
        supabaseCount: result.supabaseCount,
        elasticsearchCount: result.elasticsearchCount,
        missingInES: result.missingInES.length,
        extraInES: result.extraInES.length,
      },
      details: {
        missingInES: result.missingInES,
        extraInES: result.extraInES,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Consistency check error:', error);
    return NextResponse.json(
      { error: 'Consistency check failed' },
      { status: 500 }
    );
  }
}

// Fix inconsistencies endpoint
async function handleFixInconsistencies(
  request: NextRequest
): Promise<NextResponse> {
  try {
    console.log('🔧 Starting inconsistency fix via API...');
    const result = await dataSyncService.fixInconsistencies();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Inconsistencies fixed successfully',
        fixed: result.fixed,
        errors: result.errors,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Fix inconsistencies completed with errors',
          fixed: result.fixed,
          errors: result.errors,
        },
        { status: 207 }
      );
    }
  } catch (error) {
    console.error('Fix inconsistencies error:', error);
    return NextResponse.json(
      { error: 'Fix inconsistencies failed' },
      { status: 500 }
    );
  }
}

// Clear sync queue endpoint
async function handleClearQueue(request: NextRequest): Promise<NextResponse> {
  try {
    const queueSizeBefore = dataSyncService.getSyncStats().queueSize;
    dataSyncService.clearSyncQueue();

    return NextResponse.json({
      success: true,
      message: 'Sync queue cleared',
      clearedItems: queueSizeBefore,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Clear queue error:', error);
    return NextResponse.json(
      { error: 'Failed to clear queue' },
      { status: 500 }
    );
  }
}

// Main route handler
async function handleSyncRequest(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'health':
      return handleSyncHealth(request);
    case 'full-sync':
      return handleFullSync(request);
    case 'consistency-check':
      return handleConsistencyCheck(request);
    case 'fix-inconsistencies':
      return handleFixInconsistencies(request);
    case 'clear-queue':
      return handleClearQueue(request);
    default:
      return NextResponse.json(
        {
          error: 'Invalid action',
          availableActions: [
            'health',
            'full-sync',
            'consistency-check',
            'fix-inconsistencies',
            'clear-queue',
          ],
        },
        { status: 400 }
      );
  }
}

// Export with security middleware
export const GET = withRateLimit(
  withAuth(handleSyncRequest, AuthLevel.ADMIN),
  'admin'
);

export const POST = withRateLimit(
  withInputValidation(
    ['POST'],
    ['application/json'],
    1024
  )(withAuth(handleSyncRequest, AuthLevel.ADMIN)),
  'admin'
);
