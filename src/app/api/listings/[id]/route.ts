import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';
import { createClient } from '@/lib/supabase/server';
import { transformDepositFromDB } from '@/lib/listings/transform';

export const dynamic = 'force-dynamic';

// GET /api/listings/[id] - получить конкретное объявление
// Reads from Supabase (system of record) using the same transform as the catalog
// route, so the detail page never drifts from the listing grid.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from('kazakhstan_deposits')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !row) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Only publicly-visible (ACTIVE) listings are exposed via this endpoint.
    if ((row as any).status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Best-effort view counter — never block the response on it.
    void (supabase.from('kazakhstan_deposits') as any)
      .update({ views: (Number((row as any).views) || 0) + 1 })
      .eq('id', id)
      .then(() => {});

    return NextResponse.json({
      success: true,
      data: transformDepositFromDB(row),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

// PUT /api/listings/[id] - обновить объявление
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Проверяем, что пользователь - владелец объявления
    const existingDeposit = await prisma.kazakhstanDeposit.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingDeposit) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (existingDeposit.user.email !== session.user.email) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    const updatedDeposit = await prisma.kazakhstanDeposit.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        mineral: body.mineral,
        region: body.region,
        city: body.city,
        area: body.area ? parseFloat(body.area) : undefined,
        price: body.price ? parseFloat(body.price) : null,
        coordinates: body.coordinates
          ? JSON.stringify(body.coordinates)
          : undefined,
        images: body.images ? JSON.stringify(body.images) : undefined,
        documents: body.documents ? JSON.stringify(body.documents) : undefined,
        status: body.status,

        // Условные поля
        licenseSubtype: body.licenseSubtype,
        licenseNumber: body.licenseNumber,
        licenseExpiry: body.licenseExpiry ? new Date(body.licenseExpiry) : null,
        annualProductionLimit: body.annualProductionLimit
          ? parseFloat(body.annualProductionLimit)
          : null,

        explorationStage: body.explorationStage,
        explorationStart: body.explorationStart
          ? new Date(body.explorationStart)
          : null,
        explorationEnd: body.explorationEnd
          ? new Date(body.explorationEnd)
          : null,
        explorationBudget: body.explorationBudget
          ? parseFloat(body.explorationBudget)
          : null,

        discoveryDate: body.discoveryDate ? new Date(body.discoveryDate) : null,
        geologicalConfidence: body.geologicalConfidence,
        estimatedReserves: body.estimatedReserves
          ? parseFloat(body.estimatedReserves)
          : null,
        accessibilityRating: body.accessibilityRating,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            verified: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedDeposit,
        coordinates: JSON.parse(updatedDeposit.coordinates),
        images: JSON.parse(updatedDeposit.images),
        documents: JSON.parse(updatedDeposit.documents),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

// DELETE /api/listings/[id] - удалить объявление
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Проверяем владельца
    const existingDeposit = await prisma.kazakhstanDeposit.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingDeposit) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (existingDeposit.user.email !== session.user.email) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    await prisma.kazakhstanDeposit.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}
