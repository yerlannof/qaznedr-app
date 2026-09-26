# Сессия 3б — отложенные мелочи: план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** закрыть 15 отложенных пунктов из ревью сессий 2–3 (ссылки, редиректы, гайды, og:image, тексты, надёжность, чистка) без изменения дизайна.

**Architecture:** точечные правки в существующих модулях. Новые маленькие модули: `src/lib/seo/og.ts` (чистые функции карточки), `src/lib/seo/og-card.tsx` (JSX карточки для `next/og`), `src/lib/leads/stats.ts` (счётчики главной). Остальное — правки на месте.

**Tech Stack:** Next.js 15.5 App Router, TypeScript, Jest + Testing Library, `next/og` (ImageResponse), `marked`.

**Spec:** `docs/superpowers/specs/2026-09-26-session3b-deferred-fixes-design.md`

## Global Constraints

- Внешний вид не меняем: цвета, шрифты, раскладка остаются. og-карточки — в текущем стиле (белый фон, `system-ui`, серый текст `#111827` / `#9CA3AF`).
- Красные линии текста: не намекать, что участок наш; «свободен» = «по нашей проверке на дату»; без «гарантированной доходности»; без упоминания OCR/ИИ.
- Переводы — только в `src/lib/i18n/translations.ts`, 4 языка (ru, kz, en, zh). Каждый новый ключ во всех четырёх.
- Нет `console.*` в продакшен-коде. Иконки только Lucide.
- Коммиты только своих файлов: в рабочей папке лежат незакоммиченные файлы Codex в `docs/design/` — **никогда** `git add -A` / `git add .`.
- Старые падающие тесты маркетплейса не чиним; новых падений быть не должно (сравнивать с базовой линией из Task 0).
- Деплой = `git push origin master`; `vercel --prod` не запускать.

## Review Focus

1. og-картинка гайда для языка без версии (kz) или неизвестного slug — 404, а не 500 и не падение сборки. Проверка: Task 3, Step 8 (curl по локальному `next start`).
2. UTM со спецсимволами и несколькими параметрами при 308 — сохраняется байт в байт. Тест: Task 1, Step 4.
3. Длинный zh- или en-заголовок гайда на og-карточке переносится и не обрезается, иероглифы без «квадратиков». Тест `ogTitleSize` (Task 3, Step 1) плюс просмотр PNG (Task 3, Step 8).
4. Вторая страница `/api/leads` падает — счётчики на главной остаются прежними (31 / 9), а не частичными. Тест: Task 5, Step 7.
5. У несвободного участка `last_verified` пустой или мусорный — в тизере месяц общей сверки, а не пустая строка. Тесты `formatCheckDate` (Task 5, Step 4); видимость строки — Task 4, Step 6.

---

## Task 0: Базовая линия тестов

**Files:** нет изменений.

- [ ] **Step 1: Запустить весь набор и сохранить список падающих наборов**

Run: `npx jest 2>&1 | grep -E "^(FAIL|PASS)" | sort > "$SCRATCH/baseline.txt"; grep -c FAIL "$SCRATCH/baseline.txt"; grep -E "^Tests:" <(npx jest 2>&1 | tail -5)`
(`$SCRATCH` — папка scratchpad сессии.)
Expected: 5–6 FAIL старых наборов маркетплейса, остальные PASS. Этот список — эталон для Task 7.

---

## Task 1: Ссылки на гайды без 308 и редирект с query-строкой

**Files:**
- Modify: `src/lib/insights/registry.ts` (добавить `insightHref`)
- Modify: `src/lib/insights/routing.ts` (использовать `insightHref`)
- Modify: `src/components/features/GuideLinks.tsx:25`
- Modify: `src/app/[locale]/leads/[code]/page.tsx:216`
- Modify: `src/middleware.ts:14-16`
- Test: `src/__tests__/lib/insights/registry.test.ts` (новый), `src/__tests__/middleware.test.ts`

**Interfaces:**
- Produces: `insightHref(locale: string, slug: string): string` из `@/lib/insights/registry`.

- [ ] **Step 1: Написать падающие тесты**

Создать `src/__tests__/lib/insights/registry.test.ts`:

```ts
import { GUIDE, insightHref } from '@/lib/insights/registry';

describe('insightHref', () => {
  it('links to the reader language when the guide is written in it', () => {
    expect(insightHref('en', GUIDE.rightsTransfer)).toBe(
      `/en/insights/${GUIDE.rightsTransfer}`
    );
    expect(insightHref('zh', GUIDE.foreignInvestor)).toBe(
      `/zh/insights/${GUIDE.foreignInvestor}`
    );
  });

  it('links kz readers straight to the ru version (no 308 hop)', () => {
    expect(insightHref('kz', GUIDE.rightsTransfer)).toBe(
      `/ru/insights/${GUIDE.rightsTransfer}`
    );
  });
});
```

В `src/__tests__/middleware.test.ts`:
- в тесте `redirects with 308 to the replacement, keeping the locale` ожидание заменить на `'https://qaznedr.kz/zh/leads?x=1'` и переименовать тест в `'redirects with 308 to the replacement, keeping the locale and query'`;
- в блок `guides without a translation` добавить:

```ts
  it('keeps UTM and other query parameters byte for byte', () => {
    const res = middleware(
      new NextRequest(
        `https://qaznedr.kz/kz/insights/${slug}?utm_source=wechat&utm_campaign=a%20b`
      )
    );
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe(
      `https://qaznedr.kz/ru/insights/${slug}?utm_source=wechat&utm_campaign=a%20b`
    );
  });
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `npx jest src/__tests__/lib/insights/registry.test.ts src/__tests__/middleware.test.ts`
Expected: FAIL — `insightHref is not a function`; location без `?x=1` и без UTM.

- [ ] **Step 3: Реализация**

В конец `src/lib/insights/registry.ts`:

```ts
/** Link to a guide in the reader's language, or straight to its fallback
 * version, so pages never link through the middleware's 308. */
export function insightHref(locale: string, slug: string): string {
  const entry = findInsight(slug);
  const written = entry?.locales.some((l) => l === locale) ?? false;
  return `/${written ? locale : INSIGHT_FALLBACK_LOCALE}/insights/${slug}`;
}
```

`src/lib/insights/routing.ts` целиком:

```ts
import { findInsight, insightHref } from './registry';

const ARTICLE_PATH = /^\/(ru|kz|en|zh)\/insights\/([\w-]+)\/?$/;

/**
 * A guide opened in a language it is not written in (the footer language
 * switcher keeps the path) → its ru version instead of a 404.
 */
export function insightLocaleRedirect(pathname: string): string | null {
  const match = ARTICLE_PATH.exec(pathname);
  if (!match) return null;
  const [, locale, slug] = match;
  const entry = findInsight(slug);
  if (!entry || (entry.locales as readonly string[]).includes(locale)) {
    return null;
  }
  return insightHref(locale, slug);
}
```

`src/components/features/GuideLinks.tsx`: импорт `import { GUIDE, GUIDE_KEYS, insightHref, type GuideKey } from '@/lib/insights/registry';`, ссылка `href={insightHref(locale, GUIDE[key])}`.

`src/app/[locale]/leads/[code]/page.tsx`: импорт `import { GUIDE, insightHref } from '@/lib/insights/registry';`, ссылка `href={insightHref(locale, GUIDE.rightsTransfer)}`.

`src/middleware.ts` — вместо `return NextResponse.redirect(new URL(target, request.url), 308);`:

```ts
  if (target) {
    // Clone keeps the query string (UTM tags survive the redirect).
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url, 308);
  }
```

- [ ] **Step 4: Тесты проходят**

Run: `npx jest src/__tests__/lib/insights src/__tests__/middleware.test.ts src/__tests__/lib/seo/pages.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/insights/registry.ts src/lib/insights/routing.ts src/components/features/GuideLinks.tsx "src/app/[locale]/leads/[code]/page.tsx" src/middleware.ts src/__tests__/lib/insights/registry.test.ts src/__tests__/middleware.test.ts
git commit -m "fix(links): guides linked in the reader's language or ru directly; 308 keeps the query string"
```

---

## Task 2: Гайды — дата проверки норм, крошки с названием, таблицы с клавиатуры

**Files:**
- Modify: `src/lib/insights/registry.ts` (поле `lawAsOf`)
- Modify: `src/app/[locale]/insights/[slug]/page.tsx` (плашка, крошки)
- Modify: `src/lib/insights/content.ts` (`renderMarkdown(markdown, tableLabel)`)
- Modify: `src/lib/i18n/translations.ts` (ключ `insights.table` ×4)
- Modify: `src/styles/globals.css:366-368` (focus-visible)
- Test: `src/__tests__/lib/insights/registry.test.ts`, `src/__tests__/lib/insights/content.test.ts`, `src/__tests__/lib/i18n/insights-keys.test.ts`

**Interfaces:**
- Consumes: `insightHref` (Task 1) — не нужен здесь.
- Produces: `InsightEntry.lawAsOf?: string`; `renderMarkdown(markdown: string, tableLabel?: string): string`.

- [ ] **Step 1: Падающие тесты**

Дописать в `src/__tests__/lib/insights/registry.test.ts`:

```ts
import { INSIGHTS } from '@/lib/insights/registry';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: string): boolean {
  if (!ISO_DAY.test(value)) return false;
  return new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

// A day of slack: the machine clock may be in UTC while dates are local (+05).
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

describe.each(INSIGHTS.map((e) => [e.slug, e] as const))(
  '%s registry dates',
  (_slug, entry) => {
    it('are real calendar dates and not in the future', () => {
      for (const d of [entry.published, entry.updated, entry.lawAsOf]) {
        if (d === undefined) continue;
        expect(isCalendarDate(d)).toBe(true);
        expect(d <= tomorrow).toBe(true);
      }
    });

    it('update on or after publishing', () => {
      expect(entry.published <= entry.updated).toBe(true);
    });

    it('legal guides say when the rules were checked', () => {
      if (!entry.legal) return;
      expect(entry.lawAsOf).toBeDefined();
      expect(entry.published <= (entry.lawAsOf as string)).toBe(true);
    });
  }
);
```

(Импорт `INSIGHTS` объединить с существующим импортом в начале файла.)

В `src/__tests__/lib/insights/content.test.ts` заменить первый тест `renderMarkdown`:

```ts
  it('wraps tables in a labelled, focusable region that scrolls', () => {
    const html = renderMarkdown('| A | B |\n|---|---|\n| 1 | 2 |\n', 'Таблица');
    expect(html).toContain(
      '<div class="insight-table" tabindex="0" role="region" aria-label="Таблица"><table>'
    );
    expect(html).toContain('</table></div>');
  });

  it('escapes quotes in the table label', () => {
    const html = renderMarkdown('| A |\n|---|\n| 1 |\n', 'a"b');
    expect(html).toContain('aria-label="a&quot;b"');
  });
```

и в блок `parseArticle` добавить:

```ts
  it('labels tables in the article language', () => {
    const md = '---\ntitle: 标题\ndescription: 描述\n---\n\n| A |\n|---|\n| 1 |\n';
    expect(parseArticle(md, entry, 'zh').html).toContain('aria-label="表格"');
  });
```

В `src/__tests__/lib/i18n/insights-keys.test.ts` в список `insights.*` добавить `'table'` (после `'otherGuides'`).

- [ ] **Step 2: Тесты падают**

Run: `npx jest src/__tests__/lib/insights src/__tests__/lib/i18n/insights-keys.test.ts`
Expected: FAIL — `lawAsOf` undefined у юридических гайдов; обёртка без `tabindex`; ключ `insights.table` не найден.

