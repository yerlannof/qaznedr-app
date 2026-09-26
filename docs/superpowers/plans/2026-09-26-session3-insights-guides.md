# Сессия 3: `/insights` и 4 гайда — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить выдуманные разделы blog, education, knowledge и news одним разделом `/insights` с четырьмя проверенными гайдами на ru, en и zh. Перевести FAQ на en и zh. Проставить внутренние ссылки. Задеплоить.

**Architecture:**

- Гайды хранятся markdown-файлами `content/insights/<slug>/<locale>.md`. В шапке только `title` и `description`.
- Всё про статью целиком лежит в реестре `src/lib/insights/registry.ts`: категория, даты, флаг `legal`, языки. В реестре нет `fs`, поэтому его читают middleware (edge), sitemap и клиентские компоненты.
- Серверный загрузчик `src/lib/insights/content.ts` читает файл и рендерит его через `marked`. Страницы собираются статически.
- Если у статьи нет нужного языка, middleware отдаёт 308 на ru.
- Старые разделы удаляются и отдают 308 через `HIDDEN_ROUTE_REDIRECTS`.

**Tech Stack:** Next.js 15.5 App Router (RSC, `generateStaticParams`), TypeScript, Tailwind v3, `marked` 18 (ESM), Jest (`next/jest`, SWC), Lucide.

**Spec:** `docs/superpowers/specs/2026-09-26-session3-insights-guides-design.md`

## Global Constraints

- **Работа прямо в `master`** в `~/Documents/qaznedr-app`.
  - `git add` только поимённо.
  - `docs/design/*`, `AGENTS.md` и прочие файлы Codex не трогать и не коммитить.
  - Push один раз, в Task 10.
- **Дизайн-система.**
  - Цвета: серый + gold (`gold #C8A24B`, `gold-dark #A8842F`, `gold-light #E0C674`), тёмная тема ink `#0A0A0A` / surface `#141414`.
  - Заголовки `font-serif font-light tracking-tight`.
  - Без эмодзи и градиентов, иконки только Lucide.
  - Hover: `hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200`.
- **SEO.**
  - У каждой новой страницы своя metadata с уникальными title и description, один `h1`, дальше `h2` → `h3`.
  - Страница в sitemap, у контентных страниц JSON-LD.
  - Canonical только на `https://qaznedr.kz`.
- **Красные линии текста** (для всех гайдов, FAQ и переводов UI):
  - не намекать, что участки наши;
  - не писать, что продаём отчёты или данные;
  - без «гарантированной доходности»;
  - ГКЗ C1/C2 не называть JORC, P1–P3 — прогноз, а не запасы;
  - «свободен» — по нашей проверке на дату;
  - не обещать, что лицензия будет получена;
  - без OCR, ИИ и моделей;
  - не писать «портфель», «portfolio», «маркетплейс»;
  - не писать `obtain the licence`.
- **Юридические гайды** (`legal: true`):
  - только по тексту нормы, со ссылкой на adilet.zan.kz;
  - «по состоянию на 26.09.2026»;
  - неоднозначное — «уточняйте у юриста».
- **Без `console.*`** в продуктовом коде.
- **Старые падающие наборы маркетплейса** (5–6 шт.) не чинить. Новых падений быть не должно.
- **Коммиты** заканчиваются строками:

  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01KhCFz4qY37mq8JCb7otomQ
  ```

## Review Focus

1. **kz и прочие языки без перевода.**
   - Открывают `/kz/insights/<slug>` (переключатель языка в футере сохраняет путь) → должны получить 308 на `/ru/insights/<slug>`, а не 404.
   - Список на kz ведёт прямо на ru-статьи.
   - Покрыто в Task 3 (middleware test) и Task 1 (`listArticles('kz')`).
2. **Таблица на телефоне 375 px.**
   - Таблица соответствий в гайде 3 широкая. Прокручиваться должна таблица, а не страница.
   - Покрыто в Task 1 (обёртка `insight-table` в `renderMarkdown`) и Task 9 (ручная проверка в браузере на 375 px).
3. **Внешние ссылки в «Источниках».**
   - Открываются в новой вкладке с `rel="noopener noreferrer"`. Внутренние ссылки `/ru/leads` — в той же вкладке.
   - Покрыто в Task 1.
4. **Статья с неполной шапкой или H1 в теле.**
   - Сборка должна упасть с понятной ошибкой, а не показать пустой заголовок или два H1.
   - Покрыто в Task 1 (`parseArticle` бросает ошибку) и Task 7 (тест целостности контента).
5. **Ссылки из markdown на скрытые разделы** (`/ru/listings`, `/ru/blog`).
   - Иначе посетитель получит лишний 308.
   - Покрыто в Task 7 (тест целостности контента).

---

## File Structure

| Файл | Отвечает за |
| --- | --- |
| `content/insights/<slug>/{ru,en,zh}.md` | Тексты гайдов (шапка title/description + markdown) |
| `src/lib/insights/front-matter.ts` | `parseFrontMatter(source)` — разбор шапки |
| `src/lib/insights/registry.ts` | Реестр статей, `GUIDE`-слаги, `findInsight` (без `fs`) |
| `src/lib/insights/routing.ts` | `insightLocaleRedirect(pathname)` для middleware |
| `src/lib/insights/content.ts` | `renderMarkdown`, `readingMinutes`, `parseArticle`, `getArticle`, `listArticles` (сервер, `fs`) |
| `src/lib/seo/article-jsonld.ts` | `breadcrumbJsonLd`, `articleJsonLd` |
| `src/lib/seo/metadata.ts` | + `locales`, `article` в `buildPageMetadata`; `buildLanguageAlternates(path, locales)` |
| `src/lib/content/faq.ts` | FAQ ru/en/zh, `faqFor`, `faqJsonLd` |
| `src/components/features/ClosingCta.tsx` | Тёмный CTA «Обсудить участок» (без хуков: список, статья, FAQ) |
| `src/components/features/GuideLinks.tsx` | Карточки-ссылки на гайды (без хуков: FAQ, услуги, `/services/legal`) |
| `src/app/[locale]/insights/page.tsx` | Список гайдов |
| `src/app/[locale]/insights/[slug]/page.tsx` | Статья |
| `src/styles/globals.css` | `.insight-prose`, `.insight-table` |
| `src/middleware.ts`, `src/lib/seo/pages.ts`, `src/app/sitemap.ts` | Редиректы, публичные страницы, sitemap |
| `src/lib/i18n/translations.ts` | `insights.*`, `faqPage.*`, `navigation.insights`, `seo.insights`; удаление `seo.blog/education/knowledge/news` |
| Удаляются | `src/app/[locale]/{blog,education,knowledge,news}/` |

---

### Task 1: Движок markdown и реестр

**Files:**

- Create:
  - `src/lib/insights/front-matter.ts`
  - `src/lib/insights/registry.ts`
  - `src/lib/insights/content.ts`
  - `src/__tests__/lib/insights/front-matter.test.ts`
  - `src/__tests__/lib/insights/content.test.ts`
- Modify:
  - `package.json` / `package-lock.json` (зависимость `marked`);
  - `next.config.mjs` (`transpilePackages`, `outputFileTracingIncludes`);
  - `jest.config.ts` (`transformIgnorePatterns`).

**Interfaces:**

- Produces:
  - `parseFrontMatter(source: string): { data: Record<string, string>; body: string }`.
  - `type InsightCategory = 'law' | 'licensing' | 'geology'`.
  - `interface InsightEntry { slug: string; category: InsightCategory; published: string; updated: string; legal: boolean; locales: readonly Locale[] }`.
  - `GUIDE`, `type GuideKey = keyof typeof GUIDE`, `GUIDE_KEYS: readonly GuideKey[]`, `INSIGHTS: readonly InsightEntry[]`, `INSIGHT_FALLBACK_LOCALE: Locale`, `findInsight(slug: string): InsightEntry | undefined`.
  - `INSIGHTS_DIR: string`, `articlePath(slug, locale): string`, `renderMarkdown(md: string): string`, `readingMinutes(md: string, locale: Locale): number`.
  - `interface ArticleCard { slug; locale: Locale; title; description; category: InsightCategory; updated: string; readingMinutes: number }`, `interface Article extends ArticleCard { html: string }`.
  - `parseArticle(source: string, entry: InsightEntry, locale: Locale): Article`, `getArticle(slug: string, locale: Locale): Article | null`, `listArticles(locale: Locale): ArticleCard[]`.

- [ ] **Step 1: Поставить `marked` и научить Jest его трансформировать**

```bash
cd ~/Documents/qaznedr-app && npm install marked@^18
```

В `next.config.mjs` в объект `nextConfig` (после `reactStrictMode: true,`) добавить:

```js
  // marked ships ESM only; next/jest reads this list to transform it in tests.
  transpilePackages: ['marked'],

  // Guides are read from content/ at build time; keep them in the trace in
  // case a page is ever rendered on demand.
  outputFileTracingIncludes: {
    '/[locale]/insights': ['./content/insights/**/*'],
    '/[locale]/insights/[slug]': ['./content/insights/**/*'],
  },
```

В `jest.config.ts` заменить `transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],` на:

```ts
  transformIgnorePatterns: ['node_modules/(?!(uuid|marked)/)'],
```

- [ ] **Step 2: Написать падающий тест парсера шапки**

`src/__tests__/lib/insights/front-matter.test.ts`:

```ts
import { parseFrontMatter } from '@/lib/insights/front-matter';

describe('parseFrontMatter', () => {
  it('splits key: value pairs from the body, keeping colons in values', () => {
    const { data, body } = parseFrontMatter(
      '---\ntitle: Лицензия: шаги\ndescription: Коротко\n---\n\nТекст\n'
    );
    expect(data).toEqual({ title: 'Лицензия: шаги', description: 'Коротко' });
    expect(body).toBe('\nТекст\n');
  });

  it('accepts CRLF line endings', () => {
    const { data } = parseFrontMatter('---\r\ntitle: A\r\n---\r\nB');
    expect(data.title).toBe('A');
  });

  it('throws when the header is missing', () => {
    expect(() => parseFrontMatter('# Title\n\nText')).toThrow(/front matter/);
  });

  it('throws on a line without a key', () => {
    expect(() => parseFrontMatter('---\njust text\n---\n')).toThrow(
      /just text/
    );
  });
});
```

- [ ] **Step 3: Запустить тест — должен упасть**

Run: `npx jest src/__tests__/lib/insights/front-matter.test.ts --coverage=false`
Expected: FAIL — `Cannot find module '@/lib/insights/front-matter'`.

- [ ] **Step 4: Реализовать парсер**

`src/lib/insights/front-matter.ts`:

```ts
const HEADER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/**
 * Minimal front matter: `key: value` lines between `---` fences. Values are
 * taken verbatim after the first colon (no quotes, no multi-line values).
 */
export function parseFrontMatter(source: string): {
  data: Record<string, string>;
  body: string;
} {
  const match = HEADER.exec(source);
  if (!match) throw new Error('Missing front matter (--- … ---) at the top');
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(':');
    if (colon <= 0) throw new Error(`Bad front matter line: "${line}"`);
    data[trimmed.slice(0, colon).trim()] = trimmed.slice(colon + 1).trim();
  }
  return { data, body: source.slice(match[0].length) };
}
```

- [ ] **Step 5: Запустить тест — должен пройти**

Run: `npx jest src/__tests__/lib/insights/front-matter.test.ts --coverage=false`
Expected: PASS (4 tests).

- [ ] **Step 6: Реестр**

`src/lib/insights/registry.ts`:

```ts
import type { Locale } from '@/lib/seo/site';

// Article-level facts. No fs here: the middleware (edge), the sitemap and
// client components read this file. Texts live in content/insights/<slug>/.

export type InsightCategory = 'law' | 'licensing' | 'geology';

export interface InsightEntry {
  slug: string;
  category: InsightCategory;
  /** ISO dates, shared by all languages of the article. */
  published: string;
  updated: string;
  /** Shows the "not legal advice, as of <updated>" note. */
  legal: boolean;
  /** Languages with a content/insights/<slug>/<locale>.md file. */
  locales: readonly Locale[];
}

export const GUIDE = {
  foreignInvestor: 'foreign-investor-subsoil-rights-kazakhstan',
  explorationLicence: 'solid-minerals-exploration-licence-kazakhstan',
  reserveClassification: 'reserve-classification-gkz-kazrc-jorc-gbt17766',
  rightsTransfer: 'subsoil-rights-transfer-permission-kazakhstan',
} as const;

export type GuideKey = keyof typeof GUIDE;
export const GUIDE_KEYS = Object.keys(GUIDE) as GuideKey[];

const WRITTEN: readonly Locale[] = ['ru', 'en', 'zh'];

export const INSIGHTS: readonly InsightEntry[] = [
  {
    slug: GUIDE.foreignInvestor,
    category: 'law',
    published: '2026-09-26',
    updated: '2026-09-26',
    legal: true,
    locales: WRITTEN,
  },
  {
    slug: GUIDE.explorationLicence,
    category: 'licensing',
    published: '2026-09-26',
    updated: '2026-09-26',
    legal: true,
    locales: WRITTEN,
  },
  {
    slug: GUIDE.reserveClassification,
    category: 'geology',
    published: '2026-09-26',
    updated: '2026-09-26',
    legal: false,
    locales: WRITTEN,
  },
  {
    slug: GUIDE.rightsTransfer,
    category: 'law',
    published: '2026-09-26',
    updated: '2026-09-26',
    legal: true,
    locales: WRITTEN,
  },
];

