/** @jest-environment node */
import jwt from 'jsonwebtoken';
import {
  ADMIN_SESSION_SECONDS,
  USER_SESSION_SECONDS,
  getSecureAuthConfig,
} from '@/lib/auth/jwt-security';

const SECRET = 'k9#Vq2!mZ7$wR4^tY8&uP1*xN5@bL3%cH6';
process.env.NEXTAUTH_SECRET = SECRET;

describe('session config', () => {
  const config = getSecureAuthConfig();

  it('uses a lax cookie so a fresh Google sign-in is visible on the next page', () => {
    expect(config.cookies.sessionToken.options.sameSite).toBe('lax');
    // Tests do not run as production: no __Secure- prefix on plain http.
    expect(config.cookies.sessionToken.name).toBe('next-auth.session-token');
    expect(config.session.maxAge).toBe(USER_SESSION_SECONDS);
  });

  async function lifetime(token: Record<string, unknown>) {
    const encoded = await config.jwt.encode({ secret: SECRET, token });
    const payload = jwt.decode(encoded) as { exp: number; iat: number };
    return payload.exp - payload.iat;
  }

  it('keeps marketplace users signed in for 30 days', async () => {
    expect(
      await lifetime({ sub: 'b1c2', iat: Math.floor(Date.now() / 1000) })
    ).toBe(USER_SESSION_SECONDS);
  });

  it('keeps the env admin session short', async () => {
    expect(
      await lifetime({
        sub: 'env-admin:owner@example.invalid',
        iat: Math.floor(Date.now() / 1000),
      })
    ).toBe(ADMIN_SESSION_SECONDS);
  });

  it('re-encodes a decoded token that already carries exp', async () => {
    const first = await config.jwt.encode({
      secret: SECRET,
      token: { sub: 'u1' },
    });
    const decoded = await config.jwt.decode({ secret: SECRET, token: first });
    expect(decoded).toMatchObject({ sub: 'u1' });
    await expect(
      config.jwt.encode({ secret: SECRET, token: decoded })
    ).resolves.toEqual(expect.any(String));
  });
});
