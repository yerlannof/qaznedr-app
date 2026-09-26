# QAZNEDR HOLDING, Фаза 1 «Быстрые победы»: план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** один деплой, после которого:

- у каждой публичной страницы свои локализованные title, description и canonical;
- маркетплейс скрыт;
- иностранец пишет в WeChat или WhatsApp либо отправляет заявку без регистрации, заявка приходит в Telegram и в админку;
- владелец снова может войти в админку.

**Architecture:**

- **SEO.** Единый модуль `src/lib/seo/` (site, metadata, pages, lead-metadata). Тексты берутся из `src/lib/i18n/translations.ts` через существующий `getServerTranslation`.
- **Скрытие маркетплейса.** Один реестр маршрутов (`pages.ts`) используют middleware (308-редиректы), sitemap и тесты.
- **Заявки.** Таблица Supabase `inquiries` без публичного доступа. Публичный `POST /api/inquiries` (zod + honeypot + throttle в памяти) пишет через service role и шлёт уведомление в Telegram.
- **Админ-доступ.** Вход владельца через env-учётку, потому что таблицы `users` в Supabase нет.

**Tech Stack:** Next.js 15.5 App Router, TypeScript, Tailwind v3, Supabase (Postgres, service role), NextAuth (credentials), zod 4, bcryptjs, @vercel/analytics, Jest 29 + Testing Library (jsdom; API-тесты с `@jest-environment node`).

**Spec:** `docs/superpowers/specs/2026-09-26-qaznedr-holding-pivot-design.md` (разделы 4, 5, 6.1, 8 «Фаза 1»).

## Global Constraints

- Адрес сайта: `SITE_URL = 'https://qaznedr.kz'` (без www). Бренд в заголовках: `QAZNEDR HOLDING`.
- Локали в URL: `ru | kz | en | zh`. Коды языка: `ru`, `kk`, `en`, `zh-CN`.
- **Красные линии текста.** Не писать, что участок принадлежит холдингу. Не писать, что продаём архивные отчёты. Никакой «гарантированной доходности». Формула: «геология изучена по архивным отчётам, лицензию оформим под сделку».
- **Дизайн-система.** Иконки только Lucide, эмодзи нет. Главные кнопки чёрные (`bg-gray-900`). Акценты gold. Без градиентов. Анимации только лёгкие hover.
- **В коде нет `console.*`** (правило CLAUDE.md).
- **Данные участков публикует только геобаза** (сессия «50 точек», гейт выдачи + «да» Ерлана). Сайт сам точки не пушит и в `leads` не пишет.
- **Правила текста Ерлана:** спайк не равен среднему; P1–P3 — прогноз, а не запасы; слабое не хвалить; не упоминать OCR, агентов и модели — это труд наших геологов.
- **Секреты только в env.** Номера, ID, токены в код не зашивать. Пустое значение означает, что функция тихо выключена.
- **Для Supabase-таблиц без сгенерированных типов** использовать приведение `(svc as any)`, как принято в проекте.
- **Базовая линия тестов на 2026-09-26.** Уже падают 6 legacy-наборов: `MiningLicenseCard`, `CreateListingWizard`, `ListingsFilters`, `ThemeToggle`, `app/api/listings/__tests__/route`, `lib/middleware/__tests__/csrf`. Их не чиним. Новых падений быть не должно.
- **Команды тестов:** `npx jest <path> --coverage=false`.
- **Работа идёт в ветке `feat/holding-phase1`.** В конце — fast-forward в `master`, деплой, push.

## Review Focus

1. **Встроенный браузер WeChat без `navigator.clipboard`.** Кнопка «复制» не должна падать, ID остаётся виден и выделяем. Тест в Task 5.
2. **В проде не заданы контактные env.** Нет битых `wa.me` и пустых QR: канал просто не рендерится, форма остаётся. Тест в Task 5.
3. **Боты и двойной клик заваливают Telegram.** Honeypot и время заполнения меньше 2 с означают тихий отказ. Больше 5 заявок за 10 минут с одного IP дают 429. Кнопка заблокирована во время отправки. Тесты в Task 6 и 7.
4. **Редиректы скрытых разделов не должны задевать похожие пути.** `/ru/admin/listings`, `/ru/services/geological`, `/ru/listingsx`, `/ru/auth/login` остаются. Локаль сохраняется. Тест в Task 3.
5. **Регион или металл участка не распознан** (`'Центральный Казахстан'`, `mineral = null`). В китайском и английском title не должно быть кириллицы, код не должен падать. Тест в Task 2.
6. **Telegram недоступен.** Заявка всё равно сохраняется, пользователь видит успех. Тест в Task 6.

---

## Карта файлов

| Файл                                                                          | Ответственность                                                                |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/lib/seo/site.ts` (new)                                                   | SITE_URL, локали, коды языков, `localeUrl`                                     |
| `src/lib/seo/metadata.ts` (new)                                               | `buildPageMetadata`, `buildTranslatedPageMetadata`, `buildLanguageAlternates`  |
| `src/lib/seo/pages.ts` (new)                                                  | `PUBLIC_PAGES`, `HIDDEN_ROUTE_REDIRECTS`, `hiddenRouteRedirect`                |
| `src/lib/seo/lead-metadata.ts` (new)                                          | Локализованные title и description участка                                     |
| `src/lib/config/contacts.ts` (new)                                            | Контакты из env                                                                |
| `src/lib/inquiries/{schema,throttle,notify}.ts` (new)                         | Валидация, антиспам, Telegram                                                  |
| `src/lib/auth/env-admin.ts` (new)                                             | Вход владельца по env                                                          |
| `src/components/features/ContactChannels.tsx` (new)                           | WeChat, WhatsApp, email                                                        |
| `src/components/features/InquiryForm.tsx` (new)                               | Форма заявки                                                                   |
| `src/components/features/HomePageContent.tsx` (moved)                         | Бывший клиентский `[locale]/page.tsx`                                          |
| `src/app/api/inquiries/route.ts` (new)                                        | Публичный POST                                                                 |
| `src/app/api/admin/inquiries/route.ts` (new)                                  | GET и PATCH для админки                                                        |
| `src/app/[locale]/contact/page.tsx` (new)                                     | Страница контактов                                                             |
| `src/app/[locale]/admin/inquiries/page.tsx` (new)                             | Входящие заявки                                                                |
| `supabase/migrations/20260926_inquiries.sql` (new)                            | Таблица `inquiries`                                                            |
| `src/lib/i18n/translations.ts`                                                | Пространства имён `seo`, `contact`, `inquiry` и 4 ключа `navigation` × 4 языка |
| `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, 12 файлов страниц | Метаданные через помощник                                                      |
| `src/app/sitemap.ts`, `src/app/robots.ts`, `middleware.ts`                    | SEO и редиректы                                                                |
| `src/components/layouts/{Navigation,MobileTabBar,Footer}.tsx`                 | Меню без маркетплейса                                                          |
| `src/lib/data/filter-config.ts`                                               | Новые регионы: Абай, Жетісу, Ұлытау                                            |
| `src/lib/services/auth.config.ts`, `src/lib/auth/admin.ts`                    | Env-админ                                                                      |
| `src/app/[locale]/leads/[code]/page.tsx`                                      | Кнопка «Обсудить участок», форма, каналы связи                                 |
| `src/app/[locale]/admin/page.tsx`                                             | Плитка «Заявки»                                                                |
| `public/llms.txt`, `.env.example`                                             | Бренд и env                                                                    |

---

### Task 0: Ветка

- [ ] **Step 1:**

```bash
cd ~/Documents/qaznedr-app && git checkout -b feat/holding-phase1
```

---

### Task 1: SEO-основа и тексты `seo` на 4 языках

**Files:**

- Create: `src/lib/seo/site.ts`, `src/lib/seo/metadata.ts`
- Modify: `src/lib/i18n/translations.ts` (вставка `seo` в каждый локальный объект)
- Test: `src/__tests__/lib/seo/metadata.test.ts`, `src/__tests__/lib/i18n/holding-keys.test.ts`

**Interfaces:**

- Produces: `SITE_URL`, `SITE_NAME`, `LOCALES`, `type Locale`, `DEFAULT_LOCALE`, `HREFLANG`, `OG_LOCALE`, `isLocale(v)`, `toLocale(v): Locale`, `localeUrl(locale, path?)`.
- Также: `buildLanguageAlternates(path): Record<string,string>`, `buildPageMetadata(input: PageMetadataInput): Metadata`, `buildTranslatedPageMetadata(localeParam: string, path: string, seoKey: string, options?: { absoluteTitle?: boolean; noindex?: boolean }): Metadata`.
- Ключи переводов: `seo.<page>.title|description` для page ∈ `site, home, leads, services, servicesGeological, servicesLegal, servicesInvestors, about, contact, faq, support, terms, blog, education, knowledge, news`, плюс `seo.lead.{title, descriptionFree, descriptionOther, where, whereNone, notFound}`.

- [ ] **Step 1: Написать падающие тесты**

`src/__tests__/lib/seo/metadata.test.ts`:

```ts
import { HREFLANG, localeUrl, toLocale } from '@/lib/seo/site';
import {
  buildLanguageAlternates,
  buildPageMetadata,
  buildTranslatedPageMetadata,
} from '@/lib/seo/metadata';

describe('seo/site', () => {
  it('builds locale urls without trailing slash', () => {
    expect(localeUrl('zh')).toBe('https://qaznedr.kz/zh');
    expect(localeUrl('en', '/leads/')).toBe('https://qaznedr.kz/en/leads');
    expect(localeUrl('ru', 'about')).toBe('https://qaznedr.kz/ru/about');
  });

  it('falls back to ru for unknown locales', () => {
    expect(toLocale('de')).toBe('ru');
    expect(toLocale(undefined)).toBe('ru');
    expect(toLocale('zh')).toBe('zh');
  });

  it('uses zh-CN and kk as language codes', () => {
    expect(HREFLANG.zh).toBe('zh-CN');
    expect(HREFLANG.kz).toBe('kk');
  });
});

describe('seo/metadata', () => {
  it('lists every locale plus x-default in alternates', () => {
    expect(buildLanguageAlternates('/leads')).toEqual({
      ru: 'https://qaznedr.kz/ru/leads',
      kk: 'https://qaznedr.kz/kz/leads',
      en: 'https://qaznedr.kz/en/leads',
      'zh-CN': 'https://qaznedr.kz/zh/leads',
      'x-default': 'https://qaznedr.kz/ru/leads',
    });
  });

  it('sets a self-referencing canonical and branded OG title', () => {
    const m = buildPageMetadata({
      locale: 'en',
      path: '/about',
      title: 'About',
      description: 'd',
    });
    expect(m.alternates?.canonical).toBe('https://qaznedr.kz/en/about');
    expect(m.title).toBe('About');
    expect((m.openGraph as { title: string }).title).toBe(
      'About | QAZNEDR HOLDING'
    );
    expect((m.openGraph as { locale: string }).locale).toBe('en_US');
    expect(m.robots).toEqual({ index: true, follow: true });
  });

  it('supports absolute titles and noindex', () => {
    const m = buildPageMetadata({
      locale: 'ru',
      path: '',
      title: 'Home',
      description: 'd',
      absoluteTitle: true,
      noindex: true,
    });
    expect(m.title).toEqual({ absolute: 'Home' });
    expect(m.alternates?.canonical).toBe('https://qaznedr.kz/ru');
    expect(m.robots).toEqual({ index: false, follow: false });
  });

  it('reads localized strings from translations', () => {
    const zh = buildTranslatedPageMetadata('zh', '/leads', 'leads');
    const ru = buildTranslatedPageMetadata('ru', '/leads', 'leads');
    expect(String(zh.title)).toMatch(/[一-鿿]/);
    expect(zh.title).not.toEqual(ru.title);
    expect(zh.alternates?.canonical).toBe('https://qaznedr.kz/zh/leads');
  });
});
```

`src/__tests__/lib/i18n/holding-keys.test.ts`:

```ts
import { translate } from '@/lib/i18n/translations';

const SEO_PAGES = [
  'site',
  'home',
  'leads',
  'services',
  'servicesGeological',
  'servicesLegal',
  'servicesInvestors',
  'about',
  'contact',
  'faq',
  'support',
  'terms',
  'blog',
  'education',
  'knowledge',
  'news',
];

const SEO_KEYS = [
  ...SEO_PAGES.flatMap((p) => [`seo.${p}.title`, `seo.${p}.description`]),
  'seo.lead.title',
  'seo.lead.descriptionFree',
  'seo.lead.descriptionOther',
  'seo.lead.where',
  'seo.lead.notFound',
];

// Later tasks append their namespaces here.
const KEYS: string[] = [...SEO_KEYS];

describe.each(['ru', 'kz', 'en', 'zh'])('%s holding translations', (locale) => {
  it.each(KEYS)('%s exists', (key) => {
    expect(translate(locale, key)).not.toBe(key);
  });

  if (locale !== 'ru') {
    it.each(KEYS)('%s is translated (differs from ru)', (key) => {
      expect(translate(locale, key)).not.toBe(translate('ru', key));
    });
  }
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `npx jest src/__tests__/lib/seo/metadata.test.ts src/__tests__/lib/i18n/holding-keys.test.ts --coverage=false`
Expected: FAIL — `Cannot find module '@/lib/seo/site'`, и ключи `seo.*` возвращают сам ключ.

- [ ] **Step 3: Создать `src/lib/seo/site.ts`**

```ts
// Single source of truth for the public site URL, locales and their
// language codes. Used by metadata, sitemap, robots and middleware.

export const SITE_URL = 'https://qaznedr.kz';
export const SITE_NAME = 'QAZNEDR HOLDING';

