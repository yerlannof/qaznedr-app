import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { registerSchema, validateRequest } from '@/lib/validations/api';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const prisma = getPrisma();
  try {
    const body = await request.json();

    const validation = validateRequest(body, registerSchema);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid registration data',
          details: validation.errors.flatten(),
        },
        { status: 400 }
      );
    }

    const { email, password, name, profileType } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (profileType) {
      try {
        const supabase = await createServiceClient();

        // First registered user becomes super_admin (platform owner bootstrap)
        const { count } = await (supabase as any)
          .from('profiles')
          .select('id', { count: 'exact', head: true });
        const isFirstUser = count === 0;

        await (supabase as any).from('profiles').upsert(
          {
            id: user.id,
            full_name: name || email.split('@')[0],
            email,
            profile_type: profileType,
            role: isFirstUser ? 'super_admin' : 'user',
          },
          { onConflict: 'id' }
        );
      } catch {
        // Profile creation is best-effort; user can complete setup later
      }
    }

    return NextResponse.json(
      {
        message: 'User created successfully',
        user,
        profileSetupComplete: Boolean(profileType),
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
