import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthLevel } from '@/lib/middleware/auth-middleware';
import { withRateLimit } from '@/lib/middleware/rate-limiting';
import { transactionManager } from '@/lib/database/transaction-manager';

// Get transaction status and statistics
async function handleTransactionStatus(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('id');

    if (transactionId) {
      // Get specific transaction status
      const transaction =
        transactionManager.getTransactionStatus(transactionId);

      if (!transaction) {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        transaction: {
          id: transaction.id,
          status: transaction.status,
          operationsCount: transaction.operations.length,
          isolationLevel: transaction.isolationLevel,
          startTime: transaction.startTime,
          duration: Date.now() - transaction.startTime.getTime(),
          metadata: transaction.metadata,
        },
      });
    } else {
      // Get all active transactions and statistics
      const activeTransactions = transactionManager.getActiveTransactions();
      const stats = transactionManager.getTransactionStats();

      return NextResponse.json({
        statistics: stats,
        activeTransactions: activeTransactions.map((tx) => ({
          id: tx.id,
          status: tx.status,
          operationsCount: tx.operations.length,
          isolationLevel: tx.isolationLevel,
          startTime: tx.startTime,
          duration: Date.now() - tx.startTime.getTime(),
          metadata: tx.metadata,
        })),
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Transaction status error:', error);
    return NextResponse.json(
      { error: 'Failed to get transaction status' },
      { status: 500 }
    );
  }
}

// Cleanup stale transactions
async function handleCleanupTransactions(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const maxAgeMs = parseInt(searchParams.get('maxAge') || '300000'); // 5 minutes default

    await transactionManager.cleanupStaleTransactions(maxAgeMs);

    return NextResponse.json({
      success: true,
      message: 'Stale transactions cleaned up',
      maxAge: maxAgeMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Transaction cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup transactions' },
      { status: 500 }
    );
  }
}

// Main route handler
async function handleTransactionRequest(
  request: NextRequest
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'status':
      return handleTransactionStatus(request);
    case 'cleanup':
      return handleCleanupTransactions(request);
    default:
      return NextResponse.json(
        {
          error: 'Invalid action',
          availableActions: ['status', 'cleanup'],
        },
        { status: 400 }
      );
  }
}

// Export with security middleware
export const GET = withRateLimit(
  withAuth(handleTransactionRequest, AuthLevel.ADMIN),
  'admin'
);

export const POST = withRateLimit(
  withAuth(handleTransactionRequest, AuthLevel.ADMIN),
  'admin'
);