export const LOCALES = ['ru', 'kz', 'en', 'zh'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ru';

/** BCP 47 codes for <html lang> and hreflang. URL segments stay ru/kz/en/zh. */
export const HREFLANG: Record<Locale, string> = {
  ru: 'ru',
  kz: 'kk',
  en: 'en',
  zh: 'zh-CN',
};

export const OG_LOCALE: Record<Locale, string> = {
  ru: 'ru_KZ',
  kz: 'kk_KZ',
  en: 'en_US',
  zh: 'zh_CN',
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function toLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Absolute URL for a locale-prefixed path. `path` is '' or a sub-path. */
export function localeUrl(locale: Locale, path = ''): string {
  const trimmed = path.replace(/\/+$/, '');
  const clean = trimmed && !trimmed.startsWith('/') ? `/${trimmed}` : trimmed;
  return `${SITE_URL}/${locale}${clean}`;
}
```

- [ ] **Step 4: Создать `src/lib/seo/metadata.ts`**

```ts
import type { Metadata } from 'next';
import { getServerTranslation } from '@/lib/i18n/translations';
import {
  HREFLANG,
  LOCALES,
  OG_LOCALE,
  SITE_NAME,
  localeUrl,
  toLocale,
  type Locale,
} from './site';

export function buildLanguageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[HREFLANG[l]] = localeUrl(l, path);
  languages['x-default'] = localeUrl('ru', path);
  return languages;
}

export interface PageMetadataInput {
  locale: Locale;
  /** '' for the home page, otherwise a sub-path such as '/leads' */
  path: string;
  title: string;
  description: string;
  /** Skip the "%s | QAZNEDR HOLDING" template (home page). */
  absoluteTitle?: boolean;
  noindex?: boolean;
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const url = localeUrl(input.locale, input.path);
  const fullTitle = input.absoluteTitle
    ? input.title
    : `${input.title} | ${SITE_NAME}`;
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates(input.path),
    },
    openGraph: {
      title: fullTitle,
      description: input.description,
      url,
      siteName: SITE_NAME,
      locale: OG_LOCALE[input.locale],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: input.description,
    },
    robots: input.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

/** Metadata from the `seo.<key>.title|description` translation keys. */
export function buildTranslatedPageMetadata(
  localeParam: string,
  path: string,
  seoKey: string,
  options: Pick<PageMetadataInput, 'absoluteTitle' | 'noindex'> = {}
): Metadata {
  const locale = toLocale(localeParam);
  const { t } = getServerTranslation(locale);
  return buildPageMetadata({
    locale,
    path,
    title: t(`seo.${seoKey}.title`),
    description: t(`seo.${seoKey}.description`),
    ...options,
  });
}
```

- [ ] **Step 5: Добавить `seo` в `src/lib/i18n/translations.ts`.** В каждом локальном объекте вставить блок сразу после открывающей строки (`  ru: {` — строка 5, `  kz: {`, `  en: {`, `  zh: {`).

После `  ru: {`:

```ts
    seo: {
      site: {
        title: 'QAZNEDR HOLDING — участки недр Казахстана для инвесторов',
        description:
          'Геологоразведочный холдинг из Казахстана. Подготовленные свободные участки по золоту, меди и другим металлам из реестра 7 000+ рудных объектов по советским фондовым отчётам. Сопровождение лицензирования и сделок для инвесторов.',
      },
      home: {
        title: 'QAZNEDR HOLDING — участки недр Казахстана для инвесторов',
        description:
          'Геологоразведочный холдинг из Казахстана. Подготовленные свободные участки по золоту, меди и другим металлам из реестра 7 000+ рудных объектов по советским фондовым отчётам. Сопровождение лицензирования и сделок для инвесторов.',
      },
      leads: {
        title: 'Участки недр Казахстана: золото, медь и другие металлы',
        description:
          'Портфель подготовленных свободных участков QAZNEDR HOLDING. В тизере: металл, регион, тип месторождения, содержание. Детали — после встречи и NDA.',
      },
      services: {
        title: 'Услуги: лицензирование, геологоразведка, due diligence',
        description:
          'Сопровождение получения лицензии на недропользование в Казахстане, полевые геологические работы, due diligence участков и аналитика для инвесторов.',
      },
      servicesGeological: {
        title: 'Геологоразведка и полевые работы в Казахстане',
        description:
          'Штатные геологи QAZNEDR HOLDING: выезд на участок, опробование, оценка перспектив по архивным и полевым данным.',
      },
      servicesLegal: {
        title: 'Лицензирование недропользования в Казахстане',
        description:
          'Сопровождение получения лицензии на разведку твёрдых полезных ископаемых: подбор участка, подготовка заявки, работа с Единой платформой недропользования.',
      },
      servicesInvestors: {
        title: 'Инвесторам: вход в геологоразведочные проекты Казахстана',
        description:
          'Форматы сделок: лицензия на инвестора, совместное предприятие, earn-in, аналитика по участку. Сопровождение от подбора до разрешения на переход права.',
      },
      about: {
        title: 'О компании QAZNEDR HOLDING',
        description:
          'Казахстанский геологоразведочный холдинг: команда геологов, анализ архивных геологических отчётов, подготовка участков и сделок для иностранных инвесторов.',
      },
      contact: {
        title: 'Контакты: WeChat, WhatsApp, email',
        description:
          'Свяжитесь с QAZNEDR HOLDING через WeChat, WhatsApp или форму заявки. Обсудим участок, формат сделки и встречу.',
      },
      faq: {
        title: 'Вопросы и ответы',
        description:
          'Как устроена работа с QAZNEDR HOLDING: участки, форматы сделок, лицензирование в Казахстане, NDA и встречи.',
      },
      support: {
        title: 'Поддержка',
        description:
          'Вопросы по сайту и заявкам QAZNEDR HOLDING. Отвечаем в течение одного рабочего дня.',
      },
      terms: {
        title: 'Условия использования',
        description:
          'Условия использования сайта qaznedr.kz компании QAZNEDR HOLDING.',
      },
      blog: {
        title: 'Статьи о недропользовании Казахстана',
        description:
          'Статьи и гайды о геологии, лицензировании и инвестициях в недра Казахстана.',
      },
      education: {
        title: 'Обучение: геология и недропользование',
        description:
          'Материалы по геологии и недропользованию Казахстана для инвесторов и специалистов.',
      },
      knowledge: {
        title: 'База знаний по недропользованию',
        description:
          'Термины, процедуры и законодательство о недрах Казахстана простым языком.',
      },
      news: {
        title: 'Новости недропользования Казахстана',
        description:
          'Новости геологической отрасли и законодательства о недрах Казахстана.',
      },
      lead: {
        title: '{mineral} — участок {code}, {where}',
        descriptionFree:
          'Участок: {mineral}, {where}. По нашей проверке свободен от лицензий; геология изучена по архивным отчётам, лицензию оформим под сделку. Код {code}.',
        descriptionOther:
          '{mineral}, {where}. Участок из портфеля QAZNEDR HOLDING. Код {code}.',
        where: '{region} область, Казахстан',
        whereNone: 'Казахстан',
        notFound: 'Участок не найден',
      },
    },
```

После `  kz: {`:

```ts
    seo: {
      site: {
        title: 'QAZNEDR HOLDING — инвесторларға арналған Қазақстан жер қойнауы учаскелері',
        description:
          'Қазақстандағы геологиялық барлау холдингі. Кеңестік қор есептері бойынша 7 000+ кен объектісі тізілімінен іріктелген алтын, мыс және басқа металдар бойынша дайын бос учаскелер. Инвесторларға лицензиялау мен мәмілені сүйемелдеу.',
      },
      home: {
        title: 'QAZNEDR HOLDING — инвесторларға арналған Қазақстан жер қойнауы учаскелері',
        description:
          'Қазақстандағы геологиялық барлау холдингі. Кеңестік қор есептері бойынша 7 000+ кен объектісі тізілімінен іріктелген алтын, мыс және басқа металдар бойынша дайын бос учаскелер. Инвесторларға лицензиялау мен мәмілені сүйемелдеу.',
      },
      leads: {
        title: 'Қазақстан жер қойнауы учаскелері: алтын, мыс және басқа металдар',
        description:
          'QAZNEDR HOLDING дайын бос учаскелер портфелі. Тизерде: металл, өңір, кен орнының түрі, құрамы. Толық деректер кездесу мен NDA-дан кейін.',
      },
      services: {
        title: 'Қызметтер: лицензиялау, геологиялық барлау, due diligence',
        description:
          'Қазақстанда жер қойнауын пайдалану лицензиясын алуды сүйемелдеу, далалық геологиялық жұмыстар, учаскелердің due diligence және инвесторларға арналған талдау.',
      },
      servicesGeological: {
        title: 'Қазақстандағы геологиялық барлау және далалық жұмыстар',
        description:
          'QAZNEDR HOLDING штаттағы геологтары: учаскеге шығу, сынама алу, архивтік және далалық деректер бойынша болашағын бағалау.',
      },
      servicesLegal: {
        title: 'Қазақстанда жер қойнауын пайдалану лицензиясы',
        description:
          'Қатты пайдалы қазбаларды барлау лицензиясын алуды сүйемелдеу: учаскені іріктеу, өтінімді дайындау, Жер қойнауын пайдаланудың бірыңғай платформасымен жұмыс.',
      },
      servicesInvestors: {
        title: 'Инвесторларға: Қазақстанның геологиялық барлау жобаларына кіру',
        description:
          'Мәміле форматтары: инвесторға лицензия, бірлескен кәсіпорын, earn-in, учаске бойынша талдау. Іріктеуден құқықты беруге рұқсат алғанға дейін сүйемелдеу.',
      },
      about: {
        title: 'QAZNEDR HOLDING туралы',
        description:
          'Қазақстандық геологиялық барлау холдингі: геологтар командасы, архивтік геологиялық есептерді талдау, шетелдік инвесторларға учаскелер мен мәмілелерді дайындау.',
      },
      contact: {
        title: 'Байланыс: WeChat, WhatsApp, email',
        description:
          'QAZNEDR HOLDING-пен WeChat, WhatsApp немесе өтінім формасы арқылы байланысыңыз. Учаскені, мәміле форматын және кездесуді талқылаймыз.',
      },
      faq: {
        title: 'Сұрақтар мен жауаптар',
        description:
          'QAZNEDR HOLDING-пен жұмыс: учаскелер, мәміле форматтары, Қазақстандағы лицензиялау, NDA және кездесулер.',
      },
      support: {
        title: 'Қолдау',
        description:
          'Сайт пен өтінімдер бойынша сұрақтар. Бір жұмыс күні ішінде жауап береміз.',
      },
      terms: {
        title: 'Пайдалану шарттары',
        description:
          'QAZNEDR HOLDING компаниясының qaznedr.kz сайтын пайдалану шарттары.',
      },
      blog: {
        title: 'Қазақстандағы жер қойнауын пайдалану туралы мақалалар',
        description:
          'Қазақстандағы геология, лицензиялау және тау-кен инвестициялары туралы мақалалар мен нұсқаулықтар.',
      },
      education: {
        title: 'Оқу: геология және жер қойнауын пайдалану',
        description:
          'Инвесторлар мен мамандарға арналған Қазақстандағы геология және жер қойнауын пайдалану материалдары.',
      },
      knowledge: {
        title: 'Жер қойнауын пайдалану бойынша білім базасы',
        description:
          'Қазақстандағы жер қойнауы туралы терминдер, рәсімдер және заңнама қарапайым тілмен.',
      },
      news: {
        title: 'Қазақстандағы жер қойнауын пайдалану жаңалықтары',
        description:
          'Қазақстанның геология саласы мен жер қойнауы заңнамасының жаңалықтары.',
      },
      lead: {
        title: '{mineral} — {code} учаскесі, {where}',
        descriptionFree:
          'Учаске: {mineral}, {where}. Біздің тексеруімізше лицензиядан бос; геологиясы архивтік есептер бойынша зерттелген, лицензияны мәміле үшін рәсімдейміз. Код {code}.',
        descriptionOther:
          '{mineral}, {where}. QAZNEDR HOLDING портфеліндегі учаске. Код {code}.',
        where: '{region}, Қазақстан',
        whereNone: 'Қазақстан',
        notFound: 'Учаске табылмады',
      },
    },
```

После `  en: {`:

```ts
    seo: {
      site: {
        title: 'QAZNEDR HOLDING — Mineral Exploration Areas in Kazakhstan for Investors',
        description:
          'Kazakhstan exploration holding. Prepared free subsoil areas for gold, copper and other metals, drawn from a registry of 7,000+ mineral occurrences compiled from Soviet-era geological reports. Licensing and deal support for investors.',
      },
      home: {
        title: 'QAZNEDR HOLDING — Mineral Exploration Areas in Kazakhstan for Investors',
        description:
          'Kazakhstan exploration holding. Prepared free subsoil areas for gold, copper and other metals, drawn from a registry of 7,000+ mineral occurrences compiled from Soviet-era geological reports. Licensing and deal support for investors.',
      },
      leads: {
        title: 'Exploration Areas in Kazakhstan: Gold, Copper and More',
        description:
          'QAZNEDR HOLDING portfolio of prepared free subsoil areas. The teaser shows metal, region, deposit type and grade; full details after a meeting and an NDA.',
      },
      services: {
        title: 'Services: Licensing, Exploration, Due Diligence',
        description:
          'Support in obtaining a subsoil use licence in Kazakhstan, field geology, due diligence of areas and analytics for investors.',
      },
      servicesGeological: {
        title: 'Exploration and Field Geology in Kazakhstan',
        description:
          'QAZNEDR HOLDING staff geologists: site visits, sampling and prospect evaluation based on archival and field data.',
      },
      servicesLegal: {
        title: 'Subsoil Licensing in Kazakhstan',
        description:
          'Support in obtaining an exploration licence for solid minerals: area selection, application preparation and work with the Unified Subsoil Use Platform.',
      },
      servicesInvestors: {
        title: 'For Investors: Entering Exploration Projects in Kazakhstan',
        description:
          'Deal formats: licence for the investor, joint venture, earn-in, area analytics. Support from area selection to the transfer-of-rights permission.',
      },
      about: {
        title: 'About QAZNEDR HOLDING',
        description:
          'Kazakhstan exploration holding: a team of geologists, analysis of archival geological reports, preparation of areas and deals for foreign investors.',
      },
      contact: {
        title: 'Contact: WeChat, WhatsApp, Email',
        description:
          'Contact QAZNEDR HOLDING via WeChat, WhatsApp or the inquiry form to discuss an area, a deal format and a meeting.',
      },
      faq: {
        title: 'FAQ',
        description:
          'How working with QAZNEDR HOLDING works: areas, deal formats, licensing in Kazakhstan, NDA and meetings.',
      },
      support: {
        title: 'Support',
        description:
          'Questions about the website and inquiries. We reply within one business day.',
      },
      terms: {
        title: 'Terms of Use',
        description:
          'Terms of use of qaznedr.kz, the website of QAZNEDR HOLDING.',
      },
      blog: {
        title: 'Articles on Subsoil Use in Kazakhstan',
        description:
          'Articles and guides on geology, licensing and mining investment in Kazakhstan.',
      },
      education: {
        title: 'Learning: Geology and Subsoil Use',
        description:
          'Materials on geology and subsoil use in Kazakhstan for investors and professionals.',
      },
      knowledge: {
        title: 'Subsoil Use Knowledge Base',
        description:
          'Terms, procedures and subsoil legislation of Kazakhstan in plain language.',
      },
      news: {
        title: 'Kazakhstan Subsoil Use News',
        description:
          "News of Kazakhstan's geology sector and subsoil legislation.",
      },
      lead: {
        title: '{mineral} Exploration Area {code}, {where}',
        descriptionFree:
          'Area: {mineral}, {where}. Free of licences per our check; geology studied from archival reports, the licence can be arranged for the deal. Code {code}.',
        descriptionOther:
          '{mineral}, {where}. Area from the QAZNEDR HOLDING portfolio. Code {code}.',
        where: '{region}, Kazakhstan',
        whereNone: 'Kazakhstan',
        notFound: 'Area not found',
      },
    },
```

После `  zh: {`:

```ts
    seo: {
      site: {
        title: 'QAZNEDR HOLDING — 哈萨克斯坦矿权投资项目：金矿、铜矿等空白探矿区',
        description:
          '哈萨克斯坦地质勘探控股公司。依托基于苏联时期地质档案整理的7000余处矿点数据库，筛选金、铜等矿种空白矿区，为投资者提供探矿权办理及交易全程服务。',
      },
      home: {
        title: 'QAZNEDR HOLDING — 哈萨克斯坦矿权投资项目：金矿、铜矿等空白探矿区',
        description:
          '哈萨克斯坦地质勘探控股公司。依托基于苏联时期地质档案整理的7000余处矿点数据库，筛选金、铜等矿种空白矿区，为投资者提供探矿权办理及交易全程服务。',
      },
      leads: {
        title: '哈萨克斯坦矿区项目库：金矿、铜矿等空白探矿区',
        description:
          'QAZNEDR HOLDING 精选空白矿区项目。公开简介包含矿种、位置、矿床类型与品位；详细资料在会面并签署保密协议（NDA）后提供。',
      },
      services: {
        title: '服务：探矿权办理、地质勘探、尽职调查',
        description:
          '协助在哈萨克斯坦办理矿产资源勘查许可证、野外地质工作、矿区尽职调查及投资分析。',
      },
      servicesGeological: {
        title: '哈萨克斯坦地质勘探与野外工作',
        description:
          'QAZNEDR HOLDING 自有地质团队：实地踏勘、采样，基于档案资料与野外数据评价找矿前景。',
      },
      servicesLegal: {
        title: '哈萨克斯坦矿权许可证办理',
        description:
          '协助办理固体矿产勘查许可证：矿区筛选、申请材料准备，通过哈萨克斯坦统一矿产资源利用平台提交。',
      },
      servicesInvestors: {
        title: '投资者服务：进入哈萨克斯坦矿产勘查项目',
        description:
          '合作方式：许可证直接办理在投资者名下、合资企业、分阶段投资入股（earn-in）、矿区分析报告。从选区到矿权转让审批全程陪同。',
      },
      about: {
        title: '关于 QAZNEDR HOLDING',
        description:
          '哈萨克斯坦地质勘探控股公司：自有地质团队，系统分析地质档案报告，为外国投资者筛选矿区并推进交易。',
      },
      contact: {
        title: '联系我们：微信、WhatsApp、邮箱',
        description:
          '通过微信、WhatsApp 或在线表单联系 QAZNEDR HOLDING，洽谈矿区项目、合作方式及会面安排。',
      },
      faq: {
        title: '常见问题',
        description:
          '与 QAZNEDR HOLDING 合作流程：矿区项目、合作方式、哈萨克斯坦许可证办理、保密协议与会面。',
      },
      support: {
        title: '客户支持',
        description: '关于网站与咨询的问题，我们将在一个工作日内回复。',
      },
      terms: {
        title: '使用条款',
        description: 'QAZNEDR HOLDING 官网 qaznedr.kz 使用条款。',
      },
      blog: {
        title: '哈萨克斯坦矿业资讯文章',
        description: '关于哈萨克斯坦地质、矿权许可与矿业投资的文章与指南。',
      },
      education: {
        title: '地质与矿产资源知识',
        description:
          '面向投资者与专业人士的哈萨克斯坦地质与矿产资源利用资料。',
      },
      knowledge: {
        title: '哈萨克斯坦矿业知识库',
        description:
          '以通俗语言介绍哈萨克斯坦矿产资源相关术语、流程与法规。',
      },
      news: {
        title: '哈萨克斯坦矿业新闻',
        description: '哈萨克斯坦地质行业与矿产资源法规动态。',
      },
      lead: {
        title: '哈萨克斯坦{where}{mineral}矿项目 {code}',
        descriptionFree:
          '哈萨克斯坦{where}{mineral}矿区，经我方核查目前无矿权（空白区），已基于地质档案完成研究，可为交易协助办理探矿权。项目编号 {code}。',
        descriptionOther:
          '哈萨克斯坦{where}{mineral}矿项目，来自 QAZNEDR HOLDING 项目库。项目编号 {code}。',
        where: '{region}',
        whereNone: '',
        notFound: '未找到该项目',
      },
    },
```

Примечание: `seo.lead.where` у zh (`'{region}'`) отличается от ru, так что тест «differs from ru» проходит. `whereNone` в тест не входит (у zh он пустой намеренно).

- [ ] **Step 6: Убедиться, что тесты проходят**

Run: `npx jest src/__tests__/lib/seo/metadata.test.ts src/__tests__/lib/i18n/holding-keys.test.ts --coverage=false`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/seo/site.ts src/lib/seo/metadata.ts src/lib/i18n/translations.ts src/__tests__/lib/seo/metadata.test.ts src/__tests__/lib/i18n/holding-keys.test.ts
git commit -m "feat(seo): shared site/metadata helpers + localized seo copy for 4 locales"
```

---

### Task 2: Метаданные на всех публичных страницах и у участков

**Files:**

- Create: `src/lib/seo/lead-metadata.ts`
- Move: `src/app/[locale]/page.tsx` → `src/components/features/HomePageContent.tsx`; new `src/app/[locale]/page.tsx`
- Modify: `src/app/[locale]/layout.tsx`, `src/lib/data/filter-config.ts` (3 региона), `src/app/[locale]/leads/layout.tsx`, `src/app/[locale]/leads/[code]/layout.tsx`, `src/app/[locale]/{about,faq,support}/page.tsx`, `src/app/[locale]/legal/terms/page.tsx`, `src/app/[locale]/services/{layout.tsx,geological/layout.tsx,legal/layout.tsx,investors/layout.tsx}`, `src/app/[locale]/{blog,education,knowledge,news}/layout.tsx`
- Test: `src/__tests__/lib/seo/lead-metadata.test.ts`

**Interfaces:**

- Consumes: `buildPageMetadata`, `buildTranslatedPageMetadata`, `toLocale`, `HREFLANG`, `OG_LOCALE`, `SITE_URL`, `SITE_NAME` (Task 1); `REGIONS` из `filter-config.ts`; `translate`.
- Produces: `leadMineralName(mineral, locale): string`, `leadRegionName(region, locale): string` ('' если не распознан), `leadSeoText(lead: LeadSeoInput, locale: Locale): { title: string; description: string }`, `interface LeadSeoInput { code: string; mineral: string | null; region: string | null; license_status: string | null }`.

- [ ] **Step 1: Падающий тест** `src/__tests__/lib/seo/lead-metadata.test.ts`

```ts
import {
  leadMineralName,
  leadRegionName,
  leadSeoText,
} from '@/lib/seo/lead-metadata';

const lead = {
  code: 'AU-508A4C',
  mineral: 'Au',
  region: 'Жамбылская',
  license_status: 'FREE_COORD_VERIFIED_2026',
};

describe('lead SEO text', () => {
  it('builds a Chinese title without Cyrillic', () => {
    const { title } = leadSeoText(lead, 'zh');
    expect(title).toBe('哈萨克斯坦江布尔金矿项目 AU-508A4C');
    expect(title).not.toMatch(/[А-Яа-яЁё]/);
  });

  it('builds ru and en titles', () => {
    expect(leadSeoText(lead, 'ru').title).toBe(
      'Золото — участок AU-508A4C, Жамбылская область, Казахстан'
    );
    expect(leadSeoText(lead, 'en').title).toBe(
      'Gold Exploration Area AU-508A4C, Zhambyl, Kazakhstan'
    );
  });

  it('resolves region spellings used by the leads export', () => {
    expect(leadRegionName('ВКО', 'en')).toBe('East Kazakhstan');
    expect(leadRegionName('Семипалатинская/Абайская', 'zh')).toBe('阿拜');
    expect(leadRegionName('Костанай', 'kz')).toBe('Қостанай');
    expect(leadRegionName('Жетысуская', 'en')).toBe('Zhetysu');
  });

  it('never leaks an unknown Russian region into zh/en', () => {
    const x = { ...lead, region: 'Центральный Казахстан' };
    expect(leadSeoText(x, 'zh').title).toBe('哈萨克斯坦金矿项目 AU-508A4C');
    expect(leadSeoText(x, 'en').title).toBe(
      'Gold Exploration Area AU-508A4C, Kazakhstan'
    );
  });

  it('uses the free-area description only for FREE statuses', () => {
    expect(leadSeoText(lead, 'ru').description).toMatch(/свободен от лицензий/);
    expect(
      leadSeoText({ ...lead, license_status: 'PENDING' }, 'ru').description
    ).toMatch(/портфеля QAZNEDR HOLDING/);
  });

  it('handles compound and annotated commodity values from the registry', () => {
    expect(leadMineralName('Pb-Zn', 'zh')).toBe('铅锌');
    expect(leadMineralName('Pb-Zn', 'ru')).toBe('Свинец-цинк');
    expect(leadMineralName('Au+Cu', 'en')).toBe('Gold-Copper');
    expect(leadMineralName('Au россыпь', 'ru')).toBe('Золото');
  });

  it('falls back to the raw mineral code and tolerates nulls', () => {
    expect(leadMineralName('REE', 'en')).toBe('REE');
    expect(() =>
      leadSeoText(
        { code: 'AU-1', mineral: null, region: null, license_status: null },
        'zh'
      )
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Убедиться, что падает.** Run: `npx jest src/__tests__/lib/seo/lead-metadata.test.ts --coverage=false`. Expected: FAIL, модуль не найден.

- [ ] **Step 3: Добавить 3 новых региона РК.** В `src/lib/data/filter-config.ts` перед закрывающим `] as const;` массива `REGIONS` (после объекта `north-kz`):

```ts
  {
    id: 'abai',
    name: { ru: 'Абайская', kz: 'Абай', en: 'Abai', zh: '阿拜' },
  },
  {
    id: 'zhetysu',
    name: { ru: 'Жетысуская', kz: 'Жетісу', en: 'Zhetysu', zh: '杰特苏' },
  },
  {
    id: 'ulytau',
    name: { ru: 'Улытауская', kz: 'Ұлытау', en: 'Ulytau', zh: '乌勒套' },
  },
```

- [ ] **Step 4: Создать `src/lib/seo/lead-metadata.ts`**

```ts
import { REGIONS } from '@/lib/data/filter-config';
import { translate } from '@/lib/i18n/translations';
import type { Locale } from './site';

export interface LeadSeoInput {
  code: string;
  mineral: string | null;
  region: string | null;
  license_status: string | null;
}

// Chemical symbols used by the leads export → localized names.
const MINERALS: Record<string, Record<Locale, string>> = {
  AU: { ru: 'Золото', kz: 'Алтын', en: 'Gold', zh: '金' },
  CU: { ru: 'Медь', kz: 'Мыс', en: 'Copper', zh: '铜' },
  ZN: { ru: 'Цинк', kz: 'Мырыш', en: 'Zinc', zh: '锌' },
  SN: { ru: 'Олово', kz: 'Қалайы', en: 'Tin', zh: '锡' },
  NI: { ru: 'Никель', kz: 'Никель', en: 'Nickel', zh: '镍' },
  W: { ru: 'Вольфрам', kz: 'Вольфрам', en: 'Tungsten', zh: '钨' },
  PB: { ru: 'Свинец', kz: 'Қорғасын', en: 'Lead', zh: '铅' },
  AG: { ru: 'Серебро', kz: 'Күміс', en: 'Silver', zh: '银' },
  MO: { ru: 'Молибден', kz: 'Молибден', en: 'Molybdenum', zh: '钼' },
  FE: { ru: 'Железо', kz: 'Темір', en: 'Iron', zh: '铁' },
  MN: { ru: 'Марганец', kz: 'Марганец', en: 'Manganese', zh: '锰' },
  CR: { ru: 'Хром', kz: 'Хром', en: 'Chromium', zh: '铬' },
  U: { ru: 'Уран', kz: 'Уран', en: 'Uranium', zh: '铀' },
};

// Region spellings used by the leads export that differ from filter-config.
const REGION_ALIASES: Record<string, string> = {
  вко: 'восточно-казахстанская',
  костанай: 'костанайская',
  'семипалатинская/абайская': 'абайская',
};

/**
 * Registry commodity → localized name. Handles 'Au', 'Pb-Zn', 'Au+Cu' and
 * annotated values like 'Au россыпь'; unknown values are returned as-is.
 */
export function leadMineralName(
  mineral: string | null | undefined,
  locale: Locale
): string {
  const raw = (mineral ?? '').trim();
  const head = raw.split(/\s+/)[0] ?? '';
  const names = head
    .split(/[+\-–\/]/)
    .filter(Boolean)
    .map((part) => MINERALS[part.toUpperCase()]?.[locale]);
  if (!names.length || names.some((n) => !n)) return raw;
  const parts = names as string[];
  if (locale === 'zh') return parts.join('');
  if (locale === 'en') return parts.join('-');
  return [parts[0], ...parts.slice(1).map((n) => n.toLowerCase())].join('-');
}

/** Localized region name, or '' when the export value is not a known region. */
export function leadRegionName(
  region: string | null | undefined,
  locale: Locale
): string {
  const raw = (region ?? '').trim().toLowerCase();
  if (!raw) return '';
  const key = REGION_ALIASES[raw] ?? raw;
  const match = REGIONS.find(
    (r) =>
      r.id === key || Object.values(r.name).some((n) => n.toLowerCase() === key)
  );
  return match ? match.name[locale] : '';
}

export function leadSeoText(
  lead: LeadSeoInput,
  locale: Locale
): { title: string; description: string } {
  const mineral = leadMineralName(lead.mineral, locale);
  const region = leadRegionName(lead.region, locale);
  const where = region
    ? translate(locale, 'seo.lead.where', { region })
    : translate(locale, 'seo.lead.whereNone');
  const params = { mineral, where, code: lead.code };
  const free = (lead.license_status ?? '').startsWith('FREE');
  const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
  return {
    title: clean(translate(locale, 'seo.lead.title', params)),
    description: clean(
      translate(
        locale,
        free ? 'seo.lead.descriptionFree' : 'seo.lead.descriptionOther',
        params
      )
    ).slice(0, 200),
  };
}
```

- [ ] **Step 5: Тест проходит.** Run: `npx jest src/__tests__/lib/seo/lead-metadata.test.ts --coverage=false`. Expected: PASS.

- [ ] **Step 6: Layout локали** `src/app/[locale]/layout.tsx`:
  - удалить `const BASE_URL = 'https://qaznedr.kz';`;
  - добавить импорты:

```ts
import { getServerTranslation } from '@/lib/i18n/translations';
import {
  HREFLANG,
  OG_LOCALE,
  SITE_NAME,
  SITE_URL,
  toLocale,
} from '@/lib/seo/site';
```

- заменить всю функцию `generateMetadata` на:

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const { t } = getServerTranslation(locale);

  const otherVerification: Record<string, string> = {};
  if (process.env.BING_SITE_VERIFICATION) {
    otherVerification['msvalidate.01'] = process.env.BING_SITE_VERIFICATION;
  }
  if (process.env.BAIDU_SITE_VERIFICATION) {
    otherVerification['baidu-site-verification'] =
      process.env.BAIDU_SITE_VERIFICATION;
  }

  // Pages set their own canonical/hreflang via buildPageMetadata — the layout
  // must NOT, otherwise every page inherits the home canonical.
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t('seo.site.title'), template: `%s | ${SITE_NAME}` },
    description: t('seo.site.description'),
    openGraph: {
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      type: 'website',
    },
    robots: { index: true, follow: true },
    // Set *_VERIFICATION env vars in Vercel to emit the verification meta tags.
    verification: {
      ...(process.env.GOOGLE_SITE_VERIFICATION
        ? { google: process.env.GOOGLE_SITE_VERIFICATION }
        : {}),
      ...(process.env.YANDEX_VERIFICATION
        ? { yandex: process.env.YANDEX_VERIFICATION }
        : {}),
      ...(Object.keys(otherVerification).length
        ? { other: otherVerification }
        : {}),
    },
  };
}
```

- в `LocaleLayout` после проверки `validLocales` добавить `const lang = HREFLANG[toLocale(locale)];` и заменить `<html lang={locale} suppressHydrationWarning>` на:

```tsx
    <html lang={lang} suppressHydrationWarning>
      <head>
        <meta httpEquiv="content-language" content={lang} />
      </head>
```

- [ ] **Step 7: Главная — серверная обёртка.**

```bash
git mv 'src/app/[locale]/page.tsx' src/components/features/HomePageContent.tsx
```

В `HomePageContent.tsx` заменить `export default function Home() {` на `export default function HomePageContent() {`. Создать новый `src/app/[locale]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import HomePageContent from '@/components/features/HomePageContent';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, '', 'home', {
    absoluteTitle: true,
  });
}

export default function Home() {
  return <HomePageContent />;
}
```

- [ ] **Step 8: Статические страницы.** В каждом файле таблицы ниже:
  - удалить `export const metadata: Metadata = {...};` целиком;
  - добавить `import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';`;
  - оставить или добавить `import type { Metadata } from 'next';`;
  - вставить функцию по шаблону.

Шаблон функции (подставить PATH и KEY):

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, 'PATH', 'KEY');
}
```

| Файл                                                                                                | PATH                   | KEY                  |
| --------------------------------------------------------------------------------------------------- | ---------------------- | -------------------- |
| `src/app/[locale]/leads/layout.tsx` (заменить существующую `generateMetadata` и удалить `BASE_URL`) | `/leads`               | `leads`              |
| `src/app/[locale]/about/page.tsx`                                                                   | `/about`               | `about`              |
| `src/app/[locale]/faq/page.tsx`                                                                     | `/faq`                 | `faq`                |
| `src/app/[locale]/support/page.tsx`                                                                 | `/support`             | `support`            |
| `src/app/[locale]/legal/terms/page.tsx`                                                             | `/legal/terms`         | `terms`              |
| `src/app/[locale]/services/layout.tsx`                                                              | `/services`            | `services`           |
| `src/app/[locale]/services/geological/layout.tsx`                                                   | `/services/geological` | `servicesGeological` |
| `src/app/[locale]/services/legal/layout.tsx`                                                        | `/services/legal`      | `servicesLegal`      |
| `src/app/[locale]/services/investors/layout.tsx`                                                    | `/services/investors`  | `servicesInvestors`  |
| `src/app/[locale]/blog/layout.tsx`                                                                  | `/blog`                | `blog`               |
| `src/app/[locale]/education/layout.tsx`                                                             | `/education`           | `education`          |
| `src/app/[locale]/knowledge/layout.tsx`                                                             | `/knowledge`           | `knowledge`          |
| `src/app/[locale]/news/layout.tsx`                                                                  | `/news`                | `news`               |

- [ ] **Step 9: Страница участка.** Заменить всё содержимое `src/app/[locale]/leads/[code]/layout.tsx` на:

```tsx
import type { Metadata } from 'next';
import { getPublishedLeadByCode } from '@/lib/leads/public-queries';
import { translate } from '@/lib/i18n/translations';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { leadSeoText } from '@/lib/seo/lead-metadata';
import { toLocale } from '@/lib/seo/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, code } = await params;
  const locale = toLocale(rawLocale);
  const lead = await getPublishedLeadByCode(code);
  if (!lead) {
    return {
      title: translate(locale, 'seo.lead.notFound'),
      robots: { index: false, follow: false },
    };
  }
  const { title, description } = leadSeoText(lead, locale);
  return buildPageMetadata({
    locale,
    path: `/leads/${lead.code}`,
    title,
    description,
  });
}

export default function LeadDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

- [ ] **Step 10: Проверка типов и тесты.**
      Run: `npm run type-check && npx jest src/__tests__/lib/seo --coverage=false`
      Expected: 0 ошибок TS, PASS. Если TS ругается на `languages` в `alternates`, привести тип в `buildPageMetadata`: `languages: buildLanguageAlternates(input.path) as Record<string, string>`.

- [ ] **Step 11: Commit**

```bash
git add -A src/app src/components/features/HomePageContent.tsx src/lib/seo/lead-metadata.ts src/lib/data/filter-config.ts src/__tests__/lib/seo/lead-metadata.test.ts
git commit -m "feat(seo): per-page localized metadata + self canonicals, localized lead titles"
```

---

### Task 3: Реестр страниц, robots и sitemap

**Files:**

- Create: `src/lib/seo/pages.ts`
- Modify: `src/app/robots.ts`, `src/app/sitemap.ts`
- Test: `src/__tests__/lib/seo/pages.test.ts`, `src/__tests__/app/robots-sitemap.test.ts`

**Interfaces:**

- Consumes: `LOCALES`, `SITE_URL`, `localeUrl` (Task 1), `buildLanguageAlternates` (Task 1).
- Produces: `PUBLIC_PAGES: readonly string[]`, `HIDDEN_ROUTE_REDIRECTS: ReadonlyArray<readonly [string, string]>`, `hiddenRouteRedirect(pathname: string): string | null`. `pages.ts` импортирует только `site.ts`, потому что он нужен в edge middleware.

- [ ] **Step 1: Падающие тесты.**

`src/__tests__/lib/seo/pages.test.ts`:

```ts
import {
  HIDDEN_ROUTE_REDIRECTS,
  PUBLIC_PAGES,
  hiddenRouteRedirect,
} from '@/lib/seo/pages';

describe('hiddenRouteRedirect', () => {
  it.each([
    ['/zh/listings', '/zh/leads'],
    ['/en/listings/abc-123', '/en/leads'],
    ['/ru/listings/create', '/ru/leads'],
    ['/kz/companies', '/kz/about'],
    ['/ru/services/catalog', '/ru/services'],
    ['/ru/services/equipment', '/ru/services'],
    ['/en/dashboard', '/en/leads'],
    ['/en/dashboard/my-leads', '/en/leads'],
    ['/ru/favorites', '/ru/leads'],
    ['/ru/messages', '/ru/contact'],
    ['/zh/auth/register', '/zh/contact'],
    ['/ru/map', '/ru/leads'],
  ])('%s → %s', (from, to) => {
    expect(hiddenRouteRedirect(from)).toBe(to);
  });

  it.each([
    '/ru',
    '/ru/leads',
    '/ru/leads/AU-1',
    '/ru/services',
    '/ru/services/geological',
    '/ru/listingsx',
    '/ru/admin',
    '/ru/admin/listings',
    '/ru/auth/login',
    '/de/listings',
    '/api/listings',
  ])('%s is left alone', (path) => {
    expect(hiddenRouteRedirect(path)).toBeNull();
  });

  it('never lists a hidden route as a public page', () => {
    for (const page of PUBLIC_PAGES) {
      for (const [prefix] of HIDDEN_ROUTE_REDIRECTS) {
        expect(page === prefix || page.startsWith(`${prefix}/`)).toBe(false);
      }
    }
  });
});
```

`src/__tests__/app/robots-sitemap.test.ts`:

```ts
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

describe('robots', () => {
  it('blocks private areas including /ru/dashboard without a trailing slash', () => {
    const r = robots();
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
    const star = rules.find((x) => x.userAgent === '*');
    expect(star?.disallow).toEqual(
      expect.arrayContaining(['/*/dashboard', '/*/admin', '/api/'])
    );
    expect(r.sitemap).toBe('https://qaznedr.kz/sitemap.xml');
  });
});

describe('sitemap', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('lists public pages and lead teasers for every locale, no legacy routes', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: { leads: [{ code: 'AU-508A4C' }], totalPages: 1 },
      }),
    }) as unknown as typeof fetch;
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain('https://qaznedr.kz/zh');
    expect(urls).toContain('https://qaznedr.kz/zh/leads/AU-508A4C');
    expect(urls).toContain('https://qaznedr.kz/en/contact');
    expect(urls.some((u) => /\/(listings|companies|map)(\/|$)/.test(u))).toBe(
      false
    );
  });

  it('still returns static pages when the leads API is down', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('down')) as unknown as typeof fetch;
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain('https://qaznedr.kz/ru/leads');
  });
});
```

- [ ] **Step 2: Убедиться, что падают.** Run: `npx jest src/__tests__/lib/seo/pages.test.ts src/__tests__/app/robots-sitemap.test.ts --coverage=false`. Expected: FAIL (нет модуля; в robots нет `/*/dashboard`; в sitemap есть `/listings`).

- [ ] **Step 3: `src/lib/seo/pages.ts`**

```ts
import { LOCALES } from './site';

/** Indexable pages (without locale prefix). Drives sitemap.xml. */
export const PUBLIC_PAGES = [
  '',
  '/leads',
  '/services',
  '/services/geological',
  '/services/legal',
  '/services/investors',
  '/about',
  '/contact',
  '/faq',
  '/support',
  '/legal/terms',
  '/blog',
  '/education',
  '/knowledge',
  '/news',
] as const;

/**
 * Legacy marketplace routes hidden after the holding pivot (spec §4).
 * prefix → replacement, both without locale. The code behind them is kept;
 * delete an entry here to bring a section back.
 */
export const HIDDEN_ROUTE_REDIRECTS: ReadonlyArray<readonly [string, string]> =
  [
    ['/listings', '/leads'],
    ['/companies', '/about'],
    ['/services/catalog', '/services'],
    ['/services/equipment', '/services'],
    ['/map', '/leads'],
    ['/favorites', '/leads'],
    ['/messages', '/contact'],
    ['/dashboard', '/leads'],
    ['/auth/register', '/contact'],
  ];

const LOCALE_PATH = new RegExp(`^/(${LOCALES.join('|')})(/.*)?$`);

export function hiddenRouteRedirect(pathname: string): string | null {
  const match = pathname.match(LOCALE_PATH);
  if (!match) return null;
  const [, locale, rest = ''] = match;
  for (const [prefix, target] of HIDDEN_ROUTE_REDIRECTS) {
    if (rest === prefix || rest.startsWith(`${prefix}/`)) {
      return `/${locale}${target}`;
    }
  }
  return null;
}
```

- [ ] **Step 4: Заменить `src/app/robots.ts` целиком**

```ts
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/site';

// Private/utility areas. Legacy marketplace routes are 308-redirected in
// middleware (src/lib/seo/pages.ts), so they need no rule here.
// AI crawlers (GPTBot, ClaudeBot, PerplexityBot…) are intentionally allowed.
const disallow = [
  '/api/',
  '/*/admin',
  '/*/auth/',
  '/*/dashboard',
  '/*/favorites',
  '/*/leads/*/full',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      { userAgent: 'Yandex', allow: '/', disallow, crawlDelay: 2 },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
```

- [ ] **Step 5: Заменить `src/app/sitemap.ts` целиком**

```ts
import type { MetadataRoute } from 'next';
import { buildLanguageAlternates } from '@/lib/seo/metadata';
import { PUBLIC_PAGES } from '@/lib/seo/pages';
import { LOCALES, SITE_URL, localeUrl } from '@/lib/seo/site';

// Stable build-time date to avoid lastModified churn on every deploy.
const BUILD_DATE = new Date('2026-09-26');

async function fetchLeadCodes(): Promise<string[]> {
  const codes: string[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await fetch(`${SITE_URL}/api/leads?limit=50&page=${page}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    const leads: { code: string }[] = data?.success
      ? (data.data?.leads ?? [])
      : [];
    if (!leads.length) break;
    codes.push(...leads.map((l) => l.code));
    totalPages = data.data?.totalPages ?? 1;
    page++;
  } while (page <= totalPages);
  return codes;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    PUBLIC_PAGES.map((page) => ({
      url: localeUrl(locale, page),
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly' as const,
      priority: page === '' ? 1.0 : 0.8,
      alternates: { languages: buildLanguageAlternates(page) },
    }))
  );

  let leadEntries: MetadataRoute.Sitemap = [];
  try {
    const codes = await fetchLeadCodes();
    leadEntries = codes.flatMap((code) =>
      LOCALES.map((locale) => ({
        url: localeUrl(locale, `/leads/${code}`),
        lastModified: BUILD_DATE,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
        alternates: { languages: buildLanguageAlternates(`/leads/${code}`) },
      }))
    );
  } catch {
    // Leads API unavailable at build time: ship static entries only.
  }

  return [...staticEntries, ...leadEntries];
}
```

- [ ] **Step 6: Тесты проходят.** Run: `npx jest src/__tests__/lib/seo src/__tests__/app --coverage=false`. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/seo/pages.ts src/app/robots.ts src/app/sitemap.ts src/__tests__/lib/seo/pages.test.ts src/__tests__/app/robots-sitemap.test.ts
git commit -m "feat(seo): public page registry, sitemap without marketplace, robots fixes"
```

---

### Task 4: Скрыть маркетплейс (редиректы, меню, таб-бар, футер)

**Files:**

- Modify: `middleware.ts`, `src/components/layouts/Navigation.tsx` (переписать), `src/components/layouts/MobileTabBar.tsx` (переписать), `src/components/layouts/Footer.tsx`, `src/lib/i18n/translations.ts` (4 ключа `navigation`), `src/__tests__/lib/i18n/holding-keys.test.ts`
- Test: `src/__tests__/components/layouts/MobileTabBar.test.tsx`

**Interfaces:**

- Consumes: `hiddenRouteRedirect` (Task 3), `translate`.
- Produces: ключи `navigation.home`, `navigation.about`, `navigation.contact`, `navigation.admin`.

- [ ] **Step 1: Добавить ключи в падающий тест.** В `holding-keys.test.ts` заменить `const KEYS: string[] = [...SEO_KEYS];` на:

```ts
const NAV_KEYS = [
  'navigation.home',
  'navigation.about',
  'navigation.contact',
  'navigation.admin',
];

// Later tasks append their namespaces here.
const KEYS: string[] = [...SEO_KEYS, ...NAV_KEYS];
```

Создать `src/__tests__/components/layouts/MobileTabBar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import MobileTabBar from '@/components/layouts/MobileTabBar';

// jest.setup.js mocks usePathname as a plain function returning '/'.
jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));

describe('MobileTabBar', () => {
  it('shows holding tabs in the current locale without marketplace entries', () => {
    (usePathname as jest.Mock).mockReturnValue('/zh/leads');
    render(<MobileTabBar />);
    const hrefs = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/zh', '/zh/leads', '/zh/services', '/zh/contact']);
    expect(screen.getByText('联系我们')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Убедиться, что падают.** Run: `npx jest src/__tests__/lib/i18n src/__tests__/components/layouts/MobileTabBar.test.tsx --coverage=false`. Expected: FAIL.

- [ ] **Step 3: Ключи навигации.** В каждом блоке `navigation: {` после строки `createListing: ...,` добавить:
  - ru: `home: 'Главная', about: 'О компании', contact: 'Связаться', admin: 'Админка',`
  - kz: `home: 'Басты бет', about: 'Компания туралы', contact: 'Байланыс', admin: 'Әкімші',`
  - en: `home: 'Home', about: 'About', contact: 'Contact', admin: 'Admin',`
  - zh: `home: '首页', about: '关于我们', contact: '联系我们', admin: '管理后台',`

- [ ] **Step 4: Middleware.** В `middleware.ts` добавить импорт `import { hiddenRouteRedirect } from '@/lib/seo/pages';` и сразу после строки `const currentLocale = getLocale(pathname);` вставить:

```ts
// Legacy marketplace routes hidden after the holding pivot → permanent redirect.
const hiddenTarget = hiddenRouteRedirect(pathname);
if (hiddenTarget) {
  return applySecurityHeaders(
    NextResponse.redirect(new URL(hiddenTarget, request.url), 308),
    defaultSecurityConfig
  );
}
```

- [ ] **Step 5: Заменить `src/components/layouts/MobileTabBar.tsx` целиком**

```tsx
'use client';

import { Home, Gem, Briefcase, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { translate } from '@/lib/i18n/translations';

export default function MobileTabBar() {
  const pathname = usePathname();

  const locale = useMemo(() => {
    const segment = pathname.split('/')[1];
    return ['ru', 'kz', 'en', 'zh'].includes(segment) ? segment : 'ru';
  }, [pathname]);

  const tabs = [
    { key: 'home', icon: Home, href: `/${locale}` },
    { key: 'leads', icon: Gem, href: `/${locale}/leads` },
    { key: 'services', icon: Briefcase, href: `/${locale}/services` },
    { key: 'contact', icon: MessageCircle, href: `/${locale}/contact` },
  ];

  const isActive = (href: string) =>
    href === `/${locale}`
      ? pathname === href || pathname === `${href}/`
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label={translate(locale, 'common.menu')}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 dark:bg-[#0A0A0A] dark:border-[#262626]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0A84FF] ${
                active
                  ? 'text-gray-900 dark:text-gray-50'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Icon aria-hidden size={20} />
              <span className="text-[10px]">
                {translate(locale, `navigation.${tab.key}`)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 6: Заменить `src/components/layouts/Navigation.tsx` целиком**

```tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { Menu, LogOut, Shield } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

/**
 * Navigation — fixed top nav bar, h-16 (desktop) / h-14 (mobile).
 *
 * IMPORTANT: Every page that renders this component must add `pt-16`
 * (or `pt-14` on mobile if using the shorter bar) to its root content
 * wrapper so the fixed nav does not overlap page content.
 */
export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { t, locale } = useTranslation();
  const { data: session } = useSession();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: t('navigation.leads'), href: `/${locale}/leads` },
    { label: t('navigation.services'), href: `/${locale}/services` },
    { label: t('navigation.blog'), href: `/${locale}/blog` },
    { label: t('navigation.about'), href: `/${locale}/about` },
  ];
  const contactHref = `/${locale}/contact`;
  const adminHref = `/${locale}/admin`;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <nav
      aria-label={t('common.menu')}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 border-b border-gray-100 dark:bg-[#0A0A0A]/95 dark:border-gray-800'
          : 'bg-white border-b border-transparent dark:bg-[#0A0A0A] dark:border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-16">
          <Link
            href={`/${locale}`}
            className="font-bold tracking-tight text-gray-900 dark:text-gray-50 text-lg"
          >
            QAZNEDR
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`px-3 py-2 text-sm transition-colors rounded-md ${
                  isActive(link.href)
                    ? 'text-gray-900 dark:text-gray-50 font-medium'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            {session && (
              <>
                <Link
                  href={adminHref}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 transition-colors"
                >
                  <Shield aria-hidden className="w-4 h-4" />
                  {t('navigation.admin')}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: `/${locale}` })}
                  aria-label={t('common.logout')}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <LogOut aria-hidden className="w-4 h-4" />
                </button>
              </>
            )}
            <Link
              href={contactHref}
              className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              {t('navigation.contact')}
            </Link>
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label={t('common.menu')}
                  aria-expanded={isOpen}
                  aria-controls="mobile-nav-menu"
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]"
                >
                  <Menu aria-hidden className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                id="mobile-nav-menu"
                side="right"
                className="w-[300px] sm:w-[360px] p-0"
              >
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <SheetTitle className="text-left text-base font-semibold text-gray-900 dark:text-gray-50">
                    {t('common.menu')}
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-[calc(100%-73px)]">
                  <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${
                            isActive(link.href)
                              ? 'text-gray-900 dark:text-gray-50 font-medium bg-gray-50 dark:bg-gray-800'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                    {session && (
                      <SheetClose asChild>
                        <Link
                          href={adminHref}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Shield aria-hidden className="w-4 h-4" />
                          {t('navigation.admin')}
                        </Link>
                      </SheetClose>
                    )}
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-3">
                    <div className="flex items-center justify-between px-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('common.theme') !== 'common.theme'
                          ? t('common.theme')
                          : 'Тема'}
                      </span>
                      <ThemeToggle />
                    </div>
                    <SheetClose asChild>
                      <Link
                        href={contactHref}
                        className="block w-full px-4 py-2.5 text-sm text-center font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                      >
                        {t('navigation.contact')}
                      </Link>
                    </SheetClose>
                    {session && (
                      <button
                        onClick={() => signOut({ callbackUrl: `/${locale}` })}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <LogOut aria-hidden className="w-4 h-4" />
                        <span>{t('common.logout')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

Удалён только `backdrop-blur-xl`: это glassmorphism, он запрещён брифом. Всё остальное сохранено по классам.

- [ ] **Step 7: Футер.** В `src/components/layouts/Footer.tsx`:
  - удалить три элемента `<li>`, чьи `Link` ведут на `` `/${locale}/listings` ``, `` `/${locale}/companies` `` и `` `/${locale}/map` ``;
  - в ссылке с текстом `t('footerNav.info.contacts')` заменить ``href={`/${locale}/support`}`` на ``href={`/${locale}/contact`}``.

- [ ] **Step 8: Тесты и типы.** Run: `npx jest src/__tests__/lib src/__tests__/components/layouts --coverage=false && npm run type-check`. Expected: PASS, 0 ошибок.

- [ ] **Step 9: Commit**

```bash
git add middleware.ts src/components/layouts src/lib/i18n/translations.ts src/__tests__/lib/i18n/holding-keys.test.ts src/__tests__/components/layouts/MobileTabBar.test.tsx
git commit -m "feat(nav): hide marketplace — 308 redirects, holding menu, contact CTA"
```

---

### Task 5: Контакты и компонент `ContactChannels`

**Files:**

- Create: `src/lib/config/contacts.ts`, `src/components/features/ContactChannels.tsx`
- Modify: `src/lib/i18n/translations.ts` (namespace `contact`), `src/__tests__/lib/i18n/holding-keys.test.ts`
- Test: `src/__tests__/lib/config/contacts.test.ts`, `src/__tests__/components/features/ContactChannels.test.tsx`

**Interfaces:**

- Produces:
  - `interface ContactConfig { whatsappNumber: string | null; wechatId: string | null; wechatQrSrc: string | null; email: string | null }`;
  - `normalizeContactConfig(raw: { whatsapp?: string; wechatId?: string; wechatQr?: string; email?: string }): ContactConfig`;
  - `getContactConfig(): ContactConfig` (читает `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_WECHAT_ID`, `NEXT_PUBLIC_WECHAT_QR`, `NEXT_PUBLIC_CONTACT_EMAIL` буквальными обращениями, чтобы Next их инлайнил);
  - `whatsappLink(number: string, text: string): string`;
  - `<ContactChannels config={ContactConfig} locale={string} leadCode?={string} />` с каналами в `[data-channel="wechat|whatsapp|email"]`.
- Ключи `contact.*`: `title, subtitle, wechatTitle, wechatHint, wechatQrAlt, copy, copied, whatsappTitle, whatsappCta, emailTitle, formTitle, whatsappTextLead, whatsappTextGeneral, discussHeading, discussNote`.

- [ ] **Step 1: Падающие тесты.**

`src/__tests__/lib/config/contacts.test.ts`:

```ts
import { normalizeContactConfig, whatsappLink } from '@/lib/config/contacts';

describe('contacts config', () => {
  it('keeps only digits in the WhatsApp number and nulls empty values', () => {
    expect(
      normalizeContactConfig({
        whatsapp: '+7 (700) 123-45-67',
        wechatId: '   ',
        wechatQr: '/contacts/wechat-qr.png',
        email: undefined,
      })
    ).toEqual({
      whatsappNumber: '77001234567',
      wechatId: null,
      wechatQrSrc: '/contacts/wechat-qr.png',
      email: null,
    });
  });

  it('treats a number without digits as missing', () => {
    expect(normalizeContactConfig({ whatsapp: '+' }).whatsappNumber).toBeNull();
  });

  it('builds a wa.me link with an encoded prefilled message', () => {
    expect(whatsappLink('77001234567', 'Участок AU-1')).toBe(
      `https://wa.me/77001234567?text=${encodeURIComponent('Участок AU-1')}`
    );
  });
});
```

`src/__tests__/components/features/ContactChannels.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import ContactChannels from '@/components/features/ContactChannels';

jest.mock('@vercel/analytics', () => ({ track: jest.fn() }));

const full = {
  whatsappNumber: '77001234567',
  wechatId: 'qaznedr_holding',
  wechatQrSrc: '/contacts/wechat-qr.png',
  email: 'info@qaznedr.kz',
};

const order = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-channel]')).map((n) =>
    n.getAttribute('data-channel')
  );

