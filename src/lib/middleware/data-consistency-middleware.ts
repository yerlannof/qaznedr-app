import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/database.types';
import { dataSyncService } from '@/lib/sync/data-sync-service';
import { redisCacheService } from '@/lib/cache/redis-cache-service';

type Deposit = Database['public']['Tables']['kazakhstan_deposits']['Row'];

// Data consistency validation rules
interface ConsistencyRule {
  name: string;
  validate: (data: any, context?: any) => Promise<ConsistencyResult>;
  critical: boolean; // If true, failure blocks the operation
  description: string;
}

interface ConsistencyResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fixable: boolean;
  autoFix?: () => Promise<void>;
}

interface ConsistencyContext {
  operation: 'create' | 'update' | 'delete';
  userId?: string;
  existingData?: any;
  relatedData?: any;
}

// Validation schemas for different data types
const depositValidationSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  type: z.enum(['MINING_LICENSE', 'EXPLORATION_LICENSE', 'MINERAL_OCCURRENCE']),
  mineral: z.enum([
    'Oil',
    'Gas',
    'Gold',
    'Copper',
    'Coal',
    'Uranium',
    'Iron',
    'Silver',
    'Zinc',
  ]),
  region: z.string().min(1),
  price: z.number().positive().max(999999999999),
  area: z.number().positive().max(1000000),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'SOLD', 'SUSPENDED']).optional(),
  verified: z.boolean().optional(),
  featured: z.boolean().optional(),
});

