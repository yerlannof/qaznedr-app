import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Security validation schemas
const secureStringSchema = z
  .string()
  .max(1000, 'Input too long')
  .refine((val) => !containsSqlInjection(val), 'Invalid characters detected')
  .refine((val) => !containsXss(val), 'Potentially harmful content detected');

const secureEmailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .transform((val) => val.toLowerCase().trim());

const secureNumberSchema = z
  .number()
  .min(-999999999, 'Number too small')
  .max(999999999, 'Number too large')
  .finite('Must be a finite number');

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /('|(\\')|(--)|(\s*(=|<|>|!=)\s*))/i,
  /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
  /(\bor\b|\band\b).*(\b=\b|\blike\b|\bin\b)/i,
  /(script|javascript|vbscript|onload|onerror|onclick)/i,
  /(<|>|&lt;|&gt;|&amp;)/,
  /(\\x[0-9a-f]{2}|\\u[0-9a-f]{4})/i, // Hex encoding
  /(char|nchar|varchar|nvarchar)\s*\(/i,
  /(\|\||&&|;|\||&)/,
];

// XSS patterns
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>/gi,
  /<link[^>]*>/gi,
  /on\w+\s*=\s*['"]/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
];

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.[\/\\]/,
  /\.\.\%2f/i,
  /\.\.\%5c/i,
  /\%2e\%2e[\/\\]/i,
  /\/etc\/passwd/i,
  /\/proc\/self\/environ/i,
  /\\windows\\system32/i,
];

/**
 * Check for SQL injection patterns
 */
function containsSqlInjection(input: string): boolean {
  const normalizedInput = input.toLowerCase().trim();
  return SQL_INJECTION_PATTERNS.some((pattern) =>
    pattern.test(normalizedInput)
  );
}

/**
 * Check for XSS patterns
 */
function containsXss(input: string): boolean {
  return XSS_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Check for path traversal patterns
 */
function containsPathTraversal(input: string): boolean {
  return PATH_TRAVERSAL_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // HTML sanitization
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  // SQL injection protection
  sanitized = sanitized
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[;\-]/g, '') // Remove SQL terminators
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  return sanitized;
}

/**
 * Validate request body against schema
 */
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(body);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return { success: false, error: errorMessages };
    }
    return { success: false, error: 'Invalid input data' };
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams(
  request: NextRequest,
  allowedParams: string[]
):
  | { success: true; params: Record<string, string> }
  | { success: false; error: string } {
  const searchParams = request.nextUrl.searchParams;
  const params: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    // Check if parameter is allowed
    if (!allowedParams.includes(key)) {
      return { success: false, error: `Unauthorized parameter: ${key}` };
    }

    // Security validation
    if (
      containsSqlInjection(value) ||
      containsXss(value) ||
      containsPathTraversal(value)
    ) {
      return { success: false, error: `Invalid value for parameter: ${key}` };
    }

    // Sanitize and store
    params[key] = sanitizeString(value);
  }

  return { success: true, params };
}

/**
 * Content-Type validation
 */
export function validateContentType(
  request: NextRequest,
  allowedTypes: string[]
): boolean {
  const contentType = request.headers.get('content-type') || '';
  return allowedTypes.some((type) => contentType.startsWith(type));
}

/**
 * File upload validation
 */
export function validateFileUpload(
  file: File,
  allowedTypes: string[],
  maxSize: number = 10 * 1024 * 1024 // 10MB default
): { success: true } | { success: false; error: string } {
  // Check file size
  if (file.size > maxSize) {
    return { success: false, error: 'File too large' };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Invalid file type' };
  }

  // Check file name for path traversal
  if (containsPathTraversal(file.name)) {
    return { success: false, error: 'Invalid file name' };
  }

  return { success: true };
}

/**
 * Input validation middleware
 */
export function withInputValidation(
  allowedMethods: string[] = ['GET', 'POST', 'PUT', 'DELETE'],
  allowedContentTypes: string[] = ['application/json', 'multipart/form-data'],
  maxBodySize: number = 1024 * 1024 // 1MB default
) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      try {
        // Method validation
        if (!allowedMethods.includes(request.method)) {
          return NextResponse.json(
            { error: 'Method not allowed' },
            { status: 405 }
          );
        }

        // Content-Type validation for POST/PUT requests
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
          if (!validateContentType(request, allowedContentTypes)) {
            return NextResponse.json(
              { error: 'Invalid content type' },
              { status: 415 }
            );
          }
        }

        // Body size validation
        const contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > maxBodySize) {
          return NextResponse.json(
            { error: 'Request body too large' },
            { status: 413 }
          );
        }

        // Add security headers
        const response = await handler(request);

        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-XSS-Protection', '1; mode=block');
        response.headers.set(
          'Referrer-Policy',
          'strict-origin-when-cross-origin'
        );

        return response;
      } catch (error) {
        console.error('Input validation error:', error);
        return NextResponse.json(
          { error: 'Validation failed' },
          { status: 400 }
        );
      }
    };
  };
}

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  // User input
  username: z
    .string()
    .min(3, 'Username too short')
    .max(50, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid username format')
    .transform(sanitizeString),

  email: secureEmailSchema,

  password: z
    .string()
    .min(8, 'Password too short')
    .max(128, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character'
    ),

  // Search and filters
  searchQuery: z
    .string()
    .max(200, 'Search query too long')
    .transform(sanitizeString)
    .refine((val) => val.length >= 2, 'Query too short'),

  // Pagination
  page: z.number().int().min(1).max(1000),
  limit: z.number().int().min(1).max(100),

  // IDs
  uuid: z.string().uuid('Invalid ID format'),

  // Monetary values
  price: secureNumberSchema.min(0, 'Price cannot be negative'),

  // Coordinates
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),

  // General text
  title: z
    .string()
    .min(1, 'Title required')
    .max(200, 'Title too long')
    .transform(sanitizeString),

  description: z
    .string()
    .max(5000, 'Description too long')
    .transform(sanitizeString),

  // File paths (server-side only)
  filePath: z
    .string()
    .refine((val) => !containsPathTraversal(val), 'Invalid file path')
    .transform(sanitizeString),
};

// Export individual functions for direct use
export {
  containsSqlInjection,
  containsXss,
  containsPathTraversal,
  secureStringSchema,
  secureEmailSchema,
  secureNumberSchema,
};
