/**
 * Система верификации и доверия компаний
 *
 * Компании могут подтвердить свои сертификаты, лицензии и опыт.
 * Чем больше подтверждённых данных — тем выше уровень доверия.
 * Используется для фильтрации, сортировки и бейджей в каталоге.
 */

// ─────────────────────────────────────────────
// Сертификаты и лицензии
// ─────────────────────────────────────────────

export interface Certification {
  id: string;
  name: { ru: string; kz: string; en: string; zh: string };
  category: 'iso' | 'state' | 'industry' | 'professional';
  description: { ru: string; en: string };
}

export const CERTIFICATIONS: Certification[] = [
  // ISO стандарты
  {
    id: 'iso-9001',
    name: {
      ru: 'ISO 9001 — Менеджмент качества',
      kz: 'ISO 9001 — Сапа менеджменті',
      en: 'ISO 9001 — Quality Management',
      zh: 'ISO 9001 — 质量管理',
    },
    category: 'iso',
    description: {
      ru: 'Международный стандарт системы менеджмента качества',
      en: 'International quality management system standard',
    },
  },
  {
    id: 'iso-14001',
    name: {
      ru: 'ISO 14001 — Экологический менеджмент',
      kz: 'ISO 14001 — Экологиялық менеджмент',
      en: 'ISO 14001 — Environmental Management',
      zh: 'ISO 14001 — 环境管理',
    },
    category: 'iso',
    description: {
      ru: 'Международный стандарт экологического менеджмента',
      en: 'International environmental management standard',
    },
  },
  {
    id: 'iso-45001',
    name: {
      ru: 'ISO 45001 — Охрана труда и безопасность',
      kz: 'ISO 45001 — Еңбекті қорғау және қауіпсіздік',
      en: 'ISO 45001 — Occupational Health & Safety',
      zh: 'ISO 45001 — 职业健康安全',
    },
    category: 'iso',
    description: {
      ru: 'Международный стандарт охраны труда и безопасности',
      en: 'International occupational health and safety standard',
    },
  },

  // Государственные лицензии РК
  {
    id: 'geological-license-kz',
    name: {
      ru: 'Лицензия на геологоразведку (РК)',
      kz: 'Геологиялық барлау лицензиясы (ҚР)',
      en: 'Geological Exploration License (KZ)',
      zh: '地质勘探许可证（哈萨克斯坦）',
    },
    category: 'state',
    description: {
      ru: 'Государственная лицензия на право проведения геологоразведочных работ в Казахстане',
      en: 'State license for geological exploration in Kazakhstan',
    },
  },
  {
    id: 'mining-license-kz',
    name: {
      ru: 'Лицензия на добычу (РК)',
      kz: 'Өндіру лицензиясы (ҚР)',
      en: 'Mining License (KZ)',
      zh: '采矿许可证（哈萨克斯坦）',
    },
    category: 'state',
    description: {
      ru: 'Государственная лицензия на право добычи полезных ископаемых',
      en: 'State license for mineral extraction',
    },
  },
  {
    id: 'building-license-kz',
    name: {
      ru: 'Строительная лицензия (РК)',
      kz: 'Құрылыс лицензиясы (ҚР)',
      en: 'Construction License (KZ)',
      zh: '建筑许可证（哈萨克斯坦）',
    },
    category: 'state',
    description: {
      ru: 'Лицензия на строительно-монтажные работы',
      en: 'License for construction and installation work',
    },
  },
  {
    id: 'environmental-permit-kz',
    name: {
      ru: 'Экологическое разрешение (РК)',
      kz: 'Экологиялық рұқсат (ҚР)',
      en: 'Environmental Permit (KZ)',
      zh: '环境许可证（哈萨克斯坦）',
    },
    category: 'state',
    description: {
      ru: 'Разрешение на эмиссии в окружающую среду',
      en: 'Environmental emissions permit',
    },
  },

  // Отраслевые сертификаты
  {
    id: 'jorc-competent',
    name: {
      ru: 'Компетентное лицо JORC',
      kz: 'JORC құзыретті тұлға',
      en: 'JORC Competent Person',
      zh: 'JORC合格人员',
    },
    category: 'professional',
    description: {
      ru: 'Специалист, аккредитованный для оценки запасов по международному стандарту JORC',
      en: 'Professional accredited for resource estimation under JORC standard',
    },
  },
  {
    id: 'kazrc-competent',
    name: {
      ru: 'Компетентное лицо KAZRC',
      kz: 'KAZRC құзыретті тұлға',
      en: 'KAZRC Competent Person',
      zh: 'KAZRC合格人员',
    },
    category: 'professional',
    description: {
      ru: 'Специалист по Казахстанскому кодексу отчётности о запасах',
      en: 'Professional under Kazakhstan Resource Classification code',
    },
  },
  {
    id: 'sro-member',
    name: {
      ru: 'Член СРО',
      kz: 'ӨРҰ мүшесі',
      en: 'SRO Member',
      zh: '自律组织成员',
    },
    category: 'industry',
    description: {
      ru: 'Членство в саморегулируемой организации',
      en: 'Self-regulatory organization membership',
    },
  },
  {
    id: 'insurance-coverage',
    name: {
      ru: 'Страхование ответственности',
      kz: 'Жауапкершілікті сақтандыру',
      en: 'Liability Insurance',
      zh: '责任保险',
    },
    category: 'industry',
    description: {
      ru: 'Страхование профессиональной ответственности и гражданской ответственности',
      en: 'Professional and civil liability insurance coverage',
    },
  },
];