/** Where a reader lands when the article has no version in their language. */
export const INSIGHT_FALLBACK_LOCALE: Locale = 'ru';

export function findInsight(slug: string): InsightEntry | undefined {
  return INSIGHTS.find((entry) => entry.slug === slug);
}
```

- [ ] **Step 7: Написать падающий тест загрузчика**

`src/__tests__/lib/insights/content.test.ts`:

```ts
/** @jest-environment node */
import {
  listArticles,
  parseArticle,
  readingMinutes,
  renderMarkdown,
} from '@/lib/insights/content';
import { INSIGHTS, type InsightEntry } from '@/lib/insights/registry';

const entry: InsightEntry = {
  slug: 'test-guide',
  category: 'law',
  published: '2026-09-26',
  updated: '2026-09-27',
  legal: true,
  locales: ['ru'],
};

describe('renderMarkdown', () => {
  it('wraps tables so they scroll on narrow screens', () => {
    const html = renderMarkdown('| A | B |\n|---|---|\n| 1 | 2 |\n');
    expect(html).toContain('<div class="insight-table"><table>');
    expect(html).toContain('</table></div>');
  });

  it('opens external links in a new tab, internal ones in place', () => {
    const html = renderMarkdown(
      '[Кодекс](https://adilet.zan.kz/rus/docs/K1700000125) и [участки](/ru/leads)'
    );
    expect(html).toContain(
      '<a href="https://adilet.zan.kz/rus/docs/K1700000125" target="_blank" rel="noopener noreferrer">'
    );
    expect(html).toContain('<a href="/ru/leads">');
  });
});

describe('readingMinutes', () => {
  it('counts 200 words a minute for ru/en and at least one minute', () => {
    expect(readingMinutes('слово '.repeat(400), 'ru')).toBe(2);
    expect(readingMinutes('word', 'en')).toBe(1);
  });

  it('counts 400 characters a minute for zh', () => {
    expect(readingMinutes('矿'.repeat(1200), 'zh')).toBe(3);
  });
});

describe('parseArticle', () => {
  it('combines the file header with registry facts', () => {
    const a = parseArticle(
      '---\ntitle: Заголовок\ndescription: Описание\n---\n\n## Раздел\n\nТекст',
      entry,
      'ru'
    );
    expect(a).toMatchObject({
      slug: 'test-guide',
      locale: 'ru',
      title: 'Заголовок',
      description: 'Описание',
      category: 'law',
      updated: '2026-09-27',
      readingMinutes: 1,
    });
    expect(a.html).toContain('<h2>Раздел</h2>');
  });

  it('names the file when title or description is missing', () => {
    expect(() =>
      parseArticle('---\ndescription: D\n---\nX', entry, 'en')
    ).toThrow('test-guide/en.md: missing title');
    expect(() => parseArticle('---\ntitle: T\n---\nX', entry, 'en')).toThrow(
      'test-guide/en.md: missing description'
    );
  });
});

describe('listArticles', () => {
  // Runs against the real content/ folder; guides land in Task 7–8.
  it('falls back to the ru version for locales without a translation', () => {
    const cards = listArticles('kz');
    for (const card of cards) expect(card.locale).toBe('ru');
    expect(cards.length).toBeLessThanOrEqual(INSIGHTS.length);
  });
});
```

- [ ] **Step 8: Запустить тест — должен упасть**

Run: `npx jest src/__tests__/lib/insights/content.test.ts --coverage=false`
Expected: FAIL — `Cannot find module '@/lib/insights/content'`.

- [ ] **Step 9: Реализовать загрузчик**

`src/lib/insights/content.ts`:

```ts
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { marked } from 'marked';
import type { Locale } from '@/lib/seo/site';
import { parseFrontMatter } from './front-matter';
import {
  INSIGHTS,
  INSIGHT_FALLBACK_LOCALE,
  findInsight,
  type InsightCategory,
  type InsightEntry,
} from './registry';

// Server only (fs). Pages that use it are prerendered at build time.

export const INSIGHTS_DIR = path.join(process.cwd(), 'content', 'insights');

export interface ArticleCard {
  slug: string;
  /** Language of the text, which may differ from the page (kz → ru). */
  locale: Locale;
  title: string;
  description: string;
  category: InsightCategory;
  updated: string;
  readingMinutes: number;
}

export interface Article extends ArticleCard {
  html: string;
}

export function articlePath(slug: string, locale: Locale): string {
  return path.join(INSIGHTS_DIR, slug, `${locale}.md`);
}

export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false, gfm: true }) as string;
  return html
    .replace(/<table>/g, '<div class="insight-table"><table>')
    .replace(/<\/table>/g, '</table></div>')
    .replace(
      /<a href="(https?:\/\/[^"]+)"/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer"'
    );
}

export function readingMinutes(markdown: string, locale: Locale): number {
  const text = markdown.replace(/[#>*_`|[\]()-]/g, ' ');
  const units =
    locale === 'zh'
      ? (text.match(/[㐀-鿿]/g) ?? []).length / 400
      : text.split(/\s+/).filter(Boolean).length / 200;
  return Math.max(1, Math.round(units));
}

export function parseArticle(
  source: string,
  entry: InsightEntry,
  locale: Locale
): Article {
  const { data, body } = parseFrontMatter(source);
  const file = `${entry.slug}/${locale}.md`;
  if (!data.title) throw new Error(`${file}: missing title`);
  if (!data.description) throw new Error(`${file}: missing description`);
  return {
    slug: entry.slug,
    locale,
    title: data.title,
    description: data.description,
    category: entry.category,
    updated: entry.updated,
    readingMinutes: readingMinutes(body, locale),
    html: renderMarkdown(body),
  };
}

export function getArticle(slug: string, locale: Locale): Article | null {
  const entry = findInsight(slug);
  if (!entry || !entry.locales.includes(locale)) return null;
  const file = articlePath(slug, locale);
  if (!existsSync(file)) return null;
  return parseArticle(readFileSync(file, 'utf8'), entry, locale);
}

/** Cards for the index; articles without this language fall back to ru. */
export function listArticles(locale: Locale): ArticleCard[] {
  return INSIGHTS.flatMap((entry) => {
    const article =
      getArticle(entry.slug, locale) ??
      getArticle(entry.slug, INSIGHT_FALLBACK_LOCALE);
    if (!article) return [];
    const { html: _html, ...card } = article;
    return [card];
  });
}
```

Если ESLint ругается на `_html` (`no-unused-vars`), заменить деструктуризацию явным объектом-карточкой из тех же полей.

- [ ] **Step 10: Запустить тесты — должны пройти**

Run: `npx jest src/__tests__/lib/insights --coverage=false`
Expected: PASS. Если падает `SyntaxError: Cannot use import statement outside a module` из `node_modules/marked`, проверить Step 1: `transpilePackages` в `next.config.mjs` и `uuid|marked` в `jest.config.ts` нужны вместе.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json next.config.mjs jest.config.ts \
  src/lib/insights/front-matter.ts src/lib/insights/registry.ts src/lib/insights/content.ts \
  src/__tests__/lib/insights/front-matter.test.ts src/__tests__/lib/insights/content.test.ts
git commit -m "feat(insights): markdown content engine and guide registry"
```

---

### Task 2: SEO-помощники — hreflang по языкам, Article JSON-LD, sitemap

**Files:**

- Modify:
  - `src/lib/seo/metadata.ts`
  - `src/app/sitemap.ts`
- Create:
  - `src/lib/seo/article-jsonld.ts`
  - `src/__tests__/lib/seo/article-seo.test.ts`
- Modify test: `src/__tests__/app/robots-sitemap.test.ts`

**Interfaces:**

- Consumes: `INSIGHTS`, `InsightEntry` (Task 1).
- Produces:
  - `buildLanguageAlternates(path: string, locales?: readonly Locale[]): Record<string, string>`.
  - `PageMetadataInput.locales?: readonly Locale[]`, `PageMetadataInput.article?: { published: string; modified: string }`.
  - `breadcrumbJsonLd(items: { name: string; url: string }[])`.
  - `articleJsonLd(input: { slug: string; locale: Locale; title: string; description: string; published: string; updated: string }): { article: object; breadcrumb: object }`.

- [ ] **Step 1: Написать падающие тесты**

`src/__tests__/lib/seo/article-seo.test.ts`:

```ts
import {
  buildLanguageAlternates,
  buildPageMetadata,
} from '@/lib/seo/metadata';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo/article-jsonld';

describe('buildLanguageAlternates', () => {
  it('limits hreflang to the given locales, x-default → ru', () => {
    expect(buildLanguageAlternates('/insights/x', ['ru', 'en', 'zh'])).toEqual(
      {
        ru: 'https://qaznedr.kz/ru/insights/x',
        en: 'https://qaznedr.kz/en/insights/x',
        'zh-CN': 'https://qaznedr.kz/zh/insights/x',
        'x-default': 'https://qaznedr.kz/ru/insights/x',
      }
    );
  });

  it('still covers every locale by default', () => {
    expect(Object.keys(buildLanguageAlternates('/faq'))).toEqual([
      'ru',
      'kk',
      'en',
      'zh-CN',
      'x-default',
    ]);
  });
});

describe('buildPageMetadata for an article', () => {
  const meta = buildPageMetadata({
    locale: 'zh',
    path: '/insights/x',
    title: '标题',
    description: '描述',
    locales: ['ru', 'en', 'zh'],
    article: { published: '2026-09-26', modified: '2026-09-27' },
  });

  it('marks og:type article with dates', () => {
    expect(meta.openGraph).toMatchObject({
      type: 'article',
      publishedTime: '2026-09-26',
      modifiedTime: '2026-09-27',
      locale: 'zh_CN',
    });
  });

  it('has no kk alternate', () => {
    expect(meta.alternates?.languages).not.toHaveProperty('kk');
    expect(meta.alternates?.canonical).toBe('https://qaznedr.kz/zh/insights/x');
  });
});

describe('articleJsonLd', () => {
  const { article, breadcrumb } = articleJsonLd({
    slug: 'x',
    locale: 'en',
    title: 'Title',
    description: 'Desc',
    published: '2026-09-26',
    updated: '2026-09-27',
  });

  it('describes an Article by the holding', () => {
    expect(article).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Title',
      description: 'Desc',
      inLanguage: 'en',
      datePublished: '2026-09-26',
      dateModified: '2026-09-27',
      mainEntityOfPage: 'https://qaznedr.kz/en/insights/x',
      isAccessibleForFree: true,
      author: { '@type': 'Organization', name: 'QAZNEDR HOLDING' },
      publisher: { '@type': 'Organization', name: 'QAZNEDR HOLDING' },
    });
  });

  it('builds home → guides → article breadcrumbs', () => {
    expect(breadcrumb).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { position: 1, item: 'https://qaznedr.kz/en' },
        { position: 2, item: 'https://qaznedr.kz/en/insights' },
        { position: 3, name: 'Title', item: 'https://qaznedr.kz/en/insights/x' },
      ],
    });
  });
});

describe('breadcrumbJsonLd', () => {
  it('numbers items from 1', () => {
    expect(
      breadcrumbJsonLd([{ name: 'A', url: 'https://qaznedr.kz/ru' }])
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'A',
          item: 'https://qaznedr.kz/ru',
        },
      ],
    });
  });
});
```

В `src/__tests__/app/robots-sitemap.test.ts`, в тесте `lists public pages and lead teasers…`, после `expect(urls).toContain('https://qaznedr.kz/en/contact');` добавить:

```ts
    expect(urls).toContain('https://qaznedr.kz/kz/insights');
    expect(urls).toContain(
      'https://qaznedr.kz/zh/insights/reserve-classification-gkz-kazrc-jorc-gbt17766'
    );
    expect(urls).not.toContain(
      'https://qaznedr.kz/kz/insights/reserve-classification-gkz-kazrc-jorc-gbt17766'
    );
    expect(urls.some((u) => /\/(blog|education|knowledge|news)$/.test(u))).toBe(
      false
    );
```

и новый тест в том же `describe('sitemap')`:

```ts
  it('gives guides hreflang only for their languages', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('down')) as unknown as typeof fetch;
    const entry = (await sitemap()).find(
      (e) =>
        e.url ===
        'https://qaznedr.kz/en/insights/foreign-investor-subsoil-rights-kazakhstan'
    );
    expect(Object.keys(entry?.alternates?.languages ?? {})).toEqual([
      'ru',
      'en',
      'zh-CN',
      'x-default',
    ]);
  });
```

- [ ] **Step 2: Запустить — должны упасть**

Run: `npx jest src/__tests__/lib/seo/article-seo.test.ts src/__tests__/app/robots-sitemap.test.ts --coverage=false`
Expected: FAIL — нет модуля `article-jsonld`, в sitemap нет `/insights`.

- [ ] **Step 3: Расширить `metadata.ts`**

Заменить `buildLanguageAlternates` на:

```ts
export function buildLanguageAlternates(
  path: string,
  locales: readonly Locale[] = LOCALES
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[HREFLANG[l]] = localeUrl(l, path);
  languages['x-default'] = localeUrl(
    locales.includes('ru') ? 'ru' : locales[0],
    path
  );
  return languages;
}
```

В `PageMetadataInput` добавить:

```ts
  /** Languages the page exists in (hreflang). Defaults to every locale. */
  locales?: readonly Locale[];
  /** ISO dates of an article; switches og:type to "article". */
  article?: { published: string; modified: string };
```

В `buildPageMetadata`:

- `languages: buildLanguageAlternates(input.path),` заменить на `languages: buildLanguageAlternates(input.path, input.locales),`;
- блок `openGraph: {…}` заменить на:

```ts
    openGraph: input.article
      ? {
          ...openGraph,
          type: 'article',
          publishedTime: input.article.published,
          modifiedTime: input.article.modified,
        }
      : { ...openGraph, type: 'website' },
```

и перед `return` объявить:

```ts
  const openGraph = {
    title: fullTitle,
    description: input.description,
    url,
    siteName: SITE_NAME,
    locale: OG_LOCALE[input.locale],
  };
```

- [ ] **Step 4: Создать `article-jsonld.ts`**

`src/lib/seo/article-jsonld.ts`:

```ts
import { translate } from '@/lib/i18n/translations';
import { HREFLANG, SITE_NAME, SITE_URL, localeUrl, type Locale } from './site';

const HOLDING = { '@type': 'Organization', name: SITE_NAME, url: SITE_URL };

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function insightsBreadcrumb(locale: Locale) {
  return [
    { name: translate(locale, 'navigation.home'), url: localeUrl(locale) },
    {
      name: translate(locale, 'insights.breadcrumb'),
      url: localeUrl(locale, '/insights'),
    },
  ];
}

export interface ArticleJsonLdInput {
  slug: string;
  locale: Locale;
  title: string;
  description: string;
  published: string;
  updated: string;
}

export function articleJsonLd(input: ArticleJsonLdInput) {
  const url = localeUrl(input.locale, `/insights/${input.slug}`);
  return {
    article: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: input.title,
      description: input.description,
      inLanguage: HREFLANG[input.locale],
      datePublished: input.published,
      dateModified: input.updated,
      mainEntityOfPage: url,
      url,
      isAccessibleForFree: true,
      author: HOLDING,
      publisher: HOLDING,
    },
    breadcrumb: breadcrumbJsonLd([
      ...insightsBreadcrumb(input.locale),
      { name: input.title, url },
    ]),
  };
}
```

`insights.breadcrumb` появится в переводах в Task 4. До тех пор `translate` вернёт сам ключ — тесты Task 2 проверяют только `item`, а не `name`, у первых двух крошек.

- [ ] **Step 5: Sitemap**

В `src/app/sitemap.ts` добавить импорт `import { INSIGHTS } from '@/lib/insights/registry';`, а перед `let leadEntries` вставить:

```ts
  const insightEntries: MetadataRoute.Sitemap = INSIGHTS.flatMap((entry) => {
    const path = `/insights/${entry.slug}`;
    return entry.locales.map((locale) => ({
      url: localeUrl(locale, path),
      lastModified: new Date(entry.updated),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      alternates: { languages: buildLanguageAlternates(path, entry.locales) },
    }));
  });
```

и вернуть `return [...staticEntries, ...insightEntries, ...leadEntries];`. `/insights` в `PUBLIC_PAGES` добавит Task 3.

- [ ] **Step 6: Запустить — `article-seo` должен пройти, sitemap — частично**

Run: `npx jest src/__tests__/lib/seo src/__tests__/app/robots-sitemap.test.ts --coverage=false`
Expected:

- `article-seo.test.ts` и `metadata.test.ts` проходят.
- В `robots-sitemap` пока падают только ожидания `https://qaznedr.kz/kz/insights` и отсутствие `/blog`: их чинит Task 3.

- [ ] **Step 7: Commit**

```bash
git add src/lib/seo/metadata.ts src/lib/seo/article-jsonld.ts src/app/sitemap.ts \
  src/__tests__/lib/seo/article-seo.test.ts src/__tests__/app/robots-sitemap.test.ts
git commit -m "feat(seo): per-locale hreflang, Article JSON-LD, guides in sitemap"
```

---

### Task 3: Маршрутизация — редиректы старых разделов и языковой фолбэк

**Files:**

- Create: `src/lib/insights/routing.ts`
- Modify:
  - `src/lib/seo/pages.ts`
  - `src/middleware.ts`
  - `src/__tests__/lib/seo/pages.test.ts`
  - `src/__tests__/middleware.test.ts`
  - `src/__tests__/lib/i18n/holding-keys.test.ts`
  - `src/lib/i18n/translations.ts` (удалить `seo.blog|education|knowledge|news` в 4 языках)
- Delete: `src/app/[locale]/blog/`, `src/app/[locale]/education/`, `src/app/[locale]/knowledge/`, `src/app/[locale]/news/`

**Interfaces:**

- Consumes: `findInsight`, `INSIGHT_FALLBACK_LOCALE` (Task 1).
- Produces: `insightLocaleRedirect(pathname: string): string | null`.

- [ ] **Step 1: Падающие тесты**

В `src/__tests__/lib/seo/pages.test.ts` добавить в конец:

```ts
describe('session 3: content sections merged into /insights', () => {
  it.each([
    ['/ru/blog', '/ru/insights'],
    ['/en/blog/2', '/en/insights'],
    ['/zh/education', '/zh/insights'],
    ['/kz/knowledge', '/kz/insights'],
    ['/ru/news/kazakhstan-gold', '/ru/insights'],
  ])('%s → %s', (from, to) => {
    expect(hiddenRouteRedirect(from)).toBe(to);
  });

  it('lists /insights, not the old sections', () => {
    expect(PUBLIC_PAGES).toContain('/insights');
    for (const old of ['/blog', '/education', '/knowledge', '/news']) {
      expect(PUBLIC_PAGES).not.toContain(old);
    }
    expect(hiddenRouteRedirect('/ru/insights')).toBeNull();
    expect(hiddenRouteRedirect('/ru/insights/x')).toBeNull();
  });
});
```

В `src/__tests__/middleware.test.ts` добавить в конец:

```ts
describe('guides without a translation', () => {
  const slug = 'foreign-investor-subsoil-rights-kazakhstan';

  it('sends kz readers to the ru version with 308', () => {
    const res = middleware(
      new NextRequest(`https://qaznedr.kz/kz/insights/${slug}`)
    );
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe(
      `https://qaznedr.kz/ru/insights/${slug}`
    );
  });

  it('serves written languages, the index and unknown slugs as is', () => {
    for (const p of [
      `/zh/insights/${slug}`,
      `/ru/insights/${slug}`,
      '/kz/insights',
      '/kz/insights/unknown-guide',
    ]) {
      const res = middleware(new NextRequest(`https://qaznedr.kz${p}`));
      expect(res.headers.get('location')).toBeNull();
    }
  });
});
```

В `src/__tests__/lib/i18n/holding-keys.test.ts` в `SEO_PAGES` заменить строки `'blog', 'education', 'knowledge', 'news',` на `'insights',`.

- [ ] **Step 2: Запустить — должны упасть**

Run: `npx jest src/__tests__/lib/seo/pages.test.ts src/__tests__/middleware.test.ts --coverage=false`
Expected: FAIL — `/ru/blog` не редиректится, `/kz/insights/<slug>` пропускается.

- [ ] **Step 3: `routing.ts`**

`src/lib/insights/routing.ts`:

```ts
import { INSIGHT_FALLBACK_LOCALE, findInsight } from './registry';

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
  return `/${INSIGHT_FALLBACK_LOCALE}/insights/${slug}`;
}
```

- [ ] **Step 4: `pages.ts` и middleware**

В `src/lib/seo/pages.ts`:

- в `PUBLIC_PAGES` заменить `'/blog', '/education', '/knowledge', '/news',` на `'/insights',`;
- в конец `HIDDEN_ROUTE_REDIRECTS` добавить:

```ts
    // Session 3: invented blog/news/courses replaced by the guides section.
    ['/blog', '/insights'],
    ['/education', '/insights'],
    ['/knowledge', '/insights'],
    ['/news', '/insights'],
