import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';

const prisma = new PrismaClient();

// GET /api/favorites - получить избранные объявления пользователя
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        deposit: {
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
            _count: {
              select: {
                favorites: true,
                views_: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedFavorites = favorites.map((favorite) => ({
      id: favorite.id,
      createdAt: favorite.createdAt,
      deposit: {
        ...favorite.deposit,
        coordinates: JSON.parse(favorite.deposit.coordinates),
        images: JSON.parse(favorite.deposit.images),
        documents: JSON.parse(favorite.deposit.documents),
        favoritesCount: favorite.deposit._count.favorites,
        viewsCount: favorite.deposit._count.views_,
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedFavorites,
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

// POST /api/favorites - добавить в избранное
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const { depositId } = await request.json();

    if (!depositId) {
      return NextResponse.json(
        { success: false, error: 'depositId is required' },
        { status: 400 }
      );
    }

    // Проверяем, что объявление существует
    const deposit = await prisma.kazakhstanDeposit.findUnique({
      where: { id: depositId },
    });

    if (!deposit) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Создаем избранное (используем upsert для предотвращения дублирования)
    const favorite = await prisma.favorite.upsert({
      where: {
        userId_depositId: {
          userId: user.id,
          depositId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        depositId,
      },
    });

    return NextResponse.json({
      success: true,
      data: favorite,
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add to favorites' },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - удалить из избранного
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const { depositId } = await request.json();

    if (!depositId) {
      return NextResponse.json(
        { success: false, error: 'depositId is required' },
        { status: 400 }
      );
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: user.id,
        depositId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Removed from favorites',
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove from favorites' },
      { status: 500 }
    );
  }
}