- [ ] **Step 3: Реестр**

`src/lib/insights/registry.ts`, в `InsightEntry` после `legal: boolean;`:

```ts
  /** ISO date the cited rules were last checked against the current law
   * (the legal note's "as of"). Required when `legal` is true. */
  lawAsOf?: string;
```

И у трёх записей с `legal: true` (foreignInvestor, explorationLicence, rightsTransfer) после `legal: true,` добавить `lawAsOf: '2026-09-26',`.

- [ ] **Step 4: Таблицы**

`src/lib/insights/content.ts`: добавить импорт `import { translate } from '@/lib/i18n/translations';` и заменить `renderMarkdown`:

```ts
export function renderMarkdown(markdown: string, tableLabel = 'Table'): string {
  const html = marked.parse(markdown, { async: false, gfm: true }) as string;
  const label = tableLabel.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  // Focusable region: wide tables scroll inside, keyboard users reach them.
  return html
    .replace(
      /<table>/g,
      `<div class="insight-table" tabindex="0" role="region" aria-label="${label}"><table>`
    )
    .replace(/<\/table>/g, '</table></div>')
    .replace(
      /<a href="(https?:\/\/[^"]+)"/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer"'
    );
}
```

В `parseArticle`: `const html = renderMarkdown(body, translate(locale, 'insights.table'));`

`src/lib/i18n/translations.ts` — после строки `otherGuides: …` в блоке `insights` каждого языка:
- ru (после `otherGuides: 'Другие гайды',`): `table: 'Таблица',`
- kz (после `otherGuides: 'Басқа нұсқаулықтар',`): `table: 'Кесте',`
- en (после `otherGuides: 'More guides',`): `table: 'Table',`
- zh (после `otherGuides: '更多指南',`): `table: '表格',`

`src/styles/globals.css` — сразу после правила `.insight-table { … }`:

```css
  .insight-table:focus-visible {
    @apply outline-none ring-2 ring-gold/60 ring-offset-2 ring-offset-white dark:ring-offset-[#0A0A0A];
  }
```

- [ ] **Step 5: Страница статьи**

`src/app/[locale]/insights/[slug]/page.tsx`:
- после `const updated = formatCheckDate(entry.updated, locale);` добавить
  ```ts
  // The legal note dates the rules, not the last text edit.
  const lawAsOf = formatCheckDate(entry.lawAsOf ?? entry.updated, locale);
  ```
- в плашке `t('insights.legalNote', { date: updated })` → `t('insights.legalNote', { date: lawAsOf })`;
- в `<nav aria-label="Breadcrumb">` после ссылки на `/insights` добавить:
  ```tsx
            <span aria-hidden="true">/</span>
            <span
              aria-current="page"
              className="max-w-full truncate text-gray-700 dark:text-gray-300"
            >
              {article.title}
            </span>
  ```

- [ ] **Step 6: Тесты проходят**

Run: `npx jest src/__tests__/lib/insights src/__tests__/lib/i18n`
Expected: PASS (включая `content-integrity`).

- [ ] **Step 7: Commit**

```bash
git add src/lib/insights/registry.ts src/lib/insights/content.ts "src/app/[locale]/insights/[slug]/page.tsx" src/lib/i18n/translations.ts src/styles/globals.css src/__tests__/lib/insights src/__tests__/lib/i18n/insights-keys.test.ts
git commit -m "fix(insights): separate 'rules as of' date, article title in breadcrumbs, keyboard-scrollable tables"
```

---

## Task 3: og:image на всех страницах, карточка гайда

**Files:**
- Create: `src/lib/seo/og.ts`
- Create: `src/lib/seo/og-card.tsx`
- Modify: `src/app/[locale]/opengraph-image.tsx` (целиком)
- Create: `src/app/[locale]/insights/[slug]/opengraph-image.tsx`
- Modify: `src/lib/seo/metadata.ts` (images в openGraph/twitter)
- Modify: `next.config.mjs` (trace для og-маршрута гайда)
- Test: `src/__tests__/lib/seo/og.test.ts` (новый), `src/__tests__/lib/seo/metadata.test.ts`

**Interfaces:**
- Produces:
  - `OG_SIZE: { width: 1200; height: 630 }`, `OG_ALT = 'QAZNEDR HOLDING'`
  - `ogHomeTitle(locale: Locale): string`
  - `ogTitleSize(title: string): number`
  - `ogImageUrl(locale: Locale): string` → `https://qaznedr.kz/{locale}/opengraph-image`
  - `ogCard({ eyebrow, title, footer }: { eyebrow: string; title: string; footer: string }): JSX.Element`

- [ ] **Step 1: Падающие тесты**

`src/__tests__/lib/seo/og.test.ts`:

```ts
import { LOCALES } from '@/lib/seo/site';
import { OG_ALT, ogHomeTitle, ogImageUrl, ogTitleSize } from '@/lib/seo/og';

describe('ogHomeTitle', () => {
  it.each(LOCALES)('%s: approved home title without the brand prefix', (l) => {
    const title = ogHomeTitle(l);
    expect(title.length).toBeGreaterThan(10);
    expect(title).not.toMatch(/QAZNEDR/);
    expect(title).not.toMatch(/Платформа геологической|ecosystem|экосистем/i);
  });

  it('ru reads as the home page promise, capitalised', () => {
    expect(ogHomeTitle('ru')).toBe('Участки недр Казахстана для инвесторов');
  });
});

describe('ogTitleSize', () => {
  it('shrinks long titles, counting CJK characters double', () => {
    expect(ogTitleSize('Участки недр Казахстана')).toBe(64);
    expect(ogTitleSize('x'.repeat(60))).toBe(52);
    expect(ogTitleSize('x'.repeat(90))).toBe(44);
    // 25 CJK chars = 50 units → middle size.
    expect(ogTitleSize('矿'.repeat(25))).toBe(52);
  });
});

describe('ogImageUrl', () => {
  it('points at the locale card', () => {
    expect(ogImageUrl('zh')).toBe('https://qaznedr.kz/zh/opengraph-image');
    expect(OG_ALT).toBe('QAZNEDR HOLDING');
  });
});
```

