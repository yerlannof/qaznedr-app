import crypto from 'crypto';

// Minimum security requirements for JWT secrets
const MIN_SECRET_LENGTH = 32;
const MIN_ENTROPY_BITS = 128;

interface SecretValidationResult {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
  warnings: string[];
}

/**
 * Calculate entropy of a string
 */
function calculateEntropy(str: string): number {
  const frequencies: Record<string, number> = {};

  // Count character frequencies
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  // Calculate Shannon entropy
  let entropy = 0;
  const length = str.length;

  for (const count of Object.values(frequencies)) {
    const probability = count / length;
    entropy -= probability * Math.log2(probability);
  }

  return entropy * length; // Total entropy in bits
}

/**
 * Check for common weak patterns
 */
function hasWeakPatterns(secret: string): string[] {
  const weakPatterns = [
    { pattern: /^[a-zA-Z]+$/, message: 'Contains only letters' },
    { pattern: /^[0-9]+$/, message: 'Contains only numbers' },
    { pattern: /^(.)\1+$/, message: 'Contains repeating characters' },
    {
      pattern: /password|secret|key|admin|test|demo/i,
      message: 'Contains common words',
    },
    { pattern: /123456|qwerty|abc/i, message: 'Contains common sequences' },
    { pattern: /(.{1,3})\1{2,}/, message: 'Contains repeating patterns' },
  ];

  const issues = [];
  for (const { pattern, message } of weakPatterns) {
    if (pattern.test(secret)) {
      issues.push(message);
    }
  }

  return issues;
}

/**
 * Validate JWT secret strength and security
 */
export function validateJwtSecret(
  secret: string | undefined
): SecretValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if secret exists
  if (!secret) {
    errors.push('JWT secret is not defined');
    return {
      isValid: false,
      strength: 'weak',
      errors,
      warnings,
    };
  }

  // Check minimum length
  if (secret.length < MIN_SECRET_LENGTH) {
    errors.push(
      `Secret too short (minimum ${MIN_SECRET_LENGTH} characters, got ${secret.length})`
    );
  }

  // Check entropy
  const entropy = calculateEntropy(secret);
  if (entropy < MIN_ENTROPY_BITS) {
    errors.push(
      `Secret has insufficient entropy (minimum ${MIN_ENTROPY_BITS} bits, got ${entropy.toFixed(1)})`
    );
  }

  // Check for weak patterns
  const weakPatterns = hasWeakPatterns(secret);
  if (weakPatterns.length > 0) {
    errors.push(`Weak patterns detected: ${weakPatterns.join(', ')}`);
  }

  // Check character diversity
  const hasUpperCase = /[A-Z]/.test(secret);
  const hasLowerCase = /[a-z]/.test(secret);
  const hasNumbers = /[0-9]/.test(secret);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(secret);

  const charTypeCount = [
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChars,
  ].filter(Boolean).length;

  if (charTypeCount < 3) {
    warnings.push(
      'Secret should contain at least 3 different character types (uppercase, lowercase, numbers, special characters)'
    );
  }

  // Check if it's base64 encoded (good practice)
  try {
    const decoded = Buffer.from(secret, 'base64').toString('ascii');
    if (decoded.length < secret.length * 0.5) {
      warnings.push('Consider using base64 encoded secrets for better entropy');
    }
  } catch {
    // Not base64, that's fine
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (errors.length === 0) {
    if (
      entropy >= MIN_ENTROPY_BITS * 2 &&
      charTypeCount >= 3 &&
      secret.length >= 64
    ) {
      strength = 'strong';
    } else if (entropy >= MIN_ENTROPY_BITS && charTypeCount >= 2) {
      strength = 'medium';
    }
  }

  return {
    isValid: errors.length === 0,
    strength,
    errors,
    warnings,
  };
}

/**
 * Generate a secure JWT secret
 */
export function generateSecureJwtSecret(): string {
  // Generate 64 bytes (512 bits) of random data
  const randomBytes = crypto.randomBytes(64);

  // Convert to base64 for safe storage in environment variables
  return randomBytes.toString('base64');
}