describe('ContactChannels', () => {
  it('puts WeChat first for Chinese visitors', () => {
    const { container } = render(
      <ContactChannels config={full} locale="zh" leadCode="AU-1" />
    );
    expect(order(container)).toEqual(['wechat', 'whatsapp', 'email']);
    expect(
      screen.getByAltText('QAZNEDR HOLDING 微信二维码')
    ).toBeInTheDocument();
  });

  it('puts WhatsApp first elsewhere with the area code prefilled', () => {
    const { container } = render(
      <ContactChannels config={full} locale="en" leadCode="AU-1" />
    );
    expect(order(container)[0]).toBe('whatsapp');
    expect(
      screen.getByRole('link', { name: /WhatsApp/ }).getAttribute('href')
    ).toBe(
      `https://wa.me/77001234567?text=${encodeURIComponent(
        'Hello! I am interested in area AU-1 on qaznedr.kz.'
      )}`
    );
  });

  it('renders nothing for channels that are not configured', () => {
    const { container } = render(
      <ContactChannels
        config={{
          whatsappNumber: null,
          wechatId: null,
          wechatQrSrc: null,
          email: null,
        }}
        locale="ru"
      />
    );
    expect(order(container)).toEqual([]);
  });

  it('keeps the WeChat ID visible when the clipboard API is missing', () => {
    const original = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    render(<ContactChannels config={full} locale="zh" />);
    fireEvent.click(screen.getByRole('button', { name: '复制' }));
    expect(screen.getByText('qaznedr_holding')).toBeInTheDocument();
    Object.defineProperty(navigator, 'clipboard', {
      value: original,
      configurable: true,
    });
  });

  it('shows the copied state after a successful copy', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    render(<ContactChannels config={full} locale="zh" />);
    fireEvent.click(screen.getByRole('button', { name: '复制' }));
    expect(await screen.findByText('已复制')).toBeInTheDocument();
  });
});
```

В `holding-keys.test.ts` добавить массив и включить его в `KEYS`:

```ts
const CONTACT_KEYS = [
  'contact.title',
  'contact.subtitle',
  'contact.wechatHint',
  'contact.wechatQrAlt',
  'contact.copy',
  'contact.copied',
  'contact.whatsappCta',
  'contact.formTitle',
  'contact.whatsappTextLead',
  'contact.whatsappTextGeneral',
  'contact.discussHeading',
  'contact.discussNote',
];
```

`const KEYS: string[] = [...SEO_KEYS, ...NAV_KEYS, ...CONTACT_KEYS];`

Ключи `wechatTitle`, `whatsappTitle` и `emailTitle` в тест не входят: у en и kz они совпадают с ru («WhatsApp», «Email»).

- [ ] **Step 2: Убедиться, что падают.** Run: `npx jest src/__tests__/lib/config src/__tests__/components/features/ContactChannels.test.tsx src/__tests__/lib/i18n --coverage=false`. Expected: FAIL.

- [ ] **Step 3: `src/lib/config/contacts.ts`**

```ts
export interface ContactConfig {
  whatsappNumber: string | null;
  wechatId: string | null;
  wechatQrSrc: string | null;
  email: string | null;
}

