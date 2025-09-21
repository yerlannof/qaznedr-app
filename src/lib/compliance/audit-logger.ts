/**
 * 🛡️ QAZNEDR.KZ Enterprise Audit Logging System
 * Comprehensive audit trail for Kazakhstan mining platform compliance
 * Supports GDPR, Kazakhstan data protection laws, and mining regulations
 */

import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Types for audit logging
export interface AuditEvent {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  userId?: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  sensitiveData?: boolean;
  riskLevel: RiskLevel;
  category: AuditCategory;
}

export enum AuditAction {
  // User actions
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_PASSWORD_CHANGED = 'USER_PASSWORD_CHANGED',
  USER_EMAIL_VERIFIED = 'USER_EMAIL_VERIFIED',
  USER_PERMISSIONS_CHANGED = 'USER_PERMISSIONS_CHANGED',

  // Data access
  DATA_VIEWED = 'DATA_VIEWED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  DATA_DOWNLOADED = 'DATA_DOWNLOADED',

  // Mining-specific actions
  DEPOSIT_CREATED = 'DEPOSIT_CREATED',
  DEPOSIT_UPDATED = 'DEPOSIT_UPDATED',
  DEPOSIT_DELETED = 'DEPOSIT_DELETED',
  DEPOSIT_PUBLISHED = 'DEPOSIT_PUBLISHED',
  DEPOSIT_UNPUBLISHED = 'DEPOSIT_UNPUBLISHED',
  LICENSE_UPLOADED = 'LICENSE_UPLOADED',
  LICENSE_VERIFIED = 'LICENSE_VERIFIED',
  GEOLOGICAL_SURVEY_UPLOADED = 'GEOLOGICAL_SURVEY_UPLOADED',

  // Business transactions
  CONTACT_REQUEST_SENT = 'CONTACT_REQUEST_SENT',
  CONTACT_REQUEST_RESPONDED = 'CONTACT_REQUEST_RESPONDED',
  FAVORITE_ADDED = 'FAVORITE_ADDED',
  FAVORITE_REMOVED = 'FAVORITE_REMOVED',

  // Administrative actions
  ADMIN_USER_CREATED = 'ADMIN_USER_CREATED',
  ADMIN_USER_SUSPENDED = 'ADMIN_USER_SUSPENDED',
  ADMIN_DEPOSIT_APPROVED = 'ADMIN_DEPOSIT_APPROVED',
  ADMIN_DEPOSIT_REJECTED = 'ADMIN_DEPOSIT_REJECTED',
  ADMIN_ORGANIZATION_VERIFIED = 'ADMIN_ORGANIZATION_VERIFIED',

  // System events
  API_ACCESSED = 'API_ACCESSED',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SECURITY_INCIDENT = 'SECURITY_INCIDENT',
  DATA_BREACH_DETECTED = 'DATA_BREACH_DETECTED',

  // GDPR events
  GDPR_CONSENT_GIVEN = 'GDPR_CONSENT_GIVEN',
  GDPR_CONSENT_WITHDRAWN = 'GDPR_CONSENT_WITHDRAWN',
  GDPR_DATA_EXPORT_REQUESTED = 'GDPR_DATA_EXPORT_REQUESTED',
  GDPR_DATA_DELETION_REQUESTED = 'GDPR_DATA_DELETION_REQUESTED',
  GDPR_DATA_RECTIFICATION = 'GDPR_DATA_RECTIFICATION',
}

export enum ResourceType {
  USER = 'USER',
  ORGANIZATION = 'ORGANIZATION',
  DEPOSIT = 'DEPOSIT',
  DOCUMENT = 'DOCUMENT',
  CONTACT_REQUEST = 'CONTACT_REQUEST',
  NOTIFICATION = 'NOTIFICATION',
  SYSTEM = 'SYSTEM',
  API_ENDPOINT = 'API_ENDPOINT',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AuditCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  BUSINESS_TRANSACTION = 'BUSINESS_TRANSACTION',
  ADMIN_ACTION = 'ADMIN_ACTION',
  SYSTEM_EVENT = 'SYSTEM_EVENT',
  SECURITY = 'SECURITY',
  COMPLIANCE = 'COMPLIANCE',
}

class AuditLogger {
  private prisma: PrismaClient;
  private isEnabled: boolean;

