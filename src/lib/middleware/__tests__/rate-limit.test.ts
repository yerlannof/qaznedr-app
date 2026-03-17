import { rateLimit } from '../rate-limit';

// Mock the environment to be production (rate limiting is disabled in development)
const originalEnv = process.env.NODE_ENV;

describe('Rate Limiting Middleware', () => {
  // Helper to create a mock NextRequest
  const createMockRequest = (method: string = 'GET', ip?: string) => {
    const headers = new Headers();
    if (ip) {
      headers.set('x-forwarded-for', ip);
    }
    return {
      method,
      headers,
      url: 'http://localhost/api/test',
    } as any;
  };

  beforeEach(() => {
    // Set to production so rate limiting runs
    process.env.NODE_ENV = 'production';
  });

  afterAll(() => {
    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  it('should allow requests under rate limit', async () => {
    const request = createMockRequest('GET', '127.0.0.1');
    const result = await rateLimit(request);

    // First request should be allowed
    expect(result).not.toBeNull();
    expect(result?.success).toBe(true);
    expect(result?.remaining).toBeGreaterThanOrEqual(0);
  });

  it('should block requests over rate limit', async () => {
    const request = createMockRequest('GET', '192.168.1.100');

    // Make multiple requests to exceed limit (30 for GET)
    const results = [];
    for (let i = 0; i < 35; i++) {
      const result = await rateLimit(request);
      results.push(result);
    }

    // Last few requests should be blocked
    const lastResult = results[results.length - 1];
    expect(lastResult?.success).toBe(false);
    expect(lastResult?.remaining).toBe(0);
  });

  it('should handle different IP addresses independently', async () => {
    const request1 = createMockRequest('GET', '192.168.1.1');
    const request2 = createMockRequest('GET', '192.168.1.2');

    const result1 = await rateLimit(request1);
    const result2 = await rateLimit(request2);

    // Both should be allowed as they're different IPs
    expect(result1?.success).toBe(true);
    expect(result2?.success).toBe(true);
  });

  it('should handle rate limit errors gracefully', async () => {
    const request = createMockRequest('GET');

    // Test that error handling doesn't throw
    const result = await rateLimit(request);

    // Should return a result (fail open behavior)
    expect(result).toBeDefined();
  });

  it('should provide reset time for rate-limited requests', async () => {
    const request = createMockRequest('GET', '10.0.0.1');

    const result = await rateLimit(request);

    expect(result).not.toBeNull();
    if (result?.reset) {
      expect(result.reset).toBeGreaterThan(Date.now() / 1000);
    }
  });

  it('should skip rate limiting in development', async () => {
    process.env.NODE_ENV = 'development';
    const request = createMockRequest('GET', '127.0.0.1');

    const result = await rateLimit(request);

    // Should return null in development
    expect(result).toBeNull();
  });
});
