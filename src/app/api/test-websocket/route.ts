import { NextRequest, NextResponse } from 'next/server';
import {
  wsNotificationService,
  NotificationType,
  Notification,
} from '@/lib/notifications/websocket-service';
import {
  sentryMiningService,
  MiningErrorType,
} from '@/lib/monitoring/sentry-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'info';

    // Create a mock user for testing
    const mockUserId = 'test-user-12345';
    const mockAuthToken = 'test-auth-token';

    switch (testType) {
      case 'connect':
        // Test WebSocket connection simulation
        try {
          // This is a simulation since we can't create actual WebSocket connection in API route
          const connectionTest = {
            userId: mockUserId,
            authToken: mockAuthToken,
            status: 'simulated_connection',
            timestamp: new Date().toISOString(),
          };

          sentryMiningService.addMiningBreadcrumb(
            'WebSocket connection test simulated',
            'api',
            connectionTest
          );

          return NextResponse.json({
            success: true,
            message: 'WebSocket connection test simulated',
            connectionDetails: connectionTest,
            note: 'This is a simulation - actual WebSocket server would be needed for real connection',
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error: 'WebSocket connection test failed',
              details: (error as Error).message,
            },
            { status: 500 }
          );
        }

      case 'mining_notification':
        // Test mining-specific notification creation
        const miningNotification: Omit<
          Notification,
          'id' | 'createdAt' | 'userId'
        > = {
          type: NotificationType.NEW_MINERAL_DISCOVERY,
          title: 'Новое месторождение обнаружено!',
          message:
            'В Атырауской области обнаружено новое месторождение золота с запасами 2.5 тонн',
          data: {
            listingId: 'test-listing-456',
            mineral: 'Gold',
            region: 'Атырауская область',
            estimatedReserves: '2.5 tons',
            discoveryDate: new Date().toISOString(),
            coordinates: { lat: 47.1164, lng: 51.8978 },
          },
          priority: 'high',
          actionUrl: '/listings/test-listing-456',
          read: false,
        };

        sentryMiningService.addMiningBreadcrumb(
          'Mining notification created for testing',
          'notification',
          {
            notificationType: miningNotification.type,
            priority: miningNotification.priority,
            mineral: miningNotification.data?.mineral,
            region: miningNotification.data?.region,
          }
        );

        return NextResponse.json({
          success: true,
          message: 'Mining notification created successfully',
          notification: miningNotification,
          miningContext: {
            supportedMinerals: [
              'Gold',
              'Oil',
              'Gas',
              'Copper',
              'Coal',
              'Uranium',
              'Iron',
            ],
            supportedRegions: [
              'Атырауская область',
              'Мангистауская область',
              'Алматинская область',
              'Нур-Султан',
              'Шымкент',
              'Караганда',
              'Актобе',
            ],
          },
        });

      case 'license_expiry':
        // Test license expiry notification
        const licenseNotification: Omit<
          Notification,
          'id' | 'createdAt' | 'userId'
        > = {
          type: NotificationType.LICENSE_EXPIRY_WARNING,
          title: 'Внимание: Истекает лицензия на добычу',
          message:
            'Ваша лицензия на добычу нефти LIC-OIL-2024-001 истекает через 30 дней',
          data: {
            licenseNumber: 'LIC-OIL-2024-001',
            licenseType: 'MINING_LICENSE',
            mineral: 'Oil',
            expiryDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            remainingDays: 30,
            listingId: 'mining-license-789',
          },
          priority: 'urgent',
          actionUrl: '/dashboard/my-listings/mining-license-789',
          read: false,
        };

        return NextResponse.json({
          success: true,
          message: 'License expiry notification created',
          notification: licenseNotification,
          urgencyLevel: 'urgent',
          recommendedActions: [
            'Продлить лицензию через портал государственных услуг',
            'Подготовить необходимые документы для продления',
            'Обратиться к специалисту по лицензированию',
          ],
        });

      case 'market_alert':
        // Test market alert notification
        const marketNotification: Omit<
          Notification,
          'id' | 'createdAt' | 'userId'
        > = {
          type: NotificationType.MARKET_ALERT,
          title: 'Рыночное предупреждение: Рост цен на золото',
          message:
            'Цены на золото выросли на 15% за последнюю неделю. Рассмотрите возможность продажи активов.',
          data: {
            mineral: 'Gold',
            priceChange: '+15%',
            currentPrice: '$1,950/oz',
            timeframe: '7 days',
            marketTrend: 'bullish',
            recommendation: 'consider_selling',
          },
          priority: 'medium',
          actionUrl: '/market/gold-analysis',
          read: false,
        };

        return NextResponse.json({
          success: true,
          message: 'Market alert notification created',
          notification: marketNotification,
          marketData: {
            minerals: {
              gold: { price: 1950, change: '+15%', trend: 'bullish' },
              oil: { price: 85, change: '+3%', trend: 'stable' },
              copper: { price: 8.5, change: '-2%', trend: 'bearish' },
            },
          },
        });

      case 'notification_types':
        // List all available notification types
        const allTypes = Object.values(NotificationType);
        const miningSpecificTypes = allTypes.filter(
          (type) =>
            type.includes('mineral') ||
            type.includes('license') ||
            type.includes('exploration') ||
            type.includes('geological') ||
            type.includes('market')
        );

        return NextResponse.json({
          success: true,
          message: 'WebSocket notification types enumerated',
          totalTypes: allTypes.length,
          miningSpecificTypes: miningSpecificTypes.length,
          allNotificationTypes: allTypes,
          miningTypes: miningSpecificTypes,
          systemTypes: allTypes.filter(
            (type) => type.includes('system') || type.includes('security')
          ),
          userTypes: allTypes.filter(
            (type) => type.includes('message') || type.includes('payment')
          ),
        });

      case 'error_simulation':
        // Test error handling in WebSocket system
        try {
          // Simulate a WebSocket error
          throw new Error(
            'WebSocket connection timeout during mining notification delivery'
          );
        } catch (error) {
          const errorId = sentryMiningService.captureError(
            error as Error,
            MiningErrorType.EXTERNAL_API_ERROR,
            {
              component: 'websocket_notification_service',
              operation: 'notification_delivery',
              userId: mockUserId,
              notificationType: NotificationType.NEW_MINERAL_DISCOVERY,
            }
          );

          return NextResponse.json({
            success: true,
            message: 'WebSocket error simulation completed',
            errorSimulated: true,
            errorId: errorId,
            errorDetails: (error as Error).message,
            recoveryStrategy:
              'Queue notification for retry when connection is restored',
          });
        }

      default:
        return NextResponse.json({
          success: true,
          message: 'WebSocket notification service test endpoints',
          availableTests: [
            'connect',
            'mining_notification',
            'license_expiry',
            'market_alert',
            'notification_types',
            'error_simulation',
          ],
          serviceFeatures: [
            'Real-time mining notifications',
            'Mining license expiry alerts',
            'Market price alerts for minerals',
            'Geological discovery notifications',
            'Error handling and retry mechanisms',
            'Kazakhstan mining industry context',
          ],
          usage: 'Add ?type=test_name to test specific WebSocket features',
        });
    }
  } catch (error) {
    console.error('WebSocket test error:', error);

    const errorId = sentryMiningService.captureError(
      error as Error,
      MiningErrorType.EXTERNAL_API_ERROR,
      { testEndpoint: '/api/test-websocket' }
    );

    return NextResponse.json(
      {
        success: false,
        error: 'WebSocket test failed',
        errorId: errorId,
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Test custom notification creation
    const customNotification: Omit<
      Notification,
      'id' | 'createdAt' | 'userId'
    > = {
      type: body.type || NotificationType.SYSTEM_ALERT,
      title: body.title || 'Test notification',
      message: body.message || 'This is a test notification created via API',
      data: body.data || {},
      priority: body.priority || 'medium',
      actionUrl: body.actionUrl,
      read: false,
    };

    sentryMiningService.addMiningBreadcrumb(
      'Custom WebSocket notification created via API',
      'api',
      {
        notificationType: customNotification.type,
        priority: customNotification.priority,
        hasActionUrl: !!customNotification.actionUrl,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Custom notification created successfully',
      notification: customNotification,
      receivedData: body,
    });
  } catch (error) {
    console.error('WebSocket POST test error:', error);

    const errorId = sentryMiningService.captureError(
      error as Error,
      MiningErrorType.VALIDATION_ERROR,
      { testEndpoint: '/api/test-websocket', method: 'POST' }
    );

    return NextResponse.json(
      {
        success: false,
        error: 'WebSocket POST test failed',
        errorId: errorId,
      },
      { status: 500 }
    );
  }
}
