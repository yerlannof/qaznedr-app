import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { registerSchema, validateRequest } from '@/lib/validations/api';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const prisma = getPrisma();
  try {
    const body = await request.json();

    // Validate request data with zod
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

    const { email, password, name } = validation.data;

    // Check if user already exists
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

    // Create the user
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

    return NextResponse.json(
      { message: 'User created successfully', user },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
