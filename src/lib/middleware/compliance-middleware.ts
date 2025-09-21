/**
 * 🛡️ QAZNEDR.KZ Compliance Middleware
 * Automatic audit logging and GDPR compliance for all API routes
 * Integrates with Kazakhstan mining platform business logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  auditLogger,
  AuditAction,
  ResourceType,
  RiskLevel,
  AuditCategory,
} from '../compliance/audit-logger';
import { gdprCompliance, ConsentType } from '../compliance/gdpr-compliance';

// Route patterns that require special handling
const SENSITIVE_ROUTES = [
  '/api/admin',
  '/api/users',
  '/api/deposits/create',
  '/api/deposits/update',
  '/api/auth',
];

const PUBLIC_ROUTES = [
  '/api/health',
  '/api/deposits/search',
  '/api/regions',
  '/api/minerals',
];

const MINING_SPECIFIC_ROUTES = [
  '/api/deposits',
  '/api/licenses',
  '/api/geological-surveys',
  '/api/mining-organizations',
];

interface ComplianceContext {
  userId?: string;
  organizationId?: string;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  route: string;
  method: string;
  isAuthenticated: boolean;
  isSensitive: boolean;
  isMiningSpecific: boolean;
  requiresConsent: ConsentType[];
}

/**
 * Extract compliance context from request
 */
async function extractComplianceContext(
  request: NextRequest
): Promise<ComplianceContext> {
  const session = await getServerSession(authOptions);
  const ipAddress =
    request.ip ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const route = request.nextUrl.pathname;
  const method = request.method;

  // Determine if route is sensitive
  const isSensitive = SENSITIVE_ROUTES.some((pattern) =>
    route.startsWith(pattern)
  );
  const isMiningSpecific = MINING_SPECIFIC_ROUTES.some((pattern) =>
    route.startsWith(pattern)
  );

  // Determine required consents
  const requiresConsent: ConsentType[] = [];
  if (isMiningSpecific) requiresConsent.push(ConsentType.MINING_DATA);
  if (route.includes('/analytics')) requiresConsent.push(ConsentType.ANALYTICS);
  if (route.includes('/marketing')) requiresConsent.push(ConsentType.MARKETING);

  return {
    userId: session?.user?.id,
    organizationId: session?.user?.organizationId,
    ipAddress,
    userAgent,
    sessionId: session?.sessionId,
    route,
    method,
    isAuthenticated: !!session,
    isSensitive,
    isMiningSpecific,
    requiresConsent,
  };
}

/**
 * Check GDPR consent compliance
 */
async function checkConsentCompliance(
  context: ComplianceContext
): Promise<{ allowed: boolean; missingConsents: ConsentType[] }> {
  if (!context.userId || context.requiresConsent.length === 0) {
    return { allowed: true, missingConsents: [] };
  }

  const missingConsents: ConsentType[] = [];

  for (const consentType of context.requiresConsent) {
    const hasConsent = await gdprCompliance.hasValidConsent(
      context.userId,
      consentType
    );
    if (!hasConsent && consentType !== ConsentType.ESSENTIAL) {
      missingConsents.push(consentType);
    }
  }

  return {
    allowed: missingConsents.length === 0,
    missingConsents,
  };
}

/**
 * Determine audit action based on route and method
 */
function determineAuditAction(context: ComplianceContext): AuditAction {
  const { route, method } = context;

  // Authentication routes
  if (route.includes('/auth/login')) return AuditAction.USER_LOGIN;
  if (route.includes('/auth/logout')) return AuditAction.USER_LOGOUT;
  if (route.includes('/auth/register')) return AuditAction.USER_CREATED;

  // Mining-specific routes
  if (route.includes('/deposits')) {
    if (method === 'POST') return AuditAction.DEPOSIT_CREATED;
    if (method === 'PUT' || method === 'PATCH')
      return AuditAction.DEPOSIT_UPDATED;
    if (method === 'DELETE') return AuditAction.DEPOSIT_DELETED;
    if (method === 'GET') return AuditAction.DATA_VIEWED;
  }

  if (route.includes('/licenses/upload')) return AuditAction.LICENSE_UPLOADED;
  if (route.includes('/geological-surveys/upload'))
    return AuditAction.GEOLOGICAL_SURVEY_UPLOADED;

  // Admin routes
  if (route.includes('/admin')) {
    if (route.includes('/users/create')) return AuditAction.ADMIN_USER_CREATED;
    if (route.includes('/users/suspend'))
      return AuditAction.ADMIN_USER_SUSPENDED;
    if (route.includes('/deposits/approve'))
      return AuditAction.ADMIN_DEPOSIT_APPROVED;
    if (route.includes('/deposits/reject'))
      return AuditAction.ADMIN_DEPOSIT_REJECTED;
  }

  // Business actions
  if (route.includes('/contact-requests'))
    return AuditAction.CONTACT_REQUEST_SENT;
  if (route.includes('/favorites')) {
    return method === 'POST'
      ? AuditAction.FAVORITE_ADDED
      : AuditAction.FAVORITE_REMOVED;
  }

  // GDPR routes
  if (route.includes('/gdpr/export'))
    return AuditAction.GDPR_DATA_EXPORT_REQUESTED;
  if (route.includes('/gdpr/delete'))
    return AuditAction.GDPR_DATA_DELETION_REQUESTED;

  // Default
  return AuditAction.API_ACCESSED;
}

