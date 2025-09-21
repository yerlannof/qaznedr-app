import { useState, useEffect } from 'react';
import { getCSRFTokenFromCookie } from '@/lib/middleware/csrf';

export function useCSRFToken() {
  const [csrfToken, setCSRFToken] = useState<string | null>(null);

  useEffect(() => {
    const token = getCSRFTokenFromCookie();
    setCSRFToken(token);
  }, []);

  return csrfToken;
}

// Helper to add CSRF token to fetch requests
export function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrfToken = getCSRFTokenFromCookie();

  const headers = new Headers(options.headers);
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// Helper hook for API calls with CSRF protection
export function useAPICall() {
  const csrfToken = useCSRFToken();

  const callAPI = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const headers = new Headers(options.headers);

    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }

    headers.set('Content-Type', 'application/json');

    return fetch(url, {
      ...options,
      headers,
    });
  };

  return { callAPI, csrfToken };
}
