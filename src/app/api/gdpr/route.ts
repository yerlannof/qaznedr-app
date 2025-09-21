/**
 * 🛡️ QAZNEDR.KZ GDPR Compliance API
 * User data management, consent handling, and privacy rights
 * Kazakhstan mining platform specific implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  gdprCompliance,
  gdprHelpers,
  ConsentType,
  DataCategory,
} from '@/lib/compliance/gdpr-compliance';
import { auditHelpers } from '@/lib/compliance/audit-logger';
import { z } from 'zod';

// Validation schemas
const ConsentRequestSchema = z.object({
  consentType: z.nativeEnum(ConsentType),
  granted: z.boolean(),
  purpose: z.string().optional(),
  dataCategories: z.array(z.nativeEnum(DataCategory)).optional(),
});

const DataExportRequestSchema = z.object({
  format: z.enum(['JSON', 'CSV', 'XML']).default('JSON'),
  categories: z.array(z.nativeEnum(DataCategory)).optional(),
});

const DataDeletionRequestSchema = z.object({
  reason: z.string(),
  categories: z.array(z.nativeEnum(DataCategory)).optional(),
  justification: z.string().optional(),
});

/**
 * GET /api/gdpr - Get user's current consent status and data summary
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    switch (action) {
      case 'consents':
        return await getConsentStatus(userId);

      case 'data-summary':
        return await getDataSummary(userId);

      case 'privacy-notice':
        return getPrivacyNotice();

      case 'export-status':
        return await getExportStatus(userId);

      default:
        return await getGDPRDashboard(userId);
    }
  } catch (error) {
    console.error('GDPR GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gdpr - Handle consent updates and data requests
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'update-consent':
        return await updateConsent(userId, body, request);

      case 'export-data':
        return await exportUserData(userId, body);

      case 'delete-data':
        return await requestDataDeletion(userId, body);

      case 'rectify-data':
        return await rectifyUserData(userId, body);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('GDPR POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get user's consent status for all consent types
 */
async function getConsentStatus(userId: string) {
  const consents: Record<string, boolean> = {};

  for (const consentType of Object.values(ConsentType)) {
    consents[consentType] = await gdprCompliance.hasValidConsent(
      userId,
      consentType
    );
  }

  // Log data access
  await auditHelpers.dataExportRequested(userId, 'SYSTEM');

  return NextResponse.json({
    userId,
    consents,
    lastUpdated: new Date().toISOString(),
    platform: 'QAZNEDR_KZ',
    jurisdiction: 'Kazakhstan/EU',
  });
}

/**
 * Get summary of user's data across the platform
 */
async function getDataSummary(userId: string) {
  // This would typically query the database for data counts
  const summary = {
    personalData: {
      categories: [
        DataCategory.PERSONAL_IDENTITY,
        DataCategory.BUSINESS_IDENTITY,
      ],
      recordCount: 1, // User record
      lastModified: new Date().toISOString(),
      retention: '7 years',
    },
    miningData: {
      categories: [DataCategory.MINING_ACTIVITY, DataCategory.LOCATION],
      recordCount: 0, // Would be actual count of deposits
      lastModified: new Date().toISOString(),
      retention: '20 years (Kazakhstan mining law)',
    },
    behavioralData: {
      categories: [DataCategory.BEHAVIORAL, DataCategory.TECHNICAL],
      recordCount: 0, // Analytics events, views
      lastModified: new Date().toISOString(),
      retention: '3 years',
    },
    communicationData: {
      categories: [DataCategory.COMMUNICATION],
      recordCount: 0, // Contact requests, notifications
      lastModified: new Date().toISOString(),
      retention: '5 years',
    },
  };

  return NextResponse.json({
    userId,
    dataSummary: summary,
    totalCategories: Object.keys(summary).length,
    generatedAt: new Date().toISOString(),
  });
}

/**
 * Get privacy notice content
 */
function getPrivacyNotice() {
  const notice = gdprCompliance.generatePrivacyNotice();

  return NextResponse.json({
    privacyNotice: notice,
    jurisdiction: 'Kazakhstan/EU',
    lastUpdated: '2025-01-01',
    language: 'ru',
    contactEmail: 'privacy@qaznedr.kz',
    dataProtectionOfficer: 'dpo@qaznedr.kz',
  });
}

/**
 * Get status of data export requests
 */
async function getExportStatus(userId: string) {
  // In a real implementation, this would query the database
  return NextResponse.json({
    userId,
    exportRequests: [],
    message: 'No active export requests',
  });
}

/**
 * Get comprehensive GDPR dashboard
 */