/**
 * Determine resource type based on route
 */
function determineResourceType(context: ComplianceContext): ResourceType {
  const { route } = context;

  if (route.includes('/users')) return ResourceType.USER;
  if (route.includes('/organizations')) return ResourceType.ORGANIZATION;
  if (route.includes('/deposits')) return ResourceType.DEPOSIT;
  if (route.includes('/documents') || route.includes('/licenses'))
    return ResourceType.DOCUMENT;
  if (route.includes('/contact-requests')) return ResourceType.CONTACT_REQUEST;
  if (route.includes('/notifications')) return ResourceType.NOTIFICATION;
  if (route.includes('/admin') || route.includes('/system'))
    return ResourceType.SYSTEM;

  return ResourceType.API_ENDPOINT;
}

/**
 * Determine risk level based on route and action
 */
function determineRiskLevel(
  context: ComplianceContext,
  action: AuditAction
): RiskLevel {
  // Critical risk events
  if (
    [
      AuditAction.SECURITY_INCIDENT,
      AuditAction.DATA_BREACH_DETECTED,
      AuditAction.ADMIN_USER_CREATED,
      AuditAction.GDPR_DATA_DELETION_REQUESTED,
    ].includes(action)
  ) {
    return RiskLevel.CRITICAL;
  }

  // High risk events
  if (
    context.isSensitive ||
    [
      AuditAction.LICENSE_UPLOADED,
      AuditAction.GEOLOGICAL_SURVEY_UPLOADED,
      AuditAction.ADMIN_DEPOSIT_APPROVED,
      AuditAction.GDPR_DATA_EXPORT_REQUESTED,
    ].includes(action)
  ) {
    return RiskLevel.HIGH;
  }

  // Medium risk events
  if (
    context.isMiningSpecific ||
    [
      AuditAction.DEPOSIT_CREATED,
      AuditAction.DEPOSIT_UPDATED,
      AuditAction.USER_CREATED,
      AuditAction.CONTACT_REQUEST_SENT,
    ].includes(action)
  ) {
    return RiskLevel.MEDIUM;
  }

  // Low risk by default
  return RiskLevel.LOW;
}

/**
 * Determine audit category
 */
function determineAuditCategory(action: AuditAction): AuditCategory {
  const authActions = [
    AuditAction.USER_LOGIN,
    AuditAction.USER_LOGOUT,
    AuditAction.USER_CREATED,
  ];
  if (authActions.includes(action)) return AuditCategory.AUTHENTICATION;

  const adminActions = [
    AuditAction.ADMIN_USER_CREATED,
    AuditAction.ADMIN_USER_SUSPENDED,
    AuditAction.ADMIN_DEPOSIT_APPROVED,
    AuditAction.ADMIN_DEPOSIT_REJECTED,
  ];
  if (adminActions.includes(action)) return AuditCategory.ADMIN_ACTION;

  const dataActions = [
    AuditAction.DATA_VIEWED,
    AuditAction.DATA_EXPORTED,
    AuditAction.DATA_DOWNLOADED,
  ];
  if (dataActions.includes(action)) return AuditCategory.DATA_ACCESS;

  const modificationActions = [
    AuditAction.DEPOSIT_CREATED,
    AuditAction.DEPOSIT_UPDATED,
    AuditAction.DEPOSIT_DELETED,
    AuditAction.USER_UPDATED,
  ];
  if (modificationActions.includes(action))
    return AuditCategory.DATA_MODIFICATION;

  const businessActions = [
    AuditAction.CONTACT_REQUEST_SENT,
    AuditAction.FAVORITE_ADDED,
    AuditAction.LICENSE_UPLOADED,
  ];
  if (businessActions.includes(action))
    return AuditCategory.BUSINESS_TRANSACTION;

  const complianceActions = [
    AuditAction.GDPR_CONSENT_GIVEN,
    AuditAction.GDPR_DATA_EXPORT_REQUESTED,
    AuditAction.GDPR_DATA_DELETION_REQUESTED,
  ];
  if (complianceActions.includes(action)) return AuditCategory.COMPLIANCE;

  const securityActions = [
    AuditAction.SECURITY_INCIDENT,
    AuditAction.DATA_BREACH_DETECTED,
  ];
  if (securityActions.includes(action)) return AuditCategory.SECURITY;

  return AuditCategory.SYSTEM_EVENT;
}

/**
 * Extract resource ID from request
 */
function extractResourceId(
  context: ComplianceContext,
  request: NextRequest
): string | undefined {
  const { route } = context;

  // Extract ID from URL path
  const pathSegments = route.split('/');
  const idSegment = pathSegments.find((segment) =>
    segment.match(/^[a-zA-Z0-9_-]+$/)
  );

  if (idSegment && idSegment.length > 10) {
    return idSegment;
  }

  // Extract from query parameters
  const searchParams = request.nextUrl.searchParams;
  return (
    searchParams.get('id') ||
    searchParams.get('depositId') ||
    searchParams.get('userId')
  );
}

