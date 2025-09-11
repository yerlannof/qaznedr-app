/**
 * Error monitoring and reporting utilities
 */

import { logger } from './logger';
import { config } from '@/lib/config/env';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error context interface
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  component?: string;
  action?: string;
  additionalData?: Record<string, unknown>;
}

// Monitored error interface
export interface MonitoredError {
  id: string;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  context: ErrorContext;
  timestamp: number;
  fingerprint: string;
  count: number;
}

// Error fingerprinting for grouping similar errors
function generateErrorFingerprint(error: Error, context?: ErrorContext): string {
  const message = error.message.replace(/\d+/g, 'N'); // Replace numbers with 'N'
  const component = context?.component || 'unknown';
  const action = context?.action || 'unknown';
  
  return btoa(`${message}:${component}:${action}`).substring(0, 16);
}

// Determine error severity based on error type and context
function determineErrorSeverity(error: Error, context?: ErrorContext): ErrorSeverity {
  const errorMessage = error.message.toLowerCase();
  
  // Critical errors
  if (
    errorMessage.includes('database') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('payment') ||
    errorMessage.includes('security')
  ) {
    return ErrorSeverity.CRITICAL;
  }
  
  // High severity errors
  if (
    errorMessage.includes('api') ||
    errorMessage.includes('server') ||
    errorMessage.includes('network') ||
    context?.component === 'auth'
  ) {
    return ErrorSeverity.HIGH;
  }
  
  // Medium severity errors
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('form') ||
    context?.component === 'listings'
  ) {
    return ErrorSeverity.MEDIUM;
  }
  
  // Default to low severity
  return ErrorSeverity.LOW;
}