// Consistency validation rules
const CONSISTENCY_RULES: ConsistencyRule[] = [
  {
    name: 'schema_validation',
    critical: true,
    description: 'Validates data against the defined schema',
    validate: async (data: any): Promise<ConsistencyResult> => {
      try {
        depositValidationSchema.parse(data);
        return {
          valid: true,
          errors: [],
          warnings: [],
          fixable: false,
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors = error.errors.map(
            (e) => `${e.path.join('.')}: ${e.message}`
          );
          return {
            valid: false,
            errors,
            warnings: [],
            fixable: false,
          };
        }
        return {
          valid: false,
          errors: ['Unknown validation error'],
          warnings: [],
          fixable: false,
        };
      }
    },
  },

  {
    name: 'business_logic_validation',
    critical: true,
    description: 'Validates business-specific rules',
    validate: async (
      data: any,
      context?: ConsistencyContext
    ): Promise<ConsistencyResult> => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Mining license specific validations
      if (data.type === 'MINING_LICENSE') {
        if (!data.license_number) {
          errors.push('Mining license must have a license number');
        }
        if (!data.license_expiry) {
          errors.push('Mining license must have an expiry date');
        } else if (new Date(data.license_expiry) < new Date()) {
          warnings.push('Mining license has expired');
        }
      }

      // Exploration license specific validations
      if (data.type === 'EXPLORATION_LICENSE') {
        if (!data.exploration_stage) {
          errors.push('Exploration license must specify the exploration stage');
        }
        if (data.exploration_budget && data.exploration_budget < 100000) {
          warnings.push('Exploration budget seems unusually low');
        }
      }

      // Mineral occurrence specific validations
      if (data.type === 'MINERAL_OCCURRENCE') {
        if (!data.discovery_date) {
          errors.push('Mineral occurrence must have a discovery date');
        }
        if (!data.geological_confidence) {
          errors.push(
            'Mineral occurrence must specify geological confidence level'
          );
        }
      }

      // Geographic validation
      if (data.latitude && data.longitude) {
        // Check if coordinates are within Kazakhstan bounds
        const kazakhstanBounds = {
          north: 55.4421,
          south: 40.9023,
          east: 87.3157,
          west: 46.4664,
        };

        if (
          data.latitude < kazakhstanBounds.south ||
          data.latitude > kazakhstanBounds.north ||
          data.longitude < kazakhstanBounds.west ||
          data.longitude > kazakhstanBounds.east
        ) {
          warnings.push('Coordinates appear to be outside Kazakhstan');
        }
      }

      // Price validation
      if (data.price) {
        if (data.price < 1000) {
          warnings.push('Price seems unusually low for a mining asset');
        }
        if (data.price > 100000000000) {
          // 100 billion
          warnings.push('Price seems unusually high');
        }
      }

      // Area validation
      if (data.area) {
        if (data.area < 0.1) {
          warnings.push('Area seems unusually small');
        }
        if (data.area > 100000) {
          // 100,000 hectares
          warnings.push('Area seems unusually large');
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        fixable: false,
      };
    },
  },

  {
    name: 'uniqueness_validation',
    critical: true,
    description: 'Checks for duplicate data',
    validate: async (
      data: any,
      context?: ConsistencyContext
    ): Promise<ConsistencyResult> => {
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        const supabase = createClient();

        // Check for duplicate titles
        let titleQuery = supabase
          .from('kazakhstan_deposits')
          .select('id, title')
          .eq('title', data.title);

        // Exclude current record if updating
        if (context?.operation === 'update' && data.id) {
          titleQuery = titleQuery.neq('id', data.id);
        }

        const { data: duplicateTitles } = await titleQuery;

        if (duplicateTitles && duplicateTitles.length > 0) {
          warnings.push(
            `Title "${data.title}" is already used by ${duplicateTitles.length} other listing(s)`
          );
        }

        // Check for duplicate license numbers
        if (data.license_number) {
          let licenseQuery = supabase
            .from('kazakhstan_deposits')
            .select('id, license_number')
            .eq('license_number', data.license_number);

          if (context?.operation === 'update' && data.id) {
            licenseQuery = licenseQuery.neq('id', data.id);
          }

          const { data: duplicateLicenses } = await licenseQuery;

          if (duplicateLicenses && duplicateLicenses.length > 0) {
            errors.push(
              `License number "${data.license_number}" is already used`
            );
          }
        }

        // Check for overlapping coordinates (if exact match)
        if (data.latitude && data.longitude) {
          let coordinatesQuery = supabase
            .from('kazakhstan_deposits')
            .select('id, latitude, longitude, title')
            .eq('latitude', data.latitude)
            .eq('longitude', data.longitude);

          if (context?.operation === 'update' && data.id) {
            coordinatesQuery = coordinatesQuery.neq('id', data.id);
          }

          const { data: duplicateCoordinates } = await coordinatesQuery;

          if (duplicateCoordinates && duplicateCoordinates.length > 0) {
            warnings.push(
              `Exact coordinates are already used by listing: "${duplicateCoordinates[0].title}"`
            );
          }
        }
      } catch (error) {
        console.error('Uniqueness validation error:', error);
        warnings.push('Could not verify uniqueness due to database error');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        fixable: false,
      };
    },
  },

  {
    name: 'referential_integrity',
    critical: true,
    description: 'Validates relationships between data entities',
    validate: async (
      data: any,
      context?: ConsistencyContext
    ): Promise<ConsistencyResult> => {
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        const supabase = createClient();

        // Check if user exists and is valid
        if (data.user_id || data.seller_id) {
          const userId = data.user_id || data.seller_id;
          const { data: user } = await supabase
            .from('users')
            .select('id, email, is_verified')
            .eq('id', userId)
            .single();

          if (!user) {
            errors.push(`User ${userId} does not exist`);
          } else if (!user.is_verified) {
            warnings.push('Associated user account is not verified');
          }
        }

        // Check related payment intents if this is a sold listing
        if (data.status === 'SOLD' && data.id) {
          const { data: paymentIntents } = await supabase
            .from('payment_intents')
            .select('id, status')
            .eq('listing_id', data.id)
            .eq('status', 'succeeded');

          if (!paymentIntents || paymentIntents.length === 0) {
            warnings.push(
              'Listing marked as SOLD but no successful payment found'
            );
          }
        }

        // Check if there are any active transactions for this listing
        if (context?.operation === 'delete' && data.id) {
          const { data: activeTransactions } = await supabase
            .from('transactions')
            .select('id, status')
            .eq('listing_id', data.id)
            .in('status', ['pending', 'processing']);

          if (activeTransactions && activeTransactions.length > 0) {
            errors.push('Cannot delete listing with active transactions');
          }
        }
      } catch (error) {
        console.error('Referential integrity validation error:', error);
        warnings.push(
          'Could not verify referential integrity due to database error'
        );
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        fixable: false,
      };
    },
  },

  {
    name: 'data_synchronization',
    critical: false,
    description: 'Validates data synchronization across systems',
    validate: async (
      data: any,
      context?: ConsistencyContext
    ): Promise<ConsistencyResult> => {
      const warnings: string[] = [];

      try {
        // Check if Elasticsearch sync is up to date
        if (data.id) {
          const esHealth = await dataSyncService.healthCheck();
          if (!esHealth.elasticsearch) {
            warnings.push(
              'Elasticsearch is not available - search functionality may be limited'
            );
          }
        }

        // Check cache consistency
        const cacheHealth = await redisCacheService.healthCheck();
        if (!cacheHealth.connected) {
          warnings.push(
            'Redis cache is not available - performance may be degraded'
          );
        }
      } catch (error) {
        console.error('Data synchronization validation error:', error);
        warnings.push('Could not verify data synchronization status');
      }

      return {
        valid: true, // Non-critical, so always valid
        errors: [],
        warnings,
        fixable: true,
        autoFix: async () => {
          if (data.id) {
            // Trigger sync for this specific deposit
            await dataSyncService.handleDepositChange('update', data);
          }
        },
      };
    },
  },
];