```

`src/middleware.ts` целиком:

```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hiddenRouteRedirect } from '@/lib/seo/pages';
import { insightLocaleRedirect } from '@/lib/insights/routing';

// Must live in src/ (the app is in src/app); Next.js ignores a root middleware.ts.
// Security headers come from next.config.mjs and vercel.json, not from here.
export function middleware(request: NextRequest) {
  // Legacy marketplace routes hidden after the holding pivot, and guides
  // opened in a language they are not written in → permanent redirect.
  const { pathname } = request.nextUrl;
  const target = hiddenRouteRedirect(pathname) ?? insightLocaleRedirect(pathname);
  if (target) {
    return NextResponse.redirect(new URL(target, request.url), 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/(ru|kz|en|zh)/:path*'],
};
```

- [ ] **Step 5: Удалить старые разделы и их SEO-ключи**

```bash
git rm -r -q "src/app/[locale]/blog" "src/app/[locale]/education" "src/app/[locale]/knowledge" "src/app/[locale]/news"
grep -rn "seo\.\(blog\|education\|knowledge\|news\)" src | grep -v __tests__
```

Expected: grep пуст. Затем в `src/lib/i18n/translations.ts` в каждом из 4 блоков `seo: {…}` (ru ~стр. 67, kz ~797, en ~1455, zh — найти `grep -n "      blog: {" src/lib/i18n/translations.ts`) удалить вложенные объекты `blog`, `education`, `knowledge`, `news` целиком. Остальные ключи с этими словами (`navigation.blog`, `services.knowledge.*`, `breadcrumbs.*`) не трогать: их заменит или отвяжет Task 6.

- [ ] **Step 6: Запустить — должны пройти**

Run: `npx jest src/__tests__/lib/seo src/__tests__/middleware.test.ts src/__tests__/app src/__tests__/lib/i18n --coverage=false`
Expected:

- `pages`, `middleware` и `robots-sitemap` проходят.
- `holding-keys` падает только на `seo.insights.*`: ключей ещё нет ни в одном языке, их добавит Task 4. Это ожидаемо.
- `no-hidden-links.test.ts` падает на `app/[locale]/services/page.tsx → /ru/knowledge` и `/ru/news` и на `Navigation.tsx → /blog`. Это тоже ожидаемо, чинит Task 6.

- [ ] **Step 7: Commit**

```bash
git add src/lib/insights/routing.ts src/lib/seo/pages.ts src/middleware.ts src/lib/i18n/translations.ts \
  src/__tests__/lib/seo/pages.test.ts src/__tests__/middleware.test.ts src/__tests__/lib/i18n/holding-keys.test.ts
git commit -m "feat(insights): 308 old blog/news/courses to /insights, ru fallback for untranslated guides"
```

---

### Task 4: Страницы `/insights` и статьи, переводы интерфейса, стили текста

**Files:**

- Create:
  - `src/app/[locale]/insights/page.tsx`
  - `src/app/[locale]/insights/[slug]/page.tsx`
  - `src/components/features/ClosingCta.tsx`
  - `src/__tests__/lib/i18n/insights-keys.test.ts`
- Modify:
  - `src/lib/i18n/translations.ts` (namespace `insights`, `seo.insights`, `navigation.insights` в 4 языках);
  - `src/styles/globals.css`.

**Interfaces:**

- Consumes: `getArticle`, `listArticles`, `Article`, `ArticleCard` (Task 1); `INSIGHTS`, `findInsight` (Task 1); `buildPageMetadata`, `buildTranslatedPageMetadata`, `articleJsonLd`, `breadcrumbJsonLd`, `insightsBreadcrumb` (Task 2); `formatCheckDate(value, locale)` из `src/lib/leads/check-date.ts` (форматирует ISO-дату по языку: `26.09.2026` / `26 September 2026` / `2026年9月26日`).
- Produces:
  - `<ClosingCta locale={string} />`;
  - ключи `insights.{eyebrow,title,subtitle,breadcrumb,updated,readingTime,legalNote,otherGuides,onlyRu,ctaTitle,ctaText,ctaLeads,ctaContact,servicesHeading,faqHeading}`;
  - `insights.categories.{law,licensing,geology}`;
  - `insights.links.{foreignInvestor,explorationLicence,reserveClassification,rightsTransfer}`;
  - `insights.summaries.{…те же 4…}`;
  - `navigation.insights`, `seo.insights.{title,description}`.

- [ ] **Step 1: Падающий тест переводов (без фолбэка на ru)**

`src/__tests__/lib/i18n/insights-keys.test.ts`:

```ts
import { translations } from '@/lib/i18n/translations';
import { GUIDE_KEYS } from '@/lib/insights/registry';

const KEYS = [
  'seo.insights.title',
  'seo.insights.description',
  'navigation.insights',
  ...[
    'eyebrow',
    'title',
    'subtitle',
    'breadcrumb',
    'updated',
    'readingTime',
    'legalNote',
    'otherGuides',
    'onlyRu',
    'ctaTitle',
    'ctaText',
    'ctaLeads',
    'ctaContact',
    'servicesHeading',
    'faqHeading',
  ].map((k) => `insights.${k}`),
  ...['law', 'licensing', 'geology'].map((k) => `insights.categories.${k}`),
  ...GUIDE_KEYS.flatMap((k) => [
    `insights.links.${k}`,
    `insights.summaries.${k}`,
  ]),
];

function own(dict: unknown, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object'
          ? (node as Record<string, unknown>)[part]
          : undefined,
      dict
    );
}

describe.each(['ru', 'kz', 'en', 'zh'] as const)('%s insights copy', (locale) => {
  it.each(KEYS)('%s is translated in this locale', (key) => {
    const value = own(translations[locale], key);
    expect(typeof value).toBe('string');
    expect((value as string).length).toBeGreaterThan(0);
  });

  it('keeps placeholders in parametrised strings', () => {
    expect(own(translations[locale], 'insights.readingTime')).toMatch(/\{n\}/);
    expect(own(translations[locale], 'insights.legalNote')).toMatch(/\{date\}/);
  });
});
```

- [ ] **Step 2: Запустить — должен упасть**

Run: `npx jest src/__tests__/lib/i18n/insights-keys.test.ts --coverage=false`
Expected: FAIL — ключей нет.

- [ ] **Step 3: Переводы**

В `src/lib/i18n/translations.ts`, в каждом языке:

- в `seo` добавить объект `insights`;
- в `navigation` — ключ `insights`;
- на верхний уровень языка добавить namespace `insights`.

Тексты — ниже, дословно.

**ru**

```ts
      // seo:
      insights: {
        title: 'Гайды для инвестора: недропользование в Казахстане',
        description:
          'Как иностранному инвестору получить право недропользования в Казахстане, лицензия на разведку, классификации запасов и сделки с правом — со ссылками на закон.',
      },
      // navigation:
      insights: 'Гайды',
    // top level:
    insights: {
      eyebrow: 'Гайды',
      title: 'Гайды для инвестора',
      subtitle:
        'Право недропользования, лицензирование и классификации запасов в Казахстане — коротко и со ссылками на источники.',
      breadcrumb: 'Гайды',
      updated: 'Обновлено',
      readingTime: '{n} мин чтения',
      legalNote:
        'Материал не является юридической консультацией. Нормы приведены по состоянию на {date}; перед сделкой проверьте актуальную редакцию на adilet.zan.kz и проконсультируйтесь с юристом.',
      otherGuides: 'Другие гайды',
      onlyRu: 'Гайды пока доступны на русском, английском и китайском.',
      ctaTitle: 'Готовы обсудить участок?',
      ctaText:
        'Посмотрите участки на витрине или напишите нам — ответим в течение рабочего дня.',
      ctaLeads: 'Смотреть участки',
      ctaContact: 'Связаться',
      servicesHeading: 'Гайды по лицензированию и сделкам',
      faqHeading: 'Подробные гайды',
      categories: {
        law: 'Право',
        licensing: 'Лицензирование',
        geology: 'Геология',
      },
      links: {
        foreignInvestor:
          'Как иностранному инвестору получить право недропользования',
        explorationLicence: 'Лицензия на разведку ТПИ: процесс по шагам',
        reserveClassification:
          'Классификации запасов: ГКЗ, KAZRC/JORC, GB/T 17766',
        rightsTransfer: 'Сделки с правом недропользования: разрешение на переход',
      },
      summaries: {
        foreignInvestor:
          'Кто может стать недропользователем и три пути входа: новая лицензия, покупка права или доли, совместное предприятие.',
        explorationLicence:
          'Заявление, блоки, сроки, обязательства и переход к добыче.',
        reserveClassification:
          'Как соотносятся категории ГКЗ, KAZRC/JORC и китайского GB/T 17766 — и где прямого соответствия нет.',
        rightsTransfer:
          'Какие сделки требуют разрешения на переход права и что изменилось с 7 сентября 2026 года.',
      },
    },
```

**kz**

```ts
      // seo:
      insights: {
        title: 'Инвесторға арналған нұсқаулықтар: Қазақстандағы жер қойнауын пайдалану',
        description:
          'Шетелдік инвестор Қазақстанда жер қойнауын пайдалану құқығын қалай алады, барлау лицензиясы, қор жіктемелері және құқықпен мәмілелер — заңға сілтемелермен.',
      },
      // navigation:
      insights: 'Нұсқаулықтар',
    // top level:
    insights: {
      eyebrow: 'Нұсқаулықтар',
      title: 'Инвесторға арналған нұсқаулықтар',
      subtitle:
        'Қазақстандағы жер қойнауын пайдалану құқығы, лицензиялау және қор жіктемелері — қысқа әрі дереккөздерге сілтемелермен.',
      breadcrumb: 'Нұсқаулықтар',
      updated: 'Жаңартылды',
      readingTime: '{n} мин оқу',
      legalNote:
        'Бұл материал заң кеңесі емес. Нормалар {date} жағдайы бойынша келтірілген; мәміле алдында adilet.zan.kz сайтындағы өзекті редакцияны тексеріп, заңгермен кеңесіңіз.',
      otherGuides: 'Басқа нұсқаулықтар',
      onlyRu:
        'Нұсқаулықтар әзірге орыс, ағылшын және қытай тілдерінде қолжетімді.',
      ctaTitle: 'Учаскені талқылауға дайынсыз ба?',
      ctaText:
        'Витринадағы учаскелерді қараңыз немесе бізге жазыңыз — жұмыс күні ішінде жауап береміз.',
      ctaLeads: 'Учаскелерді қарау',
      ctaContact: 'Байланысу',
      servicesHeading: 'Лицензиялау және мәмілелер бойынша нұсқаулықтар',
      faqHeading: 'Толық нұсқаулықтар',
      categories: {
        law: 'Құқық',
        licensing: 'Лицензиялау',
        geology: 'Геология',
      },
      links: {
        foreignInvestor:
          'Шетелдік инвесторға жер қойнауын пайдалану құқығы',
        explorationLicence: 'Қатты пайдалы қазбаларды барлау лицензиясы: қадамдар',
        reserveClassification:
          'Қор жіктемелері: ГКЗ, KAZRC/JORC, GB/T 17766',
        rightsTransfer:
          'Жер қойнауын пайдалану құқығымен мәмілелер: өтуге рұқсат',
      },
      summaries: {
        foreignInvestor:
          'Кім жер қойнауын пайдаланушы бола алады және кірудің үш жолы: жаңа лицензия, құқықты не үлесті сатып алу, бірлескен кәсіпорын.',
        explorationLicence:
          'Өтініш, блоктар, мерзімдер, міндеттемелер және өндіруге көшу.',
        reserveClassification:
          'ГКЗ, KAZRC/JORC және қытайлық GB/T 17766 санаттары қалай сәйкеседі — және қай жерде тікелей сәйкестік жоқ.',
        rightsTransfer:
          'Қандай мәмілелерге құқықтың өтуіне рұқсат керек және 2026 жылғы 7 қыркүйектен бастап не өзгерді.',
      },
    },
```

**en**

```ts
      // seo:
      insights: {
        title: 'Guides for investors: subsoil use in Kazakhstan',
        description:
          'How a foreign investor acquires subsoil use rights in Kazakhstan, the exploration licence, reserve classifications and rights transfers — with links to the law.',
      },
      // navigation:
      insights: 'Guides',
    // top level:
    insights: {
      eyebrow: 'Guides',
      title: 'Guides for investors',
      subtitle:
        'Subsoil use rights, licensing and reserve classifications in Kazakhstan — briefly, with links to the sources.',
      breadcrumb: 'Guides',
      updated: 'Updated',
      readingTime: '{n} min read',
      legalNote:
        'This is not legal advice. Rules are stated as of {date}; before a transaction, check the current wording on adilet.zan.kz and consult a lawyer.',
      otherGuides: 'More guides',
      onlyRu: 'Guides are available in Russian, English and Chinese.',
      ctaTitle: 'Ready to discuss an area?',
      ctaText:
        'Browse the areas we have prepared or message us — we reply within one business day.',
      ctaLeads: 'View areas',
      ctaContact: 'Contact us',
      servicesHeading: 'Guides on licensing and transactions',
      faqHeading: 'In-depth guides',
      categories: {
        law: 'Law',
        licensing: 'Licensing',
        geology: 'Geology',
      },
      links: {
        foreignInvestor: 'Subsoil use rights for foreign investors',
        explorationLicence: 'Solid-minerals exploration licence, step by step',
        reserveClassification:
          'Reserve classifications: GKZ, KAZRC/JORC, GB/T 17766',
        rightsTransfer: 'Subsoil rights transactions: transfer permission',
      },
      summaries: {
        foreignInvestor:
          'Who can hold subsoil use rights and three ways in: a new licence, buying a right or a stake, a joint venture.',
        explorationLicence:
          'Application, blocks, terms, obligations and the move to mining.',
        reserveClassification:
          "How GKZ, KAZRC/JORC and China's GB/T 17766 categories compare — and where there is no direct match.",
        rightsTransfer:
          'Which transactions need a transfer permission and what changed on 7 September 2026.',
      },
    },
```

**zh**

```ts
      // seo:
      insights: {
        title: '哈萨克斯坦矿业投资指南：矿业权、勘查许可证与储量分类',
        description:
          '外国投资者如何在哈萨克斯坦取得矿业权、固体矿产勘查许可证流程、储量分类对照及矿业权转让许可——附法律原文链接。',
      },
      // navigation:
      insights: '指南',
    // top level:
    insights: {
      eyebrow: '投资指南',
      title: '投资者指南',
      subtitle:
        '哈萨克斯坦矿业权、许可证办理与储量分类——简明扼要，并附资料来源。',
      breadcrumb: '指南',
      updated: '更新于',
      readingTime: '阅读约{n}分钟',
      legalNote:
        '本文不构成法律意见。相关规定以{date}为准；交易前请在 adilet.zan.kz 核对现行版本并咨询律师。',
      otherGuides: '更多指南',
      onlyRu: '指南目前提供俄文、英文和中文版本。',
      ctaTitle: '想进一步了解矿区？',
      ctaText: '查看我们准备好的矿区，或直接联系我们——一个工作日内回复。',
      ctaLeads: '查看矿区',
      ctaContact: '联系我们',
      servicesHeading: '许可证与交易指南',
      faqHeading: '详细指南',
      categories: {
        law: '法律',
        licensing: '许可证',
        geology: '地质',
      },
      links: {
        foreignInvestor: '外国投资者如何在哈萨克斯坦取得矿业权',
        explorationLicence: '固体矿产勘查许可证：办理流程',
        reserveClassification: '储量分类对照：GKZ、KAZRC/JORC、GB/T 17766',
        rightsTransfer: '矿业权交易：转让许可',
      },
      summaries: {
        foreignInvestor:
          '谁可以成为矿业权人，以及三种进入方式：申请新许可证、收购矿业权或股权、成立合资企业。',
        explorationLicence: '申请、区块、期限、义务及转入开采。',
        reserveClassification:
          'GKZ、KAZRC/JORC 与中国 GB/T 17766 分类如何对应，以及哪些无法直接对应。',
        rightsTransfer: '哪些交易需要转让许可，以及2026年9月7日起的变化。',
      },
    },
```

- [ ] **Step 4: Запустить тест переводов — должен пройти**

Run: `npx jest src/__tests__/lib/i18n --coverage=false`
Expected: `insights-keys` и `holding-keys` PASS. `copy-qualifiers` PASS: новые тексты не содержат «свободен».

- [ ] **Step 5: Стили текста статьи**

В конец `src/styles/globals.css` добавить:

```css
/* Guide body rendered from markdown (/insights/[slug]). */
@layer components {
  .insight-prose {
    @apply text-base leading-relaxed text-gray-700 dark:text-gray-300;
  }
  .insight-prose > * + * {
    @apply mt-5;
  }
  .insight-prose h2 {
    @apply mt-12 font-serif text-3xl font-light tracking-tight text-gray-900 dark:text-gray-50;
  }
  .insight-prose h3 {
    @apply mt-8 font-serif text-2xl text-gray-900 dark:text-gray-50;
  }
  .insight-prose a {
    @apply text-gray-900 underline decoration-gold underline-offset-4 transition-colors duration-150 hover:decoration-gold-dark dark:text-gray-100;
  }
  .insight-prose strong {
    @apply font-semibold text-gray-900 dark:text-gray-100;
  }
  .insight-prose ul {
    @apply list-disc space-y-2 pl-6;
  }
  .insight-prose ol {
    @apply list-decimal space-y-2 pl-6;
  }
  .insight-prose blockquote {
    @apply border-l-2 border-gold pl-5 text-gray-600 dark:text-gray-400;
  }
  .insight-table {
    @apply -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0;
  }
  .insight-prose table {
    @apply w-full min-w-[560px] border-collapse text-sm;
  }
  .insight-prose th {
    @apply border-b border-gray-300 py-2 pr-4 text-left align-bottom font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100;
  }
  .insight-prose td {
    @apply border-b border-gray-100 py-2 pr-4 align-top dark:border-gray-800;
  }
}
```

- [ ] **Step 6: `ClosingCta`**

`src/components/features/ClosingCta.tsx`:

```tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';

/** Closing dark band: view the areas or contact us. Hook-free (RSC-safe). */
export default function ClosingCta({ locale }: { locale: string }) {
  const t = (key: string) => translate(locale, key);
  return (
    <section className="bg-[#0A0A0A] text-white border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-left">
        <h2 className="font-serif text-3xl lg:text-4xl font-light tracking-tight text-white">
          {t('insights.ctaTitle')}
        </h2>
        <p className="mt-4 text-gray-400 max-w-xl">{t('insights.ctaText')}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/leads`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-50 text-gray-900 text-sm font-semibold shadow-subtle hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200"
          >
            {t('insights.ctaLeads')}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/5 transition-colors duration-150"
          >
            {t('insights.ctaContact')}
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Список `/insights`**

`src/app/[locale]/insights/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import ClosingCta from '@/components/features/ClosingCta';
import { getServerTranslation } from '@/lib/i18n/translations';
import { listArticles } from '@/lib/insights/content';
import { formatCheckDate } from '@/lib/leads/check-date';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';
import {
  breadcrumbJsonLd,
  insightsBreadcrumb,
} from '@/lib/seo/article-jsonld';
import { HREFLANG, toLocale } from '@/lib/seo/site';

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, '/insights', 'insights');
}

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = toLocale((await params).locale);
  const { t } = getServerTranslation(locale);
  const cards = listArticles(locale);
  const fallback = cards.some((card) => card.locale !== locale);
  const breadcrumb = breadcrumbJsonLd(insightsBreadcrumb(locale));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c'),
        }}
      />
      <Navigation />
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-20 lg:pt-24">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 lg:pt-16 lg:pb-16 border-b border-gray-100 dark:border-gray-800">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-dark dark:text-gold-light">
              {t('insights.eyebrow')}
            </span>
          </div>
          <h1 className="font-serif font-light text-4xl lg:text-5xl tracking-tight text-gray-900 dark:text-gray-50 leading-[1.05]">
            {t('insights.title')}
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            {t('insights.subtitle')}
          </p>
          {fallback && (
            <p className="mt-4 text-sm text-gray-500">{t('insights.onlyRu')}</p>
          )}
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <ul className="space-y-5">
            {cards.map((card) => (
              <li key={card.slug}>
                <Link
                  href={`/${card.locale}/insights/${card.slug}`}
                  lang={
                    card.locale === locale ? undefined : HREFLANG[card.locale]
                  }
                  className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] p-6 shadow-subtle hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold-dark dark:text-gold-light">
                    {t(`insights.categories.${card.category}`)}
                  </span>
                  <h2 className="mt-3 font-serif text-2xl tracking-tight text-gray-900 dark:text-gray-50">
                    {card.title}
                  </h2>
                  <p className="mt-3 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {card.description}
                  </p>
                  <p className="mt-4 text-sm text-gray-500">
                    {t('insights.updated')}{' '}
                    {formatCheckDate(card.updated, locale)} ·{' '}
                    {t('insights.readingTime', { n: card.readingMinutes })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <ClosingCta locale={locale} />
      </div>
      <Footer />
    </>
  );
}
```

Карточка статьи-фолбэка (kz → ru) получает `lang` своего текста, чтобы экранные дикторы читали её по-русски.

- [ ] **Step 8: Страница статьи**

`src/app/[locale]/insights/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Scale } from 'lucide-react';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import ClosingCta from '@/components/features/ClosingCta';
import { getServerTranslation } from '@/lib/i18n/translations';
import { getArticle, listArticles } from '@/lib/insights/content';
import { INSIGHTS, findInsight } from '@/lib/insights/registry';
import { formatCheckDate } from '@/lib/leads/check-date';
import { articleJsonLd } from '@/lib/seo/article-jsonld';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { toLocale } from '@/lib/seo/site';

