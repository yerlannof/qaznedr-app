import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';

const prisma = new PrismaClient();

// GET /api/listings/[id] - получить конкретное объявление
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deposit = await prisma.kazakhstanDeposit.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            phone: true,
            verified: true,
          },
        },
        documents_: {
          select: {
            id: true,
            name: true,
            type: true,
            url: true,
            size: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            favorites: true,
            views_: true,
          },
        },
      },
    });

    if (!deposit) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Увеличиваем счетчик просмотров
    await prisma.kazakhstanDeposit.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    // Записываем просмотр в историю
    const session = await getServerSession(authOptions);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : '127.0.0.1';

    let userId = null;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      userId = user?.id || null;
    }

    await prisma.view.create({
      data: {
        depositId: id,
        userId,
        ipAddress,
        userAgent,
      },
    });

    const formattedDeposit = {
      ...deposit,
      coordinates: JSON.parse(deposit.coordinates),
      images: JSON.parse(deposit.images),
      documents: JSON.parse(deposit.documents),
      favoritesCount: deposit._count.favorites,
      viewsCount: deposit._count.views_,
    };

    return NextResponse.json({
      success: true,
      data: formattedDeposit,
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
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
    console.error('Error updating listing:', error);
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
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}
