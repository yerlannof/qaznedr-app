/**
 * 🛡️ QAZNEDR.KZ GDPR Compliance System
 * Comprehensive GDPR and Kazakhstan data protection compliance
 * Handles consent management, data retention, and user rights
 */

import { PrismaClient } from '@prisma/client';
import { auditLogger, AuditAction } from './audit-logger';
import { hash, compare } from 'bcryptjs';
import JSZip from 'jszip';

// GDPR Consent Types
export enum ConsentType {
  ESSENTIAL = 'ESSENTIAL', // Required for basic service
  ANALYTICS = 'ANALYTICS', // Google Analytics, performance monitoring
  MARKETING = 'MARKETING', // Email marketing, promotional content
  MINING_DATA = 'MINING_DATA', // Geological surveys, mining licenses
  THIRD_PARTY = 'THIRD_PARTY', // External services integration
  LOCATION = 'LOCATION', // GPS coordinates for deposits
  COMMUNICATION = 'COMMUNICATION', // SMS, phone calls for business
}

// Data Categories for Processing
export enum DataCategory {
  PERSONAL_IDENTITY = 'PERSONAL_IDENTITY', // Name, email, phone
  BUSINESS_IDENTITY = 'BUSINESS_IDENTITY', // Company info, BIN number
  MINING_ACTIVITY = 'MINING_ACTIVITY', // Deposits, licenses, surveys
  FINANCIAL = 'FINANCIAL', // Pricing, transactions
  TECHNICAL = 'TECHNICAL', // IP address, device info
  BEHAVIORAL = 'BEHAVIORAL', // Site usage, preferences
  COMMUNICATION = 'COMMUNICATION', // Messages, contact requests
  LOCATION = 'LOCATION', // GPS coordinates, regions
}

// Legal Basis for Processing (GDPR Article 6)
export enum LegalBasis {
  CONSENT = 'CONSENT', // Article 6(1)(a)
  CONTRACT = 'CONTRACT', // Article 6(1)(b)
  LEGAL_OBLIGATION = 'LEGAL_OBLIGATION', // Article 6(1)(c) - Kazakhstan mining law
  VITAL_INTERESTS = 'VITAL_INTERESTS', // Article 6(1)(d)
  PUBLIC_TASK = 'PUBLIC_TASK', // Article 6(1)(e) - Public mining registry
  LEGITIMATE_INTERESTS = 'LEGITIMATE_INTERESTS', // Article 6(1)(f)
}

// Data Retention Periods (in days)
export const RETENTION_PERIODS = {
  [DataCategory.PERSONAL_IDENTITY]: 2555, // 7 years (Kazakhstan business law)
  [DataCategory.BUSINESS_IDENTITY]: 3653, // 10 years (mining license records)
  [DataCategory.MINING_ACTIVITY]: 7305, // 20 years (geological data)
  [DataCategory.FINANCIAL]: 2190, // 6 years (tax records)
  [DataCategory.TECHNICAL]: 730, // 2 years (security logs)
  [DataCategory.BEHAVIORAL]: 1095, // 3 years (analytics)
  [DataCategory.COMMUNICATION]: 1825, // 5 years (business correspondence)
  [DataCategory.LOCATION]: 3653, // 10 years (mining coordinates)
};