const clean = (value?: string): string | null =>
  value && value.trim() ? value.trim() : null;

export function normalizeContactConfig(raw: {
  whatsapp?: string;
  wechatId?: string;
  wechatQr?: string;
  email?: string;
}): ContactConfig {
  const digits = (raw.whatsapp ?? '').replace(/\D/g, '');
  return {
    whatsappNumber: digits || null,
    wechatId: clean(raw.wechatId),
    wechatQrSrc: clean(raw.wechatQr),
    email: clean(raw.email),
  };
}

// Literal process.env.NEXT_PUBLIC_* reads so Next.js inlines them at build time.
export function getContactConfig(): ContactConfig {
  return normalizeContactConfig({
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    wechatId: process.env.NEXT_PUBLIC_WECHAT_ID,
    wechatQr: process.env.NEXT_PUBLIC_WECHAT_QR,
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  });
}

export function whatsappLink(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
```

- [ ] **Step 4: `src/components/features/ContactChannels.tsx`**

```tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { track } from '@vercel/analytics';
import { Check, Copy, Mail, MessageCircle } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import { whatsappLink, type ContactConfig } from '@/lib/config/contacts';

interface ContactChannelsProps {
  config: ContactConfig;
  locale: string;
  leadCode?: string;
}

const card =
  'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] p-5';

export default function ContactChannels({
  config,
  locale,
  leadCode,
}: ContactChannelsProps) {
  const t = (key: string, params?: Record<string, unknown>) =>
    translate(locale, key, params);
  const [copied, setCopied] = useState(false);

  const copyWeChat = async () => {
    if (!config.wechatId) return;
    track('wechat_copy', { lead: leadCode ?? '' });
    try {
      await navigator.clipboard?.writeText(config.wechatId);
      if (navigator.clipboard) setCopied(true);
    } catch {
      // Clipboard blocked (e.g. WeChat in-app browser): ID stays selectable.
    }
  };

  const wechat =
    config.wechatId || config.wechatQrSrc ? (
      <section key="wechat" data-channel="wechat" className={card}>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          <MessageCircle
            aria-hidden
            className="w-4 h-4 text-gold-dark dark:text-gold-light"
          />
          {t('contact.wechatTitle')}
        </h3>
        <p className="mt-1 text-xs text-gray-500">{t('contact.wechatHint')}</p>
        {config.wechatQrSrc && (
          <Image
            src={config.wechatQrSrc}
            alt={t('contact.wechatQrAlt')}
            width={176}
            height={176}
            className="mt-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-white"
          />
        )}
        {config.wechatId && (
          <div className="mt-3 flex items-center gap-2">
            <span className="select-all font-mono text-sm text-gray-900 dark:text-gray-100">
              {config.wechatId}
            </span>
            <button
              type="button"
              onClick={copyWeChat}
              className="inline-flex items-center gap-1 min-h-[44px] px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {copied ? (
                <Check aria-hidden className="w-3.5 h-3.5" />
              ) : (
                <Copy aria-hidden className="w-3.5 h-3.5" />
              )}
              {copied ? t('contact.copied') : t('contact.copy')}
            </button>
          </div>
        )}
      </section>
    ) : null;

  const whatsapp = config.whatsappNumber ? (
    <section key="whatsapp" data-channel="whatsapp" className={card}>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t('contact.whatsappTitle')}
      </h3>
      <a
        href={whatsappLink(
          config.whatsappNumber,
          leadCode
            ? t('contact.whatsappTextLead', { code: leadCode })
            : t('contact.whatsappTextGeneral')
        )}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track('click_whatsapp', { lead: leadCode ?? '' })}
        className="mt-3 flex items-center justify-center gap-2 w-full min-h-[44px] px-4 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
      >
        <MessageCircle aria-hidden className="w-4 h-4" />
        {t('contact.whatsappCta')}
      </a>
    </section>
  ) : null;

  const email = config.email ? (
    <section key="email" data-channel="email" className={card}>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t('contact.emailTitle')}
      </h3>
      <a
        href={`mailto:${config.email}`}
        className="mt-2 inline-flex items-center gap-2 text-sm text-[#0060DF] hover:underline"
      >
        <Mail aria-hidden className="w-4 h-4" />
        {config.email}
      </a>
    </section>
  ) : null;

  const ordered =
    locale === 'zh' ? [wechat, whatsapp, email] : [whatsapp, wechat, email];
  const visible = ordered.filter(Boolean);
  if (!visible.length) return null;

  return <div className="space-y-3">{visible}</div>;
}
```

- [ ] **Step 5: Namespace `contact`.** В каждом локальном объекте сразу после блока `seo: {...},` вставить:

ru:

```ts
    contact: {
      title: 'Связаться с QAZNEDR HOLDING',
      subtitle:
        'Напишите в удобный мессенджер или оставьте заявку — ответим в течение рабочего дня.',
      wechatTitle: 'WeChat',
      wechatHint: 'Отсканируйте QR-код или добавьте ID. Укажите код участка.',
      wechatQrAlt: 'QR-код WeChat QAZNEDR HOLDING',
      copy: 'Копировать',
      copied: 'Скопировано',
      whatsappTitle: 'WhatsApp',
      whatsappCta: 'Написать в WhatsApp',
      emailTitle: 'Email',
      formTitle: 'Оставить заявку',
      whatsappTextLead: 'Здравствуйте! Интересует участок {code} на qaznedr.kz.',
      whatsappTextGeneral: 'Здравствуйте! Пишу с сайта qaznedr.kz.',
      discussHeading: 'Обсудить участок',
      discussNote:
        'Детали, формат сделки и документы — на встрече после подписания NDA.',
    },
