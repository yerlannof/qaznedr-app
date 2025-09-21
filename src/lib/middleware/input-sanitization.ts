import { NextRequest, NextResponse } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// XSS Protection: HTML sanitization configuration
const sanitizeConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  ALLOWED_ATTR: ['href', 'title', 'target'],
  ALLOW_DATA_ATTR: false,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  RETURN_TRUSTED_TYPE: false,
  SAFE_FOR_TEMPLATES: true,
  WHOLE_DOCUMENT: false,
  IN_PLACE: true,
};

// SQL Injection Protection: Common SQL patterns to detect
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FROM|WHERE|AND|OR|ORDER BY|GROUP BY|HAVING)\b)/gi,
  /('|"|;|--|\/\*|\*\/|xp_|sp_|0x|@@|char|nchar|varchar|nvarchar|alter|begin|cast|convert|cursor|declare|exec|execute|fetch|kill|sys|table|update)/gi,
  /(\bOR\b\s*\d+\s*=\s*\d+)/gi, // OR 1=1
  /(\bAND\b\s*\d+\s*=\s*\d+)/gi, // AND 1=1
  /(\/\*.*?\*\/)/gs, // SQL comments
  /(--.*$)/gm, // SQL line comments
];

// NoSQL Injection Protection: MongoDB operators
const NOSQL_INJECTION_PATTERNS = [
  /\$ne|\$eq|\$gt|\$gte|\$lt|\$lte|\$in|\$nin|\$and|\$or|\$not|\$nor/gi,
  /\$exists|\$type|\$expr|\$jsonSchema|\$mod|\$regex|\$text|\$where/gi,
];

// Path Traversal Protection
const PATH_TRAVERSAL_PATTERNS = [
  /\.\./g,
  /\.\.%2[fF]/g,
  /%2[eE]\./g,
  /\x00/g, // null bytes
];

// Command Injection Protection
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$(){}[\]<>]/g,
  /\$\(.*?\)/g,
  /`.*?`/g,
];

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove any script tags first
  let cleaned = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  cleaned = cleaned.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=\s*'[^']*'/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  cleaned = cleaned.replace(/javascript:/gi, '');
  
  // Use DOMPurify for comprehensive sanitization
  return DOMPurify.sanitize(cleaned, sanitizeConfig);
}

/**
 * Detect potential SQL injection attempts
 */
export function detectSqlInjection(input: string): boolean {
  if (typeof input !== 'string') return false;
  
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      console.warn('Potential SQL injection detected:', input.substring(0, 100));
      return true;
    }
  }
  return false;
}

/**
 * Detect potential NoSQL injection attempts
 */
export function detectNoSqlInjection(input: any): boolean {
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  
  for (const pattern of NOSQL_INJECTION_PATTERNS) {
    if (pattern.test(str)) {
      console.warn('Potential NoSQL injection detected');
      return true;
    }
  }
  
  // Check for object with $ operators
  if (typeof input === 'object' && input !== null) {
    for (const key in input) {
      if (key.startsWith('$')) {
        return true;
      }
      if (typeof input[key] === 'object') {
        if (detectNoSqlInjection(input[key])) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Detect path traversal attempts
 */
export function detectPathTraversal(input: string): boolean {
  if (typeof input !== 'string') return false;
  
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(input)) {
      console.warn('Potential path traversal detected:', input.substring(0, 100));
      return true;
    }
  }
  return false;
}

/**
 * Detect command injection attempts
 */
export function detectCommandInjection(input: string): boolean {
  if (typeof input !== 'string') return false;
  
  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      console.warn('Potential command injection detected:', input.substring(0, 100));
      return true;
    }
  }
  return false;
}

/**
 * Escape special characters for SQL queries
 */
