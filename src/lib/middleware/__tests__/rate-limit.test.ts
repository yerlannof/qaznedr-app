import { rateLimit } from '../rate-limit';
import { Redis } from '@upstash/redis';

// Mock Upstash Redis
jest.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: jest.fn(),
  },
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn().mockImplementation(() => ({
    limit: jest.fn(),
  })),
}));

describe('Rate Limiting Middleware', () => {
  let mockLimit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const { Ratelimit } = require('@upstash/ratelimit');
    mockLimit = jest.fn();
    Ratelimit.mockImplementation(() => ({
      limit: mockLimit,
    }));
  });

  it('should allow requests under rate limit', async () => {
    mockLimit.mockResolvedValue({
      success: true,
      limit: 30,
      remaining: 25,
      reset: Date.now() + 10000,
    });

    const result = await rateLimit('127.0.0.1');

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(25);
    expect(mockLimit).toHaveBeenCalledWith('127.0.0.1');
  });

  it('should block requests over rate limit', async () => {
    mockLimit.mockResolvedValue({
      success: false,
      limit: 30,
      remaining: 0,
      reset: Date.now() + 10000,
    });

    const result = await rateLimit('127.0.0.1');

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should handle different IP addresses independently', async () => {
    mockLimit
      .mockResolvedValueOnce({
        success: true,
        limit: 30,
        remaining: 10,
        reset: Date.now() + 10000,
      })
      .mockResolvedValueOnce({
        success: false,
        limit: 30,
        remaining: 0,
        reset: Date.now() + 10000,
      });

    const result1 = await rateLimit('192.168.1.1');
    const result2 = await rateLimit('192.168.1.2');

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(false);
    expect(mockLimit).toHaveBeenCalledTimes(2);
  });

  it('should handle rate limit errors gracefully', async () => {
    mockLimit.mockRejectedValue(new Error('Redis connection failed'));

    await expect(rateLimit('127.0.0.1')).rejects.toThrow(
      'Redis connection failed'
    );
  });

  it('should provide reset time for rate-limited requests', async () => {
    const resetTime = Date.now() + 10000;
    mockLimit.mockResolvedValue({
      success: false,
      limit: 30,
      remaining: 0,
      reset: resetTime,
    });

    const result = await rateLimit('127.0.0.1');

    expect(result.reset).toBe(resetTime);
    expect(result.reset).toBeGreaterThan(Date.now());
  });
});
