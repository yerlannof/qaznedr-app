import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';
import { getListingsCache, revalidateListings } from '@/lib/cache';
import { prisma } from '@/lib/prisma';
import type { SearchParams, RegionType, MineralType } from '@/lib/types/listing';

// GET /api/listings - получить все объявления с пагинацией и фильтрацией (с кэшированием)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Построение параметров запроса
    const params: SearchParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '12'),
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      query: searchParams.get('query') || undefined,
      filters: {
        region: searchParams.get('region') ? [searchParams.get('region')! as RegionType] : undefined,
        mineral: searchParams.get('mineral') ? [searchParams.get('mineral')! as MineralType] : undefined,
        type: searchParams.get('type') ? [searchParams.get('type')! as any] : undefined,
        verified: searchParams.get('verified') ? searchParams.get('verified') === 'true' : undefined,
        featured: searchParams.get('featured') ? searchParams.get('featured') === 'true' : undefined,
        priceMin: searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin')!) : undefined,
        priceMax: searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!) : undefined,
        areaMin: searchParams.get('areaMin') ? parseInt(searchParams.get('areaMin')!) : undefined,
        areaMax: searchParams.get('areaMax') ? parseInt(searchParams.get('areaMax')!) : undefined,
      },
    };

    // Используем кэшированную функцию
    const result = await getListingsCache(params);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

// POST /api/listings - создать новое объявление
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

    const body = await request.json();

    // Валидация обязательных полей
    const requiredFields = [
      'title',
      'description',
      'type',
      'mineral',
      'region',
      'city',
      'area',
      'coordinates',
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Field ${field} is required` },
          { status: 400 }
        );
      }
    }

    const newDeposit = await prisma.kazakhstanDeposit.create({
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        mineral: body.mineral,
        region: body.region,
        city: body.city,
        area: parseFloat(body.area),
        price: body.price ? parseFloat(body.price) : null,
        coordinates: JSON.stringify(body.coordinates),
        images: JSON.stringify(body.images || []),
        documents: JSON.stringify(body.documents || []),
        verified: false, // по умолчанию требует проверки
        featured: false,
        status: 'DRAFT', // сначала черновик
        userId: user.id,

        // Условные поля в зависимости от типа
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

    // Инвалидируем кэш после создания нового объявления
    revalidateListings();

    return NextResponse.json({
      success: true,
      data: {
        ...newDeposit,
        coordinates: JSON.parse(newDeposit.coordinates),
        images: JSON.parse(newDeposit.images),
        documents: JSON.parse(newDeposit.documents),
      },
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
