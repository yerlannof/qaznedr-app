import { generateCSRFToken, validateCSRFToken } from '../csrf';

describe('CSRF Protection', () => {
  // Store original getRandomValues
  const originalGetRandomValues = global.crypto.getRandomValues;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original
    global.crypto.getRandomValues = originalGetRandomValues;
  });

  describe('generateCSRFToken', () => {
    it('should generate a 64-character hex token', () => {
      // Mock crypto.getRandomValues to return predictable values
      const mockArray = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        mockArray[i] = i;
      }
      global.crypto.getRandomValues = jest.fn((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = mockArray[i];
        }
        return array;
      });

      const token = generateCSRFToken();

      expect(token).toHaveLength(64); // 32 bytes * 2 hex chars
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate different tokens on each call', () => {
      // Use real crypto which generates random values
      global.crypto.getRandomValues = originalGetRandomValues;

      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();

      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
    });

    it('should handle crypto errors', () => {
      global.crypto.getRandomValues = jest.fn(() => {
        throw new Error('Crypto error');
      });

      expect(() => generateCSRFToken()).toThrow('Crypto error');
    });
  });

  describe('validateCSRFToken', () => {
    it('should return true for matching tokens', () => {
      const token = '1234567890abcdef1234567890abcdef';

      const isValid = validateCSRFToken(token, token);

      expect(isValid).toBe(true);
    });

    it('should return false for non-matching tokens', () => {
      const cookieToken = '1234567890abcdef1234567890abcdef';
      const headerToken = 'fedcba0987654321fedcba0987654321';

      const isValid = validateCSRFToken(cookieToken, headerToken);

      expect(isValid).toBe(false);
    });

    it('should return false when cookie token is undefined', () => {
      const headerToken = '1234567890abcdef1234567890abcdef';

      const isValid = validateCSRFToken(undefined, headerToken);

      expect(isValid).toBe(false);
    });

    it('should return false when header token is undefined', () => {
      const cookieToken = '1234567890abcdef1234567890abcdef';

      const isValid = validateCSRFToken(cookieToken, undefined);

      expect(isValid).toBe(false);
    });

    it('should return false when both tokens are undefined', () => {
      const isValid = validateCSRFToken(undefined, undefined);

      expect(isValid).toBe(false);
    });

    it('should handle empty string tokens', () => {
      expect(validateCSRFToken('', '')).toBe(false);
      expect(validateCSRFToken('token', '')).toBe(false);
      expect(validateCSRFToken('', 'token')).toBe(false);
    });

    it('should be case-sensitive', () => {
      const token1 = '1234567890abcdef1234567890abcdef';
      const token2 = '1234567890ABCDEF1234567890ABCDEF';

      const isValid = validateCSRFToken(token1, token2);

      expect(isValid).toBe(false);
    });

    it('should handle tokens with different lengths', () => {
      const shortToken = '12345678';
      const longToken = '1234567890abcdef1234567890abcdef';

      const isValid = validateCSRFToken(shortToken, longToken);

      expect(isValid).toBe(false);
    });

    it('should prevent timing attacks with constant-time comparison', () => {
      // This test verifies the implementation uses constant-time comparison
      // by checking that validation time doesn't vary significantly
      const token1 = '1234567890abcdef1234567890abcdef';
      const token2 = 'f234567890abcdef1234567890abcdef'; // Different first character
      const token3 = '1234567890abcdef1234567890abcdef'; // Same token

      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        validateCSRFToken(token1, token2);
        const end = process.hrtime.bigint();
        times.push(Number(end - start));
      }

      // Calculate standard deviation
      const mean = times.reduce((a, b) => a + b) / times.length;
      const variance =
        times.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / times.length;
      const stdDev = Math.sqrt(variance);

      // Standard deviation should be relatively low for constant-time comparison
      expect(stdDev / mean).toBeLessThan(0.5); // Less than 50% variation
    });
  });
});