(`seo.home.title` ru = `'QAZNEDR HOLDING — участки недр Казахстана для инвесторов'`: без префикса и с заглавной буквы.)

В `src/__tests__/lib/seo/metadata.test.ts` добавить в `describe('seo/metadata')`:

```ts
  it('gives every page an og:image and twitter:image (the locale card)', () => {
    const m = buildPageMetadata({
      locale: 'zh',
      path: '/faq',
      title: 't',
      description: 'd',
    });
    expect(m.openGraph?.images).toEqual([
      {
        url: 'https://qaznedr.kz/zh/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'QAZNEDR HOLDING',
      },
    ]);
    expect(m.twitter?.images).toEqual(['https://qaznedr.kz/zh/opengraph-image']);
  });
```

- [ ] **Step 2: Тесты падают**

Run: `npx jest src/__tests__/lib/seo/og.test.ts src/__tests__/lib/seo/metadata.test.ts`
Expected: FAIL — модуль `@/lib/seo/og` не найден; `images` undefined.

- [ ] **Step 3: `src/lib/seo/og.ts`**

```ts
import { translate } from '@/lib/i18n/translations';
import { SITE_NAME, localeUrl, type Locale } from './site';

// Shared by the og-image routes (edge and node) and page metadata.
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_ALT = SITE_NAME;

const BRAND_PREFIX = /^QAZNEDR HOLDING\s*[—–-]\s*/;

/** The approved home title (seo.home.title) without the brand prefix,
 * capitalised: after the dash it starts lower-case in ru and kz. */
export function ogHomeTitle(locale: Locale): string {
  const title = translate(locale, 'seo.home.title').replace(BRAND_PREFIX, '');
  return title.charAt(0).toUpperCase() + title.slice(1);
}

const WIDE = /[⺀-鿿豈-﫿＀-￯]/;

/** Font size that keeps a title within three lines of the 1040px text box. */
export function ogTitleSize(title: string): number {
  const units = Array.from(title).reduce(
    (n, ch) => n + (WIDE.test(ch) ? 2 : 1),
    0
  );
  if (units > 70) return 44;
  if (units > 40) return 52;
  return 64;
}

export function ogImageUrl(locale: Locale): string {
  return localeUrl(locale, '/opengraph-image');
}
```

- [ ] **Step 4: `src/lib/seo/og-card.tsx`**

```tsx
import { ogTitleSize } from './og';

/** 1200×630 card in the current neutral style (until the approved design). */
export function ogCard({
  eyebrow,
  title,
  footer,
}: {
  eyebrow: string;
  title: string;
  footer: string;
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 500,
          color: '#9CA3AF',
          textTransform: 'uppercase',
          letterSpacing: '3px',
          marginBottom: '24px',
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontSize: ogTitleSize(title),
          fontWeight: 700,
          color: '#111827',
          lineHeight: 1.15,
          letterSpacing: '-1px',
          maxWidth: '1040px',
        }}
      >
        {title}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '80px',
          fontSize: 16,
          color: '#9CA3AF',
        }}
      >
        {footer}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Общая карточка `src/app/[locale]/opengraph-image.tsx` целиком**

```tsx
import { ImageResponse } from 'next/og';
import { OG_ALT, OG_SIZE, ogHomeTitle } from '@/lib/seo/og';
import { ogCard } from '@/lib/seo/og-card';
import { toLocale } from '@/lib/seo/site';

export const runtime = 'edge';
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return new ImageResponse(
    ogCard({
      eyebrow: 'QAZNEDR HOLDING',
      title: ogHomeTitle(toLocale(locale)),
      footer: 'qaznedr.kz',
    }),
    { ...OG_SIZE }
  );
}
```

- [ ] **Step 6: Карточка гайда `src/app/[locale]/insights/[slug]/opengraph-image.tsx`**

```tsx
import { ImageResponse } from 'next/og';
import { translate } from '@/lib/i18n/translations';
import { getArticle } from '@/lib/insights/content';
import { INSIGHTS, findInsight } from '@/lib/insights/registry';
import { OG_ALT, OG_SIZE } from '@/lib/seo/og';
import { ogCard } from '@/lib/seo/og-card';
import { toLocale } from '@/lib/seo/site';

// Built with the article pages: one card per written language of a guide.
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return INSIGHTS.flatMap((entry) =>
    entry.locales.map((locale) => ({ locale, slug: entry.slug }))
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = toLocale(raw);
  const entry = findInsight(slug);
  const article =
    entry && raw === locale ? getArticle(slug, locale) : null;
  if (!entry || !article) return new Response('Not found', { status: 404 });
  const category = translate(locale, `insights.categories.${entry.category}`);
  return new ImageResponse(
    ogCard({
      eyebrow: `${category} · ${translate(locale, 'insights.eyebrow')}`,
      title: article.title,
      footer: 'QAZNEDR HOLDING · qaznedr.kz',
    }),
    { ...OG_SIZE }
  );
}
```

- [ ] **Step 7: Метаданные и трассировка**

`src/lib/seo/metadata.ts`: импорт `import { OG_ALT, OG_SIZE, ogImageUrl } from './og';`; в `buildPageMetadata` после `const url = …`:

```ts
  // Nested pages set their own openGraph, which drops the file-based card of
  // [locale]/opengraph-image, so every page names it explicitly. A segment's
  // own opengraph-image file (guides) still takes precedence.
  const image = { url: ogImageUrl(input.locale), ...OG_SIZE, alt: OG_ALT };