// Error monitoring class
class ErrorMonitor {
  private static instance: ErrorMonitor;
  private errors: Map<string, MonitoredError> = new Map();
  private errorCounts: Map<string, number> = new Map();

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  // Report an error
  reportError(error: Error, context?: ErrorContext): void {
    const fingerprint = generateErrorFingerprint(error, context);
    const severity = determineErrorSeverity(error, context);
    const timestamp = Date.now();
    
    // Update error count
    const currentCount = this.errorCounts.get(fingerprint) || 0;
    this.errorCounts.set(fingerprint, currentCount + 1);
    
    // Create or update monitored error
    const monitoredError: MonitoredError = {
      id: `error_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      stack: error.stack,
      severity,
      context: {
        ...context,
        url: typeof window !== 'undefined' ? window.location.href : context?.url,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : context?.userAgent,
      },
      timestamp,
      fingerprint,
      count: this.errorCounts.get(fingerprint) || 1,
    };
    
    this.errors.set(fingerprint, monitoredError);
    
    // Log error with appropriate level
    this.logError(monitoredError);
    
    // Send to external services if configured
    this.sendToExternalServices(monitoredError);
    
    // Clean up old errors (keep last 100 unique errors)
    if (this.errors.size > 100) {
      const oldestFingerprint = Array.from(this.errors.keys())[0];
      this.errors.delete(oldestFingerprint);
      this.errorCounts.delete(oldestFingerprint);
    }
  }

  // Log error with appropriate level
  private logError(monitoredError: MonitoredError): void {
    const logData = {
      errorId: monitoredError.id,
      fingerprint: monitoredError.fingerprint,
      severity: monitoredError.severity,
      count: monitoredError.count,
      context: monitoredError.context,
    };

    switch (monitoredError.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error(`CRITICAL ERROR: ${monitoredError.message}`, new Error(monitoredError.message), logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error(`HIGH SEVERITY: ${monitoredError.message}`, new Error(monitoredError.message), logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(`MEDIUM SEVERITY: ${monitoredError.message}`, logData);
        break;
      case ErrorSeverity.LOW:
        logger.info(`LOW SEVERITY: ${monitoredError.message}`, logData);
        break;
    }
  }

  // Send error to external monitoring services
  private async sendToExternalServices(monitoredError: MonitoredError): Promise<void> {
    // Send to Sentry if configured
    if (config.monitoring.sentryDsn) {
      await this.sendToSentry(monitoredError);
    }

    // Send to internal API
    await this.sendToInternalAPI(monitoredError);
  }

  // Send error to Sentry
  private async sendToSentry(monitoredError: MonitoredError): Promise<void> {
    try {
      // This would typically use @sentry/browser or @sentry/node
      // For now, we'll just make a direct API call
      await fetch('https://sentry.io/api/0/projects/{org}/{project}/store/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${config.monitoring.sentryDsn}`,
        },
        body: JSON.stringify({
          message: monitoredError.message,
          level: this.mapSeverityToSentryLevel(monitoredError.severity),
          timestamp: monitoredError.timestamp / 1000,
          fingerprint: [monitoredError.fingerprint],
          extra: monitoredError.context,
          exception: {
            values: [
              {
                type: 'Error',
                value: monitoredError.message,
                stacktrace: {
                  frames: this.parseStackTrace(monitoredError.stack),
                },
              },
            ],
          },
        }),
      });
    } catch (error) {
      logger.warn('Failed to send error to Sentry', { error, monitoredError });
    }
  }

  // Send error to internal API
  private async sendToInternalAPI(monitoredError: MonitoredError): Promise<void> {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(monitoredError),
      });
    } catch (error) {
      logger.warn('Failed to send error to internal API', { error, monitoredError });
    }
  }

  // Map severity to Sentry level
  private mapSeverityToSentryLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'fatal';
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'error';
    }
  }

  // Parse stack trace for Sentry format
  private parseStackTrace(stack?: string): any[] {
    if (!stack) return [];
    
    return stack
      .split('\n')
      .slice(1) // Remove first line (error message)
      .map((line, index) => {
        const match = line.match(/at (.+) \((.+):(\d+):(\d+)\)/);
        if (match) {
          return {
            function: match[1],
            filename: match[2],
            lineno: parseInt(match[3]),
            colno: parseInt(match[4]),
            in_app: true,
          };
        }
        return {
          function: line.trim(),
          filename: 'unknown',
          lineno: index + 1,
          colno: 0,
          in_app: false,
        };
      });
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number;
    uniqueErrors: number;
    criticalErrors: number;
    recentErrors: MonitoredError[];
  } {
    const errors = Array.from(this.errors.values());
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    const criticalErrors = errors.filter(e => e.severity === ErrorSeverity.CRITICAL).length;
    const recentErrors = errors
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    return {
      totalErrors,
      uniqueErrors: this.errors.size,
      criticalErrors,
      recentErrors,
    };
  }

  // Clear errors
  clearErrors(): void {
    this.errors.clear();
    this.errorCounts.clear();
  }
}

// Export singleton instance
export const errorMonitor = ErrorMonitor.getInstance();

// Utility functions
export const reportError = (error: Error, context?: ErrorContext) => {
  errorMonitor.reportError(error, context);
};

export const reportCriticalError = (error: Error, context?: ErrorContext) => {
  errorMonitor.reportError(error, { ...context, severity: ErrorSeverity.CRITICAL });
};

export const getErrorStats = () => {
  return errorMonitor.getErrorStats();
};

// Initialize error monitoring on client side
if (typeof window !== 'undefined') {
  // Global error handler
  window.addEventListener('error', (event) => {
    reportError(new Error(event.message), {
      component: 'global',
      action: 'window_error',
      additionalData: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    reportError(new Error(event.reason), {
      component: 'global',
      action: 'unhandled_promise_rejection',
    });
  });

  // Network error monitoring
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      // Report API errors
      if (!response.ok) {
        reportError(new Error(`HTTP ${response.status}: ${response.statusText}`), {
          component: 'api',
          action: 'fetch_error',
          url: args[0]?.toString(),
          additionalData: {
            status: response.status,
            statusText: response.statusText,
          },
        });
      }
      
      return response;
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), {
        component: 'api',
        action: 'network_error',
        url: args[0]?.toString(),
      });
      throw error;
    }
  };
}