// Only the languages each guide is written in; others are redirected to ru
// by the middleware before they reach this page.
export const dynamicParams = false;

export function generateStaticParams() {
  return INSIGHTS.flatMap((entry) =>
    entry.locales.map((locale) => ({ locale, slug: entry.slug }))
  );
}

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = toLocale(raw);
  const entry = findInsight(slug);
  const article = entry ? getArticle(slug, locale) : null;
  if (!entry || !article) return {};
  return buildPageMetadata({
    locale,
    path: `/insights/${slug}`,
    title: article.title,
    description: article.description,
    locales: entry.locales,
    article: { published: entry.published, modified: entry.updated },
  });
}

export default async function InsightArticlePage({
  params,
}: {
  params: Params;
}) {
  const { locale: raw, slug } = await params;
  const locale = toLocale(raw);
  const entry = findInsight(slug);
  const article = entry ? getArticle(slug, locale) : null;
  if (!entry || !article) notFound();

  const { t } = getServerTranslation(locale);
  const updated = formatCheckDate(entry.updated, locale);
  const others = listArticles(locale).filter((card) => card.slug !== slug);
  const jsonLd = articleJsonLd({
    slug,
    locale,
    title: article.title,
    description: article.description,
    published: entry.published,
    updated: entry.updated,
  });

  return (
    <>
      {[jsonLd.article, jsonLd.breadcrumb].map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data).replace(/</g, '\\u003c'),
          }}
        />
      ))}
      <Navigation />
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-20 lg:pt-24">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 lg:pt-14 lg:pb-20">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500"
          >
            <Link
              href={`/${locale}`}
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-150"
            >
              {t('navigation.home')}
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/${locale}/insights`}
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-150"
            >
              {t('insights.breadcrumb')}
            </Link>
          </nav>

          <div className="mt-8 inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-dark dark:text-gold-light">
              {t(`insights.categories.${entry.category}`)}
            </span>
          </div>
          <h1 className="mt-4 font-serif font-light text-4xl lg:text-5xl tracking-tight text-gray-900 dark:text-gray-50 leading-[1.1]">
            {article.title}
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            {article.description}
          </p>
          <p className="mt-4 text-sm text-gray-500">
            {t('insights.updated')} {updated} ·{' '}
            {t('insights.readingTime', { n: article.readingMinutes })}
          </p>

          {entry.legal && (
            <aside className="mt-8 flex gap-3 rounded-xl border border-gold/40 bg-[rgba(200,162,75,0.05)] p-5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <Scale
                className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold-dark dark:text-gold-light"
                aria-hidden="true"
              />
              <p>{t('insights.legalNote', { date: updated })}</p>
            </aside>
          )}

          <div
            className="insight-prose mt-10"
            dangerouslySetInnerHTML={{ __html: article.html }}
          />
        </article>

        {others.length > 0 && (
          <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-20">
            <h2 className="font-serif text-2xl lg:text-3xl font-light tracking-tight text-gray-900 dark:text-gray-50">
              {t('insights.otherGuides')}
            </h2>
            <ul className="mt-6 divide-y divide-gray-100 dark:divide-gray-800 border-y border-gray-100 dark:border-gray-800">
              {others.map((card) => (
                <li key={card.slug}>
                  <Link
                    href={`/${card.locale}/insights/${card.slug}`}
                    className="block py-4 text-base text-gray-900 dark:text-gray-100 hover:text-gold-dark dark:hover:text-gold-light transition-colors duration-150"
                  >
                    {card.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ClosingCta locale={locale} />
      </div>
      <Footer />
    </>
  );
}
```

