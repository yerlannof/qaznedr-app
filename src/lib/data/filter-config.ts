/**
 * Конфигурация фильтров для всех разделов платформы
 *
 * Правило: 3-4 фильтра на раздел максимум.
 * Один главный (тип/категория) + 2-3 уточняющих.
 */

// ─────────────────────────────────────────────
// Общие справочники
// ─────────────────────────────────────────────

export const REGIONS = [
  {
    id: 'mangystau',
    name: {
      ru: 'Мангистауская',
      kz: 'Маңғыстау',
      en: 'Mangystau',
      zh: '曼格斯套',
    },
  },
  {
    id: 'atyrau',
    name: { ru: 'Атырауская', kz: 'Атырау', en: 'Atyrau', zh: '阿特劳' },
  },
  {
    id: 'karagandy',
    name: {
      ru: 'Карагандинская',
      kz: 'Қарағанды',
      en: 'Karagandy',
      zh: '卡拉干达',
    },
  },
  {
    id: 'east-kz',
    name: {
      ru: 'Восточно-Казахстанская',
      kz: 'Шығыс Қазақстан',
      en: 'East Kazakhstan',
      zh: '东哈萨克斯坦',
    },
  },
  {
    id: 'kostanay',
    name: {
      ru: 'Костанайская',
      kz: 'Қостанай',
      en: 'Kostanay',
      zh: '库斯塔奈',
    },
  },
  {
    id: 'pavlodar',
    name: {
      ru: 'Павлодарская',
      kz: 'Павлодар',
      en: 'Pavlodar',
      zh: '巴甫洛达尔',
    },
  },
  {
    id: 'zhambyl',
    name: { ru: 'Жамбылская', kz: 'Жамбыл', en: 'Zhambyl', zh: '江布尔' },
  },
  {
    id: 'south-kz',
    name: {
      ru: 'Туркестанская',
      kz: 'Түркістан',
      en: 'Turkestan',
      zh: '突厥斯坦',
    },
  },
  {
    id: 'akmola',
    name: { ru: 'Акмолинская', kz: 'Ақмола', en: 'Akmola', zh: '阿克莫拉' },
  },
  {
    id: 'aktobe',
    name: { ru: 'Актюбинская', kz: 'Ақтөбе', en: 'Aktobe', zh: '阿克托别' },
  },
  {
    id: 'almaty-region',
    name: {
      ru: 'Алматинская',
      kz: 'Алматы облысы',
      en: 'Almaty Region',
      zh: '阿拉木图州',
    },
  },
  {
    id: 'west-kz',
    name: {
      ru: 'Западно-Казахстанская',
      kz: 'Батыс Қазақстан',
      en: 'West Kazakhstan',
      zh: '西哈萨克斯坦',
    },
  },
  {
    id: 'kyzylorda',
    name: {
      ru: 'Кызылординская',
      kz: 'Қызылорда',
      en: 'Kyzylorda',
      zh: '克孜勒奥尔达',
    },
  },
  {
    id: 'north-kz',
    name: {
      ru: 'Северо-Казахстанская',
      kz: 'Солтүстік Қазақстан',
      en: 'North Kazakhstan',
      zh: '北哈萨克斯坦',
    },
  },
] as const;

export const MINERALS = [
  { id: 'oil', name: { ru: 'Нефть', kz: 'Мұнай', en: 'Oil', zh: '石油' } },
  { id: 'gas', name: { ru: 'Газ', kz: 'Газ', en: 'Gas', zh: '天然气' } },
  { id: 'gold', name: { ru: 'Золото', kz: 'Алтын', en: 'Gold', zh: '黄金' } },
  { id: 'copper', name: { ru: 'Медь', kz: 'Мыс', en: 'Copper', zh: '铜' } },
  { id: 'coal', name: { ru: 'Уголь', kz: 'Көмір', en: 'Coal', zh: '煤' } },
  { id: 'uranium', name: { ru: 'Уран', kz: 'Уран', en: 'Uranium', zh: '铀' } },
  { id: 'iron', name: { ru: 'Железо', kz: 'Темір', en: 'Iron', zh: '铁' } },
  { id: 'chrome', name: { ru: 'Хром', kz: 'Хром', en: 'Chrome', zh: '铬' } },
  {
    id: 'manganese',
    name: { ru: 'Марганец', kz: 'Марганец', en: 'Manganese', zh: '锰' },
  },
  { id: 'zinc', name: { ru: 'Цинк', kz: 'Мырыш', en: 'Zinc', zh: '锌' } },
  { id: 'lead', name: { ru: 'Свинец', kz: 'Қорғасын', en: 'Lead', zh: '铅' } },
  {
    id: 'rare-earth',
    name: {
      ru: 'Редкоземельные',
      kz: 'Сирек жер',
      en: 'Rare Earth',
      zh: '稀土',
    },
  },
] as const;

