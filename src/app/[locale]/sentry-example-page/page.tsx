'use client';

import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';

export default function SentryExamplePage() {
  const [isError, setIsError] = useState(false);

  const throwError = () => {
    throw new Error('Sentry Test Error - This is a test error!');
  };

  const captureMessage = () => {
    Sentry.captureMessage('Test message from QAZNEDR app', 'info');
    alert('Message sent to Sentry!');
  };

  const captureException = () => {
    try {
      // @ts-expect-error - intentionally calling undefined function
      myUndefinedFunction();
    } catch (error) {
      Sentry.captureException(error);
      alert('Exception captured and sent to Sentry!');
    }
  };

  if (isError) {
    throw new Error(
      'React Error Boundary Test - This error should be caught by Sentry!'
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Sentry Integration Test Page
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Test Sentry Error Tracking
            </h2>
            <p className="text-gray-600 mb-6">
              Click the buttons below to trigger different types of errors and
              verify that Sentry is properly configured.
            </p>
          </div>

          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-2">
                1. Throw JavaScript Error
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                This will throw an unhandled error that should be caught by
                Sentry
              </p>
              <button
                onClick={throwError}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Throw Error
              </button>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-2">
                2. Send Custom Message
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Send a custom info message to Sentry
              </p>
              <button
                onClick={captureMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Send Message
              </button>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-2">
                3. Capture Exception
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Call undefined function and capture the exception
              </p>
              <button
                onClick={captureException}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              >
                Capture Exception
              </button>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-2">
                4. React Error Boundary Test
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Trigger a React rendering error
              </p>
              <button
                onClick={() => setIsError(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Trigger React Error
              </button>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-100 rounded">
            <h3 className="font-medium text-gray-700 mb-2">📝 Instructions:</h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Make sure you have added your Sentry DSN to .env.local</li>
              <li>Start the development server: npm run dev</li>
              <li>Click any button above to trigger an error</li>
              <li>Check your Sentry dashboard to see the captured errors</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