interface ConsentRecord {
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  legalBasis: LegalBasis;
  purpose: string;
  dataCategories: DataCategory[];
  retentionPeriod: number;
  withdrawalMethod: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface DataExportRequest {
  userId: string;
  requestId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedData: DataCategory[];
  format: 'JSON' | 'CSV' | 'XML';
  deliveryMethod: 'DOWNLOAD' | 'EMAIL';
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

interface DataDeletionRequest {
  userId: string;
  requestId: string;
  reason:
    | 'USER_REQUEST'
    | 'RETENTION_EXPIRED'
    | 'ACCOUNT_CLOSURE'
    | 'LEGAL_REQUIREMENT';
  dataCategories: DataCategory[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  scheduledDate?: Date;
  completedAt?: Date;
  retentionOverride?: boolean;
  justification?: string;
}

class GDPRComplianceManager {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Record user consent for specific data processing
   */
  async recordConsent(params: ConsentRecord): Promise<void> {
    try {
      // TODO: Store consent record when gdprConsent table is created
      // await this.prisma.gdprConsent.create({
      //   data: {
      //     userId: params.userId,
      //     consentType: params.consentType,
      //     granted: params.granted,
      //     legalBasis: params.legalBasis,
      //     purpose: params.purpose,
      //     dataCategories: params.dataCategories,
      //     retentionPeriod: params.retentionPeriod,
      //     withdrawalMethod: params.withdrawalMethod,
      //     ipAddress: params.ipAddress,
      //     userAgent: params.userAgent,
      //     timestamp: params.timestamp,
      //     active: true,
      //   },
      // });

      // Audit log
      await auditLogger.logGDPREvent({
        action: params.granted
          ? AuditAction.GDPR_CONSENT_GIVEN
          : AuditAction.GDPR_CONSENT_WITHDRAWN,
        userId: params.userId,
        dataType: params.dataCategories.join(','),
        legalBasis: params.legalBasis,
        retentionPeriod: params.retentionPeriod,
        metadata: {
          consentType: params.consentType,
          purpose: params.purpose,
          withdrawalMethod: params.withdrawalMethod,
        },
      });
    } catch (error) {
      console.error('Failed to record consent:', error);
      throw new Error('Consent recording failed');
    }
  }

  /**
   * Withdraw consent for specific data processing
   */
  async withdrawConsent(
    userId: string,
    consentType: ConsentType
  ): Promise<void> {
    try {
      // TODO: Mark current consent as inactive when gdprConsent table is created
      // await this.prisma.gdprConsent.updateMany({
      //   where: {
      //     userId,
      //     consentType,
      //     active: true,
      //   },
      //   data: {
      //     active: false,
      //     withdrawnAt: new Date(),
      //   },
      // });

      // Create withdrawal record
      await this.recordConsent({
        userId,
        consentType,
        granted: false,
        legalBasis: LegalBasis.CONSENT,
        purpose: 'Consent withdrawal',
        dataCategories: [],
        retentionPeriod: 0,
        withdrawalMethod: 'USER_PORTAL',
        timestamp: new Date(),
      });

      // Initiate data anonymization/deletion for withdrawn consent
      await this.handleConsentWithdrawal(userId, consentType);
    } catch (error) {
      console.error('Failed to withdraw consent:', error);
      throw new Error('Consent withdrawal failed');
    }
  }

  /**
   * Check if user has valid consent for specific data processing
   */
  async hasValidConsent(
    userId: string,
    consentType: ConsentType
  ): Promise<boolean> {
    // TODO: Check consent when gdprConsent table is created
    // const consent = await this.prisma.gdprConsent.findFirst({
    //   where: {
    //     userId,
    //     consentType,
    //     granted: true,
    //     active: true,
    //   },
    //   orderBy: {
    //     timestamp: 'desc',
    //   },
    // });

    // return !!consent;
    return true; // Default to true for now
  }

  /**
   * Export all user data in machine-readable format
   */
  async exportUserData(
    userId: string,
    format: 'JSON' | 'CSV' | 'XML' = 'JSON'
  ): Promise<DataExportRequest> {
    const requestId = `export_${userId}_${Date.now()}`;

    try {
      // Create export request record
      const exportRequest: DataExportRequest = {
        userId,
        requestId,
        status: 'PROCESSING',
        requestedData: Object.values(DataCategory),
        format,
        deliveryMethod: 'DOWNLOAD',
        createdAt: new Date(),
      };

      // Collect all user data
      const userData = await this.collectUserData(userId);

      // Generate export file
      const exportData = await this.generateExportFile(userData, format);
      const downloadUrl = await this.storeExportFile(
        requestId,
        exportData,
        format
      );

      // Update request status
      exportRequest.status = 'COMPLETED';
      exportRequest.completedAt = new Date();
      exportRequest.downloadUrl = downloadUrl;
      exportRequest.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // TODO: Store request record when gdprDataExport table is created
      // await this.prisma.gdprDataExport.create({
      //   data: {
      //     requestId,
      //     userId,
      //     status: exportRequest.status,
      //     requestedData: exportRequest.requestedData,
      //     format,
      //     deliveryMethod: exportRequest.deliveryMethod,
      //     downloadUrl,
      //     expiresAt: exportRequest.expiresAt,
      //   },
      // });

      // Audit log
      await auditLogger.logGDPREvent({
        action: AuditAction.GDPR_DATA_EXPORT_REQUESTED,
        userId,
        metadata: {
          requestId,
          format,
          dataCategories: exportRequest.requestedData.join(','),
        },
      });

      return exportRequest;
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw new Error('Data export failed');
    }
  }

  /**
   * Request data deletion (Right to be forgotten)
   */
  async requestDataDeletion(params: {
    userId: string;
    reason: DataDeletionRequest['reason'];
    dataCategories?: DataCategory[];
    justification?: string;
  }): Promise<DataDeletionRequest> {
    const requestId = `deletion_${params.userId}_${Date.now()}`;

    try {
      const deletionRequest: DataDeletionRequest = {
        userId: params.userId,
        requestId,
        reason: params.reason,
        dataCategories: params.dataCategories || Object.values(DataCategory),
        status: 'PENDING',
        justification: params.justification,
      };

      // Check if deletion is legally permissible
      const canDelete = await this.validateDeletionRequest(deletionRequest);

      if (!canDelete.allowed) {
        deletionRequest.status = 'REJECTED';
        deletionRequest.justification = canDelete.reason;
      } else {
        deletionRequest.status = 'APPROVED';
        deletionRequest.scheduledDate = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ); // 30 days notice
      }

      // TODO: Store deletion request when gdprDataDeletion table is created
      // await this.prisma.gdprDataDeletion.create({
      //   data: {
      //     requestId,
      //     userId: params.userId,
      //     reason: params.reason,
      //     dataCategories: deletionRequest.dataCategories,
      //     status: deletionRequest.status,
      //     scheduledDate: deletionRequest.scheduledDate,
      //     justification: deletionRequest.justification,
      //   },
      // });

      // Audit log
      await auditLogger.logGDPREvent({
        action: AuditAction.GDPR_DATA_DELETION_REQUESTED,
        userId: params.userId,
        metadata: {
          requestId,
          reason: params.reason,
          status: deletionRequest.status,
        },
      });

      return deletionRequest;
    } catch (error) {
      console.error('Failed to request data deletion:', error);
      throw new Error('Data deletion request failed');
    }
  }

  /**
   * Process scheduled data deletions
   */
  async processScheduledDeletions(): Promise<void> {
    // TODO: Process scheduled deletions when gdprDataDeletion table is created
    // const pendingDeletions = await this.prisma.gdprDataDeletion.findMany({
    //   where: {
    //     status: 'APPROVED',
    //     scheduledDate: {
    //       lte: new Date(),
    //     },
    //   },
    // });
    const pendingDeletions: any[] = [];

    for (const deletion of pendingDeletions) {
      try {
        await this.executeDataDeletion(deletion);

        // TODO: Update status when gdprDataDeletion table is created
        // await this.prisma.gdprDataDeletion.update({
        //   where: { requestId: deletion.requestId },
        //   data: {
        //     status: 'COMPLETED',
        //     completedAt: new Date(),
        //   },
        // });

        console.log(`Completed data deletion for user ${deletion.userId}`);
      } catch (error) {
        console.error(
          `Failed to delete data for user ${deletion.userId}:`,
          error
        );
      }
    }
  }

  /**
   * Check data retention compliance and schedule cleanups
   */
  async checkRetentionCompliance(): Promise<void> {
    for (const [category, retentionDays] of Object.entries(RETENTION_PERIODS)) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Schedule cleanup for expired data
      await this.scheduleDataCleanup(category as DataCategory, cutoffDate);
    }
  }

  /**
   * Generate privacy notice content
   */
  generatePrivacyNotice(): string {
    return `
QAZNEDR.KZ - Уведомление о конфиденциальности

В соответствии с GDPR и законодательством Республики Казахстан о защите персональных данных, 
мы обрабатываем следующие категории данных:

1. ЛИЧНЫЕ ДАННЫЕ (основание: согласие/договор)
   - ФИО, email, телефон
   - Хранение: 7 лет

2. ДЕЛОВЫЕ ДАННЫЕ (основание: договор/законное требование)
   - Информация о компании, БИН
   - Хранение: 10 лет

3. ГОРНОДОБЫВАЮЩИЕ ДАННЫЕ (основание: законное требование)
   - Лицензии, геологические изыскания
   - Хранение: 20 лет (требования Министерства индустрии)

4. МЕСТОПОЛОЖЕНИЕ (основание: согласие)
   - GPS координаты месторождений
   - Хранение: 10 лет

ВАШИ ПРАВА:
- Доступ к данным (ст. 15 GDPR)
- Исправление данных (ст. 16 GDPR)  
- Удаление данных (ст. 17 GDPR)
- Ограничение обработки (ст. 18 GDPR)
- Переносимость данных (ст. 20 GDPR)
- Возражение против обработки (ст. 21 GDPR)

Для реализации прав обращайтесь: privacy@qaznedr.kz
    `;
  }

  // Private helper methods
  private async collectUserData(userId: string): Promise<any> {
    return {
      user: await this.prisma.user.findUnique({ where: { id: userId } }),
      deposits: await this.prisma.kazakhstanDeposit.findMany({
        where: { userId },
      }),
      favorites: await this.prisma.favorite.findMany({ where: { userId } }),
      contactRequests: await this.prisma.contactRequest.findMany({
        where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
      }),
      // TODO: Uncomment when notification table is created
      // notifications: await this.prisma.notification.findMany({
      //   where: { userId },
      // }),
      notifications: [],
      views: await this.prisma.view.findMany({ where: { userId } }),
      // TODO: Uncomment when gdprConsent table is created
      // consents: await this.prisma.gdprConsent.findMany({ where: { userId } }),
      consents: [],
    };
  }

  private async generateExportFile(data: any, format: string): Promise<Buffer> {
    switch (format) {
      case 'JSON':
        return Buffer.from(JSON.stringify(data, null, 2));
      case 'CSV':
        // Convert to CSV format
        return Buffer.from('CSV export not implemented yet');
      case 'XML':
        // Convert to XML format
        return Buffer.from('XML export not implemented yet');
      default:
        throw new Error('Unsupported export format');
    }
  }

  private async storeExportFile(
    requestId: string,
    data: Buffer,
    format: string
  ): Promise<string> {
    // In production, store in secure cloud storage (S3, etc.)
    const filename = `${requestId}.${format.toLowerCase()}`;
    return `/api/gdpr/download/${filename}`;
  }

  private async validateDeletionRequest(
    request: DataDeletionRequest
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check legal obligations that prevent deletion
    const user = await this.prisma.user.findUnique({
      where: { id: request.userId },
    });

    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    // Check for ongoing legal processes
    const hasActiveContracts = await this.prisma.contactRequest.count({
      where: {
        OR: [{ fromUserId: request.userId }, { toUserId: request.userId }],
        status: 'PENDING',
      },
    });

    if (hasActiveContracts > 0) {
      return {
        allowed: false,
        reason: 'Cannot delete data while contractual obligations are active',
      };
    }

    return { allowed: true };
  }

  private async executeDataDeletion(
    deletion: DataDeletionRequest
  ): Promise<void> {
    const userId = deletion.userId;

    // Anonymize instead of delete for audit trail compliance
    await this.anonymizeUserData(userId, deletion.dataCategories);
  }

  private async anonymizeUserData(
    userId: string,
    categories: DataCategory[]
  ): Promise<void> {
    const anonymousHash = await hash(`anonymous_${userId}_${Date.now()}`, 12);

    if (categories.includes(DataCategory.PERSONAL_IDENTITY)) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${anonymousHash}@deleted.local`,
          name: 'Deleted User',
          phone: null,
          image: null,
        },
      });
    }

    // Continue anonymization for other categories...
  }

  private async handleConsentWithdrawal(
    userId: string,
    consentType: ConsentType
  ): Promise<void> {
    // Handle different consent withdrawals
    switch (consentType) {
      case ConsentType.ANALYTICS:
        // Stop analytics tracking
        break;
      case ConsentType.MARKETING:
        // Unsubscribe from marketing
        break;
      case ConsentType.LOCATION:
        // Remove location data
        break;
    }
  }

  private async scheduleDataCleanup(
    category: DataCategory,
    cutoffDate: Date
  ): Promise<void> {
    console.log(
      `Scheduling cleanup for ${category} data older than ${cutoffDate}`
    );
    // Implementation depends on specific data category
  }
}

export const gdprCompliance = new GDPRComplianceManager();

// Helper functions for common GDPR operations
export const gdprHelpers = {
  recordEssentialConsent: (
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ) =>
    gdprCompliance.recordConsent({
      userId,
      consentType: ConsentType.ESSENTIAL,
      granted: true,
      legalBasis: LegalBasis.CONTRACT,
      purpose: 'Essential service functionality',
      dataCategories: [DataCategory.PERSONAL_IDENTITY, DataCategory.TECHNICAL],
      retentionPeriod: RETENTION_PERIODS[DataCategory.PERSONAL_IDENTITY],
      withdrawalMethod: 'Account deletion',
      timestamp: new Date(),
      ipAddress,
      userAgent,
    }),

  recordMiningDataConsent: (userId: string, purpose: string) =>
    gdprCompliance.recordConsent({
      userId,
      consentType: ConsentType.MINING_DATA,
      granted: true,
      legalBasis: LegalBasis.LEGAL_OBLIGATION,
      purpose,
      dataCategories: [
        DataCategory.MINING_ACTIVITY,
        DataCategory.LOCATION,
        DataCategory.BUSINESS_IDENTITY,
      ],
      retentionPeriod: RETENTION_PERIODS[DataCategory.MINING_ACTIVITY],
      withdrawalMethod: 'Contact privacy officer',
      timestamp: new Date(),
    }),

  checkMarketingConsent: (userId: string) =>
    gdprCompliance.hasValidConsent(userId, ConsentType.MARKETING),

  exportUserData: (userId: string, format: 'JSON' | 'CSV' | 'XML' = 'JSON') =>
    gdprCompliance.exportUserData(userId, format),

  requestAccountDeletion: (userId: string, reason: string) =>
    gdprCompliance.requestDataDeletion({
      userId,
      reason: 'USER_REQUEST',
      justification: reason,
    }),
};
