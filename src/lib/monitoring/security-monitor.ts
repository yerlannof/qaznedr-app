import { createClient } from '@/lib/supabase/server';
import * as Sentry from '@sentry/nextjs';

/**
 * Security Monitoring Service for Kazakhstan Mining Platform
 * Tracks and alerts on security events and suspicious activities
 */

export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_LOCKED = 'account_locked',
  
  // Authorization events
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PERMISSION_DENIED = 'permission_denied',
  ROLE_CHANGED = 'role_changed',
  
  // Data protection events
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  PATH_TRAVERSAL_ATTEMPT = 'path_traversal_attempt',
  COMMAND_INJECTION_ATTEMPT = 'command_injection_attempt',
  
  // GDPR events
  DATA_EXPORT_REQUESTED = 'data_export_requested',
  DATA_DELETION_REQUESTED = 'data_deletion_requested',
  CONSENT_UPDATED = 'consent_updated',
  
  // Rate limiting events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  
  // Data access events
  SENSITIVE_DATA_ACCESSED = 'sensitive_data_accessed',
  BULK_DATA_EXPORT = 'bulk_data_export',
  ADMIN_ACTION = 'admin_action',
  
  // Anomaly detection
  UNUSUAL_ACTIVITY = 'unusual_activity',
  GEOGRAPHIC_ANOMALY = 'geographic_anomaly',
  TIME_ANOMALY = 'time_anomaly',
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface SecurityEvent {
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  email?: string;
  ipAddress: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: Date;
  location?: {
    country?: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
}

export interface SecurityAlert {
  alertId: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  message: string;
  affectedUsers: string[];
  timestamp: Date;
  resolved: boolean;
  actions: string[];
}

/**
 * Security Monitoring Service
 */
export class SecurityMonitor {
  private static alertThresholds = {
    [SecurityEventType.LOGIN_FAILED]: { count: 5, window: 300000 }, // 5 failures in 5 minutes
    [SecurityEventType.SQL_INJECTION_ATTEMPT]: { count: 3, window: 60000 }, // 3 attempts in 1 minute
    [SecurityEventType.XSS_ATTEMPT]: { count: 3, window: 60000 },
    [SecurityEventType.RATE_LIMIT_EXCEEDED]: { count: 10, window: 300000 },
    [SecurityEventType.UNAUTHORIZED_ACCESS]: { count: 5, window: 300000 },
  };

  private static recentEvents = new Map<string, SecurityEvent[]>();

  /**
   * Log security event
   */
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const supabase = await createClient();

      // Store event in database
      await supabase
        .from('security_events')
        .insert([{
          event_type: event.eventType,
          severity: event.severity,
          user_id: event.userId,
          email: event.email,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          details: event.details,
          timestamp: event.timestamp.toISOString(),
          location: event.location,
        }]);

      // Track in memory for quick analysis
      const key = `${event.eventType}_${event.ipAddress}`;
      const events = this.recentEvents.get(key) || [];
      events.push(event);
      
      // Keep only recent events
      const cutoff = Date.now() - 3600000; // 1 hour
      const recentOnly = events.filter(e => e.timestamp.getTime() > cutoff);
      this.recentEvents.set(key, recentOnly);

      // Send to Sentry for monitoring
      if (event.severity === SecuritySeverity.HIGH || 
          event.severity === SecuritySeverity.CRITICAL) {
        Sentry.captureMessage(`Security Event: ${event.eventType}`, {
          level: event.severity === SecuritySeverity.CRITICAL ? 'error' : 'warning',
          tags: {
            event_type: event.eventType,
            severity: event.severity,
            ip_address: event.ipAddress,
          },
          extra: event.details,
        });
      }

      // Check if alert should be triggered
      await this.checkAlertThresholds(event);

      // Perform automated response if needed
      await this.performAutomatedResponse(event);
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Still try to send to Sentry
      Sentry.captureException(error, {
        tags: { component: 'security_monitor' },
      });
    }
  }

  /**
   * Check if event threshold triggers an alert
   */
  private static async checkAlertThresholds(event: SecurityEvent): Promise<void> {
    const threshold = this.alertThresholds[event.eventType];
    if (!threshold) return;

    const key = `${event.eventType}_${event.ipAddress}`;
    const events = this.recentEvents.get(key) || [];
    
    const windowStart = Date.now() - threshold.window;
    const recentCount = events.filter(e => 
      e.timestamp.getTime() > windowStart
    ).length;

    if (recentCount >= threshold.count) {
      await this.createAlert({
        alertId: `alert_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        eventType: event.eventType,
        severity: SecuritySeverity.HIGH,
        message: `Threshold exceeded: ${recentCount} ${event.eventType} events from ${event.ipAddress}`,
        affectedUsers: event.userId ? [event.userId] : [],
        timestamp: new Date(),
        resolved: false,
        actions: ['Block IP', 'Notify admin', 'Increase monitoring'],
      });
    }
  }

  /**
   * Create security alert
   */
  static async createAlert(alert: SecurityAlert): Promise<void> {
    try {
      const supabase = await createClient();

      // Store alert
      await supabase
        .from('security_alerts')
        .insert([{
          alert_id: alert.alertId,
          event_type: alert.eventType,
          severity: alert.severity,
          message: alert.message,
          affected_users: alert.affectedUsers,
          timestamp: alert.timestamp.toISOString(),
          resolved: alert.resolved,
          actions: alert.actions,
        }]);

      // Send to Sentry
      Sentry.captureMessage(`Security Alert: ${alert.message}`, {
        level: 'error',
        tags: {
          alert_id: alert.alertId,
          event_type: alert.eventType,
          severity: alert.severity,
        },
      });

      // Notify administrators
      await this.notifyAdministrators(alert);
    } catch (error) {
      console.error('Failed to create security alert:', error);
      Sentry.captureException(error);
    }
  }

  /**
   * Perform automated response to security events
   */
  private static async performAutomatedResponse(event: SecurityEvent): Promise<void> {
    switch (event.eventType) {
      case SecurityEventType.SQL_INJECTION_ATTEMPT:
      case SecurityEventType.XSS_ATTEMPT:
      case SecurityEventType.COMMAND_INJECTION_ATTEMPT:
        // Block IP temporarily
        await this.blockIpAddress(event.ipAddress, 3600000); // 1 hour
        break;

      case SecurityEventType.BRUTE_FORCE_ATTEMPT:
        // Lock account
        if (event.userId) {
          await this.lockAccount(event.userId);
        }
        // Block IP
        await this.blockIpAddress(event.ipAddress, 86400000); // 24 hours
        break;

      case SecurityEventType.UNAUTHORIZED_ACCESS:
        // Log out user
        if (event.userId) {
          await this.forceLogout(event.userId);
        }
        break;

      case SecurityEventType.GEOGRAPHIC_ANOMALY:
        // Require additional verification
        if (event.userId) {
          await this.requireVerification(event.userId);
        }
        break;
    }
  }

  /**
   * Block IP address
   */
  static async blockIpAddress(ipAddress: string, duration: number): Promise<void> {
    try {
      const supabase = await createClient();
      
      const expiresAt = new Date(Date.now() + duration);
      
      await supabase
        .from('blocked_ips')
        .insert([{
          ip_address: ipAddress,
          blocked_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          reason: 'Automated security response',
        }]);

      console.log(`Blocked IP ${ipAddress} until ${expiresAt.toISOString()}`);
    } catch (error) {
      console.error('Failed to block IP:', error);
    }
  }

  /**
   * Lock user account
   */
  static async lockAccount(userId: string): Promise<void> {
    try {
      const supabase = await createClient();
      
      await supabase
        .from('user_profiles')
        .update({
          locked: true,
          locked_at: new Date().toISOString(),
          locked_reason: 'Security violation detected',
        })
        .eq('user_id', userId);

      console.log(`Locked account for user ${userId}`);
    } catch (error) {
      console.error('Failed to lock account:', error);
    }
  }

  /**
   * Force user logout
   */
  static async forceLogout(userId: string): Promise<void> {
    try {
      const supabase = await createClient();
      
      // Invalidate all sessions
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId);

      console.log(`Forced logout for user ${userId}`);
    } catch (error) {
      console.error('Failed to force logout:', error);
    }
  }

  /**
   * Require additional verification
   */
  static async requireVerification(userId: string): Promise<void> {
    try {
      const supabase = await createClient();
      
      await supabase
        .from('user_profiles')
        .update({
          requires_verification: true,
          verification_required_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      console.log(`Required verification for user ${userId}`);
    } catch (error) {
      console.error('Failed to require verification:', error);
    }
  }

  /**
   * Notify administrators of security alert
   */
  private static async notifyAdministrators(alert: SecurityAlert): Promise<void> {
    try {
      const supabase = await createClient();
      
      // Get admin users
      const { data: admins } = await supabase
        .from('user_profiles')
        .select('user_id, email')
        .eq('role', 'admin');

      if (!admins || admins.length === 0) return;

      // Create notifications for each admin
      for (const admin of admins) {
        await supabase
          .from('notifications')
          .insert([{
            user_id: admin.user_id,
            type: 'security_alert',
            title: 'Security Alert',
            message: alert.message,
            data: {
              alertId: alert.alertId,
              eventType: alert.eventType,
              severity: alert.severity,
            },
            created_at: new Date().toISOString(),
          }]);
      }

      console.log(`Notified ${admins.length} administrators of security alert`);
    } catch (error) {
      console.error('Failed to notify administrators:', error);
    }
  }

  /**
   * Detect anomalies in user behavior
   */
  static async detectAnomalies(
    userId: string,
    currentIp: string,
    currentLocation?: { country?: string; city?: string }
  ): Promise<void> {
    try {
      const supabase = await createClient();
      
      // Get user's recent activity
      const { data: recentActivity } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (!recentActivity || recentActivity.length === 0) return;

      // Check for geographic anomaly
      if (currentLocation) {
        const previousLocations = recentActivity
          .filter(a => a.location?.country)
          .map(a => a.location.country);
        
        if (previousLocations.length > 0 && 
            !previousLocations.includes(currentLocation.country)) {
          await this.logSecurityEvent({
            eventType: SecurityEventType.GEOGRAPHIC_ANOMALY,
            severity: SecuritySeverity.MEDIUM,
            userId,
            ipAddress: currentIp,
            details: {
              currentCountry: currentLocation.country,
              previousCountries: [...new Set(previousLocations)],
            },
            timestamp: new Date(),
            location: currentLocation,
          });
        }
      }

      // Check for time anomaly (activity at unusual hours)
      const currentHour = new Date().getHours();
      const previousHours = recentActivity
        .map(a => new Date(a.timestamp).getHours());
      
      const avgHour = previousHours.reduce((a, b) => a + b, 0) / previousHours.length;
      const hourDifference = Math.abs(currentHour - avgHour);
      
      if (hourDifference > 6) { // More than 6 hours difference from usual pattern
        await this.logSecurityEvent({
          eventType: SecurityEventType.TIME_ANOMALY,
          severity: SecuritySeverity.LOW,
          userId,
          ipAddress: currentIp,
          details: {
            currentHour,
            usualHours: previousHours,
            difference: hourDifference,
          },
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to detect anomalies:', error);
    }
  }

  /**
   * Generate security report
   */
  static async generateSecurityReport(
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      const supabase = await createClient();
      
      // Get security events
      const { data: events } = await supabase
        .from('security_events')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      // Get security alerts
      const { data: alerts } = await supabase
        .from('security_alerts')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      // Aggregate data
      const report = {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        summary: {
          totalEvents: events?.length || 0,
          totalAlerts: alerts?.length || 0,
          criticalEvents: events?.filter(e => e.severity === SecuritySeverity.CRITICAL).length || 0,
          highEvents: events?.filter(e => e.severity === SecuritySeverity.HIGH).length || 0,
          resolvedAlerts: alerts?.filter(a => a.resolved).length || 0,
          unresolvedAlerts: alerts?.filter(a => !a.resolved).length || 0,
        },
        eventsByType: {},
        topIpAddresses: [],
        affectedUsers: [],
        recommendations: [],
      };

      // Group events by type
      if (events) {
        for (const event of events) {
          report.eventsByType[event.event_type] = 
            (report.eventsByType[event.event_type] || 0) + 1;
        }

        // Get top IP addresses
        const ipCounts = new Map<string, number>();
        for (const event of events) {
          ipCounts.set(event.ip_address, (ipCounts.get(event.ip_address) || 0) + 1);
        }
        report.topIpAddresses = Array.from(ipCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([ip, count]) => ({ ip, count }));

        // Get affected users
        const userSet = new Set(events.filter(e => e.user_id).map(e => e.user_id));
        report.affectedUsers = Array.from(userSet);
      }

      // Generate recommendations
      if (report.summary.criticalEvents > 0) {
        report.recommendations.push('Immediate review of critical security events required');
      }
      if (report.summary.unresolvedAlerts > 5) {
        report.recommendations.push('Address unresolved security alerts');
      }
      if (report.eventsByType[SecurityEventType.SQL_INJECTION_ATTEMPT] > 10) {
        report.recommendations.push('Review and strengthen SQL injection prevention');
      }
      if (report.eventsByType[SecurityEventType.BRUTE_FORCE_ATTEMPT] > 5) {
        report.recommendations.push('Consider implementing CAPTCHA or stronger rate limiting');
      }

      return report;
    } catch (error) {
      console.error('Failed to generate security report:', error);
      throw error;
    }
  }
}

// Export for use in API routes and middleware
export default SecurityMonitor;