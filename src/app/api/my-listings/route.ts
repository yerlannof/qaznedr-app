import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // 'ACTIVE', 'PENDING', 'SOLD'

    const skip = (page - 1) * limit;

    // Фильтр по статусу
    const where: { ownerId: string; status?: string } = {
      ownerId: session.user.id,
    };
    if (status) {
      where.status = status;
    }

    // Получение объявлений пользователя
    const [deposits, total] = await Promise.all([
      prisma.kazakhstanDeposit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          mineral: true,
          region: true,
          city: true,
          price: true,
          area: true,
          coordinates: true,
          status: true,
          verified: true,
          featured: true,
          views: true,
          images: true,
          documents: true,
          createdAt: true,
          updatedAt: true,
          // Type-specific fields
          licenseSubtype: true,
          licenseNumber: true,
          licenseExpiry: true,
          annualProductionLimit: true,
          explorationStage: true,
          explorationStart: true,
          explorationEnd: true,
          explorationBudget: true,
          discoveryDate: true,
          geologicalConfidence: true,
          estimatedReserves: true,
        },
      }),
      prisma.kazakhstanDeposit.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Преобразование данных для фронтенда
    const formattedDeposits = deposits.map((deposit) => ({
      ...deposit,
      coordinates: JSON.parse(deposit.coordinates as string),
      images: JSON.parse(deposit.images as string),
      documents: JSON.parse(deposit.documents as string),
      price: deposit.price ? parseFloat(deposit.price.toString()) : null,
      area: parseFloat(deposit.area.toString()),
      annualProductionLimit: deposit.annualProductionLimit
        ? parseFloat(deposit.annualProductionLimit.toString())
        : null,
      explorationBudget: deposit.explorationBudget
        ? parseFloat(deposit.explorationBudget.toString())
        : null,
      estimatedReserves: deposit.estimatedReserves
        ? parseFloat(deposit.estimatedReserves.toString())
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        deposits: formattedDeposits,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user listings:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