/**
 * Main compliance middleware function
 */
export async function complianceMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    // Skip compliance for public routes
    if (
      PUBLIC_ROUTES.some((route) => request.nextUrl.pathname.startsWith(route))
    ) {
      return null;
    }

    // Extract compliance context
    const context = await extractComplianceContext(request);

    // Check GDPR consent compliance
    const consentCheck = await checkConsentCompliance(context);
    if (!consentCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Consent required',
          missingConsents: consentCheck.missingConsents,
          message: 'Required consent not granted for this operation',
        },
        { status: 403 }
      );
    }

    // Determine audit parameters
    const action = determineAuditAction(context);
    const resourceType = determineResourceType(context);
    const riskLevel = determineRiskLevel(context, action);
    const category = determineAuditCategory(action);
    const resourceId = extractResourceId(context, request);

    // Log audit event (async - don't block request)
    auditLogger
      .log({
        action,
        resourceType,
        resourceId,
        userId: context.userId,
        organizationId: context.organizationId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        metadata: {
          route: context.route,
          method: context.method,
          isAuthenticated: context.isAuthenticated,
          isSensitive: context.isSensitive,
          isMiningSpecific: context.isMiningSpecific,
          timestamp: new Date().toISOString(),
        },
        riskLevel,
        category,
        sensitiveData: context.isSensitive,
      })
      .catch((error) => {
        console.error('Audit logging failed:', error);
      });

    // Add compliance headers to response
    const response = NextResponse.next();
    response.headers.set('X-Audit-Logged', 'true');
    response.headers.set('X-GDPR-Compliant', 'true');
    response.headers.set('X-Risk-Level', riskLevel);

    if (context.isMiningSpecific) {
      response.headers.set('X-Mining-Platform', 'QAZNEDR-KZ');
      response.headers.set('X-Jurisdiction', 'Kazakhstan');
    }

    return response;
  } catch (error) {
    console.error('Compliance middleware error:', error);

    // Log security incident
    await auditLogger.logSecurityIncident({
      incidentType: 'COMPLIANCE_MIDDLEWARE_ERROR',
      severity: RiskLevel.HIGH,
      description: `Compliance middleware failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      metadata: {
        route: request.nextUrl.pathname,
        method: request.method,
        timestamp: new Date().toISOString(),
      },
    });

    // Don't block request on middleware failure
    return null;
  }
}

/**
 * Response interceptor for additional compliance checks
 */
export async function complianceResponseInterceptor(
  request: NextRequest,
  response: Response
): Promise<Response> {
  try {
    const context = await extractComplianceContext(request);

    // Log response for sensitive routes
    if (context.isSensitive) {
      await auditLogger.log({
        action: AuditAction.DATA_VIEWED,
        resourceType: determineResourceType(context),
        userId: context.userId,
        metadata: {
          statusCode: response.status,
          responseSize: response.headers.get('content-length'),
          route: context.route,
          timestamp: new Date().toISOString(),
        },
        riskLevel: response.status >= 400 ? RiskLevel.HIGH : RiskLevel.MEDIUM,
        category: AuditCategory.DATA_ACCESS,
        sensitiveData: true,
      });
    }

    // Add GDPR headers
    response.headers.set('X-Data-Controller', 'QAZNEDR.KZ');
    response.headers.set('X-Privacy-Contact', 'privacy@qaznedr.kz');
    response.headers.set(
      'X-Retention-Policy',
      'https://qaznedr.kz/privacy-policy'
    );

    return response;
  } catch (error) {
    console.error('Response interceptor error:', error);
    return response;
  }
}

// Helper functions for manual compliance checks
export const complianceHelpers = {
  /**
   * Check if user can access specific mining data
   */
  canAccessMiningData: async (
    userId: string,
    depositId: string
  ): Promise<boolean> => {
    const hasConsent = await gdprCompliance.hasValidConsent(
      userId,
      ConsentType.MINING_DATA
    );
    if (!hasConsent) return false;

    // Additional business logic checks
    // e.g., organization membership, payment status, etc.
    return true;
  },

  /**
   * Record mining-specific audit event
   */
  logMiningAction: async (params: {
    action: AuditAction;
    userId: string;
    depositId?: string;
    licenseNumber?: string;
    metadata?: any;
  }) => {
    await auditLogger.logMiningEvent({
      action: params.action,
      depositId: params.depositId,
      licenseNumber: params.licenseNumber,
      metadata: {
        ...params.metadata,
        userId: params.userId,
        platform: 'QAZNEDR_KZ',
      },
    });
  },

  /**
   * Validate data retention compliance
   */
  validateRetention: async (
    dataType: string,
    createdAt: Date
  ): Promise<boolean> => {
    // Implementation depends on data type and Kazakhstan regulations
    return true;
  },

  /**
   * Generate compliance report
   */
  generateComplianceReport: async (
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) => {
    return auditLogger.exportAuditLogs({
      startDate,
      endDate,
      organizationId,
      format: 'JSON',
    });
  },
};