  constructor() {
    this.prisma = new PrismaClient();
    this.isEnabled =
      process.env.NODE_ENV === 'production' ||
      process.env.AUDIT_LOGGING_ENABLED === 'true';
  }

  /**
   * Log an audit event with full context
   */
  async log(event: AuditEvent): Promise<void> {
    if (!this.isEnabled) {
      console.log('Audit Event (dev):', event);
      return;
    }

    try {
      // Get request context
      const headersList = headers();
      const ipAddress =
        headersList.get('x-forwarded-for') ||
        headersList.get('x-real-ip') ||
        'unknown';
      const userAgent = headersList.get('user-agent') || 'unknown';

      // Get session context
      const session = await getServerSession(authOptions);
      const userId = event.userId || session?.user?.id;

      // Create audit record
      await this.prisma.auditLog.create({
        data: {
          action: event.action,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          userId,
          organizationId: event.organizationId,
          ipAddress: event.ipAddress || ipAddress,
          userAgent: event.userAgent || userAgent,
          sessionId: event.sessionId,
          metadata: event.metadata || {},
          sensitiveData: event.sensitiveData || false,
          riskLevel: event.riskLevel,
          category: event.category,
          timestamp: new Date(),
          fingerprint: this.generateFingerprint(event),
          context: {
            url: headersList.get('referer'),
            method: 'unknown', // Will be set by middleware
            region: await this.detectRegion(ipAddress),
            deviceType: this.detectDeviceType(userAgent),
          },
        },
      });

      // Alert on high-risk events
      if (
        event.riskLevel === RiskLevel.CRITICAL ||
        event.riskLevel === RiskLevel.HIGH
      ) {
        await this.sendSecurityAlert(event);
      }
    } catch (error) {
      console.error('Audit logging failed:', error);
      // Don't throw - audit logging shouldn't break the application

      // Log to fallback system (file-based)
      await this.fallbackLog(event, error);
    }
  }

  /**
   * Enhanced logging for Kazakhstan mining-specific events
   */
  async logMiningEvent(params: {
    action: AuditAction;
    depositId?: string;
    licenseNumber?: string;
    mineralType?: string;
    region?: string;
    organizationId?: string;
    metadata?: Record<string, any>;
    riskLevel?: RiskLevel;
  }): Promise<void> {
    await this.log({
      action: params.action,
      resourceType: ResourceType.DEPOSIT,
      resourceId: params.depositId,
      organizationId: params.organizationId,
      metadata: {
        ...params.metadata,
        licenseNumber: params.licenseNumber,
        mineralType: params.mineralType,
        region: params.region,
        platform: 'QAZNEDR_KZ',
        jurisdiction: 'Kazakhstan',
      },
      riskLevel: params.riskLevel || RiskLevel.MEDIUM,
      category: AuditCategory.BUSINESS_TRANSACTION,
      sensitiveData: true,
    });
  }

