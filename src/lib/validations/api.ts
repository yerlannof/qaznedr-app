import { z } from 'zod';

// Listing query parameters schema
export const listingQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val) || 12, 100) : 12)),
  sortBy: z
    .enum(['created_at', 'price', 'area', 'title'])
    .optional()
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  query: z.string().optional(),
  region: z.string().optional(),
  mineral: z.string().optional(),
  type: z
    .enum(['MINING_LICENSE', 'EXPLORATION_LICENSE', 'MINERAL_OCCURRENCE'])
    .optional(),
  verified: z.enum(['true', 'false']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  priceMin: z.string().optional(),
  priceMax: z.string().optional(),
  areaMin: z.string().optional(),
  areaMax: z.string().optional(),
});

// Create listing body schema
export const createListingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000),
  type: z.enum(['MINING_LICENSE', 'EXPLORATION_LICENSE', 'MINERAL_OCCURRENCE']),
  mineral: z.string().min(1, 'Mineral type is required'),
  region: z.string().min(1, 'Region is required'),
  city: z.string().min(1, 'City is required'),
  area: z.number().positive('Area must be positive'),
  price: z.number().positive('Price must be positive').optional().nullable(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  images: z.array(z.string().url()).optional().default([]),
  documents: z.array(z.string()).optional().default([]),

  // License-specific fields
  licenseSubtype: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional().nullable(),
  annualProductionLimit: z.number().positive().optional().nullable(),

  // Exploration-specific fields
  explorationStage: z.string().optional(),
  explorationStart: z.string().optional().nullable(),
  explorationEnd: z.string().optional().nullable(),
  explorationBudget: z.number().positive().optional().nullable(),

  // Occurrence-specific fields
  discoveryDate: z.string().optional().nullable(),
  geologicalConfidence: z.string().optional(),
  estimatedReserves: z.number().positive().optional().nullable(),
  accessibilityRating: z.number().min(1).max(5).optional(),
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

// Validation helper
export function validateRequest<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}
