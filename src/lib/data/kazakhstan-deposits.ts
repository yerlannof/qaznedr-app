import type { KazakhstanDeposit } from '../types/listing';

export const kazakhstanDeposits: KazakhstanDeposit[] = [
  // Лицензия на добычу
  {
    id: '1',
    title: 'Лицензия на добычу нефти "Кашаган"',
    description:
      'Лицензия на разработку крупнейшего нефтяного месторождения в Каспийском море. Запасы: 6.4 млрд баррелей нефти. Развитая инфраструктура добычи и транспортировки.',
    type: 'MINING_LICENSE',
    mineral: 'Нефть',
    region: 'Мангистауская',
    city: 'Атырау',
    area: 2500,
    price: 1500000000000, // 1.5 трлн тенге
    coordinates: [46.2644, 51.9606],
    verified: true,
    featured: true,
    views: 1247,
    status: 'ACTIVE',
    images: ['/images/deposits/kashagan.jpg'],
    documents: ['license.pdf', 'geological-survey.pdf'],
    userId: '1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    // Специфичные поля для лицензии на добычу
    licenseSubtype: 'EXTRACTION_RIGHT',
    licenseNumber: 'KZ-OIL-2024-001',
    licenseExpiry: new Date('2044-01-15'),
    annualProductionLimit: 45000000, // баррелей в год
  },
  // Лицензия на разведку
  {
    id: '2',
    title: 'Лицензия на разведку газового месторождения "Сарыарка"',
    description:
      'Лицензия на геологическую разведку перспективного газоконденсатного месторождения. Предварительные данные указывают на значительные запасы природного газа.',
    type: 'EXPLORATION_LICENSE',
    mineral: 'Газ',
    region: 'Западно-Казахстанская',
    city: 'Аксай',
    area: 1800,
    price: 450000000000, // 450 млрд тенге
    coordinates: [51.1655, 53.3006],
    verified: true,
    featured: false,
    views: 892,
    status: 'ACTIVE',
    images: ['/images/deposits/saryarka-exploration.jpg'],
    documents: ['exploration-license.pdf', 'geological-preliminary.pdf'],
    userId: '2',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    // Специфичные поля для лицензии на разведку
    explorationStage: 'DETAILED',
    explorationPeriod: {
      start: new Date('2024-02-01'),
      end: new Date('2027-02-01'),
    },
    explorationBudget: 85000000000, // 85 млрд тенге
  },
  // Информация о рудопроявлении
  {
    id: '3',
    title: 'Информация о рудопроявлении нефти "Тенгиз"',
    description:
      'Крупнейшее месторождение нефти в Казахстане. Запасы: 25-26 млрд баррелей. Действующая добыча с момента открытия в 1979 году.',
    type: 'MINERAL_OCCURRENCE',
    mineral: 'Нефть',
    region: 'Атырауская',
    city: 'Атырау',
    area: 2100,
    price: 1800000000000, // 1.8 трлн тенге
    coordinates: [46.85, 52.8667],
    verified: true,
    featured: true,
    views: 1156,
    status: 'ACTIVE',
    images: ['/images/deposits/tengiz.jpg'],
    documents: ['license.pdf', 'production-data.pdf'],
    userId: '3',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-20'),
    // Специфичные поля для рудопроявления
    discoveryDate: new Date('1979-06-15'),
    geologicalConfidence: 'MEASURED',
    estimatedReserves: 25000000000, // баррелей
    accessibilityRating: 'EASY',
  },
  // Лицензия на добычу
  {
    id: '4',
    title: 'Лицензия на добычу меди "Жезказган"',
    description:
      'Крупнейший медный комплекс Казахстана. Запасы меди: 8.7 млн тонн. Включает рудники, обогатительные фабрики и металлургический завод.',
    type: 'MINING_LICENSE',
    mineral: 'Медь',
    region: 'Карагандинская',
    city: 'Жезказган',
    area: 450,
    price: 890000000000, // 890 млрд тенге
    coordinates: [47.7833, 67.7167],
    verified: true,
    featured: false,
    views: 743,
    status: 'ACTIVE',
    images: ['/images/deposits/zhezkazgan.jpg'],
    documents: ['license.pdf', 'mining-permit.pdf'],
    userId: '4',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-18'),
    // Специфичные поля для лицензии на добычу
    licenseSubtype: 'COMBINED_RIGHT',
    licenseNumber: 'KZ-CU-2024-004',
    licenseExpiry: new Date('2039-01-12'),
    annualProductionLimit: 8700000, // тонн в год
  },
  // Информация о рудопроявлении
  {
    id: '5',
    title: 'Информация о рудопроявлении угля "Экибастуз"',
    description:
      'Крупнейший угольный бассейн Казахстана. Запасы: 12.5 млрд тонн каменного угля. Открытая разработка с высокой производительностью.',
    type: 'MINERAL_OCCURRENCE',
    mineral: 'Уголь',
    region: 'Павлодарская',
    city: 'Экибастуз',
    area: 1200,
    price: 650000000000, // 650 млрд тенге
    coordinates: [51.7667, 75.3167],
    verified: true,
    featured: false,
    views: 567,
    status: 'ACTIVE',
    images: ['/images/deposits/ekibastuz.jpg'],
    documents: ['license.pdf', 'environmental-impact.pdf'],
    userId: '5',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15'),
    // Специфичные поля для рудопроявления
    discoveryDate: new Date('1955-03-10'),
    geologicalConfidence: 'MEASURED',
    estimatedReserves: 12500000000, // тонн
    accessibilityRating: 'EASY',
  },
  // Лицензия на разведку
  {
    id: '6',
    title: 'Лицензия на разведку золота "Васильковское"',
    description:
      'Перспективное золоторудное месторождение. Запасы золота: 342 тонны. Современные технологии добычи и переработки.',
    type: 'EXPLORATION_LICENSE',
    mineral: 'Золото',
    region: 'Акмолинская',
    city: 'Кокшетау',
    area: 156,
    price: 420000000000, // 420 млрд тенге
    coordinates: [53.2833, 69.3833],
    verified: true,
    featured: false,
    views: 456,
    status: 'ACTIVE',
    images: ['/images/deposits/vasilkovskoe.jpg'],
    documents: ['license.pdf', 'geological-report.pdf'],
    userId: '6',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-17'),
    // Специфичные поля для лицензии на разведку
    explorationStage: 'FEASIBILITY',
    explorationPeriod: {
      start: new Date('2024-02-01'),
      end: new Date('2026-02-01'),
    },
    explorationBudget: 65000000000, // 65 млрд тенге
  },
  // Лицензия на добычу
  {
    id: '7',
    title: 'Лицензия на добычу урана "Инкай"',
    description:
      'Одно из крупнейших урановых месторождений мира. Запасы урана: 280,000 тонн. Метод подземного выщелачивания.',
    type: 'MINING_LICENSE',
    mineral: 'Уран',
    region: 'Кызылординская',
    city: 'Кызылорда',
    area: 78,
    price: 750000000000, // 750 млрд тенге
    coordinates: [44.85, 65.5],
    verified: true,
    featured: true,
    views: 823,
    status: 'ACTIVE',
    images: ['/images/deposits/inkai.jpg'],
    documents: ['license.pdf', 'radiation-safety.pdf'],
    userId: '7',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-19'),
    // Специфичные поля для лицензии на добычу
    licenseSubtype: 'EXTRACTION_RIGHT',
    licenseNumber: 'KZ-U-2024-007',
    licenseExpiry: new Date('2040-01-01'),
    annualProductionLimit: 280000, // тонн в год
  },
  // Информация о рудопроявлении
  {
    id: '8',
    title: 'Информация о рудопроявлении железа "Соколовско-Сарбайское"',
    description:
      'Крупнейший железорудный комплекс. Запасы железной руды: 2.8 млрд тонн. Открытая и подземная разработка.',
    type: 'MINERAL_OCCURRENCE',
    mineral: 'Железо',
    region: 'Костанайская',
    city: 'Рудный',
    area: 890,
    price: 1200000000000, // 1.2 трлн тенге
    coordinates: [52.9667, 63.1167],
    verified: true,
    featured: false,
    views: 678,
    status: 'ACTIVE',
    images: ['/images/deposits/sokolovka.jpg'],
    documents: ['license.pdf', 'mining-plan.pdf'],
    userId: '8',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-16'),
    // Специфичные поля для рудопроявления
    discoveryDate: new Date('1949-08-15'),
    geologicalConfidence: 'MEASURED',
    estimatedReserves: 2800000000, // тонн
    accessibilityRating: 'MODERATE',
  },
  // Лицензия на разведку
  {
    id: '9',
    title: 'Лицензия на разведку газа "Амангельды"',
    description:
      'Перспективное газовое месторождение в Прикаспийском бассейне. Прогнозные запасы: 450 млрд м³ газа.',
    type: 'EXPLORATION_LICENSE',
    mineral: 'Газ',
    region: 'Мангистауская',
    city: 'Актау',
    area: 234,
    price: 380000000000, // 380 млрд тенге
    coordinates: [43.65, 51.1667],
    verified: false,
    featured: false,
    views: 345,
    status: 'PENDING',
    images: ['/images/deposits/amangeldy.jpg'],
    documents: ['exploration-license.pdf'],
    userId: '9',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-14'),
    // Специфичные поля для лицензии на разведку
    explorationStage: 'PRELIMINARY',
    explorationPeriod: {
      start: new Date('2024-03-01'),
      end: new Date('2027-03-01'),
    },
    explorationBudget: 95000000000, // 95 млрд тенге
  },
  // Лицензия на добычу
  {
    id: '10',
    title: 'Лицензия на добычу золота "Бакырчик"',
    description:
      'Крупное золоторудное месторождение. Запасы золота: 287 тонн. Современная обогатительная фабрика.',
    type: 'MINING_LICENSE',
    mineral: 'Золото',
    region: 'Восточно-Казахстанская',
    city: 'Усть-Каменогорск',
    area: 67,
    price: 290000000000, // 290 млрд тенге
    coordinates: [49.9833, 82.6167],
    verified: true,
    featured: false,
    views: 234,
    status: 'ACTIVE',
    images: ['/images/deposits/bakyrchik.jpg'],
    documents: ['license.pdf', 'ore-reserves.pdf'],
    userId: '10',
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-13'),
    // Специфичные поля для лицензии на добычу
    licenseSubtype: 'PROCESSING_RIGHT',
    licenseNumber: 'KZ-AU-2024-010',
    licenseExpiry: new Date('2035-01-06'),
    annualProductionLimit: 287, // тонн в год
  },
  // Информация о рудопроявлении
  {
    id: '11',
    title: 'Информация о рудопроявлении нефти "Узень"',
    description:
      'Крупное нефтяное месторождение на полуострове Мангышлак. Запасы нефти: 1.2 млрд баррелей.',
    type: 'MINERAL_OCCURRENCE',
    mineral: 'Нефть',
    region: 'Мангистауская',
    city: 'Жанаозен',
    area: 567,
    price: 580000000000, // 580 млрд тенге
    coordinates: [43.3429, 52.8581],
    verified: true,
    featured: false,
    views: 456,
    status: 'ACTIVE',
    images: ['/images/deposits/uzen.jpg'],
    documents: ['license.pdf', 'production-history.pdf'],
    userId: '11',
    createdAt: new Date('2024-01-07'),
    updatedAt: new Date('2024-01-21'),
    // Специфичные поля для рудопроявления
    discoveryDate: new Date('1965-04-20'),
    geologicalConfidence: 'INDICATED',
    estimatedReserves: 1200000000, // баррелей
    accessibilityRating: 'MODERATE',
  },
  // Лицензия на разведку
  {
    id: '12',
    title: 'Лицензия на разведку меди "Коунрад"',
    description:
      'Крупное медно-молибденовое месторождение. Запасы меди: 4.2 млн тонн. Открытая разработка.',
    type: 'EXPLORATION_LICENSE',
    mineral: 'Медь',
    region: 'Карагандинская',
    city: 'Балхаш',
    area: 234,
    price: 320000000000, // 320 млрд тенге
    coordinates: [46.85, 74.9833],
    verified: true,
    featured: false,
    views: 387,
    status: 'ACTIVE',
    images: ['/images/deposits/kounrad.jpg'],
    documents: ['license.pdf', 'feasibility-study.pdf'],
    userId: '12',
    createdAt: new Date('2024-01-09'),
    updatedAt: new Date('2024-01-22'),
    // Специфичные поля для лицензии на разведку
    explorationStage: 'ENVIRONMENTAL',
    explorationPeriod: {
      start: new Date('2024-01-15'),
      end: new Date('2026-01-15'),
    },
    explorationBudget: 75000000000, // 75 млрд тенге
  },
  // Лицензия на разведку
  {
    id: '13',
    title: 'Лицензия на разведку урана "Южный Инкай"',
    description:
      'Перспективное урановое месторождение. Прогнозные запасы урана: 45,000 тонн. Подготовка к разработке.',
    type: 'EXPLORATION_LICENSE',
    mineral: 'Уран',
    region: 'Кызылординская',
    city: 'Кызылорда',
    area: 45,
    price: 180000000000, // 180 млрд тенге
    coordinates: [44.7, 65.3],
    verified: false,
    featured: false,
    views: 123,
    status: 'PENDING',
    images: ['/images/deposits/south-inkai.jpg'],
    documents: ['exploration-contract.pdf'],
    userId: '13',
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11'),
    // Специфичные поля для лицензии на разведку
    explorationStage: 'PRELIMINARY',
    explorationPeriod: {
      start: new Date('2024-02-15'),
      end: new Date('2027-02-15'),
    },
    explorationBudget: 35000000000, // 35 млрд тенге
  },
  // Лицензия на добычу
  {
    id: '14',
    title: 'Лицензия на добычу газа "Имашевское"',
    description:
      'Газоконденсатное месторождение в Актюбинской области. Запасы газа: 89 млрд м³.',
    type: 'MINING_LICENSE',
    mineral: 'Газ',
    region: 'Актюбинская',
    city: 'Актобе',
    area: 156,
    price: 125000000000, // 125 млрд тенге
    coordinates: [50.2833, 57.1667],
    verified: true,
    featured: false,
    views: 267,
    status: 'ACTIVE',
    images: ['/images/deposits/imashevskoe.jpg'],
    documents: ['license.pdf', 'gas-analysis.pdf'],
    userId: '14',
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
    // Специфичные поля для лицензии на добычу
    licenseSubtype: 'EXTRACTION_RIGHT',
    licenseNumber: 'KZ-GAS-2024-014',
    licenseExpiry: new Date('2040-01-13'),
    annualProductionLimit: 89000000000, // м³ в год
  },
  // Информация о рудопроявлении
  {
    id: '15',
    title: 'Информация о рудопроявлении золота "Алтынтау"',
    description:
      'Золоторудное месторождение в Костанайской области. Запасы золота: 156 тонн. Планируемая разработка.',
    type: 'MINERAL_OCCURRENCE',
    mineral: 'Золото',
    region: 'Костанайская',
    city: 'Костанай',
    area: 89,
    price: 95000000000, // 95 млрд тенге
    coordinates: [53.2167, 63.6333],
    verified: false,
    featured: false,
    views: 178,
    status: 'PENDING',
    images: ['/images/deposits/altyntau.jpg'],
    documents: ['exploration-license.pdf'],
    userId: '15',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
    // Специфичные поля для рудопроявления
    discoveryDate: new Date('2020-09-12'),
    geologicalConfidence: 'INFERRED',
    estimatedReserves: 156, // тонн
    accessibilityRating: 'DIFFICULT',
  },
];

