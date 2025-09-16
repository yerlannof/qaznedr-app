import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    // Intentionally throw an error to test Sentry
    throw new Error(
      'Test Sentry Error - This is a test error to verify Sentry integration'
    );
  } catch (error) {
    // Capture the error in Sentry
    Sentry.captureException(error);

    return NextResponse.json(
      {
        error: 'Test error sent to Sentry',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  // Test different error types
  const errorType = Math.random();

  if (errorType < 0.33) {
    // Type Error
    const obj: any = null;
    obj.someMethod(); // This will throw TypeError
  } else if (errorType < 0.66) {
    // Reference Error
    // @ts-expect-error
    nonExistentFunction(); // This will throw ReferenceError
  } else {
    // Custom Error
    throw new Error('Custom Application Error - Random test');
  }

  return NextResponse.json({ status: 'error triggered' });
}