// ─────────────────────────────────────────────
// Уровни доверия
// ─────────────────────────────────────────────

export interface TrustLevel {
  id: string;
  name: { ru: string; kz: string; en: string; zh: string };
  minPoints: number;
  badge: 'none' | 'basic' | 'verified' | 'trusted' | 'premium';
  color: string; // Tailwind class for badge
}

export const TRUST_LEVELS: TrustLevel[] = [
  {
    id: 'new',
    name: {
      ru: 'Новая компания',
      kz: 'Жаңа компания',
      en: 'New Company',
      zh: '新公司',
    },
    minPoints: 0,
    badge: 'none',
    color: 'default',
  },
  {
    id: 'basic',
    name: {
      ru: 'Базовый профиль',
      kz: 'Базалық профиль',
      en: 'Basic Profile',
      zh: '基础档案',
    },
    minPoints: 20,
    badge: 'basic',
    color: 'default',
  },
  {
    id: 'verified',
    name: {
      ru: 'Проверенная компания',
      kz: 'Тексерілген компания',
      en: 'Verified Company',
      zh: '已验证公司',
    },
    minPoints: 50,
    badge: 'verified',
    color: 'blue',
  },
  {
    id: 'trusted',
    name: {
      ru: 'Надёжный партнёр',
      kz: 'Сенімді серіктес',
      en: 'Trusted Partner',
      zh: '可信赖合作伙伴',
    },
    minPoints: 80,
    badge: 'trusted',
    color: 'success',
  },
  {
    id: 'premium',
    name: {
      ru: 'Премиум партнёр',
      kz: 'Премиум серіктес',
      en: 'Premium Partner',
      zh: '高级合作伙伴',
    },
    minPoints: 100,
    badge: 'premium',
    color: 'warning', // gold-ish
  },
];

// ─────────────────────────────────────────────
// Критерии начисления баллов доверия
// ─────────────────────────────────────────────

export interface TrustCriterion {
  id: string;
  name: { ru: string; en: string };
  points: number;
  category: 'profile' | 'certification' | 'activity' | 'reputation';
  verifiable: boolean; // Нужна ли модерация
}

export const TRUST_CRITERIA: TrustCriterion[] = [
  // Профиль компании
  {
    id: 'profile-complete',
    name: {
      ru: 'Заполненный профиль (описание, контакты, адрес)',
      en: 'Complete profile',
    },
    points: 10,
    category: 'profile',
    verifiable: false,
  },
  {
    id: 'logo-uploaded',
    name: { ru: 'Загружен логотип', en: 'Logo uploaded' },
    points: 5,
    category: 'profile',
    verifiable: false,
  },
  {
    id: 'portfolio-added',
    name: { ru: 'Добавлены примеры работ / портфолио', en: 'Portfolio added' },
    points: 10,
    category: 'profile',
    verifiable: false,
  },
  {
    id: 'bin-verified',
    name: { ru: 'Подтверждён БИН/ИИН компании', en: 'Business ID verified' },
    points: 15,
    category: 'profile',
    verifiable: true,
  },

  // Сертификаты (каждый даёт баллы)
  {
    id: 'iso-cert',
    name: {
      ru: 'Загружен сертификат ISO (за каждый)',
      en: 'ISO certificate uploaded',
    },
    points: 10,
    category: 'certification',
    verifiable: true,
  },
  {
    id: 'state-license',
    name: {
      ru: 'Загружена государственная лицензия (за каждую)',
      en: 'State license uploaded',
    },
    points: 15,
    category: 'certification',
    verifiable: true,
  },
  {
    id: 'professional-cert',
    name: {
      ru: 'Профессиональный сертификат (JORC, KAZRC, СРО)',
      en: 'Professional certification',
    },
    points: 10,
    category: 'certification',
    verifiable: true,
  },
  {
    id: 'insurance-doc',
    name: {
      ru: 'Документ страхования ответственности',
      en: 'Insurance document',
    },
    points: 10,
    category: 'certification',
    verifiable: true,
  },

  // Активность на платформе
  {
    id: 'first-listing',
    name: {
      ru: 'Первое размещённое объявление',
      en: 'First listing published',
    },
    points: 5,
    category: 'activity',
    verifiable: false,
  },
  {
    id: 'active-6-months',
    name: {
      ru: 'Активность на платформе более 6 месяцев',
      en: 'Active for 6+ months',
    },
    points: 10,
    category: 'activity',
    verifiable: false,
  },
  {
    id: 'responded-to-inquiries',
    name: {
      ru: 'Отвечает на запросы (>80% ответов)',
      en: 'Response rate >80%',
    },
    points: 10,
    category: 'activity',
    verifiable: false,
  },

  // Репутация
  {
    id: 'positive-reviews',
    name: { ru: '5+ положительных отзывов', en: '5+ positive reviews' },
    points: 15,
    category: 'reputation',
    verifiable: false,
  },
  {
    id: 'completed-deals',
    name: { ru: '3+ успешных сделок на платформе', en: '3+ completed deals' },
    points: 15,
    category: 'reputation',
    verifiable: false,
  },
  {
    id: 'no-complaints',
    name: {
      ru: 'Отсутствие жалоб за 12 месяцев',
      en: 'No complaints for 12 months',
    },
    points: 10,
    category: 'reputation',
    verifiable: false,
  },
];

