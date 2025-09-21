import { NextRequest, NextResponse } from 'next/server';
import {
  sentryMiningService,
  MiningErrorType,
} from '@/lib/monitoring/sentry-service';

export async function GET(request: NextRequest) {
  try {
    // Test different types of Sentry events
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'info';

    switch (testType) {
      case 'error':
        // Test error capture
        const errorId = sentryMiningService.captureError(
          new Error('Test error from Sentry integration test'),
          MiningErrorType.VALIDATION_ERROR,
          {
            testEndpoint: '/api/test-sentry',
            testType: 'error',
            userAgent: request.headers.get('user-agent') || 'unknown',
          }
        );

        return NextResponse.json({
          success: true,
          message: 'Test error sent to Sentry',
          eventId: errorId,
          type: testType,
        });

      case 'mining_error':
        // Test mining-specific error
        const miningErrorId = sentryMiningService.captureError(
          new Error('Mining license validation failed for test case'),
          MiningErrorType.MINING_LICENSE_ERROR,
          {
            listingId: 'test-listing-123',
            licenseNumber: 'TEST-LICENSE-456',
            region: 'Атырауская область',
            mineral: 'Oil',
            operationType: 'license_validation',
          }
        );

        return NextResponse.json({
          success: true,
          message: 'Mining-specific test error sent to Sentry',
          eventId: miningErrorId,
          type: testType,
        });

      case 'breadcrumb':
        // Test breadcrumb logging
        sentryMiningService.addMiningBreadcrumb(
          'Test breadcrumb from Sentry integration',
          'navigation',
          {
            testEndpoint: '/api/test-sentry',
            timestamp: new Date().toISOString(),
            action: 'breadcrumb_test',
          }
        );

        return NextResponse.json({
          success: true,
          message: 'Test breadcrumb added to Sentry',
          type: testType,
        });

      case 'performance':
        // Test performance monitoring
        const startTime = Date.now();

        // Simulate some work
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 100)
        );

        const duration = Date.now() - startTime;

        sentryMiningService.trackMetric(
          'api_test_duration',
          duration,
          { testEndpoint: '/api/test-sentry' },
          { test_type: 'performance' }
        );

        return NextResponse.json({
          success: true,
          message: 'Performance metric tracked in Sentry',
          duration,
          type: testType,
        });

      case 'warning':
        // Test warning level
        const warningId = sentryMiningService.captureError(
          new Error('Test warning from Sentry integration'),
          MiningErrorType.SEARCH_QUERY_FAILED,
          {
            query: 'test mining search',
            filters: { region: 'Мангистауская', mineral: 'Gold' },
            resultsCount: 0,
          },
          'warning'
        );

        return NextResponse.json({
          success: true,
          message: 'Test warning sent to Sentry',
          eventId: warningId,
          type: testType,
        });

      case 'info':
      default:
        // Test info level message
        sentryMiningService.addMiningBreadcrumb(
          'Sentry integration test completed successfully',
          'api',
          {
            testEndpoint: '/api/test-sentry',
            timestamp: new Date().toISOString(),
            integrationStatus: 'working',
          }
        );

        return NextResponse.json({
          success: true,
          message: 'Sentry integration is working correctly',
          availableTests: [
            'error',
            'mining_error',
            'breadcrumb',
            'performance',
            'warning',
            'info',
          ],
          type: testType,
          usage:
            'Add ?type=error|mining_error|breadcrumb|performance|warning|info to test different Sentry features',
        });
    }
  } catch (error) {
    console.error('Test Sentry endpoint error:', error);

    // Capture the error that occurred during testing
    const errorId = sentryMiningService.captureError(
      error as Error,
      MiningErrorType.EXTERNAL_API_ERROR,
      { testEndpoint: '/api/test-sentry', stage: 'test_execution' }
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute Sentry test',
        details: (error as Error).message,
        errorId,
      },
      { status: 500 }
    );
  }
}

// Also support POST for testing different scenarios
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Test error with custom data
    const errorId = sentryMiningService.captureError(
      new Error(body.message || 'Test POST error from Sentry integration'),
      body.errorType || MiningErrorType.VALIDATION_ERROR,
      {
        ...body.context,
        testEndpoint: '/api/test-sentry',
        method: 'POST',
      },
      body.level || 'error'
    );

    return NextResponse.json({
      success: true,
      message: 'Custom test error sent to Sentry',
      eventId: errorId,
      receivedData: body,
    });
  } catch (error) {
    console.error('Test Sentry POST endpoint error:', error);

    const errorId = sentryMiningService.captureError(
      error as Error,
      MiningErrorType.EXTERNAL_API_ERROR,
      { testEndpoint: '/api/test-sentry', method: 'POST' }
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute Sentry POST test',
        errorId,
      },
      { status: 500 }
    );
  }
}