- [ ] **Step 9: Проверка типов и линт**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/(app/\[locale\]/insights|lib/insights|lib/seo|components/features/ClosingCta)" ; npx eslint "src/app/[locale]/insights" src/lib/insights src/lib/seo src/components/features/ClosingCta.tsx`
Expected: нет ошибок в новых файлах. Старые ошибки tsc в других файлах, если есть, не наши. Сравнить с `git stash`-базой не нужно — фильтруем по путям.

- [ ] **Step 10: Commit**

```bash
git add "src/app/[locale]/insights" src/components/features/ClosingCta.tsx src/styles/globals.css \
  src/lib/i18n/translations.ts src/__tests__/lib/i18n/insights-keys.test.ts
git commit -m "feat(insights): guides index and article pages, UI copy in 4 languages"
```

---

### Task 5: FAQ на en и zh, ссылки на гайды

**Files:**

- Create:
  - `src/lib/content/faq.ts`
  - `src/components/features/GuideLinks.tsx`
  - `src/__tests__/lib/content/faq.test.ts`
- Modify:
  - `src/app/[locale]/faq/page.tsx`
  - `src/lib/i18n/translations.ts` (namespace `faqPage` в 4 языках)

**Interfaces:**

- Consumes: `GUIDE`, `GUIDE_KEYS`, `GuideKey` (Task 1); `insights.links.*`, `insights.summaries.*`, `insights.faqHeading` (Task 4); `ClosingCta` (Task 4).
- Produces:
  - `interface FaqItem { q: string; a: string }`, `FAQ: Record<'ru' | 'en' | 'zh', readonly FaqItem[]>`;
  - `faqFor(locale: Locale): readonly FaqItem[]`, `faqJsonLd(items: readonly FaqItem[])`;
  - `<GuideLinks locale heading keys? />`;
  - ключи `faqPage.{eyebrow,title,subtitle}`.

- [ ] **Step 1: Падающий тест**

`src/__tests__/lib/content/faq.test.ts`:

```ts
import { FAQ, faqFor, faqJsonLd } from '@/lib/content/faq';
import { translations } from '@/lib/i18n/translations';

describe('FAQ content', () => {
  it('has the same questions in every language', () => {
    expect(FAQ.en).toHaveLength(FAQ.ru.length);
    expect(FAQ.zh).toHaveLength(FAQ.ru.length);
  });

  it('has no Russian left in en and zh', () => {
    for (const item of [...FAQ.en, ...FAQ.zh]) {
      expect(`${item.q} ${item.a}`).not.toMatch(/[А-Яа-яЁё]/);
    }
  });

  it('keeps the copy red lines', () => {
    const all = Object.values(FAQ)
      .flat()
      .map((i) => `${i.q} ${i.a}`)
      .join('\n');
    expect(all).not.toMatch(
      /гарантированн|guaranteed return|保证收益|портфел|portfolio|маркетплейс|marketplace|obtain the licen[cs]e|JORC/i
    );
  });

  it('serves ru to kz until a Kazakh FAQ exists', () => {
    expect(faqFor('kz')).toBe(FAQ.ru);
    expect(faqFor('zh')).toBe(FAQ.zh);
  });

  it('builds FAQPage structured data', () => {
    expect(faqJsonLd([{ q: 'Q?', a: 'A.' }])).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Q?',
          acceptedAnswer: { '@type': 'Answer', text: 'A.' },
        },
      ],
    });
  });

  it.each(['ru', 'kz', 'en', 'zh'] as const)(
    'has page copy in %s',
    (locale) => {
      const page = (translations[locale] as Record<string, unknown>)
        .faqPage as Record<string, string> | undefined;
      for (const key of ['eyebrow', 'title', 'subtitle']) {
        expect(page?.[key]).toBeTruthy();
      }
    }
  );
});
```

- [ ] **Step 2: Запустить — должен упасть**

Run: `npx jest src/__tests__/lib/content/faq.test.ts --coverage=false`
Expected: FAIL — нет модуля `@/lib/content/faq`.

- [ ] **Step 3: `faq.ts`**

`src/lib/content/faq.ts`:

- `FAQ.ru` — 8 пар `{ q, a }`, дословно перенесённые из текущего `src/app/[locale]/faq/page.tsx` (строки 17–50);
- `FAQ.en` и `FAQ.zh` — ниже.

Если исследование в Task 7 уточнит нормы (например, запрет передачи в первый год или номера статей), ответ 6 исправляется во всех трёх языках там же.

