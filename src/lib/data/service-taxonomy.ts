/**
 * Таксономия геологических услуг Казахстана
 *
 * Структура для умных фильтров при поиске компаний и услуг.
 * Каждая категория имеет подкатегории, а подкатегории — теги для точной фильтрации.
 *
 * Используется:
 * - При регистрации компании (выбор своих услуг)
 * - В фильтрах каталога услуг
 * - В поиске (автодополнение, подсказки)
 * - В JSON-LD structured data
 */

export interface ServiceTag {
  id: string;
  name: { ru: string; kz: string; en: string; zh: string };
}

export interface ServiceSubcategory {
  id: string;
  name: { ru: string; kz: string; en: string; zh: string };
  tags?: ServiceTag[];
}

export interface ServiceCategory {
  id: string;
  name: { ru: string; kz: string; en: string; zh: string };
  description: { ru: string; kz: string; en: string; zh: string };
  subcategories: ServiceSubcategory[];
}

export const SERVICE_TAXONOMY: ServiceCategory[] = [
  // ─────────────────────────────────────────────
  // 1. БУРЕНИЕ
  // ─────────────────────────────────────────────
  {
    id: 'drilling',
    name: {
      ru: 'Бурение',
      kz: 'Бұрғылау',
      en: 'Drilling',
      zh: '钻探',
    },
    description: {
      ru: 'Буровые работы всех типов: от разведочного до эксплуатационного бурения',
      kz: 'Барлық түрдегі бұрғылау жұмыстары: барлаудан өндірістік бұрғылауға дейін',
      en: 'All types of drilling operations: from exploration to production drilling',
      zh: '各类钻探作业：从勘探钻探到生产钻探',
    },
    subcategories: [
      {
        id: 'drilling-by-purpose',
        name: {
          ru: 'По назначению',
          kz: 'Мақсаты бойынша',
          en: 'By purpose',
          zh: '按用途',
        },
        tags: [
          {
            id: 'exploration-drilling',
            name: {
              ru: 'Разведочное бурение',
              kz: 'Барлау бұрғылауы',
              en: 'Exploration drilling',
              zh: '勘探钻探',
            },
          },
          {
            id: 'production-drilling',
            name: {
              ru: 'Эксплуатационное бурение',
              kz: 'Өндірістік бұрғылау',
              en: 'Production drilling',
              zh: '生产钻探',
            },
          },
          {
            id: 'hydrogeological-drilling',
            name: {
              ru: 'Гидрогеологическое бурение',
              kz: 'Гидрогеологиялық бұрғылау',
              en: 'Hydrogeological drilling',
              zh: '水文地质钻探',
            },
          },
          {
            id: 'engineering-geological-drilling',
            name: {
              ru: 'Инженерно-геологическое бурение',
              kz: 'Инженерлік-геологиялық бұрғылау',
              en: 'Engineering-geological drilling',
              zh: '工程地质钻探',
            },
          },
          {
            id: 'geotechnical-drilling',
            name: {
              ru: 'Геотехническое бурение',
              kz: 'Геотехникалық бұрғылау',
              en: 'Geotechnical drilling',
              zh: '岩土钻探',
            },
          },
        ],
      },
      {
        id: 'drilling-by-method',
        name: {
          ru: 'По способу бурения',
          kz: 'Бұрғылау тәсілі бойынша',
          en: 'By drilling method',
          zh: '按钻探方式',
        },
        tags: [
          {
            id: 'core-drilling',
            name: {
              ru: 'Колонковое (керновое) бурение',
              kz: 'Колонкалық (кернді) бұрғылау',
              en: 'Core drilling',
              zh: '岩心钻探',
            },
          },
          {
            id: 'rotary-drilling',
            name: {
              ru: 'Роторное бурение',
              kz: 'Роторлық бұрғылау',
              en: 'Rotary drilling',
              zh: '旋转钻探',
            },
          },
          {
            id: 'auger-drilling',
            name: {
              ru: 'Шнековое бурение',
              kz: 'Шнекті бұрғылау',
              en: 'Auger drilling',
              zh: '螺旋钻探',
            },
          },
          {
            id: 'dth-drilling',
            name: {
              ru: 'Пневмоударное бурение (DTH)',
              kz: 'Пневмосоққылы бұрғылау (DTH)',
              en: 'Down-the-hole (DTH) drilling',
              zh: '潜孔锤钻探',
            },
          },
          {
            id: 'diamond-drilling',
            name: {
              ru: 'Алмазное бурение',
              kz: 'Алмас бұрғылау',
              en: 'Diamond drilling',
              zh: '金刚石钻探',
            },
          },
          {
            id: 'directional-drilling',
            name: {
              ru: 'Наклонно-направленное бурение',
              kz: 'Көлбеу-бағытталған бұрғылау',
              en: 'Directional drilling',
              zh: '定向钻探',
            },
          },
        ],
      },
      {
        id: 'drilling-by-depth',
        name: {
          ru: 'По глубине',
          kz: 'Тереңдігі бойынша',
          en: 'By depth',
          zh: '按深度',
        },
        tags: [
          {
            id: 'shallow-drilling',
            name: {
              ru: 'Мелкое бурение (до 100 м)',
              kz: 'Таяз бұрғылау (100 м дейін)',
              en: 'Shallow drilling (up to 100m)',
              zh: '浅层钻探（100米以内）',
            },
          },
          {
            id: 'medium-drilling',
            name: {
              ru: 'Среднее бурение (100–600 м)',
              kz: 'Орташа бұрғылау (100–600 м)',
              en: 'Medium drilling (100–600m)',
              zh: '中深钻探（100-600米）',
            },
          },
          {
            id: 'deep-drilling',
            name: {
              ru: 'Глубокое бурение (600–2000 м)',
              kz: 'Терең бұрғылау (600–2000 м)',
              en: 'Deep drilling (600–2000m)',
              zh: '深层钻探（600-2000米）',
            },
          },
          {
            id: 'ultra-deep-drilling',
            name: {
              ru: 'Сверхглубокое бурение (2000–6000 м)',
              kz: 'Аса терең бұрғылау (2000–6000 м)',
              en: 'Ultra-deep drilling (2000–6000m)',
              zh: '超深钻探（2000-6000米）',
            },
          },
          {
            id: 'super-deep-drilling',
            name: {
              ru: 'Особо глубокое бурение (6000+ м)',
              kz: 'Ерекше терең бұрғылау (6000+ м)',
              en: 'Super-deep drilling (6000m+)',
              zh: '特深钻探（6000米以上）',
            },
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 2. ГЕОЛОГОРАЗВЕДКА
  // ─────────────────────────────────────────────
  {
    id: 'exploration',
    name: {
      ru: 'Геологоразведка',
      kz: 'Геологиялық барлау',
      en: 'Geological Exploration',
      zh: '地质勘探',
    },
    description: {
      ru: 'Поиск, оценка и разведка месторождений полезных ископаемых',
      kz: 'Пайдалы қазба кен орындарын іздеу, бағалау және барлау',
      en: 'Search, evaluation and exploration of mineral deposits',
      zh: '矿产资源的搜索、评估和勘探',
    },
    subcategories: [
      {
        id: 'geological-surveys',
        name: {
          ru: 'Геологическая съёмка',
          kz: 'Геологиялық түсіру',
          en: 'Geological surveying',
          zh: '地质测量',
        },
        tags: [
          {
            id: 'geological-mapping',
            name: {
              ru: 'Геологическое картирование',
              kz: 'Геологиялық картографиялау',
              en: 'Geological mapping',
              zh: '地质填图',
            },
          },
          {
            id: 'structural-geology',
            name: {
              ru: 'Структурная геология',
              kz: 'Құрылымдық геология',
              en: 'Structural geology',
              zh: '构造地质',
            },
          },
        ],
      },
      {
        id: 'geophysics',
        name: {
          ru: 'Геофизические исследования',
          kz: 'Геофизикалық зерттеулер',
          en: 'Geophysical surveys',
          zh: '地球物理勘查',
        },
        tags: [
          {
            id: 'seismic',
            name: {
              ru: 'Сейсморазведка',
              kz: 'Сейсмобарлау',
              en: 'Seismic surveys',
              zh: '地震勘探',
            },
          },
          {
            id: 'gravity',
            name: {
              ru: 'Гравиметрия',
              kz: 'Гравиметрия',
              en: 'Gravity surveys',
              zh: '重力勘探',
            },
          },
          {
            id: 'magnetics',
            name: {
              ru: 'Магнитометрия',
              kz: 'Магнитометрия',
              en: 'Magnetic surveys',
              zh: '磁法勘探',
            },
          },
          {
            id: 'electrical',
            name: {
              ru: 'Электроразведка',
              kz: 'Электрбарлау',
              en: 'Electrical surveys',
              zh: '电法勘探',
            },
          },
          {
            id: 'radiometric',
            name: {
              ru: 'Радиометрия',
              kz: 'Радиометрия',
              en: 'Radiometric surveys',
              zh: '放射性勘探',
            },
          },
        ],
      },
      {
        id: 'geochemistry',
        name: {
          ru: 'Геохимические исследования',
          kz: 'Геохимиялық зерттеулер',
          en: 'Geochemical surveys',
          zh: '地球化学勘查',
        },
        tags: [
          {
            id: 'soil-sampling',
            name: {
              ru: 'Отбор проб почв',
              kz: 'Топырақ үлгілерін алу',
              en: 'Soil sampling',
              zh: '土壤采样',
            },
          },
          {
            id: 'stream-sediment',
            name: {
              ru: 'Литохимическая съёмка',
              kz: 'Литохимиялық түсіру',
              en: 'Stream sediment sampling',
              zh: '水系沉积物采样',
            },
          },
          {
            id: 'rock-chip',
            name: {
              ru: 'Штуфное опробование',
              kz: 'Штуфтық сынамалау',
              en: 'Rock chip sampling',
              zh: '岩屑采样',
            },
          },
        ],
      },
      {
        id: 'remote-sensing',
        name: {
          ru: 'Дистанционное зондирование',
          kz: 'Қашықтықтан зондтау',
          en: 'Remote sensing',
          zh: '遥感',
        },
        tags: [
          {
            id: 'aerial-survey',
            name: {
              ru: 'Аэрофотосъёмка',
              kz: 'Аэрофототүсіру',
              en: 'Aerial photography',
              zh: '航空摄影',
            },
          },
          {
            id: 'uav-survey',
            name: {
              ru: 'Съёмка БПЛА (дронами)',
              kz: 'ҰАА (дрондармен) түсіру',
              en: 'UAV/Drone surveys',
              zh: '无人机测量',
            },
          },
          {
            id: 'satellite-imagery',
            name: {
              ru: 'Спутниковая съёмка',
              kz: 'Спутниктік түсіру',
              en: 'Satellite imagery',
              zh: '卫星遥感',
            },
          },
        ],
      },
      {
        id: 'resource-estimation',
        name: {
          ru: 'Оценка запасов',
          kz: 'Қорларды бағалау',
          en: 'Resource estimation',
          zh: '资源量估算',
        },
        tags: [
          {
            id: 'jorc-reporting',
            name: {
              ru: 'Отчёт по JORC',
              kz: 'JORC бойынша есеп',
              en: 'JORC reporting',
              zh: 'JORC报告',
            },
          },
          {
            id: 'crirsco',
            name: {
              ru: 'Стандарты CRIRSCO',
              kz: 'CRIRSCO стандарттары',
              en: 'CRIRSCO standards',
              zh: 'CRIRSCO标准',
            },
          },
          {
            id: 'kazrc',
            name: {
              ru: 'Казахстанский кодекс (KAZRC)',
              kz: 'Қазақстандық кодекс (KAZRC)',
              en: 'Kazakhstan code (KAZRC)',
              zh: '哈萨克斯坦规范(KAZRC)',
            },
          },
          {
            id: 'feasibility-study',
            name: {
              ru: 'ТЭО (технико-экономическое обоснование)',
              kz: 'ТЭН (техникалық-экономикалық негіздеме)',
              en: 'Feasibility study',
              zh: '可行性研究',
            },
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 3. ЛАБОРАТОРНЫЕ УСЛУГИ
  // ─────────────────────────────────────────────
  {
    id: 'laboratory',
    name: {
      ru: 'Лабораторные услуги',
      kz: 'Зертханалық қызметтер',
      en: 'Laboratory Services',
      zh: '实验室服务',
    },
    description: {
      ru: 'Анализ проб, минералогические и химические исследования',
      kz: 'Сынамаларды талдау, минералогиялық және химиялық зерттеулер',
      en: 'Sample analysis, mineralogical and chemical studies',
      zh: '样品分析、矿物学和化学研究',
    },
    subcategories: [
      {
        id: 'chemical-analysis',
        name: {
          ru: 'Химический анализ',
          kz: 'Химиялық талдау',
          en: 'Chemical analysis',
          zh: '化学分析',
        },
        tags: [
          {
            id: 'fire-assay',
            name: {
              ru: 'Пробирный анализ',
              kz: 'Сынақ талдауы',
              en: 'Fire assay',
              zh: '火试金',
            },
          },
          {
            id: 'icp-analysis',
            name: {
              ru: 'ICP-анализ (масс-спектрометрия)',
              kz: 'ICP-талдау',
              en: 'ICP-MS / ICP-OES analysis',
              zh: 'ICP分析',
            },
          },
          {
            id: 'xrf-analysis',
            name: {
              ru: 'Рентгенофлуоресцентный анализ (XRF)',
              kz: 'Рентгенфлуоресценттік талдау (XRF)',
              en: 'X-ray fluorescence (XRF)',
              zh: 'X射线荧光分析',
            },
          },
        ],
      },
      {
        id: 'mineralogy',
        name: {
          ru: 'Минералогия',
          kz: 'Минералогия',
          en: 'Mineralogy',
          zh: '矿物学',
        },
        tags: [
          {
            id: 'petrography',
            name: {
              ru: 'Петрография (шлифы)',
              kz: 'Петрография',
              en: 'Petrography (thin sections)',
              zh: '岩相学',
            },
          },
          {
            id: 'xrd-analysis',
            name: {
              ru: 'Рентгеноструктурный анализ (XRD)',
              kz: 'Рентгенқұрылымдық талдау (XRD)',
              en: 'X-ray diffraction (XRD)',
              zh: 'X射线衍射分析',
            },
          },
        ],
      },
      {
        id: 'metallurgical-testing',
        name: {
          ru: 'Металлургические испытания',
          kz: 'Металлургиялық сынақтар',
          en: 'Metallurgical testing',
          zh: '冶金试验',
        },
        tags: [
          {
            id: 'flotation-test',
            name: {
              ru: 'Флотационные испытания',
              kz: 'Флотациялық сынақтар',
              en: 'Flotation tests',
              zh: '浮选试验',
            },
          },
          {
            id: 'gravity-separation',
            name: {
              ru: 'Гравитационное обогащение',
              kz: 'Гравитациялық байыту',
              en: 'Gravity separation',
              zh: '重力选矿',
            },
          },
          {
            id: 'leaching-test',
            name: {
              ru: 'Выщелачивание',
              kz: 'Шаймалау',
              en: 'Leaching tests',
              zh: '浸出试验',
            },
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 4. МАРКШЕЙДЕРИЯ И ГЕОДЕЗИЯ
  // ─────────────────────────────────────────────
  {
    id: 'surveying',
    name: {
      ru: 'Маркшейдерия и геодезия',
      kz: 'Маркшейдерия және геодезия',
      en: 'Mine Surveying & Geodesy',
      zh: '矿山测量与大地测量',
    },
    description: {
      ru: 'Топографическая съёмка, маркшейдерское обеспечение, 3D-моделирование',
      kz: 'Топографиялық түсіру, маркшейдерлік қамтамасыз ету, 3D-модельдеу',
      en: 'Topographic surveys, mine surveying, 3D modeling',
      zh: '地形测量、矿山测量、3D建模',
    },
    subcategories: [
      {
        id: 'topographic',
        name: {
          ru: 'Топографическая съёмка',
          kz: 'Топографиялық түсіру',
          en: 'Topographic surveying',
          zh: '地形测量',
        },
      },
      {
        id: 'mine-surveying',
        name: {
          ru: 'Маркшейдерское обеспечение',
          kz: 'Маркшейдерлік қамтамасыз ету',
          en: 'Mine surveying',
          zh: '矿山测量',
        },
      },
      {
        id: '3d-modeling',
        name: {
          ru: '3D-моделирование месторождений',
          kz: 'Кен орындарын 3D модельдеу',
          en: '3D deposit modeling',
          zh: '矿床3D建模',
        },
      },
      {
        id: 'geodetic-monitoring',
        name: {
          ru: 'Геодезический мониторинг',
          kz: 'Геодезиялық мониторинг',
          en: 'Geodetic monitoring',
          zh: '大地测量监测',
        },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 5. ЮРИДИЧЕСКИЕ УСЛУГИ
  // ─────────────────────────────────────────────
  {
    id: 'legal',
    name: {
      ru: 'Юридические услуги',
      kz: 'Заң қызметтері',
      en: 'Legal Services',
      zh: '法律服务',
    },
    description: {
      ru: 'Горное право, лицензирование, сопровождение сделок',
      kz: 'Тау-кен құқығы, лицензиялау, мәмілелерді сүйемелдеу',
      en: 'Mining law, licensing, transaction support',
      zh: '矿业法、许可证、交易支持',
    },
    subcategories: [
      {
        id: 'license-acquisition',
        name: {
          ru: 'Получение лицензий',
          kz: 'Лицензия алу',
          en: 'License acquisition',
          zh: '许可证获取',
        },
      },
      {
        id: 'license-transfer',
        name: {
          ru: 'Передача/продажа лицензий',
          kz: 'Лицензияны беру/сату',
          en: 'License transfer/sale',
          zh: '许可证转让/出售',
        },
      },
      {
        id: 'mining-law',
        name: {
          ru: 'Горное право',
          kz: 'Тау-кен құқығы',
          en: 'Mining law',
          zh: '矿业法',
        },
      },
      {
        id: 'due-diligence',
        name: {
          ru: 'Due diligence',
          kz: 'Due diligence',
          en: 'Due diligence',
          zh: '尽职调查',
        },
      },
      {
        id: 'contract-support',
        name: {
          ru: 'Сопровождение контрактов',
          kz: 'Келісімшарттарды сүйемелдеу',
          en: 'Contract support',
          zh: '合同支持',
        },
      },
      {
        id: 'environmental-law',
        name: {
          ru: 'Экологическое право',
          kz: 'Экологиялық құқық',
          en: 'Environmental law',
          zh: '环境法',
        },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 6. ЭКОЛОГИЯ
  // ─────────────────────────────────────────────
  {
    id: 'environmental',
    name: {
      ru: 'Экологические услуги',
      kz: 'Экологиялық қызметтер',
      en: 'Environmental Services',
      zh: '环保服务',
    },
    description: {
      ru: 'ОВОС, экологический мониторинг, рекультивация',
      kz: 'ҚОӘБ, экологиялық мониторинг, рекультивация',
      en: 'EIA, environmental monitoring, reclamation',
      zh: '环境影响评价、环境监测、复垦',
    },
    subcategories: [
      {
        id: 'eia',
        name: {
          ru: 'ОВОС (оценка воздействия)',
          kz: 'ҚОӘБ (әсерді бағалау)',
          en: 'Environmental Impact Assessment',
          zh: '环境影响评价',
        },
      },
      {
        id: 'environmental-monitoring',
        name: {
          ru: 'Экологический мониторинг',
          kz: 'Экологиялық мониторинг',
          en: 'Environmental monitoring',
          zh: '环境监测',
        },
      },
      {
        id: 'reclamation',
        name: {
          ru: 'Рекультивация земель',
          kz: 'Жерді рекультивациялау',
          en: 'Land reclamation',
          zh: '土地复垦',
        },
      },
      {
        id: 'waste-management',
        name: {
          ru: 'Управление отходами',
          kz: 'Қалдықтарды басқару',
          en: 'Waste management',
          zh: '废物管理',
        },
      },
      {
        id: 'water-management',
        name: {
          ru: 'Водоотведение и водоснабжение',
          kz: 'Су бұру және сумен қамтамасыз ету',
          en: 'Water management',
          zh: '水管理',
        },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 7. ОБОРУДОВАНИЕ
  // ─────────────────────────────────────────────
  {
    id: 'equipment',
    name: {
      ru: 'Оборудование',
      kz: 'Жабдық',
      en: 'Equipment',
      zh: '设备',
    },
    description: {
      ru: 'Продажа и аренда горнодобывающего и бурового оборудования',
      kz: 'Тау-кен және бұрғылау жабдығын сату және жалға беру',
      en: 'Sale and rental of mining and drilling equipment',
      zh: '矿山和钻探设备的销售和租赁',
    },
    subcategories: [
      {
        id: 'drilling-rigs',
        name: {
          ru: 'Буровые установки',
          kz: 'Бұрғылау қондырғылары',
          en: 'Drilling rigs',
          zh: '钻机',
        },
        tags: [
          {
            id: 'rig-stationary',
            name: {
              ru: 'Стационарные',
              kz: 'Стационарлық',
              en: 'Stationary',
              zh: '固定式',
            },
          },
          {
            id: 'rig-truck-mounted',
            name: {
              ru: 'На автошасси',
              kz: 'Автошассиде',
              en: 'Truck-mounted',
              zh: '车载式',
            },
          },
          {
            id: 'rig-crawler',
            name: {
              ru: 'На гусеничном ходу',
              kz: 'Шынжырлы жүрісте',
              en: 'Crawler-mounted',
              zh: '履带式',
            },
          },
          {
            id: 'rig-portable',
            name: {
              ru: 'Переносные',
              kz: 'Тасымалды',
              en: 'Portable',
              zh: '便携式',
            },
          },
        ],
      },
      {
        id: 'excavators',
        name: {
          ru: 'Экскаваторы',
          kz: 'Экскаваторлар',
          en: 'Excavators',
          zh: '挖掘机',
        },
      },
      {
        id: 'dump-trucks',
        name: {
          ru: 'Самосвалы',
          kz: 'Өздігінен түсіргіштер',
          en: 'Dump trucks',
          zh: '自卸车',
        },
      },
      {
        id: 'crushers',
        name: {
          ru: 'Дробильное оборудование',
          kz: 'Ұсақтау жабдығы',
          en: 'Crushers',
          zh: '破碎设备',
        },
      },
      {
        id: 'conveyors',
        name: {
          ru: 'Конвейеры',
          kz: 'Конвейерлер',
          en: 'Conveyors',
          zh: '输送机',
        },
      },
      {
        id: 'pumps',
        name: {
          ru: 'Насосное оборудование',
          kz: 'Сорғы жабдығы',
          en: 'Pumps',
          zh: '泵设备',
        },
      },
      {
        id: 'compressors',
        name: {
          ru: 'Компрессоры',
          kz: 'Компрессорлар',
          en: 'Compressors',
          zh: '压缩机',
        },
      },
      {
        id: 'safety-equipment',
        name: {
          ru: 'Средства безопасности',
          kz: 'Қауіпсіздік құралдары',
          en: 'Safety equipment',
          zh: '安全设备',
        },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 8. КОНСАЛТИНГ
  // ─────────────────────────────────────────────
  {
    id: 'consulting',
    name: {
      ru: 'Консалтинг',
      kz: 'Консалтинг',
      en: 'Consulting',
      zh: '咨询',
    },
    description: {
      ru: 'Геологический, инвестиционный и управленческий консалтинг',
      kz: 'Геологиялық, инвестициялық және басқарушылық консалтинг',
      en: 'Geological, investment and management consulting',
      zh: '地质、投资和管理咨询',
    },
    subcategories: [
      {
        id: 'geological-consulting',
        name: {
          ru: 'Геологический консалтинг',
          kz: 'Геологиялық консалтинг',
          en: 'Geological consulting',
          zh: '地质咨询',
        },
      },
      {
        id: 'feasibility',
        name: {
          ru: 'ТЭО и предпроектные исследования',
          kz: 'ТЭН және жобаалды зерттеулер',
          en: 'Feasibility studies',
          zh: '可行性研究',
        },
      },
      {
        id: 'mine-planning',
        name: {
          ru: 'Проектирование горных работ',
          kz: 'Тау-кен жұмыстарын жобалау',
          en: 'Mine planning & design',
          zh: '采矿规划设计',
        },
      },
      {
        id: 'financial-modeling',
        name: {
          ru: 'Финансовое моделирование',
          kz: 'Қаржылық модельдеу',
          en: 'Financial modeling',
          zh: '财务建模',
        },
      },
      {
        id: 'risk-assessment',
        name: {
          ru: 'Оценка рисков',
          kz: 'Тәуекелді бағалау',
          en: 'Risk assessment',
          zh: '风险评估',
        },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 9. ИНВЕСТИЦИОННЫЕ УСЛУГИ
  // ─────────────────────────────────────────────
  {
    id: 'investment',
    name: {
      ru: 'Инвестиционные услуги',
      kz: 'Инвестициялық қызметтер',
      en: 'Investment Services',
      zh: '投资服务',
    },
    description: {
      ru: 'Привлечение инвестиций, оценка проектов, M&A',
      kz: 'Инвестиция тарту, жобаларды бағалау, M&A',
      en: 'Investment attraction, project evaluation, M&A',
      zh: '投资吸引、项目评估、并购',
    },
    subcategories: [
      {
        id: 'fundraising',
        name: {
          ru: 'Привлечение финансирования',
          kz: 'Қаржыландыру тарту',
          en: 'Fundraising',
          zh: '融资',
        },
      },
      {
        id: 'project-evaluation',
        name: {
          ru: 'Оценка горных проектов',
          kz: 'Тау-кен жобаларын бағалау',
          en: 'Mining project evaluation',
          zh: '矿业项目评估',
        },
      },
      {
        id: 'ma-advisory',
        name: {
          ru: 'M&A сопровождение',
          kz: 'M&A сүйемелдеу',
          en: 'M&A advisory',
          zh: '并购顾问',
        },
      },
      {
        id: 'joint-ventures',
        name: {
          ru: 'Совместные предприятия',
          kz: 'Бірлескен кәсіпорындар',
          en: 'Joint ventures',
          zh: '合资企业',
        },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 10. ЛОГИСТИКА
  // ─────────────────────────────────────────────
  {
    id: 'logistics',
    name: {
      ru: 'Логистика',
      kz: 'Логистика',
      en: 'Logistics',
      zh: '物流',
    },
    description: {
      ru: 'Транспортировка оборудования и руды, складирование',
      kz: 'Жабдық пен кенді тасымалдау, қоймалау',
      en: 'Equipment and ore transportation, warehousing',
      zh: '设备和矿石运输、仓储',
    },
    subcategories: [
      {
        id: 'equipment-transport',
        name: {
          ru: 'Транспортировка оборудования',
          kz: 'Жабдықты тасымалдау',
          en: 'Equipment transport',
          zh: '设备运输',
        },
      },
      {
        id: 'ore-transport',
        name: {
          ru: 'Транспортировка руды',
          kz: 'Кенді тасымалдау',
          en: 'Ore transport',
          zh: '矿石运输',
        },
      },
      {
        id: 'warehousing',
        name: {
          ru: 'Складирование',
          kz: 'Қоймалау',
          en: 'Warehousing',
          zh: '仓储',
        },
      },
      {
        id: 'customs',
        name: {
          ru: 'Таможенное оформление',
          kz: 'Кедендік рәсімдеу',
          en: 'Customs clearance',
          zh: '报关',
        },
      },
    ],
  },
];

// ─────────────────────────────────────────────
// Утилиты для работы с таксономией
// ─────────────────────────────────────────────

/** Получить все категории */
export function getAllCategories(): ServiceCategory[] {
  return SERVICE_TAXONOMY;
}

/** Получить категорию по ID */
export function getCategoryById(id: string): ServiceCategory | undefined {
  return SERVICE_TAXONOMY.find((c) => c.id === id);
}

/** Получить все теги (плоский список) */
export function getAllTags(): ServiceTag[] {
  const tags: ServiceTag[] = [];
  for (const category of SERVICE_TAXONOMY) {
    for (const sub of category.subcategories) {
      if (sub.tags) {
        tags.push(...sub.tags);
      }
    }
  }
  return tags;
}

/** Поиск по тегам и подкатегориям (для автодополнения) */
export function searchTaxonomy(
  query: string,
  locale: 'ru' | 'kz' | 'en' | 'zh' = 'ru'
): Array<{
  type: 'category' | 'subcategory' | 'tag';
  id: string;
  name: string;
  parentId?: string;
}> {
  const q = query.toLowerCase();
  const results: Array<{
    type: 'category' | 'subcategory' | 'tag';
    id: string;
    name: string;
    parentId?: string;
  }> = [];

  for (const category of SERVICE_TAXONOMY) {
    if (category.name[locale].toLowerCase().includes(q)) {
      results.push({
        type: 'category',
        id: category.id,
        name: category.name[locale],
      });
    }
    for (const sub of category.subcategories) {
      if (sub.name[locale].toLowerCase().includes(q)) {
        results.push({
          type: 'subcategory',
          id: sub.id,
          name: sub.name[locale],
          parentId: category.id,
        });
      }
      if (sub.tags) {
        for (const tag of sub.tags) {
          if (tag.name[locale].toLowerCase().includes(q)) {
            results.push({
              type: 'tag',
              id: tag.id,
              name: tag.name[locale],
              parentId: category.id,
            });
          }
        }
      }
    }
  }

  return results;
}

/** Получить количество тегов в категории */
export function getTagCount(categoryId: string): number {
  const category = getCategoryById(categoryId);
  if (!category) return 0;
  return category.subcategories.reduce(
    (acc, sub) => acc + (sub.tags?.length || 0),
    0
  );
}