// ─────────────────────────────────────────────
// Фильтры по разделам
// ─────────────────────────────────────────────

export interface FilterOption {
  id: string;
  name: { ru: string; kz: string; en: string; zh: string };
}

export interface FilterConfig {
  id: string;
  label: { ru: string; kz: string; en: string; zh: string };
  type: 'select' | 'multiselect' | 'range' | 'toggle';
  options?: readonly FilterOption[];
  range?: { min: number; max: number; step: number; unit: string };
  primary?: boolean; // главный фильтр раздела
}

/** Объявления — 4 фильтра */
export const LISTING_FILTERS: FilterConfig[] = [
  {
    id: 'type',
    label: { ru: 'Тип', kz: 'Түрі', en: 'Type', zh: '类型' },
    type: 'select',
    primary: true,
    options: [
      {
        id: 'MINING_LICENSE',
        name: {
          ru: 'Лицензия на добычу',
          kz: 'Өндіру лицензиясы',
          en: 'Mining License',
          zh: '采矿许可证',
        },
      },
      {
        id: 'EXPLORATION_LICENSE',
        name: {
          ru: 'Лицензия на разведку',
          kz: 'Барлау лицензиясы',
          en: 'Exploration License',
          zh: '勘探许可证',
        },
      },
      {
        id: 'MINERAL_OCCURRENCE',
        name: {
          ru: 'Рудопроявление',
          kz: 'Кен көріністері',
          en: 'Mineral Occurrence',
          zh: '矿点',
        },
      },
    ],
  },
  {
    id: 'mineral',
    label: { ru: 'Минерал', kz: 'Минерал', en: 'Mineral', zh: '矿物' },
    type: 'select',
    options: MINERALS,
  },
  {
    id: 'region',
    label: { ru: 'Регион', kz: 'Аймақ', en: 'Region', zh: '地区' },
    type: 'select',
    options: REGIONS,
  },
  {
    id: 'price',
    label: { ru: 'Цена (₸)', kz: 'Баға (₸)', en: 'Price (₸)', zh: '价格 (₸)' },
    type: 'range',
    range: { min: 0, max: 10_000_000_000, step: 100_000_000, unit: '₸' },
  },
];

