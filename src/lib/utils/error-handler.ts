/**
 * Centralized Error Handling System
 * Provides consistent error handling across the application
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';
import { config } from '@/lib/config/env';

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Business Logic
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UPLOAD_ERROR = 'UPLOAD_ERROR',

  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
  cause?: Error;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean = true;

  constructor(errorDetails: ErrorDetails) {
    super(errorDetails.message);
    this.name = 'AppError';
    this.code = errorDetails.code;
    this.statusCode = errorDetails.statusCode;
    this.details = errorDetails.details;

    if (errorDetails.cause) {
      this.cause = errorDetails.cause;
    }

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      stack: config.isDevelopment ? this.stack : undefined,
    };
  }
}

// Predefined error creators
export const createError = {
  unauthorized: (message = 'Необходима авторизация'): AppError =>
    new AppError({
      code: ErrorCode.UNAUTHORIZED,
      message,
      statusCode: 401,
    }),

  forbidden: (message = 'Недостаточно прав доступа'): AppError =>
    new AppError({
      code: ErrorCode.FORBIDDEN,
      message,
      statusCode: 403,
    }),

  notFound: (resource = 'Ресурс', message?: string): AppError =>
    new AppError({
      code: ErrorCode.NOT_FOUND,
      message: message || `${resource} не найден`,
      statusCode: 404,
    }),

  validation: (message: string, details?: Record<string, unknown>): AppError =>
    new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message,
      statusCode: 400,
      details,
    }),

  conflict: (message: string): AppError =>
    new AppError({
      code: ErrorCode.CONFLICT,
      message,
      statusCode: 409,
    }),

  rateLimitExceeded: (message = 'Превышен лимит запросов'): AppError =>
    new AppError({
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message,
      statusCode: 429,
    }),

  internal: (message = 'Внутренняя ошибка сервера', cause?: Error): AppError =>
    new AppError({
      code: ErrorCode.INTERNAL_ERROR,
      message,
      statusCode: 500,
      cause,
    }),

  database: (message = 'Ошибка базы данных', cause?: Error): AppError =>
    new AppError({
      code: ErrorCode.DATABASE_ERROR,
      message,
      statusCode: 500,
      cause,
    }),
};

// Error handler for API routes
export function handleApiError(
  error: unknown,
  requestId?: string
): NextResponse {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    // Handle known error types
    if (error.name === 'PrismaClientKnownRequestError') {
      appError = createError.database(
        'Ошибка при работе с базой данных',
        error
      );
    } else if (error.name === 'ValidationError') {
      appError = createError.validation(error.message);
    } else {
      appError = createError.internal('Неожиданная ошибка', error);
    }
  } else {
    appError = createError.internal('Неизвестная ошибка');
  }

  // Log the error with additional context
  const logContext = {
    requestId,
    errorCode: appError.code,
    statusCode: appError.statusCode,
    details: appError.details,
  };

  if (appError.cause instanceof Error) {
    logger.error(`API Error: ${appError.message}`, appError.cause, logContext);
  } else {
    logger.error(
      `API Error: ${appError.message}`,
      new Error(appError.message),
      logContext
    );
  }

  // Return error response
  const response = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(config.isDevelopment &&
        appError.details && { details: appError.details }),
      ...(config.isDevelopment && appError.stack && { stack: appError.stack }),
    },
  };

  return NextResponse.json(response, { status: appError.statusCode });
}

// Global error handler for unhandled errors
export function setupGlobalErrorHandlers() {
  if (typeof window === 'undefined') {
    // Server-side error handlers
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', error);
      process.exit(1);
    });

    process.on(
      'unhandledRejection',
      (reason: unknown, promise: Promise<unknown>) => {
        logger.error(
          'Unhandled Rejection',
          reason instanceof Error ? reason : new Error(String(reason)),
          {
            promise: promise.toString(),
          }
        );
      }
    );
  } else {
    // Client-side error handlers
    window.addEventListener('error', (event) => {
      logger.error('Global Error', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled Promise Rejection', new Error(event.reason));
    });
  }
}

// Utility function to safely execute async operations
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<[T | null, AppError | null]> {
  try {
    const result = await operation();
    return [result, null];
  } catch (error) {
    if (error instanceof AppError) {
      return [null, error];
    }

    const appError = createError.internal(
      errorMessage || 'Операция завершилась с ошибкой',
      error instanceof Error ? error : undefined
    );

    return [null, appError];
  }
}

// Utility function to validate input
export function validateRequired(
  data: Record<string, unknown>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(
    (field) =>
      data[field] === undefined || data[field] === null || data[field] === ''
  );

  if (missingFields.length > 0) {
    throw createError.validation(
      `Обязательные поля отсутствуют: ${missingFields.join(', ')}`,
      { missingFields }
    );
  }
}