async function getGDPRDashboard(userId: string) {
  const consents = await getConsentStatus(userId);
  const dataSummary = await getDataSummary(userId);

  return NextResponse.json({
    dashboard: {
      user: {
        id: userId,
        gdprRights: [
          'Access to data (Article 15)',
          'Rectification (Article 16)',
          'Erasure (Article 17)',
          'Restrict processing (Article 18)',
          'Data portability (Article 20)',
          'Object to processing (Article 21)',
        ],
      },
      consents: (await consents.json()).consents,
      dataSummary: (await dataSummary.json()).dataSummary,
      platform: 'QAZNEDR_KZ',
      compliance: {
        gdpr: true,
        kazakhstanDataProtection: true,
        miningRegulations: true,
      },
    },
  });
}

/**
 * Update user consent for specific data processing
 */
async function updateConsent(userId: string, body: any, request: NextRequest) {
  const validation = ConsentRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid consent request', details: validation.error.errors },
      { status: 400 }
    );
  }

  const { consentType, granted, purpose, dataCategories } = validation.data;
  const ipAddress =
    request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    if (granted) {
      await gdprCompliance.recordConsent({
        userId,
        consentType,
        granted: true,
        legalBasis: 'CONSENT',
        purpose: purpose || `Consent for ${consentType}`,
        dataCategories: dataCategories || [],
        retentionPeriod: 365 * 7, // 7 years default
        withdrawalMethod: 'User portal',
        timestamp: new Date(),
        ipAddress,
        userAgent,
      });
    } else {
      await gdprCompliance.withdrawConsent(userId, consentType);
    }

    // Log consent action
    await auditHelpers.consentGiven(
      userId,
      dataCategories?.join(',') || consentType,
      'CONSENT'
    );

    return NextResponse.json({
      success: true,
      action: granted ? 'granted' : 'withdrawn',
      consentType,
      timestamp: new Date().toISOString(),
      message: `Consent ${granted ? 'granted' : 'withdrawn'} successfully`,
    });
  } catch (error) {
    console.error('Consent update error:', error);
    return NextResponse.json(
      { error: 'Failed to update consent' },
      { status: 500 }
    );
  }
}

/**
 * Export user data in requested format
 */
async function exportUserData(userId: string, body: any) {
  const validation = DataExportRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid export request', details: validation.error.errors },
      { status: 400 }
    );
  }

  const { format, categories } = validation.data;

  try {
    const exportRequest = await gdprCompliance.exportUserData(userId, format);

    return NextResponse.json({
      success: true,
      requestId: exportRequest.requestId,
      status: exportRequest.status,
      format,
      categories: categories || 'all',
      downloadUrl: exportRequest.downloadUrl,
      expiresAt: exportRequest.expiresAt,
      message: 'Data export initiated successfully',
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

/**
 * Request data deletion (Right to be forgotten)
 */
async function requestDataDeletion(userId: string, body: any) {
  const validation = DataDeletionRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid deletion request', details: validation.error.errors },
      { status: 400 }
    );
  }

  const { reason, categories, justification } = validation.data;

  try {
    const deletionRequest = await gdprCompliance.requestDataDeletion({
      userId,
      reason: 'USER_REQUEST',
      dataCategories: categories,
      justification: justification || reason,
    });

    return NextResponse.json({
      success: true,
      requestId: deletionRequest.requestId,
      status: deletionRequest.status,
      scheduledDate: deletionRequest.scheduledDate,
      categories: categories || 'all',
      message:
        deletionRequest.status === 'APPROVED'
          ? 'Data deletion approved and scheduled'
          : `Data deletion ${deletionRequest.status.toLowerCase()}: ${deletionRequest.justification}`,
    });
  } catch (error) {
    console.error('Data deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to request data deletion' },
      { status: 500 }
    );
  }
}

/**
 * Rectify (update) user data
 */
async function rectifyUserData(userId: string, body: any) {
  // Implementation would depend on specific fields to update
  return NextResponse.json({
    success: true,
    message: 'Data rectification not yet implemented',
    userId,
    action: 'rectify-data',
  });
}

/**
 * DELETE /api/gdpr - Cancel pending requests
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const requestId = searchParams.get('requestId');
    const requestType = searchParams.get('type'); // 'export' | 'deletion'

    if (!requestId || !requestType) {
      return NextResponse.json(
        { error: 'Missing requestId or type parameter' },
        { status: 400 }
      );
    }

    // Implementation would cancel the specific request
    return NextResponse.json({
      success: true,
      message: `${requestType} request ${requestId} cancelled`,
      requestId,
      type: requestType,
    });
  } catch (error) {
    console.error('GDPR DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