export function escapeSql(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\x00/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string | null {
  const emailSchema = z.string().email().max(254);
  
  try {
    const validated = emailSchema.parse(email.toLowerCase().trim());
    // Additional check for common injection attempts
    if (detectSqlInjection(validated) || detectCommandInjection(validated)) {
      return null;
    }
    return validated;
  } catch {
    return null;
  }
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    // Check for injection attempts
    if (detectSqlInjection(url) || detectCommandInjection(url)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize user input for Kazakhstan mining platform
 */
export function sanitizeMiningInput(input: any): any {
  if (typeof input === 'string') {
    // Check for injection attempts
    if (
      detectSqlInjection(input) ||
      detectNoSqlInjection(input) ||
      detectPathTraversal(input) ||
      detectCommandInjection(input)
    ) {
      throw new Error('Invalid input detected');
    }
    
    // Sanitize HTML content
    return sanitizeHtml(input);
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeMiningInput(item));
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const key in input) {
      // Validate key
      if (detectSqlInjection(key) || detectNoSqlInjection(key)) {
        throw new Error('Invalid input key detected');
      }
      sanitized[key] = sanitizeMiningInput(input[key]);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Input validation schemas for mining platform
 */
export const ValidationSchemas = {
  // Listing creation schema
  createListing: z.object({
    title: z.string().min(3).max(200),
    description: z.string().min(10).max(5000),
    type: z.enum(['MINING_LICENSE', 'EXPLORATION_LICENSE', 'MINERAL_OCCURRENCE']),
    mineral: z.enum(['Oil', 'Gas', 'Gold', 'Copper', 'Coal', 'Uranium', 'Iron']),
    price: z.number().positive().max(1000000000000), // Max 1 trillion tenge
    area: z.number().positive().max(100000), // Max 100,000 km²
    region: z.string().min(2).max(100),
    city: z.string().min(2).max(100),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
    images: z.array(z.string().url()).max(10).optional(),
  }),
  
  // User registration schema
  registerUser: z.object({
    email: z.string().email().max(254),
    password: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    name: z.string().min(2).max(100),
    company: z.string().min(2).max(200).optional(),
    phone: z.string().regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/).optional(),
  }),
  
  // Search query schema
  searchQuery: z.object({
    q: z.string().max(200).optional(),
    type: z.enum(['MINING_LICENSE', 'EXPLORATION_LICENSE', 'MINERAL_OCCURRENCE']).optional(),
    mineral: z.string().max(50).optional(),
    minPrice: z.number().positive().optional(),
    maxPrice: z.number().positive().optional(),
    region: z.string().max(100).optional(),
    page: z.number().int().positive().max(1000).optional(),
    limit: z.number().int().positive().max(100).optional(),
  }),
};

/**
 * Middleware to sanitize all incoming requests
 */
export async function sanitizeRequestMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    // Check URL parameters
    const url = new URL(request.url);
    const params = url.searchParams;
    
    for (const [key, value] of params) {
      if (
        detectSqlInjection(key) ||
        detectSqlInjection(value) ||
        detectNoSqlInjection(key) ||
        detectNoSqlInjection(value) ||
        detectPathTraversal(value) ||
        detectCommandInjection(value)
      ) {
        return NextResponse.json(
          { error: 'Invalid request parameters' },
          { status: 400 }
        );
      }
    }
    
    // Check request body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const contentType = request.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          const body = await request.json();
          const sanitized = sanitizeMiningInput(body);
          
          // Create new request with sanitized body
          const sanitizedRequest = new NextRequest(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(sanitized),
          });
          
          // Store sanitized body for later use
          (sanitizedRequest as any).sanitizedBody = sanitized;
        }
      } catch (error) {
        // If body parsing fails, it might be malformed
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        );
      }
    }
    
    // Check common headers for injection attempts
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'referer', 'user-agent'];
    for (const header of suspiciousHeaders) {
      const value = request.headers.get(header);
      if (value && (detectSqlInjection(value) || detectCommandInjection(value))) {
        console.warn(`Suspicious ${header} header:`, value.substring(0, 100));
        // Don't block, but log for monitoring
      }
    }
    
    return null; // Continue to next middleware
  } catch (error) {
    console.error('Input sanitization error:', error);
    return NextResponse.json(
      { error: 'Request validation failed' },
      { status: 400 }
    );
  }
}

/**
 * Rate limiting for authentication attempts
 */
const authAttempts = new Map<string, { count: number; resetTime: number }>();

export function checkAuthRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = 5; // 5 attempts
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  const record = authAttempts.get(identifier);
  
  if (!record || record.resetTime < now) {
    authAttempts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

// Export validation utilities
export const validate = {
  email: sanitizeEmail,
  url: sanitizeUrl,
  sql: escapeSql,
  html: sanitizeHtml,
  mining: sanitizeMiningInput,
  schemas: ValidationSchemas,
  authRateLimit: checkAuthRateLimit,
};