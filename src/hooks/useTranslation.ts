'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

// Define translations inline to avoid JSON import issues
const translations = {
  ru: {
    navigation: {
      listings: 'Объявления',
      map: 'Карта',
      services: 'Услуги',
      companies: 'Компании',
      messages: 'Сообщения',
      createListing: 'Создать объявление',
    },
    home: {
      officialPlatform: 'Официальная цифровая платформа',
      title: 'Единая цифровая экосистема недропользования Казахстана',
      subtitle:
        'Инновационная платформа, обеспечивающая прозрачное взаимодействие между инвесторами, геологами, горнодобывающими компаниями и государственными органами. Способствуем цифровизации отрасли через комплексное управление лицензированием, разведкой и минеральными ресурсами.',
      viewListings: 'Смотреть объявления',
      postListing: 'Подать объявление',
      miningLicenses: 'Лицензии на добычу',
      miningLicensesDesc: 'Готовые к добыче лицензии',
      explorationLicenses: 'Лицензии на разведку',
      explorationLicensesDesc: 'Лицензии для геологической разведки',
      mineralOccurrences: 'Месторождения',
      mineralOccurrencesDesc: 'Обнаруженные месторождения полезных ископаемых',
      getStarted: 'Начать работу',
      getStartedDesc:
        'Присоединяйтесь к ведущей платформе горнодобывающей промышленности Казахстана',
      goToListings: 'К объявлениям',
      ourServices: 'Наши услуги',
      whyChooseUs: 'Почему выбирают нас',
      activeListings: 'Активных объявлений',
      kazakhstanRegions: 'Регионов Казахстана',
      verifiedCompanies: 'Проверенных компаний',
      customerSupport: 'Поддержка клиентов',
    },
    listings: {
      title: 'Месторождения полезных ископаемых',
      loading: 'Загрузка...',
      foundDeposits: 'Найдено {count} месторождений',
      depositsCount: '{count} месторождений',
      showingResults: 'Показано {count} результатов',
      pageInfo: 'страница {current} из {total}',
      filters: 'Фильтры',
      clearFilters: 'Очистить',
      smartSearch: 'Умный поиск',
      listingType: 'Тип объявления',
      allTypes: 'Все типы',
      miningLicenses: 'Лицензии на добычу',
      explorationLicenses: 'Лицензии на разведку',
      mineralOccurrences: 'Рудопроявления',
      priceRange: 'Цена (млрд ₸)',
      apply: 'Применить',
      region: 'Регион',
      mineral: 'Полезное ископаемое',
      verified: 'Проверено',
      onlineNow: '{count} человек смотрят сейчас',
      area: 'Площадь',
      license: 'Лицензия',
      active: 'Активно',
      openDate: 'Дата открытия',
      viewMode: {
        list: 'Список',
        map: 'Карта',
      },
    },
    footer: {
      company: {
        name: 'QAZNEDR.KZ',
        description:
          'Первая в Казахстане цифровая B2B платформа для горнодобывающей отрасли',
      },
      contact: {
        address: 'Алматы, Казахстан',
      },
      quickLinks: {
        title: 'Быстрые ссылки',
        news: 'Новости',
      },
      services: {
        title: 'Услуги',
        geological: 'Геологические услуги',
        legal: 'Юридические услуги',
        equipment: 'Оборудование',
        investors: 'Инвесторы',
      },
      legal: {
        title: 'Поддержка',
        terms: 'Условия использования',
        privacy: 'Политика конфиденциальности',
        support: 'Техподдержка',
        about: 'О нас',
      },
      language: {
        title: 'Язык',
      },
      industry: {
        regulatory: 'Соответствует стандартам недропользования РК',
        certified: 'Сертифицированная платформа',
      },
      copyright: '© 2025 QAZNEDR.KZ. Все права защищены.',
      poweredBy: 'Работает на',
    },
    errors: {
      somethingWentWrong: 'Что-то пошло не так',
      pageLoadError:
        'Произошла ошибка при загрузке этой части страницы. Мы уже уведомлены о проблеме.',
      reloadPage: 'Перезагрузить страницу',
      tryAgain: 'Попробовать снова',
      errorDetails: 'Детали ошибки (только в разработке)',
      loadingError: 'Ошибка загрузки',
      dataLoadFailed:
        'Не удалось загрузить данные. Попробуйте обновить страницу.',
    },
    map: {
      title: 'Карта месторождений Казахстана',
      subtitle: 'Используйте карту для поиска месторождений по регионам',
    },
    common: {
      dashboard: 'Личный кабинет',
      favorites: 'Избранное',
      logout: 'Выйти',
      menu: 'Меню',
      loading: 'Загрузка...',
      notSpecified: 'Не указан',
      search: 'Поиск',
      filter: 'Фильтр',
      close: 'Закрыть',
    },
    services: {
      hero: {
        title: 'Экосистема горнодобывающих услуг',
        subtitle:
          'Полный спектр профессиональных услуг для горнодобывающей отрасли Казахстана. От геологической разведки до инвестиционного сопровождения.',
        searchPlaceholder: 'Найдите нужную услугу или поставщика...',
      },
      sections: {
        categories: 'Категории услуг',
        categoriesSubtitle:
          'Выберите категорию услуг и найдите проверенных поставщиков в вашем регионе',
        informationCenter: 'Информационный центр',
        informationCenterSubtitle:
          'Актуальная информация, новости отрасли и база знаний для профессионалов',
      },
      labels: {
        providers: 'поставщиков',
        projects: 'проектов',
        materials: 'материалов',
        viewAll: 'Смотреть все',
      },
      cta: {
        title: 'Хотите разместить свои услуги?',
        subtitle:
          'Присоединяйтесь к нашей экосистеме и найдите новых клиентов в горнодобывающей отрасли Казахстана',
        listServices: 'Разместить услуги',
        contactUs: 'Связаться с нами',
      },
      knowledge: {
        knowledgeBase: 'База знаний',
        knowledgeBaseDesc: 'Техническая документация, стандарты, регламенты',
        industryNews: 'Новости отрасли',
        industryNewsDesc:
          'Актуальные новости горнодобывающей промышленности Казахстана',
        materials: 'материалов',
      },
      stats: {
        providers: 'поставщиков',
        projects: 'проектов',
        viewAll: 'Смотреть все',
      },
      categories: {
        drilling: 'Бурение',
        exploration: 'Геологоразведка',
        consulting: 'Консалтинг',
        logistics: 'Логистика',
        equipment: 'Оборудование',
        legal: 'Юридические услуги',
        environmental: 'Экология',
        construction: 'Строительство',
        geological: 'Геологические услуги',
        investors: 'Инвестиционные услуги',
      },
      titles: {
        geological: 'Геологические услуги',
        equipment: 'Аренда оборудования',
        legal: 'Юридические услуги',
        investors: 'Инвестиционные услуги',
      },
      descriptions: {
        geological: 'Геологоразведка, картографирование, анализ проб',
        equipment: 'Буровые установки, экскаваторы, транспорт',
        legal: 'Горное право, лицензирование, сопровождение сделок',
        investors: 'Поиск инвестиций, оценка проектов, финансирование',
      },
    },
    companies: {
      title: 'Каталог компаний',
      description:
        'Найдите надежных партнеров и поставщиков услуг в горнодобывающей отрасли',
      searchPlaceholder: 'Поиск компаний и услуг...',
      stats: {
        companies: 'Компаний',
        verified: 'Проверенных',
        services: 'Услуг',
      },
      filters: {
        categories: 'Категории услуг',
        verifiedOnly: 'Только проверенные',
        addCompany: 'Добавить компанию',
        allCategories: 'Все категории',
      },
      noResults: {
        title: 'Компании не найдены',
        description: 'Попробуйте изменить параметры поиска или фильтры',
        registerButton: 'Зарегистрировать компанию',
      },
    },
    details: {
      mineralOccurrence: {
        title: 'Информация о рудопроявлении',
        discoveryDate: 'Дата открытия',
        reserveConfidence: 'Достоверность запасов',
        estimatedReserves: 'Оценочные запасы',
        mineral: 'Полезное ископаемое',
        area: 'Площадь участка',
        status: 'Статус участка',
        tons: 'тонн',
        kmSquared: 'км²',
        statusBadge: 'Рудопроявление',
        investmentPotential: 'Инвестиционный потенциал',
        confidence: {
          inferred: 'Предполагаемые',
          indicated: 'Вероятные',
          measured: 'Достоверные',
          notDetermined: 'Не определена',
        },
        accessibility: {
          easy: 'Легкий доступ',
          moderate: 'Умеренный доступ',
          difficult: 'Сложный доступ',
          veryDifficult: 'Очень сложный доступ',
          notAssessed: 'Не оценен',
          easyDesc: 'Хорошая транспортная доступность, развитая инфраструктура',
          moderateDesc:
            'Умеренная доступность, потребуется развитие инфраструктуры',
          difficultDesc: 'Ограниченная доступность, сложная логистика',
          veryDifficultDesc:
            'Крайне сложная доступность, требует значительных инвестиций',
        },
        investmentPoints: {
          exploration: 'Возможность дальнейшей разведки и оценки запасов',
          research: 'Потенциал для научных исследований',
          investment: 'База для инвестиционных решений',
          infrastructure: 'Планирование инфраструктурных проектов',
          environmental: 'Соблюдение требований экологической безопасности',
        },
      },
      explorationLicense: {
        title: 'Информация о лицензии на разведку',
        stage: 'Стадия разведки',
        period: 'Период проведения работ',
        budget: 'Бюджет разведки',
        area: 'Площадь участка',
        mineral: 'Полезное ископаемое',
        status: 'Статус участка',
        statusBadge: 'Разведка',
        start: 'Начало',
        end: 'Окончание',
        million: 'млн ₸',
        kmSquared: 'км²',
        stages: {
          preliminary: 'Предварительная разведка',
          detailed: 'Детальная разведка',
          feasibility: 'Технико-экономическое обоснование',
          environmental: 'Экологическая оценка',
          notSpecified: 'Не указан',
        },
        stageDescriptions: {
          preliminary: 'Изучение общих геологических условий и перспектив',
          detailed:
            'Детальное изучение запасов и подготовка к промышленной добыче',
          feasibility: 'Экономическая оценка рентабельности проекта',
          environmental: 'Оценка воздействия на окружающую среду',
        },
        requirements: {
          title: 'Особенности разведочных работ',
          geological: 'Геологическое изучение месторождения',
          assessment: 'Оценка запасов полезных ископаемых',
          monitoring: 'Экологический мониторинг',
          documentation: 'Подготовка технической документации',
          compliance: 'Соблюдение требований недропользования',
        },
      },
    },
  },
  kz: {
    navigation: {
      listings: 'Хабарландырулар',
      map: 'Карта',
      services: 'Қызметтер',
      companies: 'Компаниялар',
      messages: 'Хабарлар',
      createListing: 'Хабарландыру құру',
    },
    home: {
      officialPlatform: 'Ресми цифрлық платформа',
      title: 'Қазақстанның бірыңғай цифрлық недропайдалану экожүйесі',
      subtitle:
        'Инвесторлар, геологтар, тау-кен компаниялары мен мемлекеттік органдар арасында ашық ынтымақтастықты қамтамасыз ететін инновациялық платформа. Лицензиялау, барлау және минералдық қорларды басқарудың кешенді жүйесі арқылы салаға цифрландыруды дамытамыз.',
      viewListings: 'Хабарландыруларды көру',
      postListing: 'Хабарландыру беру',
      miningLicenses: 'Өндіру лицензиялары',
      miningLicensesDesc: 'Өндіруге дайын лицензиялар',
      explorationLicenses: 'Барлау лицензиялары',
      explorationLicensesDesc: 'Геологиялық барлау лицензиялары',
      mineralOccurrences: 'Кен орындары',
      mineralOccurrencesDesc: 'Табылған пайдалы қазба кен орындары',
      getStarted: 'Жұмысты бастау',
      getStartedDesc:
        'Қазақстанның жетекші тау-кен өнеркәсібі платформасына қосылыңыз',
      goToListings: 'Хабарландыруларға',
      ourServices: 'Біздің қызметтер',
      whyChooseUs: 'Неліктен бізді таңдайды',
      activeListings: 'Белсенді хабарландырулар',
      kazakhstanRegions: 'Қазақстан аймақтары',
      verifiedCompanies: 'Тексерілген компаниялар',
      customerSupport: 'Тұтынушыларды қолдау',
    },
    listings: {
      title: 'Пайдалы қазбалар кен орындары',
      loading: 'Жүктелуде...',
      foundDeposits: '{count} кен орны табылды',
      depositsCount: '{count} кен орны',
      showingResults: '{count} нәтиже көрсетілуде',
      pageInfo: '{current} бет {total} беттен',
      filters: 'Сүзгілер',
      clearFilters: 'Тазалау',
      smartSearch: 'Ақылды іздеу',
      listingType: 'Хабарландыру түрі',
      allTypes: 'Барлық түрлер',
      miningLicenses: 'Өндіру лицензиялары',
      explorationLicenses: 'Барлау лицензиялары',
      mineralOccurrences: 'Рудопроявления',
      priceRange: 'Баға (млрд ₸)',
      apply: 'Қолдану',
      region: 'Аймақ',
      mineral: 'Пайдалы қазба',
      verified: 'Тексерілген',
      onlineNow: '{count} адам қазір қарап отыр',
      area: 'Аудан',
      license: 'Лицензия',
      active: 'Белсенді',
      openDate: 'Ашылу күні',
      viewMode: {
        list: 'Тізім',
        map: 'Карта',
      },
    },
    footer: {
      company: {
        name: 'QAZNEDR.KZ',
        description:
          'Қазақстандағы тау-кен өнеркәсібіне арналған алғашқы цифрлық B2B платформа',
      },
      contact: {
        address: 'Алматы, Қазақстан',
      },
      quickLinks: {
        title: 'Жедел сілтемелер',
        news: 'Жаңалықтар',
      },
      services: {
        title: 'Қызметтер',
        geological: 'Геологиялық қызметтер',
        legal: 'Заң қызметтері',
        equipment: 'Жабдық',
        investors: 'Инвесторлар',
      },
      legal: {
        title: 'Қолдау',
        terms: 'Пайдалану шарттары',
        privacy: 'Құпиялылық саясаты',
        support: 'Техникалық қолдау',
        about: 'Біз туралы',
      },
      language: {
        title: 'Тіл',
      },
      industry: {
        regulatory: 'ҚР недропайдалану стандарттарына сәйкес',
        certified: 'Сертификатталған платформа',
      },
      copyright: '© 2025 QAZNEDR.KZ. Барлық құқықтар қорғалған.',
      poweredBy: 'Жұмысістейді',
    },
    errors: {
      somethingWentWrong: 'Бірдеңе дұрыс болмады',
      pageLoadError:
        'Бұл беттің бөлігін жүктеу кезінде қате пайда болды. Біз мәселе туралы хабардармыз.',
      reloadPage: 'Бетті қайта жүктеу',
      tryAgain: 'Қайталап көру',
      errorDetails: 'Қате мәліметтері (тек әзірлеуде)',
      loadingError: 'Жүктеу қатесі',
      dataLoadFailed:
        'Деректерді жүктеу мүмкін болмады. Бетті жаңартып көріңіз.',
    },
    map: {
      title: 'Қазақстанның кен орындарының картасы',
      subtitle:
        'Аймақтар бойынша кен орындарын іздеу үшін картаны пайдаланыңыз',
    },
    common: {
      dashboard: 'Жеке кабинет',
      favorites: 'Таңдаулылар',
      logout: 'Шығу',
      menu: 'Мәзір',
      loading: 'Жүктелуде...',
      notSpecified: 'Көрсетілмеген',
      search: 'Іздеу',
      filter: 'Сүзгі',
      close: 'Жабу',
    },
    services: {
      categories: {
        drilling: 'Бұрғылау',
        exploration: 'Геологиялық барлау',
        consulting: 'Консалтинг',
        logistics: 'Логистика',
        equipment: 'Жабдық',
        legal: 'Заң қызметтері',
        environmental: 'Экология',
        construction: 'Құрылыс',
        geological: 'Геологиялық қызметтер',
        investors: 'Инвестициялық қызметтер',
      },
      titles: {
        geological: 'Геологиялық қызметтер',
        equipment: 'Жабдық жалға беру',
        legal: 'Заң қызметтері',
        investors: 'Инвестициялық қызметтер',
      },
      descriptions: {
        geological: 'Геологиялық барлау, картографиялау, үлгі талдау',
        equipment: 'Бұрғылау қондырғылары, экскаваторлар, көлік',
        legal: 'Тау-кен құқығы, лицензиялау, мәмілелерді сүйемелдеу',
        investors: 'Инвестиция іздеу, жобаларды бағалау, қаржыландыру',
      },
      labels: {
        providers: 'жеткізушілер',
        projects: 'жобалар',
        materials: 'материалдар',
        viewAll: 'Барлығын көру',
      },
      cta: {
        title: 'Қызметтеріңізді орналастырғыңыз келе ме?',
        description:
          'Біздің экожүйеге қосылыңыз және Қазақстанның тау-кен өнеркәсібінде жаңа клиенттерді табыңыз',
        postService: 'Қызметтерді орналастыру',
        contactUs: 'Бізбен байланысыңыз',
      },
    },
    companies: {
      title: 'Компаниялар каталогы',
      description:
        'Тау-кен өнеркәсібінде сенімді серіктестер мен қызмет көрсетушілерді табыңыз',
      searchPlaceholder: 'Компаниялар мен қызметтерді іздеу...',
      stats: {
        companies: 'Компаниялар',
        verified: 'Тексерілген',
        services: 'Қызметтер',
      },
      filters: {
        categories: 'Қызмет категориялары',
        verifiedOnly: 'Тек тексерілген',
        addCompany: 'Компания қосу',
        allCategories: 'Барлық категориялар',
      },
      noResults: {
        title: 'Компаниялар табылмады',
        description: 'Іздеу параметрлері немесе сүзгілерді өзгертіп көріңіз',
        registerButton: 'Компанияны тіркеу',
      },
    },
  },
  en: {
    navigation: {
      listings: 'Listings',
      map: 'Map',
      services: 'Services',
      companies: 'Companies',
      messages: 'Messages',
      createListing: 'Create Listing',
    },
    home: {
      officialPlatform: 'Official Digital Platform',
      title: "Kazakhstan's Unified Digital Subsoil Use Ecosystem",
      subtitle:
        'Innovative platform ensuring transparent cooperation between investors, geologists, mining companies and government agencies. We promote industry digitalization through comprehensive management of licensing, exploration and mineral resources.',
      viewListings: 'View Listings',
      postListing: 'Post Listing',
      miningLicenses: 'Mining Licenses',
      miningLicensesDesc: 'Rights to mineral extraction',
      explorationLicenses: 'Exploration Licenses',
      explorationLicensesDesc: 'Geological exploration permits',
      mineralOccurrences: 'Mineral Occurrences',
      mineralOccurrencesDesc: 'Documented mineral findings',
      getStarted: 'Get Started',
      getStartedDesc: 'Join our platform and discover new opportunities',
      goToListings: 'Go to Listings',
      ourServices: 'Our Services',
      whyChooseUs: 'Why Choose Us',
      activeListings: 'Active Listings',
      kazakhstanRegions: 'Kazakhstan Regions',
      verifiedCompanies: 'Verified Companies',
      customerSupport: 'Customer Support',
    },
    listings: {
      title: 'Mineral Deposits',
      loading: 'Loading...',
      foundDeposits: 'Found {count} deposits',
      depositsCount: '{count} deposits',
      showingResults: 'Showing {count} results',
      pageInfo: 'page {current} of {total}',
      filters: 'Filters',
      clearFilters: 'Clear',
      smartSearch: 'Smart Search',
      listingType: 'Listing Type',
      allTypes: 'All Types',
      miningLicenses: 'Mining Licenses',
      explorationLicenses: 'Exploration Licenses',
      mineralOccurrences: 'Mineral Occurrences',
      priceRange: 'Price (billion ₸)',
      apply: 'Apply',
      region: 'Region',
      mineral: 'Mineral',
      verified: 'Verified',
      onlineNow: '{count} people viewing now',
      area: 'Area',
      license: 'License',
      active: 'Active',
      openDate: 'Open Date',
      viewMode: {
        list: 'List',
        map: 'Map',
      },
    },
    footer: {
      company: {
        name: 'QAZNEDR.KZ',
        description:
          "Kazakhstan's first digital B2B platform for the mining industry",
      },
      contact: {
        address: 'Almaty, Kazakhstan',
      },
      quickLinks: {
        title: 'Quick Links',
        news: 'News',
      },
      services: {
        title: 'Services',
        geological: 'Geological Services',
        legal: 'Legal Services',
        equipment: 'Equipment',
        investors: 'Investors',
      },
      legal: {
        title: 'Support',
        terms: 'Terms of Use',
        privacy: 'Privacy Policy',
        support: 'Technical Support',
        about: 'About Us',
      },
      language: {
        title: 'Language',
      },
      industry: {
        regulatory: 'Complies with RK subsoil use standards',
        certified: 'Certified platform',
      },
      copyright: '© 2025 QAZNEDR.KZ. All rights reserved.',
      poweredBy: 'Powered by',
    },
    errors: {
      somethingWentWrong: 'Something went wrong',
      pageLoadError:
        'An error occurred while loading this part of the page. We have been notified of the issue.',
      reloadPage: 'Reload Page',
      tryAgain: 'Try Again',
      errorDetails: 'Error details (development only)',
      loadingError: 'Loading Error',
      dataLoadFailed: 'Failed to load data. Please try refreshing the page.',
    },
    map: {
      title: 'Kazakhstan Mineral Deposits Map',
      subtitle: 'Use the map to search for deposits by regions',
    },
    common: {
      dashboard: 'Dashboard',
      favorites: 'Favorites',
      logout: 'Logout',
      menu: 'Menu',
      loading: 'Loading...',
      notSpecified: 'Not specified',
      search: 'Search',
      filter: 'Filter',
      close: 'Close',
    },
    services: {
      categories: {
        drilling: 'Drilling',
        exploration: 'Geological Exploration',
        consulting: 'Consulting',
        logistics: 'Logistics',
        equipment: 'Equipment',
        legal: 'Legal Services',
        environmental: 'Environmental',
        construction: 'Construction',
        geological: 'Geological Services',
        investors: 'Investment Services',
      },
      titles: {
        geological: 'Geological Services',
        equipment: 'Equipment Rental',
        legal: 'Legal Services',
        investors: 'Investment Services',
      },
      descriptions: {
        geological: 'Geological exploration, mapping, sample analysis',
        equipment: 'Drilling rigs, excavators, transport',
        legal: 'Mining law, licensing, transaction support',
        investors: 'Investment search, project evaluation, financing',
      },
      labels: {
        providers: 'providers',
        projects: 'projects',
        materials: 'materials',
        viewAll: 'View All',
      },
      cta: {
        title: 'Want to list your services?',
        description:
          "Join our ecosystem and find new clients in Kazakhstan's mining industry",
        postService: 'Post Services',
        contactUs: 'Contact Us',
      },
    },
    companies: {
      title: 'Company Directory',
      description:
        'Find reliable partners and service providers in the mining industry',
      searchPlaceholder: 'Search companies and services...',
      stats: {
        companies: 'Companies',
        verified: 'Verified',
        services: 'Services',
      },
      filters: {
        categories: 'Service Categories',
        verifiedOnly: 'Verified only',
        addCompany: 'Add Company',
        allCategories: 'All Categories',
      },
      noResults: {
        title: 'No companies found',
        description: 'Try changing your search parameters or filters',
        registerButton: 'Register Company',
      },
    },
  },
  zh: {
    navigation: {
      listings: '发布信息',
      map: '地图',
      services: '服务',
      companies: '公司',
      messages: '消息',
      createListing: '创建发布',
    },
    home: {
      officialPlatform: '官方数字化平台',
      title: '哈萨克斯坦统一数字化地下资源生态系统',
      subtitle:
        '促进投资者、地质学家、矿业公司与政府机构透明协作的创新平台。通过全面的许可证管理、勘探和矿物资源分析，推动行业数字化转型。',
      viewListings: '查看列表',
      postListing: '发布信息',
      miningLicenses: '采矿许可证',
      miningLicensesDesc: '矿物开采权',
      explorationLicenses: '勘探许可证',
      explorationLicensesDesc: '地质勘探许可',
      mineralOccurrences: '矿物产出',
      mineralOccurrencesDesc: '记录的矿物发现',
      getStarted: '开始使用',
      getStartedDesc: '加入我们的平台，发现新机遇',
      goToListings: '前往列表',
      ourServices: '我们的服务',
      whyChooseUs: '为什么选择我们',
      activeListings: '活跃列表',
      kazakhstanRegions: '哈萨克斯坦地区',
      verifiedCompanies: '认证公司',
      customerSupport: '客户支持',
    },
    listings: {
      title: '矿物资源',
      loading: '加载中...',
      foundDeposits: '找到 {count} 个矿藏',
      depositsCount: '{count} 个矿藏',
      showingResults: '显示 {count} 个结果',
      pageInfo: '第 {current} 页，共 {total} 页',
      filters: '筛选器',
      clearFilters: '清除',
      smartSearch: '智能搜索',
      listingType: '发布类型',
      allTypes: '所有类型',
      miningLicenses: '开采许可证',
      explorationLicenses: '勘探许可证',
      mineralOccurrences: '矿点',
      priceRange: '价格（十亿坚戈）',
      apply: '应用',
      region: '地区',
      mineral: '矿物',
      verified: '已验证',
      onlineNow: '{count} 人正在查看',
      area: '面积',
      license: '许可证',
      active: '活跃',
      openDate: '开放日期',
      viewMode: {
        list: '列表',
        map: '地图',
      },
    },
    footer: {
      company: {
        name: 'QAZNEDR.KZ',
        description: '哈萨克斯坦首个采矿业数字B2B平台',
      },
      contact: {
        address: '阿拉木图，哈萨克斯坦',
      },
      quickLinks: {
        title: '快速链接',
        news: '新闻',
      },
      services: {
        title: '服务',
        geological: '地质服务',
        legal: '法律服务',
        equipment: '设备',
        investors: '投资者',
      },
      legal: {
        title: '支持',
        terms: '使用条款',
        privacy: '隐私政策',
        support: '技术支持',
        about: '关于我们',
      },
      language: {
        title: '语言',
      },
      industry: {
        regulatory: '符合哈萨克斯坦地下资源利用标准',
        certified: '认证平台',
      },
      copyright: '© 2025 QAZNEDR.KZ。保留所有权利。',
      poweredBy: '技术支持',
    },
    errors: {
      somethingWentWrong: '出现了问题',
      pageLoadError: '加载页面时发生错误。我们已收到通知。',
      reloadPage: '重新加载页面',
      tryAgain: '重试',
      errorDetails: '错误详情（仅限开发）',
      loadingError: '加载错误',
      dataLoadFailed: '数据加载失败。请尝试刷新页面。',
    },
    map: {
      title: '哈萨克斯坦矿物资源分布图',
      subtitle: '使用地图按地区搜索矿物资源',
    },
    common: {
      dashboard: '仪表板',
      favorites: '收藏夹',
      logout: '登出',
      menu: '菜单',
      loading: '加载中...',
      notSpecified: '未指定',
      search: '搜索',
      filter: '筛选',
      close: '关闭',
    },
    services: {
      categories: {
        drilling: '钻探',
        exploration: '地质勘探',
        consulting: '咨询',
        logistics: '物流',
        equipment: '设备',
        legal: '法律服务',
        environmental: '环境',
        construction: '建设',
        geological: '地质服务',
        investors: '投资服务',
      },
      titles: {
        geological: '地质服务',
        equipment: '设备租赁',
        legal: '法律服务',
        investors: '投资服务',
      },
      descriptions: {
        geological: '地质勘探、制图、样品分析',
        equipment: '钻机、挖掘机、运输',
        legal: '矿业法、许可证、交易支持',
        investors: '投资寻找、项目评估、融资',
      },
      labels: {
        providers: '供应商',
        projects: '项目',
        materials: '资料',
        viewAll: '查看全部',
      },
      cta: {
        title: '想要发布您的服务吗？',
        description: '加入我们的生态系统，在哈萨克斯坦采矿业中寻找新客户',
        postService: '发布服务',
        contactUs: '联系我们',
      },
    },
    companies: {
      title: '公司目录',
      description: '在采矿业中寻找可靠的合作伙伴和服务提供商',
      searchPlaceholder: '搜索公司和服务...',
      stats: {
        companies: '公司',
        verified: '已验证',
        services: '服务',
      },
      filters: {
        categories: '服务类别',
        verifiedOnly: '仅已验证',
        addCompany: '添加公司',
        allCategories: '所有类别',
      },
      noResults: {
        title: '未找到公司',
        description: '尝试更改搜索参数或过滤器',
        registerButton: '注册公司',
      },
    },
  },
};