  /**
   * GDPR compliance logging
   */
  async logGDPREvent(params: {
    action: AuditAction;
    userId: string;
    dataType?: string;
    legalBasis?: string;
    retentionPeriod?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.log({
      action: params.action,
      resourceType: ResourceType.USER,
      resourceId: params.userId,
      userId: params.userId,
      metadata: {
        ...params.metadata,
        dataType: params.dataType,
        legalBasis: params.legalBasis,
        retentionPeriod: params.retentionPeriod,
        gdprCompliance: true,
        jurisdiction: 'EU_GDPR',
      },
      riskLevel: RiskLevel.HIGH,
      category: AuditCategory.COMPLIANCE,
      sensitiveData: true,
    });
  }

  /**
   * Security incident logging
   */
  async logSecurityIncident(params: {
    incidentType: string;
    severity: RiskLevel;
    description: string;
    affectedResource?: string;
    mitigationAction?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.log({
      action: AuditAction.SECURITY_INCIDENT,
      resourceType: ResourceType.SYSTEM,
      resourceId: params.affectedResource,
      metadata: {
        ...params.metadata,
        incidentType: params.incidentType,
        description: params.description,
        mitigationAction: params.mitigationAction,
        detectedAt: new Date().toISOString(),
        platform: 'QAZNEDR_KZ',
      },
      riskLevel: params.severity,
      category: AuditCategory.SECURITY,
      sensitiveData: false,
    });
  }

  /**
   * Bulk export audit logs for compliance reporting
   */
  async exportAuditLogs(params: {
    startDate: Date;
    endDate: Date;
    userId?: string;
    organizationId?: string;
    category?: AuditCategory;
    riskLevel?: RiskLevel;
    format: 'JSON' | 'CSV' | 'PDF';
  }): Promise<any[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: params.startDate,
          lte: params.endDate,
        },
        userId: params.userId,
        organizationId: params.organizationId,
        category: params.category,
        riskLevel: params.riskLevel,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Log the export action
    await this.log({
      action: AuditAction.DATA_EXPORTED,
      resourceType: ResourceType.SYSTEM,
      metadata: {
        exportParams: params,
        recordCount: logs.length,
        exportFormat: params.format,
      },
      riskLevel: RiskLevel.HIGH,
      category: AuditCategory.DATA_ACCESS,
      sensitiveData: true,
    });

    return logs;
  }

  /**
   * Generate unique fingerprint for event deduplication
   */
  private generateFingerprint(event: AuditEvent): string {
    const key = `${event.action}_${event.resourceType}_${event.resourceId || 'null'}_${event.userId || 'anonymous'}`;
    return Buffer.from(key).toString('base64').substring(0, 32);
  }

  /**
   * Detect Kazakhstan region from IP address
   */
  private async detectRegion(ipAddress: string): Promise<string> {
    // In production, integrate with IP geolocation service
    // For now, return Kazakhstan as default
    return 'Kazakhstan';
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent: string): string {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile';
    if (/Tablet/.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  /**
   * Send security alerts for critical events
   */
  private async sendSecurityAlert(event: AuditEvent): Promise<void> {
    // In production, integrate with alerting system (Slack, email, Sentry)
    console.warn('SECURITY ALERT:', {
      action: event.action,
      riskLevel: event.riskLevel,
      resourceId: event.resourceId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Fallback logging when primary system fails
   */
  private async fallbackLog(event: AuditEvent, error: any): Promise<void> {
    // In production, write to file system or external logging service
    console.error('FALLBACK AUDIT LOG:', {
      event,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Cleanup old audit logs based on retention policy
   */
  async cleanupOldLogs(): Promise<void> {
    const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS || '2555'); // 7 years default for mining compliance
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const deleted = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
        // Never delete critical security events
        riskLevel: {
          not: RiskLevel.CRITICAL,
        },
      },
    });

    console.log(`Cleaned up ${deleted.count} old audit logs`);
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

// Convenience functions for common audit events
export const auditHelpers = {
  // User events
  userLogin: (userId: string, metadata?: any) =>
    auditLogger.log({
      action: AuditAction.USER_LOGIN,
      resourceType: ResourceType.USER,
      resourceId: userId,
      userId,
      metadata,
      riskLevel: RiskLevel.LOW,
      category: AuditCategory.AUTHENTICATION,
    }),

  userLogout: (userId: string) =>
    auditLogger.log({
      action: AuditAction.USER_LOGOUT,
      resourceType: ResourceType.USER,
      resourceId: userId,
      userId,
      riskLevel: RiskLevel.LOW,
      category: AuditCategory.AUTHENTICATION,
    }),

  // Mining events
  depositCreated: (depositId: string, userId: string, metadata?: any) =>
    auditLogger.logMiningEvent({
      action: AuditAction.DEPOSIT_CREATED,
      depositId,
      metadata: { ...metadata, userId },
      riskLevel: RiskLevel.MEDIUM,
    }),

  licenseUploaded: (depositId: string, licenseNumber: string, userId: string) =>
    auditLogger.logMiningEvent({
      action: AuditAction.LICENSE_UPLOADED,
      depositId,
      licenseNumber,
      metadata: { userId },
      riskLevel: RiskLevel.HIGH,
    }),

  // GDPR events
  consentGiven: (userId: string, dataType: string, legalBasis: string) =>
    auditLogger.logGDPREvent({
      action: AuditAction.GDPR_CONSENT_GIVEN,
      userId,
      dataType,
      legalBasis,
    }),

  dataExportRequested: (userId: string, requestedBy: string) =>
    auditLogger.logGDPREvent({
      action: AuditAction.GDPR_DATA_EXPORT_REQUESTED,
      userId,
      metadata: { requestedBy },
    }),

  // Security events
  securityIncident: (
    incidentType: string,
    severity: RiskLevel,
    description: string
  ) =>
    auditLogger.logSecurityIncident({
      incidentType,
      severity,
      description,
    }),
};