// ─────────────────────────────────────────────
// Параметры оборудования (для фильтрации)
// ─────────────────────────────────────────────

export interface EquipmentSpec {
  id: string;
  name: { ru: string; kz: string; en: string; zh: string };
  type: 'range' | 'select' | 'boolean';
  unit?: string;
  options?: Array<{ value: string; label: { ru: string; en: string } }>;
}

export const DRILLING_RIG_SPECS: EquipmentSpec[] = [
  {
    id: 'max-depth',
    name: {
      ru: 'Максимальная глубина бурения',
      kz: 'Бұрғылаудың максималды тереңдігі',
      en: 'Maximum drilling depth',
      zh: '最大钻探深度',
    },
    type: 'range',
    unit: 'м',
  },
  {
    id: 'drill-diameter',
    name: {
      ru: 'Диаметр бурения',
      kz: 'Бұрғылау диаметрі',
      en: 'Drill diameter',
      zh: '钻探直径',
    },
    type: 'range',
    unit: 'мм',
  },
  {
    id: 'mobility',
    name: {
      ru: 'Мобильность',
      kz: 'Мобильділік',
      en: 'Mobility',
      zh: '移动性',
    },
    type: 'select',
    options: [
      { value: 'stationary', label: { ru: 'Стационарная', en: 'Stationary' } },
      { value: 'truck', label: { ru: 'На автошасси', en: 'Truck-mounted' } },
      {
        value: 'crawler',
        label: { ru: 'На гусеничном ходу', en: 'Crawler-mounted' },
      },
      { value: 'portable', label: { ru: 'Переносная', en: 'Portable' } },
    ],
  },
  {
    id: 'drive-type',
    name: {
      ru: 'Тип привода',
      kz: 'Жетек түрі',
      en: 'Drive type',
      zh: '驱动类型',
    },
    type: 'select',
    options: [
      { value: 'diesel', label: { ru: 'Дизельный', en: 'Diesel' } },
      { value: 'electric', label: { ru: 'Электрический', en: 'Electric' } },
      { value: 'hydraulic', label: { ru: 'Гидравлический', en: 'Hydraulic' } },
      { value: 'pneumatic', label: { ru: 'Пневматический', en: 'Pneumatic' } },
    ],
  },
  {
    id: 'angle-drilling',
    name: {
      ru: 'Наклонное бурение',
      kz: 'Көлбеу бұрғылау',
      en: 'Angle drilling',
      zh: '斜孔钻探',
    },
    type: 'boolean',
  },
  {
    id: 'core-recovery',
    name: {
      ru: 'Керноотбор',
      kz: 'Керн алу',
      en: 'Core recovery',
      zh: '岩心采取',
    },
    type: 'boolean',
  },
];

// ─────────────────────────────────────────────
// Утилиты
// ─────────────────────────────────────────────

/** Рассчитать уровень доверия по набранным баллам */
export function calculateTrustLevel(points: number): TrustLevel {
  const sorted = [...TRUST_LEVELS].sort((a, b) => b.minPoints - a.minPoints);
  return sorted.find((level) => points >= level.minPoints) || TRUST_LEVELS[0];
}

/** Получить список сертификатов по категории */
export function getCertificationsByCategory(
  category: Certification['category']
): Certification[] {
  return CERTIFICATIONS.filter((c) => c.category === category);
}

/** Получить максимально возможные баллы */
export function getMaxTrustPoints(): number {
  return TRUST_CRITERIA.reduce((sum, c) => sum + c.points, 0);
}

/** Получить критерии по категории */
export function getTrustCriteriaByCategory(
  category: TrustCriterion['category']
): TrustCriterion[] {
  return TRUST_CRITERIA.filter((c) => c.category === category);
}