/**
 * Derive a secret from a master key (for multiple environments)
 */
export function deriveJwtSecret(masterKey: string, context: string): string {
  const salt = crypto.createHash('sha256').update(context).digest();
  const derivedKey = crypto.pbkdf2Sync(masterKey, salt, 100000, 64, 'sha512');
  return derivedKey.toString('base64');
}

/**
 * Secure JWT secret provider with validation
 */
export class SecureJwtSecretProvider {
  private static instance: SecureJwtSecretProvider;
  private _secret: string | null = null;
  private _isValidated = false;

  private constructor() {}

  static getInstance(): SecureJwtSecretProvider {
    if (!SecureJwtSecretProvider.instance) {
      SecureJwtSecretProvider.instance = new SecureJwtSecretProvider();
    }
    return SecureJwtSecretProvider.instance;
  }

  /**
   * Get validated JWT secret
   */
  getSecret(): string {
    if (!this._isValidated) {
      this.validateAndSetSecret();
    }

    if (!this._secret) {
      throw new Error(
        'JWT secret validation failed - cannot proceed without secure secret'
      );
    }

    return this._secret;
  }

  /**
   * Validate and set the JWT secret
   */
  private validateAndSetSecret(): void {
    const envSecret = process.env.NEXTAUTH_SECRET;
    const validation = validateJwtSecret(envSecret);

    // Log validation results
    if (!validation.isValid) {
      console.error('❌ JWT Secret Validation Failed:');
      validation.errors.forEach((error) => console.error(`  - ${error}`));

      if (process.env.NODE_ENV === 'development') {
        console.warn('🔧 Development Mode: Generating temporary secure secret');
        this._secret = generateSecureJwtSecret();
        console.warn('⚠️  Add this to your .env.local file:');
        console.warn(`NEXTAUTH_SECRET="${this._secret}"`);
      } else {
        throw new Error('Invalid JWT secret in production environment');
      }
    } else {
      this._secret = envSecret!;

      // Log warnings
      if (validation.warnings.length > 0) {
        console.warn('⚠️  JWT Secret Warnings:');
        validation.warnings.forEach((warning) =>
          console.warn(`  - ${warning}`)
        );
      }

      console.log(`✅ JWT Secret validated (strength: ${validation.strength})`);
    }

    this._isValidated = true;
  }

  /**
   * Force re-validation (useful for testing)
   */
  revalidate(): void {
    this._isValidated = false;
    this._secret = null;
    this.validateAndSetSecret();
  }
}

/**
 * Secure NextAuth configuration helper
 */
export function getSecureAuthConfig() {
  const secretProvider = SecureJwtSecretProvider.getInstance();

  return {
    secret: secretProvider.getSecret(),
    jwt: {
      maxAge: 15 * 60, // 15 minutes (short-lived for security)
      // Use secure JWT algorithm
      encode: async ({ secret, token }) => {
        const jwt = await import('jsonwebtoken');
        return jwt.sign(token!, secret, {
          algorithm: 'HS256',
          expiresIn: '15m',
          issuer: 'qaznedr.kz',
          audience: 'qaznedr-app',
        });
      },
      decode: async ({ secret, token }) => {
        const jwt = await import('jsonwebtoken');
        try {
          return jwt.verify(token!, secret, {
            algorithms: ['HS256'],
            issuer: 'qaznedr.kz',
            audience: 'qaznedr-app',
          }) as any;
        } catch (error) {
          console.error('JWT verification failed:', error);
          return null;
        }
      },
    },
    session: {
      strategy: 'jwt' as const,
      maxAge: 15 * 60, // 15 minutes
      updateAge: 5 * 60, // Update every 5 minutes
    },
    // Security-focused cookie settings
    cookies: {
      sessionToken: {
        name: '__Secure-next-auth.session-token',
        options: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict' as const,
          path: '/',
        },
      },
    },
    // Additional security headers
    useSecureCookies: process.env.NODE_ENV === 'production',
  };
}

// Export for testing
export { calculateEntropy, hasWeakPatterns };