```

kz:

```ts
    contact: {
      title: 'QAZNEDR HOLDING-пен байланысу',
      subtitle:
        'Ыңғайлы мессенджерге жазыңыз немесе өтінім қалдырыңыз — бір жұмыс күні ішінде жауап береміз.',
      wechatTitle: 'WeChat',
      wechatHint: 'QR-кодты сканерлеңіз немесе ID қосыңыз. Учаске кодын көрсетіңіз.',
      wechatQrAlt: 'QAZNEDR HOLDING WeChat QR-коды',
      copy: 'Көшіру',
      copied: 'Көшірілді',
      whatsappTitle: 'WhatsApp',
      whatsappCta: 'WhatsApp-қа жазу',
      emailTitle: 'Email',
      formTitle: 'Өтінім қалдыру',
      whatsappTextLead:
        'Сәлеметсіз бе! qaznedr.kz сайтындағы {code} учаскесі қызықтырады.',
      whatsappTextGeneral: 'Сәлеметсіз бе! qaznedr.kz сайтынан жазып отырмын.',
      discussHeading: 'Учаскені талқылау',
      discussNote:
        'Мәліметтер, мәміле форматы және құжаттар — NDA-ға қол қойылғаннан кейінгі кездесуде.',
    },
```

en:

```ts
    contact: {
      title: 'Contact QAZNEDR HOLDING',
      subtitle:
        'Message us in your preferred messenger or send an inquiry — we reply within one business day.',
      wechatTitle: 'WeChat',
      wechatHint: 'Scan the QR code or add our ID. Please mention the area code.',
      wechatQrAlt: 'QAZNEDR HOLDING WeChat QR code',
      copy: 'Copy',
      copied: 'Copied',
      whatsappTitle: 'WhatsApp',
      whatsappCta: 'Message on WhatsApp',
      emailTitle: 'Email',
      formTitle: 'Send an inquiry',
      whatsappTextLead: 'Hello! I am interested in area {code} on qaznedr.kz.',
      whatsappTextGeneral: 'Hello! I am writing from qaznedr.kz.',
      discussHeading: 'Discuss this area',
      discussNote:
        'Details, deal format and documents are shared at a meeting after an NDA is signed.',
    },
```

zh:

```ts
    contact: {
      title: '联系 QAZNEDR HOLDING',
      subtitle: '通过微信或 WhatsApp 联系我们，或提交在线咨询，我们将在一个工作日内回复。',
      wechatTitle: '微信',
      wechatHint: '扫描二维码或添加微信号，请注明项目编号。',
      wechatQrAlt: 'QAZNEDR HOLDING 微信二维码',
      copy: '复制',
      copied: '已复制',
      whatsappTitle: 'WhatsApp',
      whatsappCta: '通过 WhatsApp 联系',
      emailTitle: '邮箱',
      formTitle: '在线咨询',
      whatsappTextLead: '您好！我对 qaznedr.kz 上的项目 {code} 感兴趣。',
      whatsappTextGeneral: '您好！我从 qaznedr.kz 联系您。',
      discussHeading: '洽谈该项目',
      discussNote: '项目详情、合作方式及文件将在签署保密协议后的会面中提供。',
    },
```

- [ ] **Step 6: Тесты проходят.** Run: `npx jest src/__tests__/lib/config src/__tests__/components/features/ContactChannels.test.tsx src/__tests__/lib/i18n --coverage=false`. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/config/contacts.ts src/components/features/ContactChannels.tsx src/lib/i18n/translations.ts src/__tests__/lib/config src/__tests__/components/features/ContactChannels.test.tsx src/__tests__/lib/i18n/holding-keys.test.ts
git commit -m "feat(contact): env-driven WeChat/WhatsApp/email channels, WeChat first on /zh"
```

---

### Task 6: Заявки — таблица, валидация, антиспам, Telegram, публичный API

**Files:**

- Create: `supabase/migrations/20260926_inquiries.sql`, `src/lib/inquiries/schema.ts`, `src/lib/inquiries/throttle.ts`, `src/lib/inquiries/notify.ts`, `src/app/api/inquiries/route.ts`
- Test: `src/__tests__/lib/inquiries/schema.test.ts`, `src/__tests__/lib/inquiries/throttle.test.ts`, `src/__tests__/lib/inquiries/notify.test.ts`, `src/__tests__/api/inquiries.route.test.ts`

**Interfaces:**

- Produces:
  - `INQUIRY_CHANNELS = ['wechat','whatsapp','email','phone','telegram'] as const`, `INQUIRY_STATUSES = ['NEW','CONTACTED','MEETING','DEAL','REJECTED'] as const`, `type InquiryChannel`, `type InquiryStatus`, `inquirySchema`, `type InquiryInput`, `isLikelySpam(input): boolean`;
  - `createThrottle({ limit, windowMs, now? }): (key: string) => boolean`;
  - `formatInquiryMessage(input: InquiryInput, id: string): string`, `notifyTelegram(text, env?, fetchImpl?): Promise<boolean>`;
  - `POST /api/inquiries`. Тело запроса: `{ name, company?, country?, channel, contact, message?, leadCode?, locale, sourcePath?, utm?, website?, elapsedMs? }`. Ответы: 200 `{success:true}` / 400 / 429 / 500.

- [ ] **Step 1: Падающие тесты.**

`src/__tests__/lib/inquiries/schema.test.ts`:

```ts
import { inquirySchema, isLikelySpam } from '@/lib/inquiries/schema';

const valid = {
  name: 'Li Wei',
  channel: 'wechat',
  contact: 'liwei_88',
  locale: 'zh',
  leadCode: 'AU-508A4C',
};

describe('inquirySchema', () => {
  it('accepts minimal input and fills defaults', () => {
    const r = inquirySchema.parse(valid);
    expect(r).toMatchObject({ company: '', message: '', website: '' });
  });

  it('trims text fields', () => {
    expect(inquirySchema.parse({ ...valid, name: '  Li  ' }).name).toBe('Li');
  });

  it.each([
    { ...valid, name: '   ' },
    { ...valid, channel: 'fax' },
    { ...valid, contact: 'ab' },
    { ...valid, locale: 'de' },
    { ...valid, leadCode: 'DROP TABLE' },
    { ...valid, message: 'x'.repeat(2001) },
  ])('rejects invalid input #%#', (input) => {
    expect(inquirySchema.safeParse(input).success).toBe(false);
  });

  it('keeps only known utm fields', () => {
    const r = inquirySchema.parse({
      ...valid,
      utm: { source: 'baidu', evil: 'x' },
    });
    expect(r.utm).toEqual({ source: 'baidu' });
  });
});

describe('isLikelySpam', () => {
  it('flags a filled honeypot or a too-fast submit', () => {
    expect(isLikelySpam(inquirySchema.parse({ ...valid, website: 'x' }))).toBe(
      true
    );
    expect(
      isLikelySpam(inquirySchema.parse({ ...valid, elapsedMs: 500 }))
    ).toBe(true);
    expect(
      isLikelySpam(inquirySchema.parse({ ...valid, elapsedMs: 8000 }))
    ).toBe(false);
    expect(isLikelySpam(inquirySchema.parse(valid))).toBe(false);
  });
});
```