type TranslationKeys = typeof translations.ru;

export function useTranslation() {
  const pathname = usePathname();

  const locale = useMemo(() => {
    const segments = pathname.split('/');
    const localeFromPath = segments[1];
    return ['ru', 'kz', 'en', 'zh'].includes(localeFromPath)
      ? localeFromPath
      : 'ru';
  }, [pathname]);

  const t = useMemo(() => {
    const currentTranslations =
      (translations as any)[locale] || translations.ru;

    return function translate(
      key: string,
      params?: Record<string, any>
    ): string {
      const keys = key.split('.');
      let current: any = currentTranslations;

      for (const keyPart of keys) {
        if (current && typeof current === 'object' && keyPart in current) {
          current = current[keyPart];
        } else {
          // Fallback to Russian if key not found
          let fallback: any = translations.ru;
          for (const keyPart of keys) {
            if (
              fallback &&
              typeof fallback === 'object' &&
              keyPart in fallback
            ) {
              fallback = fallback[keyPart];
            } else {
              return key; // Return key itself if not found
            }
          }
          current = fallback;
          break;
        }
      }

      let result = typeof current === 'string' ? current : key;

      // Handle parameter interpolation
      if (params && typeof result === 'string') {
        Object.entries(params).forEach(([paramKey, value]) => {
          result = result.replace(
            new RegExp(`\\{${paramKey}\\}`, 'g'),
            String(value)
          );
        });
      }

      return result;
    };
  }, [locale]);

  return {
    t,
    locale,
  };
}
