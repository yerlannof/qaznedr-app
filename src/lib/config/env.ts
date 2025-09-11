/**
 * Environment Variables Configuration & Validation
 * Centralizes all environment variable access with type safety
 */

import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Next.js
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Authentication
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // File Upload
  UPLOAD_MAX_SIZE: z.string().default('10485760').transform(Number),
  ALLOWED_FILE_TYPES: z.string().default('pdf,doc,docx,jpg,jpeg,png'),

  // AWS S3 (optional)
  AWS_S3_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),

  // Monitoring (optional)
  SENTRY_DSN: z.string().optional(),
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  YANDEX_METRICA_ID: z.string().optional(),

  // Security
  CORS_ORIGINS: z.string().optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),

  // Kazakhstan APIs (optional)
  GEOLOGY_API_KEY: z.string().optional(),
  MINING_REGISTRY_API_KEY: z.string().optional(),

  // Redis (optional)
  REDIS_URL: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error(`Environment validation failed: ${error}`);
  }
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe environment access
export const config = {
  // App
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  appUrl: env.NEXT_PUBLIC_APP_URL,

  // Authentication
  nextAuth: {
    url: env.NEXTAUTH_URL,
    secret: env.NEXTAUTH_SECRET,
  },

  // Database
  database: {
    url: env.DATABASE_URL,
  },

  // Email
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
    enabled: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
  },

  // File Upload
  upload: {
    maxSize: env.UPLOAD_MAX_SIZE,
    allowedTypes: env.ALLOWED_FILE_TYPES.split(','),
  },

  // AWS S3
  aws: {
    s3Bucket: env.AWS_S3_BUCKET,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    enabled: !!(
      env.AWS_S3_BUCKET &&
      env.AWS_ACCESS_KEY_ID &&
      env.AWS_SECRET_ACCESS_KEY
    ),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  // Monitoring
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    googleAnalyticsId: env.GOOGLE_ANALYTICS_ID,
    yandexMetricaId: env.YANDEX_METRICA_ID,
  },

  // Security
  security: {
    corsOrigins: env.CORS_ORIGINS?.split(',') || [],
    encryptionKey: env.ENCRYPTION_KEY,
  },

  // Kazakhstan APIs
  kazakhstan: {
    geologyApiKey: env.GEOLOGY_API_KEY,
    miningRegistryApiKey: env.MINING_REGISTRY_API_KEY,
  },

  // Redis
  redis: {
    url: env.REDIS_URL,
    enabled: !!env.REDIS_URL,
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT,
  },
} as const;

// Helper function to check if we're in production
export const isProduction = () => config.isProduction;
export const isDevelopment = () => config.isDevelopment;