```

в объект `openGraph` добавить `images: [image],`, в `twitter` — `images: [image.url],`.

`next.config.mjs`, в `outputFileTracingIncludes` добавить строку (на случай рендера по запросу):

```js
    '/[locale]/insights/[slug]/opengraph-image': ['./content/insights/**/*'],
```

- [ ] **Step 8: Тесты, сборка, проверка карточек**

Run: `npx jest src/__tests__/lib/seo`
Expected: PASS.

Run: `npm run build 2>&1 | tee "$SCRATCH/build.txt" | tail -40`
Expected: успех; в списке маршрутов есть `/[locale]/insights/[slug]/opengraph-image`.

Run (локальный сервер): `PORT=3107 npm run start &` и затем:

```bash
for p in /en/insights/reserve-classification-gkz-kazrc-jorc-gbt17766 /zh/faq /ru/leads /ru; do echo "$p"; curl -s "http://localhost:3107$p" | grep -o '<meta property="og:image" content="[^"]*"'; done
curl -s -o "$SCRATCH/og-guide-zh.png" -w "%{http_code} %{content_type}\n" "http://localhost:3107/zh/insights/reserve-classification-gkz-kazrc-jorc-gbt17766/opengraph-image"
curl -s -o "$SCRATCH/og-ru.png" -w "%{http_code}\n" "http://localhost:3107/ru/opengraph-image"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3107/kz/insights/reserve-classification-gkz-kazrc-jorc-gbt17766/opengraph-image"
```

Expected:
- у всех четырёх страниц есть `og:image`: у гайда он ведёт на `…/insights/<slug>/opengraph-image…`, у остальных на `…/{locale}/opengraph-image`;
- картинка гайда отдаёт 200 `image/png`, общая — 200, kz-карточка гайда — 404.
- Открыть оба PNG через Read и проверить: текст холдинга, иероглифы без «квадратиков», заголовок не обрезан.

Если og:image гайда указывает не на его карточку, а на общую, это допустимо. Главное, чтобы og:image был. В отчёте отметить, какой из двух вариантов получился.

- [ ] **Step 9: Commit**

```bash
git add src/lib/seo/og.ts src/lib/seo/og-card.tsx "src/app/[locale]/opengraph-image.tsx" "src/app/[locale]/insights/[slug]/opengraph-image.tsx" src/lib/seo/metadata.ts next.config.mjs src/__tests__/lib/seo/og.test.ts src/__tests__/lib/seo/metadata.test.ts
git commit -m "feat(seo): og:image on every page, holding copy on the card, per-guide cards"
```

---

## Task 4: Тексты — примечание о передаче права, 404, дата у всех участков, /services

**Files:**
- Modify: `src/lib/i18n/translations.ts` (transferNote en/zh; `notFound.*` ×4; удалить `services.cta.*` ×4)
- Modify: `src/app/[locale]/not-found.tsx` (целиком)
- Modify: `src/app/[locale]/leads/[code]/page.tsx:205-210`
- Modify: `src/app/[locale]/services/page.tsx:95-109`
- Test: `src/__tests__/lib/i18n/holding-keys.test.ts`

**Interfaces:** нет новых.

- [ ] **Step 1: Падающий тест ключей**

В `src/__tests__/lib/i18n/holding-keys.test.ts` перед `// Later tasks append…`:

```ts
const NOT_FOUND_KEYS = ['title', 'text', 'home', 'contact', 'leads'].map(
  (k) => `notFound.${k}`
);
```

и добавить `...NOT_FOUND_KEYS,` в массив `KEYS`. Там же, после `describe.each`, добавить:

```ts
describe('transfer note', () => {
  it('says "as a rule" in every language, like the ru text', () => {
    expect(translate('ru', 'leadDetail.transferNote')).toMatch(/как правило/);
    expect(translate('kz', 'leadDetail.transferNote')).toMatch(/әдетте/);
    expect(translate('en', 'leadDetail.transferNote')).toMatch(/as a rule/i);
    expect(translate('zh', 'leadDetail.transferNote')).toMatch(/通常/);
  });

  it('uses the guides term 勘查 for exploration in zh', () => {
    expect(translate('zh', 'leadDetail.transferNote')).toContain('勘查');
    expect(translate('zh', 'leadDetail.transferNote')).not.toContain('勘探');
  });
});
```

- [ ] **Step 2: Тест падает**

Run: `npx jest src/__tests__/lib/i18n/holding-keys.test.ts`
Expected: FAIL — `notFound.*` нет, en без «as a rule», zh с 勘探.

- [ ] **Step 3: Переводы**

`leadDetail.transferNote`:
- en: `"As a rule, transferring a subsoil-use right requires the competent authority's permission (Arts. 44–45 of the Subsoil Code); a solid-minerals exploration licence cannot be transferred in its first year."`
- zh: `'矿业权转让通常须经主管机关许可（《底土法》第44–45条）；固体矿产勘查许可证在有效期第一年内不得转让。'`

Новый блок `notFound` в начале каждого языка (перед `faqPage: {`):

```ts
    // ru
    notFound: {
      title: 'Страница не найдена',
      text: 'Возможно, она была перемещена или больше не существует.',
      home: 'На главную',
      contact: 'Связаться с нами',
      leads: 'Участки',
    },
    // kz
    notFound: {
      title: 'Бет табылмады',
      text: 'Мүмкін, ол басқа мекенжайға көшірілген немесе енді жоқ.',
      home: 'Басты бетке',
      contact: 'Бізбен байланысу',
      leads: 'Учаскелер',
    },
    // en
    notFound: {
      title: 'Page not found',
      text: 'It may have been moved or no longer exists.',
      home: 'Home',
      contact: 'Contact us',
      leads: 'Areas',
    },
    // zh
    notFound: {
      title: '页面未找到',
      text: '该页面可能已被移动或已不存在。',
      home: '返回首页',
      contact: '联系我们',
      leads: '地块',
    },
```