/** Услуги — 3 фильтра */
export const SERVICE_FILTERS: FilterConfig[] = [
  {
    id: 'category',
    label: { ru: 'Категория', kz: 'Санат', en: 'Category', zh: '类别' },
    type: 'select',
    primary: true,
    options: [
      {
        id: 'drilling',
        name: { ru: 'Бурение', kz: 'Бұрғылау', en: 'Drilling', zh: '钻探' },
      },
      {
        id: 'exploration',
        name: {
          ru: 'Геологоразведка',
          kz: 'Геологиялық барлау',
          en: 'Exploration',
          zh: '勘探',
        },
      },
      {
        id: 'laboratory',
        name: {
          ru: 'Лаборатория',
          kz: 'Зертхана',
          en: 'Laboratory',
          zh: '实验室',
        },
      },
      {
        id: 'surveying',
        name: {
          ru: 'Маркшейдерия',
          kz: 'Маркшейдерия',
          en: 'Surveying',
          zh: '测量',
        },
      },
      {
        id: 'legal',
        name: { ru: 'Юридические', kz: 'Заңгерлік', en: 'Legal', zh: '法律' },
      },
      {
        id: 'environmental',
        name: {
          ru: 'Экология',
          kz: 'Экология',
          en: 'Environmental',
          zh: '环保',
        },
      },
      {
        id: 'equipment',
        name: { ru: 'Оборудование', kz: 'Жабдық', en: 'Equipment', zh: '设备' },
      },
      {
        id: 'consulting',
        name: {
          ru: 'Консалтинг',
          kz: 'Консалтинг',
          en: 'Consulting',
          zh: '咨询',
        },
      },
      {
        id: 'investment',
        name: {
          ru: 'Инвестиции',
          kz: 'Инвестиция',
          en: 'Investment',
          zh: '投资',
        },
      },
      {
        id: 'logistics',
        name: { ru: 'Логистика', kz: 'Логистика', en: 'Logistics', zh: '物流' },
      },
    ],
  },
  {
    id: 'region',
    label: {
      ru: 'Регион работы',
      kz: 'Жұмыс аймағы',
      en: 'Operating Region',
      zh: '运营地区',
    },
    type: 'select',
    options: REGIONS,
  },
  {
    id: 'trust',
    label: {
      ru: 'Проверенные',
      kz: 'Тексерілген',
      en: 'Verified',
      zh: '已验证',
    },
    type: 'toggle',
  },
];

/** Компании — 4 фильтра */
export const COMPANY_FILTERS: FilterConfig[] = [
  {
    id: 'type',
    label: {
      ru: 'Тип компании',
      kz: 'Компания түрі',
      en: 'Company Type',
      zh: '公司类型',
    },
    type: 'select',
    primary: true,
    options: [
      {
        id: 'subsoil_user',
        name: {
          ru: 'Недропользователь',
          kz: 'Жер қойнауын пайдаланушы',
          en: 'Subsoil User',
          zh: '地下资源使用者',
        },
      },
      {
        id: 'service_provider',
        name: {
          ru: 'Поставщик услуг',
          kz: 'Қызмет көрсетуші',
          en: 'Service Provider',
          zh: '服务提供商',
        },
      },
      {
        id: 'investor',
        name: { ru: 'Инвестор', kz: 'Инвестор', en: 'Investor', zh: '投资者' },
      },
    ],
  },
  {
    id: 'services',
    label: { ru: 'Услуги', kz: 'Қызметтер', en: 'Services', zh: '服务' },
    type: 'multiselect',
    options: SERVICE_FILTERS[0].options, // reuse service categories
  },
  {
    id: 'region',
    label: { ru: 'Регион', kz: 'Аймақ', en: 'Region', zh: '地区' },
    type: 'select',
    options: REGIONS,
  },
  {
    id: 'verified',
    label: {
      ru: 'С сертификатами',
      kz: 'Сертификаттары бар',
      en: 'Certified',
      zh: '已认证',
    },
    type: 'toggle',
  },
];

/** Блог — 1 фильтр (категория) */
export const BLOG_FILTERS: FilterConfig[] = [
  {
    id: 'category',
    label: { ru: 'Категория', kz: 'Санат', en: 'Category', zh: '类别' },
    type: 'select',
    primary: true,
    options: [
      {
        id: 'guides',
        name: { ru: 'Гайды', kz: 'Нұсқаулықтар', en: 'Guides', zh: '指南' },
      },
      {
        id: 'investors',
        name: {
          ru: 'Для инвесторов',
          kz: 'Инвесторларға',
          en: 'For Investors',
          zh: '投资者',
        },
      },
      {
        id: 'licensing',
        name: {
          ru: 'Лицензирование',
          kz: 'Лицензиялау',
          en: 'Licensing',
          zh: '许可证',
        },
      },
      {
        id: 'regions',
        name: { ru: 'Регионы', kz: 'Аймақтар', en: 'Regions', zh: '地区' },
      },
      {
        id: 'news',
        name: { ru: 'Новости', kz: 'Жаңалықтар', en: 'News', zh: '新闻' },
      },
    ],
  },
];
