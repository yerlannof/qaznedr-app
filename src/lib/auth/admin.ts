import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';
import { createServiceClient } from '@/lib/supabase/server';

export type AdminRole = 'user' | 'admin' | 'super_admin';

export interface AdminContext {
  userId: string;
  email: string | null;
  role: AdminRole;
}

/**
 * Resolve current admin context from NextAuth session + Supabase profile.
 * Returns null if not authenticated or profile missing.
 */
export async function getCurrentAdmin(): Promise<AdminContext | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const userId = (session.user as any).id as string | undefined;
  if (!userId) return null;

  try {
    const supabase = await createServiceClient();
    const { data } = (await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()) as { data: { role: string } | null };

    const role = (data?.role ?? 'user') as AdminRole;
    return {
      userId,
      email: session.user.email ?? null,
      role,
    };
  } catch {
    return null;
  }
}

export function isAdminRole(role: AdminRole | undefined): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Returns AdminContext if user is admin or super_admin, else null.
 * Use in API routes — caller should return 403 if null.
 */
export async function requireAdmin(): Promise<AdminContext | null> {
  const admin = await getCurrentAdmin();
  if (!admin || !isAdminRole(admin.role)) return null;
  return admin;
}

/**
 * Returns AdminContext only for super_admin role, else null.
 */
export async function requireSuperAdmin(): Promise<AdminContext | null> {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== 'super_admin') return null;
  return admin;
}

/**
 * Standard 403 response for failed admin checks.
 */
export function forbidden(reason = 'Forbidden') {
  return NextResponse.json({ success: false, error: reason }, { status: 403 });
}

/**
 * Standard 401 response for unauthenticated requests.
 */
export function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}