```ts
import type { Locale } from '@/lib/seo/site';

export interface FaqItem {
  q: string;
  a: string;
}

const RU: readonly FaqItem[] = [
  /* 8 items moved verbatim from faq/page.tsx */
];

const EN: readonly FaqItem[] = [
  {
    q: 'What does QAZNEDR HOLDING do?',
    a: 'We prepare deals on free ore areas in Kazakhstan: our geologists study an area using geological fund reports, we check its status, prepare the licensing for the specific deal and support the investor. We do not sell archive reports — we sell expertise and deal support.',
  },
  {
    q: 'Who owns the areas on the site?',
    a: 'No one: these are free areas, per our check on the date shown on each card. No one holds a licence for them yet, including us. The licence is applied for under a specific deal.',
  },
  {
    q: 'What deal formats are possible?',
    a: "A licence in the investor's name with our support; a licence on the holding with a later transfer; a joint venture or earn-in; analytics only. We choose the format at a meeting.",
  },
  {
    q: 'Where does the geological data come from?',
    a: 'From Soviet and Kazakh geological fund reports and publications, studied by our geologists. We state reserves only in the categories of the USSR State Reserves Committee (GKZ: A, B, C1, C2) or as a historical estimate. P1–P3 prognostic resources are a forecast, not reserves.',
  },
  {
    q: 'What will I see after the meeting?',
    a: "Once an NDA is signed: the area's name and coordinates, our geologists' assessment, its legal status and a licensing plan.",
  },
  {
    q: 'What restrictions apply to a deal?',
    a: 'A transfer of a subsoil use right or of shares requires permission from the competent authority (Articles 44–45 of the Subsoil Code). A solid-minerals exploration licence cannot be transferred in its first year. We take this into account when choosing the format.',
  },
  {
    q: 'What do you guarantee?',
    a: "The quality of our expertise and that the area's status was checked on the stated date. We do not guarantee returns, exploration results or decisions of government bodies.",
  },
  {
    q: 'How do I get in touch?',
    a: 'Message us on WeChat or WhatsApp with the area code, or leave a request on the contact page. We reply within one business day.',
  },
];

const ZH: readonly FaqItem[] = [
  {
    q: 'QAZNEDR HOLDING 做什么？',
    a: '我们为哈萨克斯坦的空白矿区筹备交易：我们的地质师依据地质资料馆藏报告研究矿区，我们核查其状态，围绕具体交易办理许可证申请，并全程协助投资者。我们不出售档案报告，我们提供的是专业评估与交易服务。',
  },
  {
    q: '网站上的矿区归谁所有？',
    a: '不归任何人所有：根据我们截至卡片所示日期的核查，这些是空白矿区。目前任何人（包括我们）都未持有其许可证。许可证将针对具体交易申请办理。',
  },
  {
    q: '可以采用哪些交易形式？',
    a: '以投资者名义申请许可证，由我们全程协助；许可证先登记在控股公司名下，之后再转让；合资或分阶段投入取得权益（earn-in）；仅提供分析服务。具体形式在会面时商定。',
  },
  {
    q: '地质数据从何而来？',
    a: '来自苏联及哈萨克斯坦的地质资料馆藏报告和公开出版物，由我们的地质师研究整理。储量仅按苏联国家储量委员会（GKZ）类别（A、B、C1、C2）标注，或注明为历史估算。P1–P3预测资源量属于预测，并非储量。',
  },
  {
    q: '会面后我能看到什么？',
    a: '签署保密协议（NDA）后：矿区名称和坐标、我们地质师的评估意见、法律状态以及许可证办理计划。',
  },
  {
    q: '交易有哪些限制？',
    a: '矿业权及股权的转让须经主管机关许可（《底土法》第44–45条）。固体矿产勘查许可证在有效期第一年内不得转让。我们在选择交易形式时会考虑这些规定。',
  },
  {
    q: '你们保证什么？',
    a: '我们保证专业评估的质量，并保证矿区状态已于所注明日期核查。我们不保证收益、勘查结果或政府机关的决定。',
  },
  {
    q: '如何联系？',
    a: '请通过微信或 WhatsApp 联系我们并注明矿区编号，或在联系页面留言。我们在一个工作日内回复。',
  },
];

export const FAQ: Record<'ru' | 'en' | 'zh', readonly FaqItem[]> = {
  ru: RU,
  en: EN,
  zh: ZH,
};

/** kz has no FAQ translation yet and gets ru. */
export function faqFor(locale: Locale): readonly FaqItem[] {
  return locale === 'en' || locale === 'zh' ? FAQ[locale] : FAQ.ru;
}

export function faqJsonLd(items: readonly FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
```

- [ ] **Step 4: Переводы `faqPage`**

Добавить на верхний уровень каждого языка в `translations.ts`:

```ts
    // ru
    faqPage: {
      eyebrow: 'Вопросы и ответы',
      title: 'Коротко о главном',
      subtitle:
        'Как устроена сделка, откуда данные и что мы гарантируем — коротко и без общих фраз.',
    },
    // kz
    faqPage: {
      eyebrow: 'Сұрақ-жауап',
      title: 'Негізгісі қысқаша',
      subtitle:
        'Мәміле қалай құрылады, деректер қайдан алынады және біз нені кепілдендіреміз — қысқа әрі нақты.',
    },
    // en
    faqPage: {
      eyebrow: 'Questions and answers',
      title: 'The essentials',
      subtitle:
        'How a deal works, where the data comes from and what we guarantee — briefly and to the point.',
    },
    // zh
    faqPage: {
      eyebrow: '常见问题',
      title: '要点速览',
      subtitle: '交易如何进行、数据从何而来、我们保证什么——简明扼要。',
    },
```

- [ ] **Step 5: `GuideLinks`**

`src/components/features/GuideLinks.tsx`:

```tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import { GUIDE, GUIDE_KEYS, type GuideKey } from '@/lib/insights/registry';

/** Cards linking to guides. Hook-free, so it renders in RSC and client pages. */
export default function GuideLinks({
  locale,
  heading,
  keys = GUIDE_KEYS,
}: {
  locale: string;
  heading: string;
  keys?: readonly GuideKey[];
}) {
  return (
    <section>
      <h2 className="font-serif text-2xl lg:text-3xl font-light tracking-tight text-gray-900 dark:text-gray-50">
        {heading}
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {keys.map((key) => (
          <li key={key}>
            <Link
              href={`/${locale}/insights/${GUIDE[key]}`}
              className="group block h-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] p-5 shadow-subtle hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="block text-base font-semibold text-gray-900 dark:text-gray-50">
                {translate(locale, `insights.links.${key}`)}
              </span>
              <span className="mt-2 block text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {translate(locale, `insights.summaries.${key}`)}
              </span>
              <ArrowRight
                className="mt-3 w-4 h-4 text-gray-400 group-hover:text-gold-dark transition-colors duration-150"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 6: Переписать страницу FAQ**

`src/app/[locale]/faq/page.tsx` целиком:

```tsx
import type { Metadata } from 'next';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import ClosingCta from '@/components/features/ClosingCta';
import GuideLinks from '@/components/features/GuideLinks';
import { faqFor, faqJsonLd } from '@/lib/content/faq';
import { getServerTranslation } from '@/lib/i18n/translations';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';
import { toLocale } from '@/lib/seo/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, '/faq', 'faq');
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = toLocale((await params).locale);
  const { t } = getServerTranslation(locale);
  const items = faqFor(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd(items)).replace(/</g, '\\u003c'),
        }}
      />
      <Navigation />
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-20 lg:pt-24">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 lg:pt-16 lg:pb-16 border-b border-gray-100 dark:border-gray-800">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-dark dark:text-gold-light">
              {t('faqPage.eyebrow')}
            </span>
          </div>
          <h1 className="font-serif font-light text-4xl lg:text-5xl tracking-tight text-gray-900 dark:text-gray-50 leading-[1.05]">
            {t('faqPage.title')}
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            {t('faqPage.subtitle')}
          </p>
        </section>

        {/* Q&A */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map(({ q, a }) => (
              <div key={q} className="py-8 first:pt-0 last:pb-0">
                <h2 className="font-serif text-2xl text-gray-900 dark:text-gray-50 tracking-tight mb-3">
                  {q}
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  {a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Guides */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-20">
          <GuideLinks locale={locale} heading={t('insights.faqHeading')} />
        </div>

        <ClosingCta locale={locale} />
      </div>
      <Footer />
    </>
  );
}
```

Корневой layout уже оборачивает страницу в `<main id="main">`, поэтому здесь `div`, а не второй `main`. Заодно это исправляет вложенный `main` в старой версии FAQ.

- [ ] **Step 7: Запустить тесты**

Run: `npx jest src/__tests__/lib/content src/__tests__/app/no-hidden-links.test.ts --coverage=false`
Expected:

- `faq.test.ts` проходит.
- `no-hidden-links` падает только на старых ссылках из Task 3 (services, Navigation). Новых нарушений нет.

- [ ] **Step 8: Commit**

```bash
git add src/lib/content/faq.ts src/components/features/GuideLinks.tsx "src/app/[locale]/faq/page.tsx" \
  src/lib/i18n/translations.ts src/__tests__/lib/content/faq.test.ts
git commit -m "feat(faq): English and Chinese FAQ, links to guides"
```

---

### Task 6: Меню, футер, услуги, тизер — ссылки на гайды

**Files:**

- Modify:
  - `src/components/layouts/Navigation.tsx:42`
  - `src/components/layouts/Footer.tsx` (колонка «Компания»)
  - `src/app/[locale]/services/page.tsx` (блок «Knowledge Center»)
  - `src/app/[locale]/services/legal/page.tsx`
  - `src/app/[locale]/leads/[code]/page.tsx` (под `leadDetail.transferNote`, ~стр. 210)

**Interfaces:**

- Consumes: `GuideLinks` (Task 5), `GUIDE` (Task 1), `navigation.insights`, `insights.*` (Task 4).

- [ ] **Step 1: Убедиться, что сторож ссылок падает (red)**

Run: `npx jest src/__tests__/app/no-hidden-links.test.ts --coverage=false`
Expected: FAIL со списком `components/layouts/Navigation.tsx → /ru/blog`, `app/[locale]/services/page.tsx → /ru/knowledge`, `→ /ru/news`.

- [ ] **Step 2: Меню и футер**

`Navigation.tsx`: строку `{ label: t('navigation.blog'), href: `/${locale}/blog` },` заменить на:

```tsx
    { label: t('navigation.insights'), href: `/${locale}/insights` },
```

`Footer.tsx`: в колонке «Компания» после `<li>` со ссылкой на `/${locale}/services` добавить:

```tsx
              <li>
                <Link
                  href={`/${locale}/insights`}
                  className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('navigation.insights')}
                </Link>
              </li>
```

- [ ] **Step 3: Страница услуг**

В `src/app/[locale]/services/page.tsx`:

- удалить массив `knowledgeCenter`;
- секцию `{/* Knowledge Center */}` (от `<section className="py-16 max-w-7xl …">` до её `</section>`) заменить на:

```tsx
      {/* Guides */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <GuideLinks locale={locale} heading={t('insights.servicesHeading')} />
      </section>
```

- добавить `import GuideLinks from '@/components/features/GuideLinks';`;
- из импорта `lucide-react` убрать ставшие неиспользуемыми иконки (`BookOpen`, `Newspaper` — проверить ESLint'ом).

- [ ] **Step 4: `/services/legal`**

В `src/app/[locale]/services/legal/page.tsx`:

- добавить `import GuideLinks from '@/components/features/GuideLinks';`;
- заменить `const { locale } = useTranslation();` на `const { t, locale } = useTranslation();`;
- перед блоком `{/* Specializations */}` вставить:

```tsx
        {/* Guides */}
        <div className="mt-12">
          <GuideLinks
            locale={locale}
            heading={t('insights.servicesHeading')}
            keys={['foreignInvestor', 'explorationLicence', 'rightsTransfer']}
          />
        </div>
```

- [ ] **Step 5: Тизер участка**

В `src/app/[locale]/leads/[code]/page.tsx`:

- добавить `import { GUIDE } from '@/lib/insights/registry';`;
- добавить `ArrowRight` в импорт из `lucide-react`, если его там нет;
- сразу после `<p className="mt-3 text-xs text-gray-500 leading-relaxed">{t('leadDetail.transferNote')}</p>` вставить:

```tsx
                <Link
                  href={`/${locale}/insights/${GUIDE.rightsTransfer}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gold-dark dark:text-gold-light hover:underline underline-offset-4"
                >
                  {t('insights.links.rightsTransfer')}
                  <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </Link>
```

Проверить, как в этом файле называется переменная языка: `locale` из `await params` (стр. ~40 `getServerTranslation(locale)`).

- [ ] **Step 6: Отвязать `navigation.blog`**

```bash
grep -rn "navigation\.blog\|navigation\.education" src | grep -v __tests__
```

Expected: пусто. Тогда удалить ключи `blog:` и `education:` из объекта `navigation` во всех 4 языках. Если grep что-то нашёл, ключи оставить и записать находку в отчёт задачи.

- [ ] **Step 7: Запустить тесты и линт**

Run: `npx jest src/__tests__/app src/__tests__/lib --coverage=false && npx eslint src/components/layouts "src/app/[locale]/services" "src/app/[locale]/leads/[code]/page.tsx" src/components/features/GuideLinks.tsx`
Expected: `no-hidden-links` PASS. Остальные наборы в `src/__tests__/lib` и `src/__tests__/app` PASS, кроме заранее известных старых падений (сверить со списком из `npm run test` до начала работы — см. Task 9, Step 1). ESLint без ошибок.

- [ ] **Step 8: Commit**

```bash
git add src/components/layouts/Navigation.tsx src/components/layouts/Footer.tsx \
  "src/app/[locale]/services/page.tsx" "src/app/[locale]/services/legal/page.tsx" \
  "src/app/[locale]/leads/[code]/page.tsx" src/lib/i18n/translations.ts
git commit -m "feat(insights): link guides from menu, footer, services and the lead teaser"
```

---

### Task 7: Гайды на русском — исследование, тексты, тест целостности

**Files:**

- Create:
  - `content/insights/<slug>/ru.md` × 4
  - `src/__tests__/lib/insights/content-integrity.test.ts`
- Possibly modify (если исследование опровергнет): `leadDetail.transferNote` в `translations.ts` (4 языка), ответ 6 в `src/lib/content/faq.ts` (3 языка), `public/llms.txt`.

**Interfaces:**

- Consumes: `INSIGHTS`, `articlePath`, `parseFrontMatter`, `hiddenRouteRedirect`.

- [ ] **Step 1: Тест целостности контента (red)**

`src/__tests__/lib/insights/content-integrity.test.ts`:

```ts
/** @jest-environment node */
import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';
import { INSIGHTS_DIR, articlePath } from '@/lib/insights/content';
import { parseFrontMatter } from '@/lib/insights/front-matter';
import { INSIGHTS } from '@/lib/insights/registry';
import { hiddenRouteRedirect } from '@/lib/seo/pages';
import type { Locale } from '@/lib/seo/site';

const SOURCES_HEADING: Record<string, RegExp> = {
  ru: /^## Источники\s*$/m,
  en: /^## Sources\s*$/m,
  zh: /^## 参考资料\s*$/m,
};

// Copy red lines (pivot spec §3, session 3 spec §8–9).
const FORBIDDEN = [
  /гарантированн[а-яё]* доходност/i,
  /guaranteed (return|yield|profit)/i,
  /保证收益|保证回报/,
  /прода[её]м (отч[её]т|данн)/i,
  /sell (archive )?reports/i,
  /\bOCR\b/,
  /нейросет/i,
  /\bИИ\b/,
  /\bAI\b/,
  /人工智能/,
  /портфел/i,
  /portfolio/i,
  /投资组合/,
  /маркетплейс|marketplace/i,
  /obtain the licen[cs]e/i,
];

const files = INSIGHTS.flatMap((entry) =>
  entry.locales.map((locale) => ({ entry, locale: locale as Locale }))
);

describe('guide files', () => {
  it('match the registry languages exactly', () => {
    for (const entry of INSIGHTS) {
      const onDisk = existsSync(path.join(INSIGHTS_DIR, entry.slug))
        ? readdirSync(path.join(INSIGHTS_DIR, entry.slug))
            .filter((f) => f.endsWith('.md'))
            .map((f) => f.replace(/\.md$/, ''))
            .sort()
        : [];
      expect({ slug: entry.slug, locales: onDisk }).toEqual({
        slug: entry.slug,
        locales: [...entry.locales].sort(),
      });
    }
  });

  it('every guide is written in ru, en and zh', () => {
    for (const entry of INSIGHTS) {
      expect([...entry.locales].sort()).toEqual(['en', 'ru', 'zh']);
    }
  });

  describe.each(files.map((f) => [`${f.entry.slug}/${f.locale}.md`, f]))(
    '%s',
    (_name, { entry, locale }) => {
      const file = articlePath(entry.slug, locale);
      const source = existsSync(file) ? readFileSync(file, 'utf8') : '';

      it('has a title up to 110 chars and a 70–200 char description', () => {
        const { data } = parseFrontMatter(source);
        expect(data.title?.length).toBeGreaterThan(10);
        expect(data.title.length).toBeLessThanOrEqual(110);
        expect(data.description?.length).toBeGreaterThanOrEqual(70);
        expect(data.description.length).toBeLessThanOrEqual(200);
      });

      it('has no H1 in the body and ends with a sources section', () => {
        const { body } = parseFrontMatter(source);
        expect(body).not.toMatch(/^# /m);
        expect(body).toMatch(SOURCES_HEADING[locale]);
        expect(body).toMatch(/\]\(https?:\/\//);
      });

      it('keeps the copy red lines', () => {
        const hits = FORBIDDEN.filter((re) => re.test(source)).map(String);
        expect(hits).toEqual([]);
      });

      it('links only to live pages in its own language', () => {
        const internal = [...source.matchAll(/\]\((\/[^)\s]*)\)/g)].map(
          (m) => m[1]
        );
        for (const href of internal) {
          expect(href.startsWith(`/${locale}/`)).toBe(true);
          expect(hiddenRouteRedirect(href.replace(/[#?].*$/, ''))).toBeNull();
        }
      });
    }
  );
});
```

Run: `npx jest src/__tests__/lib/insights/content-integrity.test.ts --coverage=false`
Expected: FAIL — файлов нет. Тест «every guide is written in ru, en and zh» и сверка с диском станут зелёными только после Task 8.

- [ ] **Step 2: Запустить 4 исследовательских субагента параллельно (в фоне)**

Одно сообщение, четыре вызова `Agent` (`subagent_type: general-purpose`, `run_in_background: true`), по одному на гайд. Общий текст задания ниже. В `<GUIDE>` подставить блок конкретного гайда из Step 3.

```
Ты пишешь гайд для сайта QAZNEDR HOLDING (qaznedr.kz) — казахстанский геологоразведочный холдинг. Он готовит сделки по свободным рудным участкам для иностранных инвесторов, в основном китайских. Читатель — инвестор или его юрист, 2026 год.

ЗАДАЧА: исследовать тему по первоисточникам и написать файл content/insights/<slug>/ru.md в репозитории /Users/yerlankulumgariyev/Documents/qaznedr-app. Других файлов не трогай, ничего не коммить.

<GUIDE>

ИСТОЧНИКИ. Только первоисточники. Инструменты: firecrawl_scrape, firecrawl_search, WebFetch.
- Кодекс РК «О недрах и недропользовании» от 27.12.2017 № 125-VI: https://adilet.zan.kz/rus/docs/K1700000125 (актуальная редакция). Закон РК от 07.07.2026 № 337-VIII: https://adilet.zan.kz/rus/docs/Z2600000337 (действует с 07.09.2026, отдельные нормы с 01.01.2027). Подзаконные акты — тоже на adilet.zan.kz.
- Разборы юрфирм и новости только в помощь поиску. Факт в тексте должен опираться на норму.
- Номер статьи, срок, площадь, сумма (МРП), процент: либо сверено с текстом нормы, либо не пишем.

ФОРМАТ ФАЙЛА:
---
title: <до 110 знаков, со словом «Казахстан» или «РК»>
description: <140–160 знаков, суть гайда>
---

<Первый абзац без заголовка: прямой ответ на главный вопрос в 2–4 предложениях — его будут цитировать поисковики и ИИ-ассистенты.>

## ... (разделы: только ## и ###, H1 не ставить)
Таблицы — GFM. Внутренние ссылки — только абсолютные пути на ru: /ru/leads (участки), /ru/contact, /ru/services/legal, /ru/faq и другие гайды /ru/insights/<slug>. Слаги гайдов:
foreign-investor-subsoil-rights-kazakhstan, solid-minerals-exploration-licence-kazakhstan, reserve-classification-gkz-kazrc-jorc-gbt17766, subsoil-rights-transfer-permission-kazakhstan.
## Чем поможет QAZNEDR HOLDING — 3–5 пунктов: подбор участка по фондовым отчётам силами наших геологов, проверка статуса, сопровождение заявки, due diligence, выбор формата сделки. Сопровождаем, а не гарантируем. Ссылки на /ru/leads и /ru/contact.
## Источники — маркированный список: [Название документа, дата, статья](URL).

ОБЪЁМ: 1 200–2 000 слов. Тон: коротко, фактически, без рекламы («инновационный», «уникальная возможность» — нельзя), без эмодзи. Дата «по состоянию на» — 26.09.2026.

КРАСНЫЕ ЛИНИИ (нарушение = переделка):
- не писать и не намекать, что участки принадлежат холдингу; наши участки — «свободные по нашей проверке на дату», лицензию оформляют под сделку;
- не писать, что холдинг продаёт отчёты или данные (продаём экспертизу и сопровождение);
- без «гарантированной доходности» и обещаний, что лицензия будет выдана или разрешение получено — решает государство;
- советские категории ГКЗ (A, B, C1, C2) не называть JORC; P1–P3 — прогнозные ресурсы, не запасы;
- не упоминать OCR, ИИ, нейросети, модели;
- не использовать слова «портфель», «маркетплейс»;
- где норма читается неоднозначно или практика не устоялась — так и написать: «уточняйте у юриста».

ОТЧЁТ (последнее сообщение, не в файле):
1) Таблица фактов: каждое утверждение с цифрой, номером статьи или сроком → URL → дословная цитата нормы (1–2 предложения).
2) Что проверить не удалось и потому не вошло.
3) Проверь по тексту Кодекса утверждения, которые уже есть на сайте, и ответь «подтверждено / неверно (как правильно, цитата)»:
   (а) «Передача права недропользования требует разрешения уполномоченного органа (ст. 44–45 Кодекса о недрах)»;
   (б) «лицензию на разведку твёрдых полезных ископаемых нельзя передать в первый год её действия».
```

- [ ] **Step 3: Блоки `<GUIDE>` для каждого субагента**

**Гайд 1** — `foreign-investor-subsoil-rights-kazakhstan`:

```
Гайд 1. Слаг foreign-investor-subsoil-rights-kazakhstan. Тема: «Как иностранному инвестору получить право недропользования в Казахстане (2026)». Категория: право.
Разобрать: кто может быть недропользователем (в т.ч. иностранные юрлица; нужна ли регистрация в РК — по норме); какие виды лицензий на ТПИ существуют (геологическое изучение, разведка, добыча, старательство) и какие актуальны инвестору; три пути входа — (1) новая лицензия на свободный участок, (2) приобретение права недропользования или доли в компании-недропользователе, (3) СП / earn-in с держателем лицензии; что учесть — разрешение на переход права, приоритетное право государства (где и к каким объектам применяется — по норме), стратегические объекты, сроки; практические шаги инвестора. Короткая таблица «путь — что нужно — плюсы/риски». Ссылки на гайды 2 и 4.
```

**Гайд 2** — `solid-minerals-exploration-licence-kazakhstan`:

```
Гайд 2. Слаг solid-minerals-exploration-licence-kazakhstan. Тема: «Лицензия на разведку твёрдых полезных ископаемых в Казахстане: процесс по шагам». Категория: лицензирование.
Разобрать по Кодексу (глава о разведке ТПИ и порядок выдачи лицензий): как выдаётся лицензия на разведку (порядок очерёдности заявлений / аукцион — как установлено нормой), где подаётся заявление (платформа / уполномоченный орган — по норме), что такое блок и предельная площадь, срок лицензии и продление, подписной бонус, минимальные расходы на разведку, арендные платежи, отчётность, сокращение территории, переход к лицензии на добычу. Таблица «шаг — срок — документ/платёж». Где цифры в МРП — указать МРП и не пересчитывать в тенге. Ссылки на гайды 1 и 4, /ru/services/legal.
```

**Гайд 3** — `reserve-classification-gkz-kazrc-jorc-gbt17766`:

```
Гайд 3. Слаг reserve-classification-gkz-kazrc-jorc-gbt17766. Тема: «Классификации запасов: ГКЗ ↔ KAZRC/JORC ↔ китайский GB/T 17766-2020». Категория: геология. Юридической плашки нет, но источники обязательны.
Источники: GB/T 17766-2020 «固体矿产资源储量分类» (текст стандарта или официальные разъяснения Минприроды КНР), кодекс KAZRC (kazrc.com), JORC Code 2012 (jorc.org), шаблон CRIRSCO (crirsco.com), советская классификация 1981 г. и действующая классификация РК (ГКЗ РК) — по доступным официальным текстам.
Разобрать: категории каждой системы (ГКЗ: A, B, C1, C2 — балансовые/забалансовые; прогнозные P1, P2, P3; KAZRC/JORC: Exploration Results, Mineral Resources — Measured/Indicated/Inferred, Ore Reserves — Proved/Probable; GB/T 17766-2020: 资源量 探明/控制/推断, 储量 证实/可信). Сводная таблица приблизительного соответствия с оговоркой, что прямого пересчёта нет: нужна переоценка компетентным лицом (Competent Person) по данным, отвечающим требованиям кодекса. Что такое историческая оценка (historical estimate) и как её разрешено упоминать по JORC/KAZRC. Почему советские C1/C2 нельзя называть JORC. Как QAZNEDR HOLDING указывает стандарт в тизерах: «запасы по категориям ГКЗ СССР / историческая оценка; P1–P3 — прогноз». Китайские термины давать в скобках. Ссылки на /ru/leads и гайд 1.
```

**Гайд 4** — `subsoil-rights-transfer-permission-kazakhstan`:

```
Гайд 4. Слаг subsoil-rights-transfer-permission-kazakhstan. Тема: «Сделки с правом недропользования в Казахстане: разрешение на переход права и изменения 2026 года». Категория: право.
Разобрать по Кодексу и Закону № 337-VIII: какие сделки требуют разрешения компетентного органа (переход права, объекты, связанные с правом недропользования — доли, акции, контроль), исключения, запрет передачи лицензии на разведку в первый год (если подтвердится), приоритетное право государства (к каким объектам), состав заявления и срок рассмотрения, последствия сделки без разрешения. Отдельный раздел «Что изменилось с 7 сентября 2026 года (Закон № 337-VIII)»: только нормы, которые сверены по тексту закона; что вступает с 01.01.2027 — отдельно. Там, где изменения не удалось сверить, так и написать и отправить к юристу. Практический чек-лист перед сделкой. Ссылки на гайд 1 и /ru/contact.
```

- [ ] **Step 4: Пока субагенты работают — выполнить Tasks 1–6** (если ещё не выполнены). Субагенты пишут только в `content/insights/`, пересечений нет.

- [ ] **Step 5: Проверить каждый ru-текст (Claude сам)**

По каждому гайду:

1. Взять таблицу фактов из отчёта субагента. Минимум 5 ключевых фактов — все номера статей, сроки, площади и изменения 337-VIII — открыть по ссылке и сверить цитату самому (`firecrawl_scrape` на adilet).
2. Проверить красные линии глазами. Тест ловит только слова, а не смысл: обещания, «наш участок», хвалебность.
3. Поправить текст правкой файла. Если факт не подтвердился — убрать его.
4. Если субагент опроверг (а) или (б) из п. 3 отчёта — исправить `leadDetail.transferNote` (4 языка), ответ 6 FAQ (3 языка), `public/llms.txt`. Записать в отчёт сессии.

- [ ] **Step 6: Запустить тест целостности для ru**

Run: `npx jest src/__tests__/lib/insights/content-integrity.test.ts --coverage=false -t "ru.md"`
Expected: все проверки `*/ru.md` PASS. Проверки en и zh и «every guide is written in ru, en and zh» пока FAIL.

- [ ] **Step 7: Commit**

```bash
git add content/insights/*/ru.md src/__tests__/lib/insights/content-integrity.test.ts
# + translations.ts / faq.ts / llms.txt, если правились в Step 5
git commit -m "content(insights): four guides in Russian, checked against primary sources"
```

---

### Task 8: Переводы гайдов на en и zh

**Files:**

- Create: `content/insights/<slug>/en.md` × 4, `content/insights/<slug>/zh.md` × 4.

- [ ] **Step 1: 4 субагента-переводчика параллельно** (по одному на гайд, каждый делает en и zh)

Задание:

```
Переведи гайд /Users/yerlankulumgariyev/Documents/qaznedr-app/content/insights/<slug>/ru.md на английский (en.md) и упрощённый китайский (zh.md) в той же папке. Другие файлы не трогай, ничего не коммить.

ПРАВИЛА:
- Смысл, факты, цифры, номера статей, даты и оговорки — один в один. Ничего не добавлять и не убирать, кроме того, что нужно для естественного языка.
- Шапка: title (до 110 знаков) и description (140–160 знаков для en; 60–100 иероглифов для zh) — переписать под поиск на этом языке:
  en: в title слово "Kazakhstan";
  zh: в title «哈萨克斯坦» и ключевой термин (矿业权 / 探矿权 / 勘查许可证 / 储量分类 / 矿业权转让).
- Внутренние ссылки: /ru/... → /en/... и /zh/... соответственно (те же пути).
- Раздел источников: en «## Sources», zh «## 参考资料». Ссылки на документы оставить. Если у документа на adilet.zan.kz есть английская версия (/eng/docs/...), в en.md дать её вместо русской. Названия русскоязычных документов перевести, в скобках — оригинал.
- Раздел «Чем поможет QAZNEDR HOLDING» → en «How QAZNEDR HOLDING can help», zh «QAZNEDR HOLDING 能提供的帮助».
- Первый абзац без заголовка, заголовки только ## и ###.
- Глоссарий zh:
  право недропользования — 底土利用权 (юр.) / 矿业权 (в обычной речи);
  Кодекс «О недрах и недропользовании» — 《底土与底土利用法典》(简称《底土法》);
  лицензия на разведку ТПИ — 固体矿产勘查许可证;
  лицензия на добычу — 开采许可证;
  разрешение на переход права — 转让许可;
  компетентный/уполномоченный орган — 主管机关;
  ГКЗ — 国家储量委员会（GKZ）;
  запасы — 储量; ресурсы — 资源量; прогнозные ресурсы P1–P3 — 预测资源量;
  историческая оценка — 历史估算;
  компетентное лицо — 合资格人士（Competent Person）;
  блок — 区块; подписной бонус — 签约奖金; МРП — 月核算指数（МРП）;
  доля — 股权/份额; совместное предприятие — 合资企业;
  NDA — 保密协议（NDA）.
- Глоссарий en: subsoil use right; Code on Subsoil and Subsoil Use; exploration licence (British spelling: licence, but "license" as a verb); competent authority; State Reserves Committee (GKZ); historical estimate; Competent Person; block; signature bonus; MCI (monthly calculation index, МРП).
- Красные линии: не писать, что участки принадлежат холдингу; не писать, что продаём отчёты или данные; без guaranteed returns и обещаний выдачи лицензии (никогда "obtain the licence" — вместо этого "apply for", "support the application"); не называть ГКЗ C1/C2 JORC; без AI/OCR; без слов portfolio / 投资组合 / marketplace.
- Китайский — естественный деловой, как в материалах китайских горных компаний, не калька. Числа — арабские цифры.

ОТЧЁТ: список мест, где перевод потребовал решения (термин, неоднозначность) — для вычитки переводчиком.
```

- [ ] **Step 2: Проверить переводы**

- Прочитать en целиком.
- В zh проверить заголовки, таблицы и все цифры против ru. Удобно так: `grep -o "[0-9][0-9.,–-]*" ru.md | sort | uniq -c` против того же по zh.md.
- Поправить, если цифры расходятся.

- [ ] **Step 3: Тест целостности — полностью зелёный**

Run: `npx jest src/__tests__/lib/insights --coverage=false`
Expected: PASS, включая «every guide is written in ru, en and zh» и сверку с диском.

- [ ] **Step 4: Список для переводчика**

Создать `docs/translator/2026-09-26-zh-guides.md`:

- 4 пути `content/insights/*/zh.md`, URL на проде `https://qaznedr.kz/zh/insights/<slug>`;
- места из отчётов субагентов, требующие решения;
- просьба: вычитать и прислать правки текстом.

Отдельно — zh FAQ (`src/lib/content/faq.ts`, блок `ZH`) и zh-строки `insights.*`.

- [ ] **Step 5: Commit**

```bash
git add content/insights/*/en.md content/insights/*/zh.md docs/translator/2026-09-26-zh-guides.md
git commit -m "content(insights): English and Chinese versions of the four guides"
```

---

### Task 9: llms.txt, полная проверка, локальный прогон

**Files:**

- Modify: `public/llms.txt`

- [ ] **Step 1: Базовая линия старых падений**

Run: `git stash list >/dev/null; npm run test -- --coverage=false 2>&1 | grep -E "^(FAIL|PASS)" | sort > /tmp/claude-tests-after.txt; grep ^FAIL /tmp/claude-tests-after.txt`
Expected: FAIL только у заранее известных старых наборов маркетплейса (5–6 шт.). Ни одного набора из `src/__tests__/lib/insights`, `lib/seo`, `lib/i18n`, `lib/content`, `app`, `middleware.test.ts`.

Для сравнения — базовая линия на коммите до сессии:

```bash
git worktree add -q /private/tmp/claude-501/-Users-yerlankulumgariyev-Documents-qaznedr-app/e499ea8b-b6fe-4838-8d25-df59dc0fb47c/scratchpad/base 62e7781
```

Затем в этой папке: `ln -s ~/Documents/qaznedr-app/node_modules node_modules && npx jest --coverage=false 2>&1 | grep -E "^FAIL" | sort`. После сравнения — `git worktree remove --force …/base`. Все FAIL «после» должны быть в списке «до».

- [ ] **Step 2: llms.txt**

В `public/llms.txt` после раздела `## Key pages` (перед `Services:`) добавить:

```
## Guides
| Guide | English | 中文 | Русский |
|---|---|---|---|
| Subsoil use rights for foreign investors | https://qaznedr.kz/en/insights/foreign-investor-subsoil-rights-kazakhstan | https://qaznedr.kz/zh/insights/foreign-investor-subsoil-rights-kazakhstan | https://qaznedr.kz/ru/insights/foreign-investor-subsoil-rights-kazakhstan |
| Solid-minerals exploration licence, step by step | https://qaznedr.kz/en/insights/solid-minerals-exploration-licence-kazakhstan | https://qaznedr.kz/zh/insights/solid-minerals-exploration-licence-kazakhstan | https://qaznedr.kz/ru/insights/solid-minerals-exploration-licence-kazakhstan |
| Reserve classifications: GKZ, KAZRC/JORC, GB/T 17766 | https://qaznedr.kz/en/insights/reserve-classification-gkz-kazrc-jorc-gbt17766 | https://qaznedr.kz/zh/insights/reserve-classification-gkz-kazrc-jorc-gbt17766 | https://qaznedr.kz/ru/insights/reserve-classification-gkz-kazrc-jorc-gbt17766 |
| Subsoil rights transactions: transfer permission | https://qaznedr.kz/en/insights/subsoil-rights-transfer-permission-kazakhstan | https://qaznedr.kz/zh/insights/subsoil-rights-transfer-permission-kazakhstan | https://qaznedr.kz/ru/insights/subsoil-rights-transfer-permission-kazakhstan |

All guides: https://qaznedr.kz/en/insights
```

- [ ] **Step 3: Линт, форматирование, сборка**

Run: `npm run lint && npm run format:check && npm run build 2>&1 | tail -40`
Expected:

- lint без ошибок;
- `format:check` без замечаний по нашим файлам (иначе `npx prettier --write <файлы>`);
- build зелёный, в таблице маршрутов `/[locale]/insights` и `/[locale]/insights/[slug]` помечены как статические (● / ○), 12 статей.

Проверить трассировку:

```bash
ls .next/server/app/\[locale\]/insights/ ; grep -l "content/insights" .next/server/app/\[locale\]/insights/\[slug\]/page.js.nft.json
```

- [ ] **Step 4: Локальный прогон**

Run (в фоне): `npm run start -- -p 3107`, затем:

```bash
B=http://localhost:3107
for p in /ru/insights /en/insights /zh/insights /kz/insights /zh/insights/reserve-classification-gkz-kazrc-jorc-gbt17766 /en/faq /zh/faq; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' $B$p) $p"; done
for p in /kz/insights/subsoil-rights-transfer-permission-kazakhstan /ru/blog /en/news/3 /zh/knowledge /ru/education; do
  echo "$(curl -s -o /dev/null -w '%{http_code} → %{redirect_url}' $B$p) $p"; done
curl -s $B/en/insights/subsoil-rights-transfer-permission-kazakhstan | grep -o '<script type="application/ld+json">[^<]*' | sed 's/<script type="application\/ld+json">//' | python3 -c "import sys,json;[print(json.loads(l)['@type']) for l in sys.stdin]"
curl -s $B/zh/faq | grep -o '"@type":"FAQPage"' | head -1
curl -s $B/sitemap.xml | grep -c "/insights/"
```

Expected:

- первые 7 адресов — `200`;
- следующие 5 — `308 → …/ru/insights/…` (для kz) и `308 → …/<l>/insights`;
- JSON-LD печатает `Article` и `BreadcrumbList`;
- FAQPage найден;
- в sitemap 12 строк с `/insights/` у статей плюс 4 у списка (всего 16 совпадений).

Потом остановить сервер.

- [ ] **Step 5: Визуальная проверка в браузере (375 и 1440 px, светлая и тёмная тема)**

Через `claude-in-chrome`:

- `localhost:3107/zh/insights/reserve-classification-gkz-kazrc-jorc-gbt17766` на 375 px — таблица прокручивается внутри, у страницы нет горизонтального скролла;
- `/ru/insights`;
- `/en/faq`.

Скриншоты не коммитить.

- [ ] **Step 6: Commit**

```bash
git add public/llms.txt
git commit -m "docs(llms): list the investor guides"
```

---

### Task 10: Ревью, деплой, проверка на проде, IndexNow, дорожная карта

- [ ] **Step 1: Финальное ревью ветки**

Субагент `general-purpose` (model: opus). Задание:

- ревью диффа `62e7781..HEAD` против спецификации и плана;
- корректность, SEO, красные линии в текстах, дизайн-система;
- найденные дефекты — списком с файлом и строкой.

Исправить подтверждённое, повторить Task 9 Step 3.

- [ ] **Step 2: Push = деплой**

```bash
git status -s   # только файлы Codex в docs/design/ должны остаться неотслеживаемыми/изменёнными
git push origin master
```

Дождаться READY: Vercel API `v6/deployments?app=qaznedr&target=production&limit=1`, `meta.githubCommitSha` = `git rev-parse HEAD`.

- [ ] **Step 3: Проверка на проде**

Повторить curl-блок из Task 9 Step 4 с `B=https://qaznedr.kz`. Проверить canonical и hreflang у одной zh-статьи:

```bash
curl -s https://qaznedr.kz/zh/insights/foreign-investor-subsoil-rights-kazakhstan | grep -o '<link rel="\(canonical\|alternate\)"[^>]*>'
```

Expected: canonical на zh-URL, alternate только `ru`, `en`, `zh-CN`, `x-default`.

- [ ] **Step 4: IndexNow**

```bash
python3 - <<'EOF'
import json, urllib.request
slugs = ["foreign-investor-subsoil-rights-kazakhstan","solid-minerals-exploration-licence-kazakhstan","reserve-classification-gkz-kazrc-jorc-gbt17766","subsoil-rights-transfer-permission-kazakhstan"]
urls = [f"https://qaznedr.kz/{l}/insights/{s}" for s in slugs for l in ("ru","en","zh")]
urls += [f"https://qaznedr.kz/{l}/insights" for l in ("ru","en","zh","kz")] + [f"https://qaznedr.kz/{l}/faq" for l in ("en","zh")]
body = json.dumps({"host":"qaznedr.kz","key":"qaznedr2026indexnow","keyLocation":"https://qaznedr.kz/qaznedr2026indexnow.txt","urlList":urls}).encode()
req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body, headers={"Content-Type":"application/json; charset=utf-8"})
print(urllib.request.urlopen(req).status, len(urls))
EOF
```

Expected: `200 18` или `202 18`.

- [ ] **Step 5: Обновить `docs/HOLDING_ROADMAP.md`**

- «Текущий статус»: сессия 3 закрыта, что на проде, что перенесено.
- Сессия 3 → «готово» со ссылками на спецификацию и план.
- «Не хватает от владельца»:
  - переводчику zh-гайды и FAQ (файл `docs/translator/…`);
  - юристу гайды 1 и 4;
  - `/services/legal` всё ещё содержит маркетплейсные призывы «Создать профиль эксперта» — задача сессии 6.
- Промпт следующей сессии (сессия 4) — без изменений.

Commit и push:

```bash
git add docs/HOLDING_ROADMAP.md
git commit -m "docs: close session 3 — insights section and four guides live"
git push origin master
```