`src/__tests__/lib/inquiries/throttle.test.ts`:

```ts
import { createThrottle } from '@/lib/inquiries/throttle';

it('allows `limit` hits per key per window', () => {
  let now = 0;
  const allow = createThrottle({ limit: 2, windowMs: 1000, now: () => now });
  expect(allow('a')).toBe(true);
  expect(allow('a')).toBe(true);
  expect(allow('a')).toBe(false);
  expect(allow('b')).toBe(true);
  now = 1001;
  expect(allow('a')).toBe(true);
});
```

`src/__tests__/lib/inquiries/notify.test.ts`:

```ts
import { inquirySchema } from '@/lib/inquiries/schema';
import { formatInquiryMessage, notifyTelegram } from '@/lib/inquiries/notify';

const input = inquirySchema.parse({
  name: 'Li Wei',
  company: 'Zijin',
  channel: 'wechat',
  contact: 'liwei_88',
  locale: 'zh',
  leadCode: 'AU-508A4C',
  sourcePath: '/zh/leads/AU-508A4C',
});

describe('formatInquiryMessage', () => {
  it('includes the essentials and no "undefined"', () => {
    const msg = formatInquiryMessage(input, 'uuid-1');
    expect(msg).toContain('AU-508A4C');
    expect(msg).toContain('wechat: liwei_88');
    expect(msg).toContain('Zijin');
    expect(msg).toContain('uuid-1');
    expect(msg).not.toContain('undefined');
  });
});

describe('notifyTelegram', () => {
  it('does nothing when not configured', async () => {
    const f = jest.fn();
    await expect(
      notifyTelegram('x', { token: undefined, chatId: undefined }, f)
    ).resolves.toBe(false);
    expect(f).not.toHaveBeenCalled();
  });

  it('posts plain text to the bot API', async () => {
    const f = jest.fn().mockResolvedValue({ ok: true });
    await expect(
      notifyTelegram('hi', { token: 'T', chatId: '42' }, f)
    ).resolves.toBe(true);
    expect(f).toHaveBeenCalledWith(
      'https://api.telegram.org/botT/sendMessage',
      expect.objectContaining({ method: 'POST' })
    );
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({
      chat_id: '42',
      text: 'hi',
      disable_web_page_preview: true,
    });
  });

  it('never throws on network errors', async () => {
    const f = jest.fn().mockRejectedValue(new Error('down'));
    await expect(
      notifyTelegram('hi', { token: 'T', chatId: '42' }, f)
    ).resolves.toBe(false);
  });
});
```

`src/__tests__/api/inquiries.route.test.ts`:

```ts
/** @jest-environment node */
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/inquiries/notify', () => ({
  ...jest.requireActual('@/lib/inquiries/notify'),
  notifyTelegram: jest.fn().mockResolvedValue(true),
}));

import { createServiceClient } from '@/lib/supabase/server';
import { notifyTelegram } from '@/lib/inquiries/notify';
import { POST } from '@/app/api/inquiries/route';

const valid = {
  name: 'Li Wei',
  channel: 'wechat',
  contact: 'liwei_88',
  locale: 'zh',
  leadCode: 'AU-508A4C',
  elapsedMs: 9000,
};

function req(body: unknown, ip: string) {
  return new NextRequest('https://qaznedr.kz/api/inquiries', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

let insert: jest.Mock;

beforeEach(() => {
  insert = jest.fn().mockReturnValue({
    select: () => ({
      single: async () => ({ data: { id: 'uuid-1' }, error: null }),
    }),
  });
  (createServiceClient as jest.Mock).mockResolvedValue({
    from: jest.fn().mockReturnValue({ insert }),
  });
  (notifyTelegram as jest.Mock).mockClear();
});

describe('POST /api/inquiries', () => {
  it('stores a valid inquiry and notifies Telegram', async () => {
    const res = await POST(req(valid, '10.0.0.1'));
    expect(res.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        lead_code: 'AU-508A4C',
        name: 'Li Wei',
        channel: 'wechat',
        contact: 'liwei_88',
        locale: 'zh',
      })
    );
    expect(notifyTelegram).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed JSON and invalid bodies with 400', async () => {
    expect((await POST(req('{oops', '10.0.0.2'))).status).toBe(400);
    expect(
      (await POST(req({ ...valid, channel: 'fax' }, '10.0.0.2'))).status
    ).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it('silently drops honeypot spam', async () => {
    const res = await POST(req({ ...valid, website: 'x' }, '10.0.0.3'));
    expect(res.status).toBe(200);
    expect(insert).not.toHaveBeenCalled();
    expect(notifyTelegram).not.toHaveBeenCalled();
  });

  it('still succeeds when Telegram is down', async () => {
    (notifyTelegram as jest.Mock).mockResolvedValueOnce(false);
    expect((await POST(req(valid, '10.0.0.4'))).status).toBe(200);
    expect(insert).toHaveBeenCalled();
  });

  it('returns 500 when the insert fails', async () => {
    insert.mockReturnValue({
      select: () => ({
        single: async () => ({ data: null, error: { message: 'x' } }),
      }),
    });
    expect((await POST(req(valid, '10.0.0.5'))).status).toBe(500);
    expect(notifyTelegram).not.toHaveBeenCalled();
  });

  it('returns 429 after 5 requests from one IP within 10 minutes', async () => {
    for (let i = 0; i < 5; i++) await POST(req(valid, '10.0.0.9'));
    expect((await POST(req(valid, '10.0.0.9'))).status).toBe(429);
  });
});
```

- [ ] **Step 2: Убедиться, что падают.** Run: `npx jest src/__tests__/lib/inquiries src/__tests__/api --coverage=false`. Expected: FAIL, модули не найдены.

- [ ] **Step 3: `src/lib/inquiries/schema.ts`**

```ts
import { z } from 'zod';

export const INQUIRY_CHANNELS = [
  'wechat',
  'whatsapp',
  'email',
  'phone',
  'telegram',
] as const;
export const INQUIRY_STATUSES = [
  'NEW',
  'CONTACTED',
  'MEETING',
  'DEAL',
  'REJECTED',
] as const;
export type InquiryChannel = (typeof INQUIRY_CHANNELS)[number];
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

const text = (max: number) => z.string().trim().max(max);
const utmValue = z.string().max(200).optional();

export const inquirySchema = z.object({
  name: text(120).min(1),
  company: text(160).default(''),
  country: text(80).default(''),
  channel: z.enum(INQUIRY_CHANNELS),
  contact: text(160).min(3),
  message: text(2000).default(''),
  leadCode: z
    .string()
    .trim()
    .regex(/^[A-Z]{1,6}-[A-Z0-9]{3,12}$/)
    .optional(),
  locale: z.enum(['ru', 'kz', 'en', 'zh']),
  sourcePath: text(300).default(''),
  utm: z
    .object({
      source: utmValue,
      medium: utmValue,
      campaign: utmValue,
      term: utmValue,
      content: utmValue,
    })
    .optional(),
  // Honeypot: real users never see or fill this field.
  website: z.string().max(200).default(''),
  // Time between form render and submit, measured client-side.
  elapsedMs: z.number().int().nonnegative().optional(),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

const MIN_FILL_MS = 2000;

export function isLikelySpam(input: InquiryInput): boolean {
  return (
    input.website.trim() !== '' ||
    (input.elapsedMs !== undefined && input.elapsedMs < MIN_FILL_MS)
  );
}
```

- [ ] **Step 4: `src/lib/inquiries/throttle.ts`**

```ts
// Best-effort in-memory limiter. Per serverless instance only — Upstash is not
// configured in production, so this plus the honeypot is the spam guard.
export function createThrottle({
  limit,
  windowMs,
  now = () => Date.now(),
}: {
  limit: number;
  windowMs: number;
  now?: () => number;
}): (key: string) => boolean {
  const hits = new Map<string, number[]>();
  return function allow(key: string): boolean {
    const t = now();
    const recent = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(t);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear(); // bound memory on long-lived instances
    return true;
  };
}
```

- [ ] **Step 5: `src/lib/inquiries/notify.ts`**

```ts
import type { InquiryInput } from './schema';

export function formatInquiryMessage(input: InquiryInput, id: string): string {
  const lines = [
    'Новая заявка с qaznedr.kz',
    input.leadCode ? `Участок: ${input.leadCode}` : null,
    `Имя: ${input.name}`,
    input.company ? `Компания: ${input.company}` : null,
    input.country ? `Страна: ${input.country}` : null,
    `Связь: ${input.channel}: ${input.contact}`,
    `Язык сайта: ${input.locale}`,
    input.message ? `Сообщение: ${input.message}` : null,
    input.sourcePath ? `Страница: ${input.sourcePath}` : null,
    `ID: ${id}`,
  ];
  return lines.filter(Boolean).join('\n');
}

export async function notifyTelegram(
  text: string,
  env: { token?: string; chatId?: string } = {
    token: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  fetchImpl: (
    url: string,
    init: RequestInit
  ) => Promise<{ ok: boolean }> = fetch
): Promise<boolean> {
  if (!env.token || !env.chatId) return false;
  try {
    const res = await fetchImpl(
      `https://api.telegram.org/bot${env.token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.chatId,
          text,
          disable_web_page_preview: true,
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}
```

- [ ] **Step 6: `src/app/api/inquiries/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { inquirySchema, isLikelySpam } from '@/lib/inquiries/schema';
import { createThrottle } from '@/lib/inquiries/throttle';
import { formatInquiryMessage, notifyTelegram } from '@/lib/inquiries/notify';

export const dynamic = 'force-dynamic';

const allow = createThrottle({ limit: 5, windowMs: 10 * 60 * 1000 });

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.headers.get('x-real-ip') || 'unknown';
}

// Public, login-free inquiry capture → inquiries table (service role only).
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!allow(clientIp(req))) {
    return NextResponse.json(
      { success: false, error: 'rate_limited' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'invalid' },
      { status: 400 }
    );
  }

  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'invalid' },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Pretend success so bots get no signal.
  if (isLikelySpam(input)) return NextResponse.json({ success: true });

  const svc = await createServiceClient();
  const { data, error } = await (svc as any)
    .from('inquiries')
    .insert({
      lead_code: input.leadCode ?? null,
      name: input.name,
      company: input.company || null,
      country: input.country || null,
      channel: input.channel,
      contact: input.contact,
      message: input.message || null,
      locale: input.locale,
      source_path: input.sourcePath || null,
      utm: input.utm ?? null,
    })
    .select('id')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: 'failed' },
      { status: 500 }
    );
  }

  await notifyTelegram(formatInquiryMessage(input, data.id));
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 7: Миграция** `supabase/migrations/20260926_inquiries.sql`

```sql
-- Login-free inquiries from the QAZNEDR HOLDING site (spec §5.2).
-- Written and read only by the service role on the server.
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  lead_code text,
  name text not null check (char_length(name) between 1 and 120),
  company text check (company is null or char_length(company) <= 160),
  country text check (country is null or char_length(country) <= 80),
  channel text not null
    check (channel in ('wechat', 'whatsapp', 'email', 'phone', 'telegram')),
  contact text not null check (char_length(contact) between 3 and 160),
  message text check (message is null or char_length(message) <= 2000),
  locale text not null check (locale in ('ru', 'kz', 'en', 'zh')),
  source_path text,
  utm jsonb,
  status text not null default 'NEW'
    check (status in ('NEW', 'CONTACTED', 'MEETING', 'DEAL', 'REJECTED')),
  created_at timestamptz not null default now()
);

create index if not exists inquiries_status_created_idx
  on public.inquiries (status, created_at desc);

-- RLS on with no policies: anon/authenticated get nothing; service role bypasses RLS.
alter table public.inquiries enable row level security;
revoke all on public.inquiries from anon, authenticated;
```

- [ ] **Step 8: Тесты проходят.** Run: `npx jest src/__tests__/lib/inquiries src/__tests__/api --coverage=false`. Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/20260926_inquiries.sql src/lib/inquiries src/app/api/inquiries src/__tests__/lib/inquiries src/__tests__/api
git commit -m "feat(inquiries): login-free inquiry API with honeypot, throttle and Telegram notify"
```

Миграция применяется к продовой БД в Task 10, до деплоя.

---

### Task 7: Форма заявки, страница контактов, тизер участка

**Files:**

- Create: `src/components/features/InquiryForm.tsx`, `src/app/[locale]/contact/page.tsx`
- Modify: `src/lib/i18n/translations.ts` (namespace `inquiry`), `src/app/[locale]/leads/[code]/page.tsx`, `src/__tests__/lib/i18n/holding-keys.test.ts`
- Test: `src/__tests__/components/features/InquiryForm.test.tsx`

**Interfaces:**

- Consumes: `INQUIRY_CHANNELS`, `type InquiryChannel` (Task 6); `ContactChannels`, `getContactConfig` (Task 5); `buildTranslatedPageMetadata` (Task 1); `POST /api/inquiries` (Task 6).
- Produces: `<InquiryForm locale={string} leadCode?={string} />`. Ключи `inquiry.*`: `nameLabel, companyLabel, countryLabel, channelLabel, contactLabel, messageLabel, messagePlaceholder, submit, sending, successTitle, successText, error, rateLimited, invalid, optional, channelWechat, channelWhatsapp, channelEmail, channelPhone, channelTelegram`.

- [ ] **Step 1: Падающие тесты.** `src/__tests__/components/features/InquiryForm.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InquiryForm from '@/components/features/InquiryForm';

jest.mock('@vercel/analytics', () => ({ track: jest.fn() }));

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

function fill() {
  fireEvent.change(screen.getByLabelText(/^Name/), {
    target: { value: 'Li Wei' },
  });
  fireEvent.change(screen.getByLabelText(/ID \/ number \/ email/), {
    target: { value: 'liwei_88' },
  });
}

describe('InquiryForm', () => {
  it('posts the inquiry with the area code and shows success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ success: true }),
    }) as unknown as typeof fetch;
    render(<InquiryForm locale="en" leadCode="AU-508A4C" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Send inquiry' }));
    expect(await screen.findByText('Inquiry sent')).toBeInTheDocument();
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/inquiries');
    expect(JSON.parse(init.body)).toMatchObject({
      name: 'Li Wei',
      contact: 'liwei_88',
      channel: 'whatsapp',
      leadCode: 'AU-508A4C',
      locale: 'en',
      website: '',
    });
  });

  it('defaults to WeChat for Chinese visitors', () => {
    render(<InquiryForm locale="zh" />);
    expect((screen.getByLabelText('联系方式') as HTMLSelectElement).value).toBe(
      'wechat'
    );
  });

  it('disables the button while sending', async () => {
    let resolve: (v: unknown) => void = () => {};
    global.fetch = jest.fn(
      () => new Promise((r) => (resolve = r))
    ) as unknown as typeof fetch;
    render(<InquiryForm locale="en" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Send inquiry' }));
    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
    resolve({ status: 200, json: async () => ({ success: true }) });
    await screen.findByText('Inquiry sent');
  });

  it('explains rate limiting', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 429,
      json: async () => ({ success: false }),
    }) as unknown as typeof fetch;
    render(<InquiryForm locale="en" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Send inquiry' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/Too many inquiries/)
    );
  });
});
```

В `holding-keys.test.ts` добавить массив и включить его в `KEYS`:

```ts
const INQUIRY_KEYS = [
  'inquiry.nameLabel',
  'inquiry.companyLabel',
  'inquiry.countryLabel',
  'inquiry.channelLabel',
  'inquiry.contactLabel',
  'inquiry.messageLabel',
  'inquiry.messagePlaceholder',
  'inquiry.submit',
  'inquiry.sending',
  'inquiry.successTitle',
  'inquiry.successText',
  'inquiry.error',
  'inquiry.rateLimited',
  'inquiry.invalid',
  'inquiry.optional',
];
```

`const KEYS: string[] = [...SEO_KEYS, ...NAV_KEYS, ...CONTACT_KEYS, ...INQUIRY_KEYS];`

Ключи `channel*` в тест не входят: названия мессенджеров и «Телефон» законно совпадают с ru в kz и en.

- [ ] **Step 2: Убедиться, что падают.** Run: `npx jest src/__tests__/components/features/InquiryForm.test.tsx src/__tests__/lib/i18n --coverage=false`. Expected: FAIL.

- [ ] **Step 3: Namespace `inquiry`.** В каждом локальном объекте после блока `contact: {...},`:

ru:

```ts
    inquiry: {
      nameLabel: 'Имя',
      companyLabel: 'Компания',
      countryLabel: 'Страна',
      channelLabel: 'Как с вами связаться',
      contactLabel: 'ID / номер / email',
      messageLabel: 'Сообщение',
      messagePlaceholder: 'Какие металлы, регионы и формат сделки интересуют?',
      submit: 'Отправить заявку',
      sending: 'Отправка…',
      successTitle: 'Заявка отправлена',
      successText: 'Мы свяжемся с вами в течение рабочего дня.',
      error: 'Не удалось отправить. Напишите нам в мессенджер.',
      rateLimited:
        'Слишком много заявок. Попробуйте позже или напишите в мессенджер.',
      invalid: 'Проверьте поля формы.',
      optional: '(необязательно)',
      channelWechat: 'WeChat',
      channelWhatsapp: 'WhatsApp',
      channelEmail: 'Email',
      channelPhone: 'Телефон',
      channelTelegram: 'Telegram',
    },
