/**
 * Centralized Logging System for QAZNEDR.KZ
 * Supports both development (pretty) and production (JSON) formats
 */

import { config } from '@/lib/config/env';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private currentLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.currentLevel = this.parseLogLevel(config.logging.level);
    this.isDevelopment = config.isDevelopment;
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error':
        return LogLevel.ERROR;
      case 'warn':
        return LogLevel.WARN;
      case 'info':
        return LogLevel.INFO;
      case 'debug':
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.currentLevel;
  }

  private formatMessage(
    level: string,
    message: string,
    context?: LogContext,
    error?: Error
  ): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    if (this.isDevelopment && config.logging.format === 'pretty') {
      return this.formatPretty(entry);
    }

    return JSON.stringify(entry);
  }

  private formatPretty(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const levelColors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m', // Yellow
      INFO: '\x1b[36m', // Cyan
      DEBUG: '\x1b[90m', // Gray
    };
    const resetColor = '\x1b[0m';
    const color = levelColors[entry.level as keyof typeof levelColors] || '';

    let output = `${color}[${timestamp}] ${entry.level}${resetColor} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }

    return output;
  }

  private log(
    level: LogLevel,
    levelName: string,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(
      levelName,
      message,
      context,
      error
    );

    if (level === LogLevel.ERROR) {
    } else if (level === LogLevel.WARN) {
    } else {
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, 'error', message, context, error);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, 'warn', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, 'info', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, 'debug', message, context);
  }

  // API Request logging
  apiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const fullContext: LogContext = {
      method,
      url,
      statusCode,
      duration,
      ...context,
    };

    const level =
      statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    const message = `${method} ${url} ${statusCode} - ${duration}ms`;

    if (level === 'error') {
      this.error(message, undefined, fullContext);
    } else if (level === 'warn') {
      this.warn(message, fullContext);
    } else {
      this.info(message, fullContext);
    }
  }

  // Database operation logging
  dbOperation(
    operation: string,
    table: string,
    duration: number,
    context?: LogContext
  ): void {
    this.debug(`DB ${operation} on ${table} - ${duration}ms`, context);
  }

  // Security event logging
  securityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high',
    context?: LogContext
  ): void {
    const message = `Security Event: ${event}`;
    const fullContext: LogContext = { severity, ...context };

    if (severity === 'high') {
      this.error(message, undefined, fullContext);
    } else if (severity === 'medium') {
      this.warn(message, fullContext);
    } else {
      this.info(message, fullContext);
    }
  }

  // Business logic logging
  businessEvent(event: string, context?: LogContext): void {
    this.info(`Business Event: ${event}`, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper function to create request-scoped logger
export function createRequestLogger(
  requestId: string,
  userId?: string,
  ip?: string,
  userAgent?: string
) {
  const baseContext: LogContext = { requestId, userId, ip, userAgent };

  return {
    error: (message: string, error?: Error, context?: LogContext) =>
      logger.error(message, error, { ...baseContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      logger.warn(message, { ...baseContext, ...context }),
    info: (message: string, context?: LogContext) =>
      logger.info(message, { ...baseContext, ...context }),
    debug: (message: string, context?: LogContext) =>
      logger.debug(message, { ...baseContext, ...context }),
    apiRequest: (
      method: string,
      url: string,
      statusCode: number,
      duration: number,
      context?: LogContext
    ) =>
      logger.apiRequest(method, url, statusCode, duration, {
        ...baseContext,
        ...context,
      }),
  };
}
