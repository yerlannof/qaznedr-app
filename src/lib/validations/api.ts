import { z } from 'zod';

// Listing query parameters schema
export const listingQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  limit: z
    .string()
    .optional()
    .refine((val) => !val || parseInt(val) <= 100, 'Limit must not exceed 100')
    .transform((val) => (val ? parseInt(val) : undefined)),
  sortBy: z
    .enum(['created_at', 'createdAt', 'price', 'area', 'title', 'views'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  query: z.string().optional(),
  region: z.string().optional(),
  mineral: z.string().optional(),
  type: z
    .enum(['MINING_LICENSE', 'EXPLORATION_LICENSE', 'MINERAL_OCCURRENCE'])
    .optional(),
  verified: z.enum(['true', 'false']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  minPrice: z
    .string()
    .optional()
    .refine((val) => !val || parseInt(val) >= 0, 'Price must be non-negative'),
  maxPrice: z
    .string()
    .optional()
    .refine((val) => !val || parseInt(val) >= 0, 'Price must be non-negative'),
  minArea: z
    .string()
    .optional()
    .refine((val) => !val || parseInt(val) >= 0, 'Area must be non-negative'),
  maxArea: z
    .string()
    .optional()
    .refine((val) => !val || parseInt(val) >= 0, 'Area must be non-negative'),
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
  city: z.string().min(1, 'City is required').optional(),
  area: z.number().positive('Area must be positive'),
  price: z.number().positive('Price must be positive').optional().nullable(),
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  images: z.array(z.string().url()).optional().default([]),
  documents: z.array(z.string()).optional().default([]),

  // Status field
  status: z.enum(['ACTIVE', 'PENDING', 'SOLD', 'EXPIRED']).optional(),

  // Contact information
  contactEmail: z.string().email('Invalid email format').optional(),
  contactPhone: z.string().optional(),
  contactName: z.string().optional(),

  // License-specific fields
  licenseSubtype: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional().nullable(),
  annualProductionLimit: z.number().positive().optional().nullable(),

  // Exploration-specific fields
  explorationStage: z.string().optional(),
  explorationStart: z.string().optional().nullable(),
  explorationEnd: z.string().optional().nullable(),
  explorationPeriod: z.string().optional(),
  explorationBudget: z.number().positive().optional().nullable(),

  // Occurrence-specific fields
  discoveryDate: z.string().optional().nullable(),
  geologicalConfidence: z.string().optional(),
  estimatedReserves: z
    .union([z.number().positive(), z.string()])
    .optional()
    .nullable(),
  accessibilityRating: z.number().min(1).max(5).optional(),
});

// Draft listing schema — only title is required, everything else optional
export const draftListingSchema = createListingSchema.partial().extend({
  title: z.string().min(1, 'Title is required').max(200),
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
  profileType: z
    .enum(['subsoil_user', 'service_provider', 'investor'])
    .optional(),
});

// Alias for compatibility with tests
export const listingsQuerySchema = listingQuerySchema;

// Update listing schema (partial of create schema)
export const updateListingSchema = createListingSchema.partial();

// Listing ID validation schema
export const listingIdSchema = z.object({
  id: z.string().uuid('Invalid listing ID format'),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z
    .union([
      z.string().refine((val) => parseInt(val) >= 1, 'Page must be at least 1'),
      z.number().min(1, 'Page must be at least 1'),
    ])
    .optional()
    .transform((val) => {
      if (!val) return 1;
      if (typeof val === 'string') return parseInt(val);
      return val;
    })
    .default(1),
  limit: z
    .union([
      z.string().refine((val) => {
        const num = parseInt(val);
        return num >= 1 && num <= 100;
      }, 'Limit must be between 1 and 100'),
      z.number().min(1).max(100, 'Limit must not exceed 100'),
    ])
    .optional()
    .transform((val) => {
      if (!val) return 20;
      if (typeof val === 'string') return parseInt(val);
      return val;
    })
    .default(20),
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
