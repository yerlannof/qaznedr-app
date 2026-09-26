import bcrypt from 'bcryptjs';
import { createThrottle } from '@/lib/inquiries/throttle';

// Owner login without a users table: ADMIN_EMAILS + ADMIN_PASSWORD_HASH (bcrypt).
const attempts = createThrottle({ limit: 10, windowMs: 15 * 60 * 1000 });

export function isEnvAdminEmail(
  email?: string | null,
  raw: string | undefined = process.env.ADMIN_EMAILS
): boolean {
  if (!email) return false;
  const list = (raw ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

export async function verifyEnvAdmin(
  email: string,
  password: string,
  env: { emails?: string; hash?: string } = {
    emails: process.env.ADMIN_EMAILS,
    hash: process.env.ADMIN_PASSWORD_HASH,
  }
): Promise<{ id: string; email: string; name: string; image: null } | null> {
  const normalized = email.trim().toLowerCase();
  if (!env.hash || !isEnvAdminEmail(normalized, env.emails)) return null;
  if (!attempts(normalized)) return null;
  const ok = await bcrypt.compare(password, env.hash);
  return ok
    ? {
        id: `env-admin:${normalized}`,
        email: normalized,
        name: 'Admin',
        image: null,
      }
    : null;
}