// Вспомогательные функции для работы с данными
export const getDepositsByRegion = (region: string) => {
  return kazakhstanDeposits.filter((deposit) => deposit.region === region);
};

export const getDepositsByMineral = (mineral: string) => {
  return kazakhstanDeposits.filter((deposit) => deposit.mineral === mineral);
};

export const getFeaturedDeposits = () => {
  return kazakhstanDeposits.filter((deposit) => deposit.featured);
};

export const getVerifiedDeposits = () => {
  return kazakhstanDeposits.filter((deposit) => deposit.verified);
};

export const getActiveDeposits = () => {
  return kazakhstanDeposits.filter((deposit) => deposit.status === 'ACTIVE');
};

export const searchDeposits = (query: string) => {
  const lowercaseQuery = query.toLowerCase();
  return kazakhstanDeposits.filter(
    (deposit) =>
      deposit.title.toLowerCase().includes(lowercaseQuery) ||
      deposit.description.toLowerCase().includes(lowercaseQuery) ||
      deposit.city.toLowerCase().includes(lowercaseQuery) ||
      deposit.region.toLowerCase().includes(lowercaseQuery) ||
      deposit.mineral.toLowerCase().includes(lowercaseQuery)
  );
};

export const sortDeposits = (
  deposits: KazakhstanDeposit[],
  sortBy: 'price' | 'area' | 'views' | 'createdAt',
  order: 'asc' | 'desc' = 'desc'
) => {
  return [...deposits].sort((a, b) => {
    let aValue: number | Date, bValue: number | Date;

    switch (sortBy) {
      case 'price':
        aValue = a.price || 0;
        bValue = b.price || 0;
        break;
      case 'area':
        aValue = a.area;
        bValue = b.area;
        break;
      case 'views':
        aValue = a.views;
        bValue = b.views;
        break;
      case 'createdAt':
        aValue = a.createdAt.getTime();
        bValue = b.createdAt.getTime();
        break;
      default:
        return 0;
    }

    if (order === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });
};

export const getDepositStats = () => {
  const total = kazakhstanDeposits.length;
  const verified = kazakhstanDeposits.filter((d) => d.verified).length;
  const featured = kazakhstanDeposits.filter((d) => d.featured).length;
  const active = kazakhstanDeposits.filter((d) => d.status === 'ACTIVE').length;

  const regions = new Set(kazakhstanDeposits.map((d) => d.region)).size;
  const minerals = new Set(kazakhstanDeposits.map((d) => d.mineral)).size;

  const totalValue = kazakhstanDeposits
    .filter((d) => d.price)
    .reduce((sum, d) => sum + (d.price || 0), 0);

  return {
    total,
    verified,
    featured,
    active,
    regions,
    minerals,
    totalValue,
  };
};