(Комментарии `// ru` и т. п. в код не вставлять — они только показывают, в какой язык идёт блок.)

Удалить блок `cta: { title, description, postService, contactUs }` внутри `services` во всех 4 языках (ru ~стр. 622, kz ~1429, en ~2111, zh ~2764; искать `postService`).

- [ ] **Step 4: 404 на языке страницы**

`src/app/[locale]/not-found.tsx`:
- первой строкой `'use client';`;
- импорт `import { useTranslation } from '@/hooks/useTranslation';`;
- в начале компонента `const { t, locale } = useTranslation();`;
- тексты: `Страница не найдена` → `{t('notFound.title')}`, подзаголовок → `{t('notFound.text')}`, `На главную` → `{t('notFound.home')}`, `Связаться с нами` → `{t('notFound.contact')}`, `Геологические находки` → `{t('notFound.leads')}`;
- ссылки: `href="/"` → `` href={`/${locale}`} ``, `href="/ru/contact"` → `` href={`/${locale}/contact`} ``, `href="/ru/leads"` → `` href={`/${locale}/leads`} ``.

- [ ] **Step 5: /services без маркетплейсного призыва**

`src/app/[locale]/services/page.tsx`:
- удалить секцию `{/* CTA */} <section …> … </section>` (строки ~95–109) и вставить вместо неё `<ClosingCta locale={locale} />`;
- импорт `import ClosingCta from '@/components/features/ClosingCta';`;
- удалить ставший лишним `import { Button } from '@/components/ui/button';`.

- [ ] **Step 6: Дата проверки у всех участков**

`src/app/[locale]/leads/[code]/page.tsx`: блок

```tsx
                  {free && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4" />{' '}
                      {t('leadDetail.verifyDate')} {checkedOn}
                    </div>
                  )}
```

заменить на (без условия — пункт «Статус проверен… на дату в карточке» должен находить дату у любого участка):

```tsx
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-4 h-4" />{' '}
                    {t('leadDetail.verifyDate')} {checkedOn}
                  </div>
```

- [ ] **Step 7: Тесты и типы**

Run: `npx jest src/__tests__/lib/i18n && npx tsc --noEmit -p . 2>&1 | grep -E "not-found|services/page|leads/\[code\]" | head`
Expected: jest PASS; tsc по этим файлам без ошибок.

- [ ] **Step 8: Commit**

```bash
git add src/lib/i18n/translations.ts "src/app/[locale]/not-found.tsx" "src/app/[locale]/leads/[code]/page.tsx" "src/app/[locale]/services/page.tsx" src/__tests__/lib/i18n/holding-keys.test.ts
git commit -m "fix(copy): 404 in four languages, check date on every area, 'as a rule' transfer note, no marketplace CTA on /services"
```

---

## Task 5: Надёжность — ограничитель, даты, счётчики, заголовок

**Files:**
- Modify: `src/lib/inquiries/throttle.ts` (целиком)
- Modify: `src/lib/leads/check-date.ts:8-21`
- Create: `src/lib/leads/stats.ts`
- Modify: `src/components/features/PortalWelcomeHero.tsx:28-45`
- Modify: `next.config.mjs` (`poweredByHeader: false`)
- Test: `src/__tests__/lib/inquiries/throttle.test.ts`, `src/__tests__/lib/leads/check-date.test.ts`, `src/__tests__/lib/leads/stats.test.ts` (новый)

**Interfaces:**
- Produces: `createThrottle({ limit, windowMs, maxKeys?, now? })`; `collectLeadStats(fetchPage: (page: number) => Promise<LeadsPage>): Promise<{ total: number; regions: number }>`; `LEADS_PAGE_SIZE = 50`.

- [ ] **Step 1: Падающие тесты ограничителя**

Дописать в `src/__tests__/lib/inquiries/throttle.test.ts`:

```ts
it('keeps a blocked key blocked when the map fills with expired keys', () => {
  let now = 0;
  const allow = createThrottle({
    limit: 1,
    windowMs: 1000,
    maxKeys: 3,
    now: () => now,
  });
  allow('a');
  allow('b');
  allow('c');
  now = 500;
  expect(allow('x')).toBe(true);
  expect(allow('x')).toBe(false);
  now = 1200; // a, b, c expired; x is still inside its window
  expect(allow('d')).toBe(true); // overflow → prune
  expect(allow('x')).toBe(false);
});

it('evicts the least recently used keys when nothing has expired', () => {
  const allow = createThrottle({
    limit: 1,
    windowMs: 1000,
    maxKeys: 3,
    now: () => 0,
  });
  expect(allow('k0')).toBe(true);
  expect(allow('k1')).toBe(true);
  expect(allow('k2')).toBe(true);
  expect(allow('k3')).toBe(true); // 4 keys > 3 → k0 goes
  expect(allow('k3')).toBe(false); // newest stays tracked
  expect(allow('k0')).toBe(true); // k0 was forgotten, starts over
});
```

- [ ] **Step 2: Тест падает**

Run: `npx jest src/__tests__/lib/inquiries/throttle.test.ts`
Expected: FAIL. `maxKeys` игнорируется, `allow('k0')` возвращает `false`. Первый тест может пройти случайно, это нормально: главное, что падает второй.

- [ ] **Step 3: Реализация `src/lib/inquiries/throttle.ts`**