/**
 * Data consistency validation middleware
 */
export function withDataConsistency(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    skipRules?: string[];
    enforceWarnings?: boolean;
    autoFix?: boolean;
  } = {}
) {
  return async function consistencyValidatedHandler(
    req: NextRequest
  ): Promise<NextResponse> {
    const {
      skipRules = [],
      enforceWarnings = false,
      autoFix = false,
    } = options;

    try {
      // Only validate for data mutation operations
      if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
        return handler(req);
      }

      // Get request body
      const requestBody = await req.json();

      // Create a new request with the same body for the handler
      const newRequest = new NextRequest(req.url, {
        method: req.method,
        headers: req.headers,
        body: JSON.stringify(requestBody),
      });

      // Determine operation type
      const operation: 'create' | 'update' | 'delete' =
        req.method === 'POST'
          ? 'create'
          : req.method === 'DELETE'
            ? 'delete'
            : 'update';

      // Build validation context
      const context: ConsistencyContext = {
        operation,
        userId: req.headers.get('x-user-id') || undefined,
      };

      // Get existing data for updates
      if (operation === 'update' && requestBody.id) {
        try {
          const supabase = createClient();
          const { data: existing } = await supabase
            .from('kazakhstan_deposits')
            .select('*')
            .eq('id', requestBody.id)
            .single();

          context.existingData = existing;
        } catch (error) {
          console.error('Failed to get existing data for validation:', error);
        }
      }

      // Run validation rules
      const validationResults: Array<ConsistencyResult & { ruleName: string }> =
        [];

      for (const rule of CONSISTENCY_RULES) {
        if (skipRules.includes(rule.name)) {
          continue;
        }

        try {
          const result = await rule.validate(requestBody, context);
          validationResults.push({
            ...result,
            ruleName: rule.name,
          });
        } catch (error) {
          console.error(`Validation rule ${rule.name} failed:`, error);
          validationResults.push({
            valid: false,
            errors: [`Validation rule ${rule.name} failed to execute`],
            warnings: [],
            fixable: false,
            ruleName: rule.name,
          });
        }
      }

      // Collect all errors and warnings
      const allErrors: string[] = [];
      const allWarnings: string[] = [];
      const fixableIssues: Array<{
        ruleName: string;
        autoFix: () => Promise<void>;
      }> = [];

      for (const result of validationResults) {
        allErrors.push(
          ...result.errors.map((e) => `[${result.ruleName}] ${e}`)
        );
        allWarnings.push(
          ...result.warnings.map((w) => `[${result.ruleName}] ${w}`)
        );

        if (result.fixable && result.autoFix) {
          fixableIssues.push({
            ruleName: result.ruleName,
            autoFix: result.autoFix,
          });
        }
      }

      // Check if we should block the operation
      const hasErrors = allErrors.length > 0;
      const hasWarnings = allWarnings.length > 0;
      const shouldBlock = hasErrors || (enforceWarnings && hasWarnings);

      if (shouldBlock) {
        const response = {
          success: false,
          error: 'Data consistency validation failed',
          validation: {
            errors: allErrors,
            warnings: allWarnings,
            fixable: fixableIssues.length > 0,
            autoFixAvailable: autoFix && fixableIssues.length > 0,
          },
        };

        return NextResponse.json(response, { status: 400 });
      }

      // Apply auto-fixes if enabled and no errors
      if (autoFix && !hasErrors && fixableIssues.length > 0) {
        console.log(`🔧 Applying ${fixableIssues.length} auto-fixes...`);

        for (const issue of fixableIssues) {
          try {
            await issue.autoFix();
            console.log(`✅ Auto-fixed issue in rule: ${issue.ruleName}`);
          } catch (error) {
            console.error(
              `❌ Failed to auto-fix issue in rule ${issue.ruleName}:`,
              error
            );
            allWarnings.push(`Failed to auto-fix issue in ${issue.ruleName}`);
          }
        }
      }

      // Execute the original handler
      const response = await handler(newRequest);

      // Add validation info to successful responses
      if (
        response.status >= 200 &&
        response.status < 300 &&
        (hasWarnings || fixableIssues.length > 0)
      ) {
        try {
          const responseData = await response.json();
          const enhancedResponse = {
            ...responseData,
            validation: {
              warnings: allWarnings,
              autoFixesApplied: autoFix ? fixableIssues.length : 0,
            },
          };

          return NextResponse.json(enhancedResponse, {
            status: response.status,
            headers: response.headers,
          });
        } catch (error) {
          // If we can't parse the response, just return it as-is
          return response;
        }
      }

      return response;
    } catch (error) {
      console.error('Data consistency middleware error:', error);
      // If validation fails, allow the operation but log the error
      return handler(req);
    }
  };
}