```

kz:

```ts
    inquiry: {
      nameLabel: 'Аты-жөні',
      companyLabel: 'Компания атауы',
      countryLabel: 'Ел',
      channelLabel: 'Сізбен қалай байланысамыз',
      contactLabel: 'ID / нөмір / email',
      messageLabel: 'Хабарлама',
      messagePlaceholder:
        'Қандай металдар, өңірлер және мәміле форматы қызықтырады?',
      submit: 'Өтінім жіберу',
      sending: 'Жіберілуде…',
      successTitle: 'Өтінім жіберілді',
      successText: 'Бір жұмыс күні ішінде хабарласамыз.',
      error: 'Жіберу мүмкін болмады. Мессенджерге жазыңыз.',
      rateLimited:
        'Өтінім тым көп. Кейінірек көріңіз немесе мессенджерге жазыңыз.',
      invalid: 'Форма өрістерін тексеріңіз.',
      optional: '(міндетті емес)',
      channelWechat: 'WeChat',
      channelWhatsapp: 'WhatsApp',
      channelEmail: 'Email',
      channelPhone: 'Телефон',
      channelTelegram: 'Telegram',
    },
```

en:

```ts
    inquiry: {
      nameLabel: 'Name',
      companyLabel: 'Company',
      countryLabel: 'Country',
      channelLabel: 'How should we contact you',
      contactLabel: 'ID / number / email',
      messageLabel: 'Message',
      messagePlaceholder:
        'Which metals, regions and deal format are you interested in?',
      submit: 'Send inquiry',
      sending: 'Sending…',
      successTitle: 'Inquiry sent',
      successText: 'We will contact you within one business day.',
      error: 'Could not send. Please message us directly.',
      rateLimited:
        'Too many inquiries. Please try later or message us directly.',
      invalid: 'Please check the form fields.',
      optional: '(optional)',
      channelWechat: 'WeChat',
      channelWhatsapp: 'WhatsApp',
      channelEmail: 'Email',
      channelPhone: 'Phone',
      channelTelegram: 'Telegram',
    },
```

zh:

```ts
    inquiry: {
      nameLabel: '姓名',
      companyLabel: '公司',
      countryLabel: '国家',
      channelLabel: '联系方式',
      contactLabel: '微信号 / 电话 / 邮箱',
      messageLabel: '留言',
      messagePlaceholder: '您关注哪些矿种、地区和合作方式？',
      submit: '提交咨询',
      sending: '提交中…',
      successTitle: '咨询已提交',
      successText: '我们将在一个工作日内与您联系。',
      error: '提交失败，请直接通过微信联系我们。',
      rateLimited: '提交次数过多，请稍后再试或直接联系我们。',
      invalid: '请检查表单内容。',
      optional: '（选填）',
      channelWechat: '微信',
      channelWhatsapp: 'WhatsApp',
      channelEmail: '邮箱',
      channelPhone: '电话',
      channelTelegram: 'Telegram',
    },
```

- [ ] **Step 4: `src/components/features/InquiryForm.tsx`**

```tsx
'use client';

import { useRef, useState } from 'react';
import { track } from '@vercel/analytics';
import { CheckCircle2 } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import { INQUIRY_CHANNELS, type InquiryChannel } from '@/lib/inquiries/schema';

interface InquiryFormProps {
  locale: string;
  leadCode?: string;
}

type State = 'idle' | 'sending' | 'done' | 'error' | 'rate' | 'invalid';

const CHANNEL_KEYS: Record<InquiryChannel, string> = {
  wechat: 'inquiry.channelWechat',
  whatsapp: 'inquiry.channelWhatsapp',
  email: 'inquiry.channelEmail',
  phone: 'inquiry.channelPhone',
  telegram: 'inquiry.channelTelegram',
};

const input =
  'w-full min-h-[44px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]';
const label = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

function readUtm(): Record<string, string> | undefined {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ['source', 'medium', 'campaign', 'term', 'content']) {
    const value = params.get(`utm_${key}`);
    if (value) utm[key] = value.slice(0, 200);
  }
  return Object.keys(utm).length ? utm : undefined;
}

export default function InquiryForm({ locale, leadCode }: InquiryFormProps) {
  const t = (key: string) => translate(locale, key);
  const startedAt = useRef(Date.now());
  const [state, setState] = useState<State>('idle');
  const [channel, setChannel] = useState<InquiryChannel>(
    locale === 'zh' ? 'wechat' : 'whatsapp'
  );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState('sending');
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          company: form.get('company'),
          country: form.get('country'),
          channel,
          contact: form.get('contact'),
          message: form.get('message'),
          leadCode,
          locale,
          sourcePath: window.location.pathname,
          utm: readUtm(),
          website: form.get('website') ?? '',
          elapsedMs: Date.now() - startedAt.current,
        }),
      });
      if (res.status === 429) return setState('rate');
      if (res.status === 400) return setState('invalid');
      const json = await res.json();
      if (!json.success) return setState('error');
      track('inquiry_submit', { lead: leadCode ?? '', channel });
      setState('done');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-gold/40 bg-[rgba(200,162,75,0.06)] p-4">
        <CheckCircle2
          aria-hidden
          className="w-5 h-5 mt-0.5 text-gold-dark dark:text-gold-light"
        />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t('inquiry.successTitle')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('inquiry.successText')}
          </p>
        </div>
      </div>
    );
  }

  const errorText =
    state === 'rate'
      ? t('inquiry.rateLimited')
      : state === 'invalid'
        ? t('inquiry.invalid')
        : state === 'error'
          ? t('inquiry.error')
          : null;

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="inq-name" className={label}>
          {t('inquiry.nameLabel')}
        </label>
        <input
          id="inq-name"
          name="name"
          required
          maxLength={120}
          className={input}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="inq-company" className={label}>
            {t('inquiry.companyLabel')} {t('inquiry.optional')}
          </label>
          <input
            id="inq-company"
            name="company"
            maxLength={160}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="inq-country" className={label}>
            {t('inquiry.countryLabel')} {t('inquiry.optional')}
          </label>
          <input
            id="inq-country"
            name="country"
            maxLength={80}
            className={input}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="inq-channel" className={label}>
            {t('inquiry.channelLabel')}
          </label>
          <select
            id="inq-channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value as InquiryChannel)}
            className={input}
          >
            {INQUIRY_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {t(CHANNEL_KEYS[c])}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="inq-contact" className={label}>
            {t('inquiry.contactLabel')}
          </label>
          <input
            id="inq-contact"
            name="contact"
            required
            minLength={3}
            maxLength={160}
            className={input}
          />
        </div>
      </div>
      <div>
        <label htmlFor="inq-message" className={label}>
          {t('inquiry.messageLabel')} {t('inquiry.optional')}
        </label>
        <textarea
          id="inq-message"
          name="message"
          rows={3}
          maxLength={2000}
          placeholder={t('inquiry.messagePlaceholder')}
          className={`${input} resize-y`}
        />
      </div>
      {/* Honeypot — hidden from people and assistive tech */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] w-px h-px overflow-hidden"
      >
        <label htmlFor="inq-website">Website</label>
        <input
          id="inq-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {errorText && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errorText}
        </p>
      )}
      <button
        type="submit"
        disabled={state === 'sending'}
        className="w-full min-h-[44px] rounded-lg bg-gray-900 dark:bg-gray-100 px-4 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-60 transition-colors"
      >
        {state === 'sending' ? t('inquiry.sending') : t('inquiry.submit')}
      </button>
    </form>
  );
}
```

Примечание к тестам. `getByLabelText(/^Name/)` находит только поле «Name» (у остальных полей label начинается иначе). Тест заполняет оба обязательных поля, поэтому встроенная HTML-валидация jsdom не блокирует отправку.

- [ ] **Step 5: Страница `src/app/[locale]/contact/page.tsx`**

```tsx
import type { Metadata } from 'next';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import ContactChannels from '@/components/features/ContactChannels';
import InquiryForm from '@/components/features/InquiryForm';
import { getContactConfig } from '@/lib/config/contacts';
import { getServerTranslation } from '@/lib/i18n/translations';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, '/contact', 'contact');
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getServerTranslation(locale);
  const config = getContactConfig();

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-16 lg:pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-tight text-gray-900 dark:text-gray-50">
            {t('contact.title')}
          </h1>
          <p className="mt-3 max-w-2xl text-gray-600 dark:text-gray-400">
            {t('contact.subtitle')}
          </p>
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ContactChannels config={config} locale={locale} />
            <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="font-serif text-xl text-gray-900 dark:text-gray-100 mb-4">
                {t('contact.formTitle')}
              </h2>
              <InquiryForm locale={locale} />
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 6: Тизер участка** `src/app/[locale]/leads/[code]/page.tsx`:
  1. Добавить импорты:

```ts
import ContactChannels from '@/components/features/ContactChannels';
import InquiryForm from '@/components/features/InquiryForm';
import { getContactConfig } from '@/lib/config/contacts';
```

2. Сразу после `<LeadLockedSection />` вставить:

```tsx
{
  /* Inquiry — no login required */
}
<section
  id="inquiry"
  className="scroll-mt-24 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
>
  <h2 className="font-serif text-xl text-gray-900 dark:text-gray-100 mb-1">
    {t('contact.discussHeading')}
  </h2>
  <p className="text-sm text-gray-500 mb-4">{t('contact.discussNote')}</p>
  <InquiryForm locale={locale} leadCode={lead.code} />
</section>;
```

3. В сайдбаре заменить `<Link href={`/${locale}/leads/${lead.code}/full`} className="mt-5 block w-full …">{t('leadDetail.getFullPackage')}</Link>` на якорь с теми же классами:

```tsx
<a
  href="#inquiry"
  className="mt-5 block w-full text-center px-4 py-3 rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
>
  {t('contact.discussHeading')}
</a>
```

4. Заменить `{t('leadDetail.ctaNote')}` на `{t('contact.discussNote')}`.
5. Сразу после закрывающего `</div>` gold-карточки сайдбара (внутри `<div className="lg:sticky lg:top-24 space-y-4">`) вставить:

```tsx
<ContactChannels
  config={getContactConfig()}
  locale={locale}
  leadCode={lead.code}
/>
```

- [ ] **Step 7: Тесты, типы, lint.** Run: `npx jest src/__tests__/components/features src/__tests__/lib/i18n --coverage=false && npm run type-check && npm run lint`. Expected: PASS, 0 ошибок TS; в lint нет новых ошибок в изменённых файлах.

- [ ] **Step 8: Commit**

```bash
git add src/components/features/InquiryForm.tsx 'src/app/[locale]/contact' 'src/app/[locale]/leads/[code]/page.tsx' src/lib/i18n/translations.ts src/__tests__/components/features/InquiryForm.test.tsx src/__tests__/lib/i18n/holding-keys.test.ts
git commit -m "feat(inquiries): inquiry form on area teasers and /contact page"
```

---

### Task 8: Вход владельца и «Входящие заявки» в админке

**Files:**

- Create: `src/lib/auth/env-admin.ts`, `src/app/api/admin/inquiries/route.ts`, `src/app/[locale]/admin/inquiries/page.tsx`
- Modify: `src/lib/services/auth.config.ts`, `src/lib/auth/admin.ts`, `src/app/[locale]/admin/page.tsx`
- Test: `src/__tests__/lib/auth/env-admin.test.ts`, `src/__tests__/api/admin-inquiries.route.test.ts`

**Interfaces:**

- Produces:
  - `isEnvAdminEmail(email?: string | null, raw?: string): boolean`;
  - `verifyEnvAdmin(email: string, password: string, env?: { emails?: string; hash?: string }): Promise<{ id: string; email: string; name: string; image: null } | null>`;
  - `GET /api/admin/inquiries?status=NEW|CONTACTED|MEETING|DEAL|REJECTED|ALL`, `PATCH /api/admin/inquiries { id, status }`.
- Env: `ADMIN_EMAILS` (через запятую), `ADMIN_PASSWORD_HASH` (bcrypt).

- [ ] **Step 1: Падающие тесты.**

`src/__tests__/lib/auth/env-admin.test.ts`:

```ts
import bcrypt from 'bcryptjs';
import { isEnvAdminEmail, verifyEnvAdmin } from '@/lib/auth/env-admin';

const hash = bcrypt.hashSync('correct horse', 4);
const env = { emails: 'Owner@Qaznedr.kz, second@x.kz', hash };

describe('env admin', () => {
  it('matches admin emails case-insensitively', () => {
    expect(isEnvAdminEmail('owner@qaznedr.kz', env.emails)).toBe(true);
    expect(isEnvAdminEmail('other@x.kz', env.emails)).toBe(false);
    expect(isEnvAdminEmail(null, env.emails)).toBe(false);
    expect(isEnvAdminEmail('owner@qaznedr.kz', '')).toBe(false);
  });

  it('returns the admin user for the right password', async () => {
    await expect(
      verifyEnvAdmin(' OWNER@qaznedr.kz ', 'correct horse', env)
    ).resolves.toEqual({
      id: 'env-admin:owner@qaznedr.kz',
      email: 'owner@qaznedr.kz',
      name: 'Admin',
      image: null,
    });
  });

  it('rejects a wrong password, a non-admin email or a missing hash', async () => {
    await expect(
      verifyEnvAdmin('owner@qaznedr.kz', 'nope', env)
    ).resolves.toBeNull();
    await expect(
      verifyEnvAdmin('x@x.kz', 'correct horse', env)
    ).resolves.toBeNull();
    await expect(
      verifyEnvAdmin('owner@qaznedr.kz', 'correct horse', {
        emails: env.emails,
      })
    ).resolves.toBeNull();
  });

  it('locks an email out after 10 attempts in 15 minutes', async () => {
    for (let i = 0; i < 10; i++)
      await verifyEnvAdmin('second@x.kz', 'bad', env);
    await expect(
      verifyEnvAdmin('second@x.kz', 'correct horse', env)
    ).resolves.toBeNull();
  });
});
```

`src/__tests__/api/admin-inquiries.route.test.ts`:

```ts
/** @jest-environment node */
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/auth/admin', () => ({
  requireAdmin: jest.fn(),
  forbidden: () =>
    new (jest.requireActual('next/server').NextResponse.json)(
      { success: false },
      { status: 403 }
    ),
}));

import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { GET, PATCH } from '@/app/api/admin/inquiries/route';

function builder(result: unknown) {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'order', 'limit', 'eq', 'update']) {
    b[m] = jest.fn(() => b);
  }
  b.then = (resolve: (v: unknown) => void) => resolve(result);
  return b as Record<string, jest.Mock> & PromiseLike<unknown>;
}

let q: ReturnType<typeof builder>;
beforeEach(() => {
  q = builder({ data: [{ id: 'i1', status: 'NEW' }], error: null });
  (createServiceClient as jest.Mock).mockResolvedValue({
    from: jest.fn(() => q),
  });
});

describe('/api/admin/inquiries', () => {
  it('403 for non-admins', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(null);
    const res = await GET(
      new NextRequest('https://qaznedr.kz/api/admin/inquiries')
    );
    expect(res.status).toBe(403);
  });

  it('lists inquiries filtered by status', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue({ role: 'super_admin' });
    const res = await GET(
      new NextRequest('https://qaznedr.kz/api/admin/inquiries?status=NEW')
    );
    expect(await res.json()).toEqual({
      success: true,
      data: [{ id: 'i1', status: 'NEW' }],
    });
    expect(q.eq).toHaveBeenCalledWith('status', 'NEW');
  });

  it('validates PATCH status', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue({ role: 'super_admin' });
    const bad = await PATCH(
      new NextRequest('https://qaznedr.kz/api/admin/inquiries', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'i1', status: 'WON' }),
      })
    );
    expect(bad.status).toBe(400);
    const ok = await PATCH(
      new NextRequest('https://qaznedr.kz/api/admin/inquiries', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'i1', status: 'MEETING' }),
      })
    );
    expect(ok.status).toBe(200);
    expect(q.update).toHaveBeenCalledWith({ status: 'MEETING' });
  });
});
```

- [ ] **Step 2: Убедиться, что падают.** Run: `npx jest src/__tests__/lib/auth src/__tests__/api/admin-inquiries.route.test.ts --coverage=false`. Expected: FAIL.

- [ ] **Step 3: `src/lib/auth/env-admin.ts`**