```ts
// Best-effort in-memory limiter. Per serverless instance only — Upstash is not
// configured in production, so this plus the honeypot is the spam guard.
export function createThrottle({
  limit,
  windowMs,
  maxKeys = 5000,
  now = () => Date.now(),
}: {
  limit: number;
  windowMs: number;
  /** Memory bound. Expired keys go first, then the least recently used. */
  maxKeys?: number;
  now?: () => number;
}): (key: string) => boolean {
  // Map order = last activity, oldest first (keys are re-inserted on use).
  const hits = new Map<string, number[]>();

  function prune(t: number): void {
    for (const [key, stamps] of hits) {
      if (stamps.every((ts) => t - ts >= windowMs)) hits.delete(key);
    }
    for (const key of hits.keys()) {
      if (hits.size <= maxKeys) break;
      hits.delete(key);
    }
  }

  return function allow(key: string): boolean {
    const t = now();
    const recent = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
    const allowed = recent.length < limit;
    if (allowed) recent.push(t);
    hits.delete(key);
    hits.set(key, recent);
    if (hits.size > maxKeys) prune(t);
    return allowed;
  };
}
```

- [ ] **Step 4: Падающие тесты дат**

В `src/__tests__/lib/leads/check-date.test.ts` добавить:

```ts
  it('drops an impossible day but keeps the month of the value', () => {
    expect(formatCheckDate('2026-06-00', 'ru')).toBe('06.2026');
    expect(formatCheckDate('2026-02-31', 'ru')).toBe('02.2026');
    expect(formatCheckDate('2026-02-29', 'en')).toBe('February 2026');
    expect(formatCheckDate('2028-02-29', 'ru')).toBe('29.02.2028');
    expect(formatCheckDate('2026-04-31', 'zh')).toBe('2026年4月');
  });
```

Run: `npx jest src/__tests__/lib/leads/check-date.test.ts`
Expected: FAIL (`00.06.2026`, `31.02.2026`).

- [ ] **Step 5: Реализация `parts` в `src/lib/leads/check-date.ts`**

```ts
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parts(value: string | null | undefined): {
  y: string;
  m: string;
  d?: string;
} {
  const match = DATE.exec(value ?? '');
  const month = match ? Number(match[2]) : 0;
  if (match && month >= 1 && month <= 12) {
    const day = match[3] ? Number(match[3]) : 0;
    // A day that does not exist (00, 31.02) keeps the month, drops the day.
    const valid = day >= 1 && day <= daysInMonth(Number(match[1]), month);
    return { y: match[1], m: match[2], d: valid ? match[3] : undefined };
  }
  const [y, m] = LEADS_BULK_CHECK.split('-');
  return { y, m };
}
```

Run: `npx jest src/__tests__/lib/leads/check-date.test.ts src/__tests__/lib/inquiries/throttle.test.ts`
Expected: PASS.

- [ ] **Step 6: Падающий тест счётчиков**

`src/__tests__/lib/leads/stats.test.ts`:

```ts
import { collectLeadStats, LEADS_PAGE_SIZE } from '@/lib/leads/stats';

const lead = (region: string | null) => ({ region });

describe('collectLeadStats', () => {
  it('reads every page and counts distinct regions once', async () => {
    const pages: Record<number, { total: number; leads: { region: string | null }[] }> = {
      1: {
        total: 60,
        leads: [
          ...Array(49).fill(lead('Восточно-Казахстанская область')),
          lead(null),
        ],
      },
      2: {
        total: 60,
        leads: [
          ...Array(9).fill(lead('Карагандинская область')),
          lead('Абайская область'),
        ],
      },
    };
    const calls: number[] = [];
    const stats = await collectLeadStats(async (page) => {
      calls.push(page);
      return pages[page];
    });
    expect(LEADS_PAGE_SIZE).toBe(50);
    expect(calls.sort()).toEqual([1, 2]);
    expect(stats).toEqual({ total: 60, regions: 3 });
  });

  it('asks for one page when everything fits', async () => {
    const calls: number[] = [];
    await collectLeadStats(async (page) => {
      calls.push(page);
      return { total: 31, leads: [lead('Абайская область')] };
    });
    expect(calls).toEqual([1]);
  });

  it('fails as a whole when a later page fails (no partial counts)', async () => {
    await expect(
      collectLeadStats(async (page) => {
        if (page === 2) throw new Error('503');
        return { total: 60, leads: [lead('Абайская область')] };
      })
    ).rejects.toThrow('503');
  });
});
```

Run: `npx jest src/__tests__/lib/leads/stats.test.ts`
Expected: FAIL — модуль не найден.

- [ ] **Step 7: `src/lib/leads/stats.ts` и главная**

```ts
import { leadRegionName } from '@/lib/seo/lead-metadata';

/** /api/leads caps `limit` at 50. */
export const LEADS_PAGE_SIZE = 50;
const MAX_PAGES = 20;

export interface LeadsPage {
  total: number;
  leads: { region?: string | null }[];
}

/** Published-lead total and distinct regions across every /api/leads page.
 * Rejects if any page fails, so callers keep their fallback numbers. */
export async function collectLeadStats(
  fetchPage: (page: number) => Promise<LeadsPage>
): Promise<{ total: number; regions: number }> {
  const first = await fetchPage(1);
  const pages = Math.min(Math.ceil(first.total / LEADS_PAGE_SIZE), MAX_PAGES);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) => fetchPage(i + 2))
  );
  const regions = new Set<string>();
  for (const { leads } of [first, ...rest]) {
    for (const l of leads) {
      const name = leadRegionName(l.region, 'ru') || (l.region ?? '').trim();
      if (name) regions.add(name);
    }
  }
  return { total: first.total, regions: regions.size };
}
```

`src/components/features/PortalWelcomeHero.tsx`: импорт `import { collectLeadStats, LEADS_PAGE_SIZE } from '@/lib/leads/stats';`; убрать ставший ненужным импорт `leadRegionName`, если он больше нигде в файле не используется; `useEffect` заменить на:

```tsx
  useEffect(() => {
    collectLeadStats(async (page) => {
      const r = await fetch(`/api/leads?limit=${LEADS_PAGE_SIZE}&page=${page}`);
      const j = await r.json();
      return {
        total: Number(j?.data?.total ?? 0),
        leads: j?.data?.leads ?? [],
      };
    })
      .then(({ total, regions }) => {
        if (total > 0) setLeadsCount(total);
        if (regions > 0) setRegionsCount(regions);
      })
      .catch(() => {});
  }, []);
```

`next.config.mjs`: после `reactStrictMode: true,` добавить

```js
  // No "X-Powered-By: Next.js" header.
  poweredByHeader: false,
```

- [ ] **Step 8: Тесты проходят**

Run: `npx jest src/__tests__/lib/leads src/__tests__/lib/inquiries src/__tests__/lib/auth`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/inquiries/throttle.ts src/lib/leads/check-date.ts src/lib/leads/stats.ts src/components/features/PortalWelcomeHero.tsx next.config.mjs src/__tests__/lib/inquiries/throttle.test.ts src/__tests__/lib/leads
git commit -m "fix: throttle prunes instead of clearing, impossible check days, home counters read every page, no X-Powered-By"
```

---

## Task 6: Чистка — мёртвые компоненты и ключи

**Files:**
- Delete: `src/components/features/GlobalSearch.tsx`, `src/components/ui/Breadcrumbs.tsx`
- Modify: `src/lib/i18n/translations.ts` (удалить `services.knowledge` ×4)

- [ ] **Step 1: Проверить, что никто не использует**

Run: `grep -rn "GlobalSearch\|ui/Breadcrumbs\|services\.knowledge\|knowledge\.knowledge" src --include='*.ts' --include='*.tsx' | grep -v "^src/components/features/GlobalSearch.tsx\|^src/components/ui/Breadcrumbs.tsx\|i18n/translations.ts"`
Expected: пусто. Если что-то нашлось — не удалять этот элемент и отметить в отчёте.

- [ ] **Step 2: Удалить**

```bash
git rm -q src/components/features/GlobalSearch.tsx src/components/ui/Breadcrumbs.tsx
```

В `translations.ts` удалить блок `knowledge: { knowledgeBase: …, … }` внутри `services` каждого языка (ru ~стр. 629, kz ~1386, en и zh — искать `knowledgeBase:`). Ключ `navigation.knowledge` и прочие `knowledge` вне `services` не трогать.

- [ ] **Step 3: Проверка**

Run: `grep -n "knowledgeBase" src/lib/i18n/translations.ts; npx jest src/__tests__/lib/i18n && npx tsc --noEmit -p . 2>&1 | grep -c "error TS"`
Expected: grep пуст; jest PASS; число ошибок tsc не больше, чем до задачи (посчитать до удаления той же командой).

- [ ] **Step 4: Commit**

```bash
git add src/lib/i18n/translations.ts
git commit -m "chore: drop dead GlobalSearch and Breadcrumbs, orphan services.knowledge keys"
```

---

## Task 7: Проверка, деплой, статус

- [ ] **Step 1: Весь набор против базовой линии**

Run: `npx jest 2>&1 | grep -E "^(FAIL|PASS)" | sort > "$SCRATCH/after.txt"; diff <(grep FAIL "$SCRATCH/baseline.txt") <(grep FAIL "$SCRATCH/after.txt")`
Expected: diff пуст (новых FAIL нет).

- [ ] **Step 2: Линт и сборка**

Run: `npx eslint $(git diff --name-only 69b0beb -- 'src/**/*.ts' 'src/**/*.tsx' | tr '\n' ' ') && npm run build 2>&1 | tail -30`
Expected: без ошибок eslint по изменённым файлам; сборка успешна.

- [ ] **Step 3: Браузер (локально, `next start` на 3107), 375 и 1440 px**

- `/ru/insights/solid-minerals-exploration-licence-kazakhstan`:
  - в крошках есть название статьи, на 375 px оно обрезано многоточием;
  - Tab доходит до таблицы, видно кольцо фокуса, стрелки прокручивают таблицу;
  - в юридической плашке дата 26.09.2026.
- `/zh/no-such-page`: 404 на китайском, ссылки ведут на `/zh`, `/zh/contact`, `/zh/leads`.
- `/ru/services` на 375 px: нет горизонтальной прокрутки, внизу блок «Готовы обсудить участок?».
- `/kz/faq`: ссылки на гайды ведут на `/ru/insights/…`.
- Тизер несвободного участка (если есть в `/api/leads`, иначе любой): строка «Дата проверки».

- [ ] **Step 4: Push и прод**

```bash
git push origin master
```

Подождать, пока Vercel соберёт прод: `meta.githubCommitSha` = HEAD, `readyState` READY. Затем:

```bash
curl -sI https://qaznedr.kz/ru | grep -ci x-powered-by   # 0
curl -sI "https://qaznedr.kz/kz/insights/reserve-classification-gkz-kazrc-jorc-gbt17766?utm_source=x" | grep -i location  # …?utm_source=x
for p in /en/insights/reserve-classification-gkz-kazrc-jorc-gbt17766 /zh/faq /ru/leads; do curl -s "https://qaznedr.kz$p" | grep -o '<meta property="og:image" content="[^"]*"'; done
```

- [ ] **Step 5: Финальное ревью**

Отдать всю ветку от `69b0beb` одному свежему ревьюеру на самой сильной модели (superpowers:requesting-code-review). Исправить подтверждённые находки отдельными коммитами, мелочи записать в роудмап.

- [ ] **Step 6: Роудмап и память**

- `docs/HOLDING_ROADMAP.md`:
  - «Текущий статус»: сессия 3б закрыта, что на проде;
  - в сессиях 2 и 3 отметить закрытые мелочи;
  - в «Не хватает от владельца» добавить Sentry (не работает, нет DSN; решить, нужен ли);
  - добавить блок «Сессия 3б», следующая — сессия 4.
- Коммит, push, проверка синхронизации.