/**
 * Standalone validation function for use outside middleware
 */
export async function validateDataConsistency(
  data: any,
  context?: ConsistencyContext,
  options: {
    skipRules?: string[];
    autoFix?: boolean;
  } = {}
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  fixable: boolean;
  autoFixesApplied: number;
}> {
  const { skipRules = [], autoFix = false } = options;

  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  const fixableIssues: Array<{
    ruleName: string;
    autoFix: () => Promise<void>;
  }> = [];

  for (const rule of CONSISTENCY_RULES) {
    if (skipRules.includes(rule.name)) {
      continue;
    }

    try {
      const result = await rule.validate(data, context);

      allErrors.push(...result.errors.map((e) => `[${rule.name}] ${e}`));
      allWarnings.push(...result.warnings.map((w) => `[${rule.name}] ${w}`));

      if (result.fixable && result.autoFix) {
        fixableIssues.push({
          ruleName: rule.name,
          autoFix: result.autoFix,
        });
      }
    } catch (error) {
      console.error(`Validation rule ${rule.name} failed:`, error);
      allErrors.push(`Validation rule ${rule.name} failed to execute`);
    }
  }

  // Apply auto-fixes if enabled
  let autoFixesApplied = 0;
  if (autoFix && allErrors.length === 0 && fixableIssues.length > 0) {
    for (const issue of fixableIssues) {
      try {
        await issue.autoFix();
        autoFixesApplied++;
      } catch (error) {
        console.error(
          `Failed to auto-fix issue in rule ${issue.ruleName}:`,
          error
        );
        allWarnings.push(`Failed to auto-fix issue in ${issue.ruleName}`);
      }
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    fixable: fixableIssues.length > 0,
    autoFixesApplied,
  };
}

// Export rule names for reference
export const VALIDATION_RULE_NAMES = CONSISTENCY_RULES.map((rule) => rule.name);