```ts
import bcrypt from 'bcryptjs';
import { createThrottle } from '@/lib/inquiries/throttle';

// Owner login without a users table: ADMIN_EMAILS + ADMIN_PASSWORD_HASH (bcrypt).
const attempts = createThrottle({ limit: 10, windowMs: 15 * 60 * 1000 });

export function isEnvAdminEmail(
  email?: string | null,
  raw: string | undefined = process.env.ADMIN_EMAILS
): boolean {
  if (!email) return false;
  const list = (raw ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

export async function verifyEnvAdmin(
  email: string,
  password: string,
  env: { emails?: string; hash?: string } = {
    emails: process.env.ADMIN_EMAILS,
    hash: process.env.ADMIN_PASSWORD_HASH,
  }
): Promise<{ id: string; email: string; name: string; image: null } | null> {
  const normalized = email.trim().toLowerCase();
  if (!env.hash || !isEnvAdminEmail(normalized, env.emails)) return null;
  if (!attempts(normalized)) return null;
  const ok = await bcrypt.compare(password, env.hash);
  return ok
    ? {
        id: `env-admin:${normalized}`,
        email: normalized,
        name: 'Admin',
        image: null,
      }
    : null;
}
```

- [ ] **Step 4: Подключить к NextAuth.** В `src/lib/services/auth.config.ts`:
  - добавить импорт `import { verifyEnvAdmin } from '@/lib/auth/env-admin';`;
  - в `authorize` сразу после блока `try { ValidationSchemas.email.parse(...) ... } catch (validationError) {...}` и до `const supabase = await createClient();` вставить:

```ts
// Owner/admin login from env — the legacy `users` table does not exist.
const envAdmin = await verifyEnvAdmin(credentials.email, credentials.password);
if (envAdmin) return envAdmin;
```

- [ ] **Step 5: Роль env-админа.** В `src/lib/auth/admin.ts` добавить импорт `import { isEnvAdminEmail } from '@/lib/auth/env-admin';`. В `getCurrentAdmin` сразу после `if (!userId) return null;` вставить:

```ts
if (isEnvAdminEmail(session.user.email)) {
  return { userId, email: session.user.email ?? null, role: 'super_admin' };
}
```

- [ ] **Step 6: `src/app/api/admin/inquiries/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin, forbidden } from '@/lib/auth/admin';
import { INQUIRY_STATUSES } from '@/lib/inquiries/schema';

export const dynamic = 'force-dynamic';

// GET /api/admin/inquiries?status=NEW|CONTACTED|MEETING|DEAL|REJECTED|ALL
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const status = new URL(request.url).searchParams.get('status') || 'NEW';
  const svc = await createServiceClient();
  let q = (svc as any)
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status !== 'ALL') q = q.eq('status', status);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to load' },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true, data: data ?? [] });
}

// PATCH /api/admin/inquiries — body { id, status }
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  let body: { id?: unknown; status?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // falls through to validation
  }
  const valid =
    typeof body.id === 'string' &&
    (INQUIRY_STATUSES as readonly string[]).includes(String(body.status));
  if (!valid) {
    return NextResponse.json(
      { success: false, error: 'Invalid input' },
      { status: 400 }
    );
  }

  const svc = await createServiceClient();
  const { error } = await (svc as any)
    .from('inquiries')
    .update({ status: body.status })
    .eq('id', body.id);
  if (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update' },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 7: Страница `src/app/[locale]/admin/inquiries/page.tsx`**

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowLeft, Inbox, Loader2, Shield } from 'lucide-react';
import { INQUIRY_STATUSES, type InquiryStatus } from '@/lib/inquiries/schema';

type Tab = InquiryStatus | 'ALL';

interface InquiryRow {
  id: string;
  lead_code: string | null;
  name: string;
  company: string | null;
  country: string | null;
  channel: string;
  contact: string;
  message: string | null;
  locale: string;
  source_path: string | null;
  status: InquiryStatus;
  created_at: string;
}

const STATUS_LABELS: Record<Tab, string> = {
  NEW: 'Новые',
  CONTACTED: 'В работе',
  MEETING: 'Встреча',
  DEAL: 'Сделка',
  REJECTED: 'Отклонённые',
  ALL: 'Все',
};

const TABS: Tab[] = [...INQUIRY_STATUSES, 'ALL'];

export default function AdminInquiriesPage() {
  const { locale } = useTranslation();
  const [tab, setTab] = useState<Tab>('NEW');
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (status: Tab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inquiries?status=${status}`);
      if (res.status === 401 || res.status === 403) {
        setForbidden(true);
        return;
      }
      const json = await res.json();
      setRows(json.success ? json.data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const setStatus = async (id: string, status: InquiryStatus) => {
    setBusy(id);
    try {
      await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      await load(tab);
    } finally {
      setBusy(null);
    }
  };

  if (forbidden) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0A0A0A] pt-16">
          <div className="text-center">
            <Shield className="w-10 h-10 mx-auto text-gray-300" />
            <p className="mt-3 text-gray-500">
              Доступ только для администраторов
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-16 lg:pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href={`/${locale}/admin`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Админка
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-50 mb-6">
            <Inbox className="w-6 h-6" /> Входящие заявки
          </h1>

          <div className="flex flex-wrap gap-2 mb-6">
            {TABS.map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  tab === key
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {STATUS_LABELS[key]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-300" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-24 text-center text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              Заявок нет
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                >
                  <div className="min-w-0 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {r.name}
                      </span>
                      {r.company && (
                        <span className="text-gray-500">· {r.company}</span>
                      )}
                      {r.country && (
                        <span className="text-gray-500">· {r.country}</span>
                      )}
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] bg-gray-100 dark:bg-gray-800 uppercase">
                        {r.locale}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-gray-700 dark:text-gray-300">
                      {r.channel}: {r.contact}
                    </p>
                    {r.lead_code && (
                      <Link
                        href={`/${locale}/leads/${r.lead_code}`}
                        className="mt-1 inline-block font-mono text-[#0060DF] hover:underline"
                      >
                        {r.lead_code}
                      </Link>
                    )}
                    {r.message && (
                      <p className="mt-1 text-gray-600 dark:text-gray-400 whitespace-pre-line">
                        {r.message}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-gray-400">
                      {new Date(r.created_at).toLocaleString('ru-RU')}
                      {r.source_path ? ` · ${r.source_path}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {busy === r.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <select
                        aria-label="Статус заявки"
                        value={r.status}
                        onChange={(e) =>
                          setStatus(r.id, e.target.value as InquiryStatus)
                        }
                        className="min-h-[36px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] px-2 text-sm"
                      >
                        {INQUIRY_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 8: Плитка в админке.** В `src/app/[locale]/admin/page.tsx`:
  - добавить `Inbox` в импорт из `lucide-react`;
  - первым элементом внутри `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">` вставить:

```tsx
<SectionTile
  href={`/${locale}/admin/inquiries`}
  title="Входящие заявки"
  description="Заявки с сайта: WeChat, WhatsApp, формы по участкам"
  icon={Inbox}
/>
```

- [ ] **Step 9: Тесты, типы.** Run: `npx jest src/__tests__/lib/auth src/__tests__/api --coverage=false && npm run type-check`. Expected: PASS, 0 ошибок.

- [ ] **Step 10: Commit**

```bash
git add src/lib/auth src/lib/services/auth.config.ts 'src/app/api/admin/inquiries' 'src/app/[locale]/admin' src/__tests__/lib/auth src/__tests__/api/admin-inquiries.route.test.ts
git commit -m "feat(admin): env-based owner login and inquiries inbox"
```

---

### Task 9: Бренд в данных для машин

**Files:**

- Modify: `src/components/features/HomePageContent.tsx` (JSON-LD), `public/llms.txt`, `.env.example`

- [ ] **Step 1: JSON-LD.** В `HomePageContent.tsx` заменить объекты `organizationJsonLd` и `websiteJsonLd` на:

```ts
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'QAZNEDR HOLDING',
  url: 'https://qaznedr.kz',
  description:
    'Kazakhstan mineral exploration holding: prepared free subsoil areas and licensing/deal support for investors.',
  areaServed: { '@type': 'Country', name: 'Kazakhstan' },
  knowsAbout: [
    'Mineral exploration in Kazakhstan',
    'Subsoil use licensing',
    'Gold',
    'Copper',
    'Zinc',
    'Tin',
    'Nickel',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    url: 'https://qaznedr.kz/en/contact',
    availableLanguage: ['ru', 'kk', 'en', 'zh'],
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'QAZNEDR HOLDING',
  url: 'https://qaznedr.kz',
  inLanguage: ['ru', 'kk', 'en', 'zh-CN'],
};
```

БИН, юридическую форму и `sameAs` (Instagram) добавляем только после подтверждения владельцем. Это отдельный коммит, в эту задачу не входит.

- [ ] **Step 2: Заменить `public/llms.txt` целиком**

```
# QAZNEDR HOLDING

> Kazakhstan mineral exploration holding. Prepared, currently unlicensed (free) subsoil areas for gold, copper and other metals, drawn from our registry of 7,000+ mineral occurrences compiled from Soviet-era geological fund reports. We support foreign investors — primarily from China and India — from area selection to licensing and the transfer-of-rights permission.

## What we offer
- Portfolio of prepared exploration areas as closed teasers: metal, region, deposit type, grade range. Exact coordinates and full data are shared after a meeting and an NDA.
- Deal formats: licence obtained directly for the investor, licence on the holding with a later transfer, joint venture or earn-in, analytics on an area.
- Licensing support for solid-mineral exploration licences in Kazakhstan.
- Field geology by staff geologists; due diligence of areas.

## Important facts
- Areas in the portfolio are free (not licensed) unless stated otherwise; the holding does not claim ownership of them.
- "Free" means free per our check against the public subsoil cadastre map on the stated date; an official extract is obtained before any deal.
- Reserves are Soviet-era categories (A/B/C1/C2); P1–P3 are forecast resources, not reserves. No object has a JORC report yet.
- Any transfer of subsoil use rights in Kazakhstan requires permission of the competent authority (Subsoil Code, articles 44–45).
- Grade figures are labelled as average, spike or schlich values.

## Key pages
| Language | Home | Portfolio | Contact |
|---|---|---|---|
| English | https://qaznedr.kz/en | https://qaznedr.kz/en/leads | https://qaznedr.kz/en/contact |
| 中文 | https://qaznedr.kz/zh | https://qaznedr.kz/zh/leads | https://qaznedr.kz/zh/contact |
| Русский | https://qaznedr.kz/ru | https://qaznedr.kz/ru/leads | https://qaznedr.kz/ru/contact |
| Қазақша | https://qaznedr.kz/kz | https://qaznedr.kz/kz/leads | https://qaznedr.kz/kz/contact |

Services: https://qaznedr.kz/en/services
FAQ: https://qaznedr.kz/en/faq
About: https://qaznedr.kz/en/about

## Contact
WeChat, WhatsApp and an inquiry form: https://qaznedr.kz/en/contact

## Sitemap
https://qaznedr.kz/sitemap.xml
```

- [ ] **Step 3: Дописать в конец `.env.example`**

```
# --- QAZNEDR HOLDING (phase 1) ---
# Contacts shown on the site; a channel is hidden when its value is empty
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_WECHAT_ID=
NEXT_PUBLIC_WECHAT_QR=/contacts/wechat-qr.png
NEXT_PUBLIC_CONTACT_EMAIL=
# Inquiry notifications (Telegram bot + chat id)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
# Owner/admin login: comma-separated emails + bcrypt hash of the password
ADMIN_EMAILS=
ADMIN_PASSWORD_HASH=
# Search engine verification meta tags
GOOGLE_SITE_VERIFICATION=
YANDEX_VERIFICATION=
BING_SITE_VERIFICATION=
BAIDU_SITE_VERIFICATION=
```

- [ ] **Step 4: Commit**

```bash
git add src/components/features/HomePageContent.tsx public/llms.txt .env.example
git commit -m "feat(brand): QAZNEDR HOLDING in JSON-LD and llms.txt, document new env vars"
```

---

### Task 10: Проверка, настройка прода, деплой

- [ ] **Step 1: Полный прогон.**

```bash
npx jest --coverage=false 2>&1 | grep -E "^(PASS|FAIL) " | sort
npm run type-check && npm run lint && npm run build
```

Expected:

- FAIL только у 6 legacy-наборов из Global Constraints, все новые наборы PASS;
- type-check без ошибок;
- lint без новых ошибок;
- build зелёный, в списке маршрутов есть `/[locale]/contact` и `/api/inquiries`.

- [ ] **Step 2: Применить миграцию к продовой БД** (Supabase Management API; токен из памяти `reference_supabase.md`):

```bash
SQL=$(python3 -c 'import json,sys;print(json.dumps({"query":open("supabase/migrations/20260926_inquiries.sql").read()}))')
curl -s -X POST "https://api.supabase.com/v1/projects/jiomlzyyvqpfeqyurnim/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" -d "$SQL"
```

Проверка, что anon ничего не видит (ожидается `[]` или ошибка доступа):

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/inquiries?select=id" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

- [ ] **Step 3: Env в Vercel (значения даёт владелец).** Для каждой переменной: `vercel env add NAME production`. Пароль админа владелец задаёт сам, чтобы он не проходил через чат:

```
! read -s "P?Пароль админа: "; echo; node -e "process.stdout.write(require('bcryptjs').hashSync(process.argv[1],12))" "$P" | vercel env add ADMIN_PASSWORD_HASH production
```

Если значений ещё нет, деплой всё равно безопасен:

- без контактов каналы скрыты, форма работает;
- без Telegram заявки видны только в админке;
- без `ADMIN_*` вход в админку по-прежнему недоступен.

- [ ] **Step 4: Главный домен — qaznedr.kz** (Vercel API, токен CLI):

```bash
TOKEN=$(python3 -c "import json;print(json.load(open('$HOME/Library/Application Support/com.vercel.cli/auth.json'))['token'])")
P=prj_imq8ikt6U2r3pL0Pf4LyeIpcjkg8; T=team_paixxLRBn717LTSAAL0OIy0A
curl -s -X PATCH "https://api.vercel.com/v9/projects/$P/domains/qaznedr.kz?teamId=$T" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"redirect":null}'
curl -s -X PATCH "https://api.vercel.com/v9/projects/$P/domains/www.qaznedr.kz?teamId=$T" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"redirect":"qaznedr.kz","redirectStatusCode":308}'
```

- [ ] **Step 5: Слить и задеплоить.**

```bash
git checkout master && git merge --ff-only feat/holding-phase1
vercel --prod --yes
```

- [ ] **Step 6: Проверки на проде.**

```bash
curl -sI https://www.qaznedr.kz/ru | grep -iE "^(HTTP|location)"        # 308 → https://qaznedr.kz/ru
for p in /zh /zh/leads /en/about /zh/contact; do
  curl -sL https://qaznedr.kz$p | grep -oE '<title>[^<]*</title>|<link rel="canonical"[^>]*>|<html lang="[^"]*"' | head -3; echo "--- $p"
done   # на zh — китайский title, canonical = сама страница, lang="zh-CN"
curl -sI https://qaznedr.kz/ru/listings | grep -iE "^(HTTP|location)"   # 308 → /ru/leads
curl -s https://qaznedr.kz/robots.txt | grep -E "dashboard|Sitemap"
curl -s https://qaznedr.kz/sitemap.xml | grep -c "<loc>"                 # >0, нет /listings
```

Тестовая заявка end-to-end:

```bash
curl -s -X POST https://qaznedr.kz/api/inquiries -H 'content-type: application/json' \
  -d '{"name":"TEST Claude","channel":"email","contact":"test@qaznedr.kz","locale":"ru","message":"Проверка фазы 1","elapsedMs":9000}'
```

Ожидается `{"success":true}`, строка в `inquiries` и сообщение в Telegram (если настроен). После этого пометить её `REJECTED` через Management API.

- [ ] **Step 7: Синхронизация.**

```bash
git push origin master
git branch -d feat/holding-phase1
```

Проверить, что `meta.githubCommitSha` текущего продакшен-деплоя равен `git rev-parse HEAD` (Vercel API, как в памяти `project-two-machines-deploy`).

- [ ] **Step 8: Сообщить поисковикам.** Отправить sitemap в Bing Webmaster и Baidu ziyuan (владелец, после env-верификации). Пинг IndexNow через `/api/indexnow`, если задан его секрет.

---

## Вне рамок Фазы 1 (зафиксировано для Фазы 2)

- **Видимые тексты с юридическим риском** (переписать вместе с новым дизайном и после юриста):
  - FAQ: «Мы продаём информацию и доступ к ней…», «первоисточник данных из государственных архивов», «пакет за 1 000 000 ₸»;
  - `LeadLockedSection`: «Первоисточник (автор, год, инв. №)», «…закрыто до соглашения и оплаты»;
  - `legal/terms`: «Платформа продаёт информацию…».
- H1 и видимый текст тизера на en и zh (сейчас `teaser_title` на русском).
- Переименование `/leads` → `/portfolio`, хабы металлов, страница «О нас» с командой.
- Файлы `public/.well-known/ai-plugin.json` и `public/api/openapi.json` всё ещё описывают маркетплейс.
