import { PrismaClient } from '@prisma/client';
import { kazakhstanDeposits } from '../src/lib/data/kazakhstan-deposits';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Создаем тестового пользователя
  const testUser = await prisma.user.upsert({
    where: { email: 'test@qaznedr.kz' },
    update: {},
    create: {
      email: 'test@qaznedr.kz',
      name: 'Тестовый Пользователь',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'SELLER',
      company: 'Қазнедр Тест ЖШС',
      phone: '+7 700 123 4567',
      verified: true,
    },
  });

  console.log(`✅ Created test user: ${testUser.email}`);

  // Заполняем месторождения из mock данных
  let createdCount = 0;
  for (const deposit of kazakhstanDeposits) {
    try {
      const createdDeposit = await prisma.kazakhstanDeposit.create({
        data: {
          id: deposit.id,
          title: deposit.title,
          description: deposit.description,
          type: deposit.type,
          mineral: deposit.mineral,
          region: deposit.region,
          city: deposit.city,
          area: deposit.area,
          price: deposit.price,
          coordinates: JSON.stringify(deposit.coordinates),
          verified: deposit.verified,
          featured: deposit.featured,
          views: deposit.views,
          status: deposit.status,
          images: JSON.stringify(deposit.images),
          documents: JSON.stringify(deposit.documents),
          userId: testUser.id,

          // Условные поля в зависимости от типа
          licenseSubtype: deposit.licenseSubtype,
          licenseNumber: deposit.licenseNumber,
          licenseExpiry: deposit.licenseExpiry,
          annualProductionLimit: deposit.annualProductionLimit,

          explorationStage: deposit.explorationStage,
          explorationStart: deposit.explorationPeriod?.start,
          explorationEnd: deposit.explorationPeriod?.end,
          explorationBudget: deposit.explorationBudget,

          discoveryDate: deposit.discoveryDate,
          geologicalConfidence: deposit.geologicalConfidence,
          estimatedReserves: deposit.estimatedReserves,
          accessibilityRating: deposit.accessibilityRating,

          createdAt: deposit.createdAt,
          updatedAt: deposit.updatedAt,
        },
      });

      createdCount++;
      console.log(`📍 Created deposit: ${createdDeposit.title}`);
    } catch (error) {
      console.error(`❌ Failed to create deposit ${deposit.title}:`, error);
    }
  }

  console.log(`✅ Successfully created ${createdCount} deposits`);

  // Создаем несколько тестовых избранных
  const favoritePromises = [
    prisma.favorite.upsert({
      where: {
        userId_depositId: {
          userId: testUser.id,
          depositId: kazakhstanDeposits[0].id,
        },
      },
      update: {},
      create: { userId: testUser.id, depositId: kazakhstanDeposits[0].id },
    }),
    prisma.favorite.upsert({
      where: {
        userId_depositId: {
          userId: testUser.id,
          depositId: kazakhstanDeposits[1].id,
        },
      },
      update: {},
      create: { userId: testUser.id, depositId: kazakhstanDeposits[1].id },
    }),
    prisma.favorite.upsert({
      where: {
        userId_depositId: {
          userId: testUser.id,
          depositId: kazakhstanDeposits[2].id,
        },
      },
      update: {},
      create: { userId: testUser.id, depositId: kazakhstanDeposits[2].id },
    }),
  ];

  await Promise.all(favoritePromises);

  console.log(`✅ Created 3 favorite entries`);

  // Создаем тестовые просмотры
  const sampleViews = await prisma.view.createMany({
    data: kazakhstanDeposits.slice(0, 5).map((deposit, index) => ({
      depositId: deposit.id,
      userId: Math.random() > 0.5 ? testUser.id : null,
      ipAddress: `192.168.1.${100 + index}`,
      userAgent: 'Mozilla/5.0 (Test Browser)',
    })),
  });

  console.log(`✅ Created ${sampleViews.count} view entries`);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
