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

// Compared against when the email is not an admin, so a miss costs the same
// time as a wrong password and does not reveal which emails are admins.
const DUMMY_HASH =
  '$2b$12$vCxKVHxkUmUhRGj/2tgmhOgtzgdJtA0.nbRqRq4cjRO3OfiYy9zgu';

export async function verifyEnvAdmin(
  email: string,
  password: string,
  env: { emails?: string; hash?: string } = {
    emails: process.env.ADMIN_EMAILS,
    hash: process.env.ADMIN_PASSWORD_HASH,
  },
  clientIp = 'unknown'
): Promise<{ id: string; email: string; name: string; image: null } | null> {
  const normalized = email.trim().toLowerCase();
  // Keyed by IP + email: knowing the owner's email is not enough to lock them out.
  if (!attempts(`${clientIp}|${normalized}`)) return null;
  const isAdmin = Boolean(env.hash) && isEnvAdminEmail(normalized, env.emails);
  const ok = await bcrypt.compare(
    password,
    isAdmin ? (env.hash as string) : DUMMY_HASH
  );
  return isAdmin && ok
    ? {
        id: `env-admin:${normalized}`,
        email: normalized,
        name: 'Admin',
        image: null,
      }
    : null;
}
