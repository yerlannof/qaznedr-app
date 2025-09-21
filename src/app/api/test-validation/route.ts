import { NextRequest, NextResponse } from 'next/server';
import {
  withInputValidation,
  validateRequestBody,
  validateQueryParams,
  ValidationSchemas,
  sanitizeString,
} from '@/lib/middleware/input-validation';
import { z } from 'zod';

// Test schema for request validation
const testSchema = z.object({
  title: ValidationSchemas.title,
  description: ValidationSchemas.description.optional(),
  price: ValidationSchemas.price.optional(),
  coordinates: z
    .object({
      latitude: ValidationSchemas.latitude,
      longitude: ValidationSchemas.longitude,
    })
    .optional(),
});

async function handleValidationTest(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'query';

    switch (testType) {
      case 'query':
        // Test query parameter validation
        const allowedParams = ['search', 'region', 'mineral', 'page', 'limit'];
        const queryValidation = validateQueryParams(request, allowedParams);

        if (!queryValidation.success) {
          return NextResponse.json(
            {
              success: false,
              test: 'query_validation',
              error: queryValidation.error,
              message: 'Query parameter validation failed as expected',
            },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          test: 'query_validation',
          sanitizedParams: queryValidation.params,
          message: 'Query parameters validated successfully',
        });

      case 'body':
        // Test body validation
        const body = await request.json();
        const bodyValidation = validateRequestBody(testSchema, body);

        if (!bodyValidation.success) {
          return NextResponse.json(
            {
              success: false,
              test: 'body_validation',
              error: bodyValidation.error,
              message: 'Request body validation failed as expected',
            },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          test: 'body_validation',
          validatedData: bodyValidation.data,
          message: 'Request body validated successfully',
        });

      case 'sanitize':
        // Test string sanitization
        const unsafeString =
          searchParams.get('input') || '<script>alert("xss")</script>';
        const sanitized = sanitizeString(unsafeString);

        return NextResponse.json({
          success: true,
          test: 'string_sanitization',
          original: unsafeString,
          sanitized: sanitized,
          message: 'String sanitized successfully',
        });

      case 'sql_injection':
        // Test SQL injection detection
        const sqlInput = searchParams.get('input') || "'; DROP TABLE users; --";
        try {
          const testResult = ValidationSchemas.searchQuery.parse(sqlInput);
          return NextResponse.json({
            success: true,
            test: 'sql_injection_test',
            input: sqlInput,
            result: testResult,
            message: 'Input passed validation (unexpected for SQL injection)',
          });
        } catch (error) {
          return NextResponse.json({
            success: true,
            test: 'sql_injection_test',
            input: sqlInput,
            blocked: true,
            error: error instanceof Error ? error.message : 'Validation failed',
            message: 'SQL injection attempt blocked successfully',
          });
        }

      case 'xss':
        // Test XSS detection
        const xssInput =
          searchParams.get('input') || '<script>alert("xss")</script>';
        try {
          const testResult = ValidationSchemas.title.parse(xssInput);
          return NextResponse.json({
            success: true,
            test: 'xss_test',
            input: xssInput,
            result: testResult,
            message: 'XSS attempt was sanitized',
          });
        } catch (error) {
          return NextResponse.json({
            success: true,
            test: 'xss_test',
            input: xssInput,
            blocked: true,
            error: error instanceof Error ? error.message : 'Validation failed',
            message: 'XSS attempt blocked successfully',
          });
        }

      default:
        return NextResponse.json({
          success: true,
          availableTests: ['query', 'body', 'sanitize', 'sql_injection', 'xss'],
          message: 'Input validation middleware is working',
          usage:
            'Add ?type=query|body|sanitize|sql_injection|xss to test different validation features',
        });
    }
  } catch (error) {
    console.error('Validation test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Validation test failed',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// Export with input validation middleware
export const GET = withInputValidation(
  ['GET', 'POST'],
  ['application/json'],
  1024 * 1024 // 1MB
)(handleValidationTest);

export const POST = withInputValidation(
  ['GET', 'POST'],
  ['application/json'],
  1024 * 1024 // 1MB
)(handleValidationTest);
