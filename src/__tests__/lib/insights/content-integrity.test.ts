/** @jest-environment node */
import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';
import {
  INSIGHTS_DIR,
  articlePath,
  renderMarkdown,
} from '@/lib/insights/content';
import { parseFrontMatter } from '@/lib/insights/front-matter';
import { GUIDE, INSIGHTS } from '@/lib/insights/registry';
import { PUBLIC_PAGES } from '@/lib/seo/pages';
import type { Locale } from '@/lib/seo/site';

const SOURCES_HEADING: Record<string, RegExp> = {
  ru: /^## Источники\s*$/m,
  en: /^## Sources\s*$/m,
  zh: /^## 参考资料\s*$/m,
  kz: /^## Дереккөздер\s*$/m,
};

// Copy red lines (pivot spec §3, session 3 spec §8–9). Negations such as
// «не продаём отчёты» or 不保证收益 are the correct copy and are allowed.
const CYR = '[А-Яа-яЁё]';
const FORBIDDEN = [
  /(?<!(без|нет|не) )гарантированн[а-яё]* доходност/i,
  /(?<!(no|not) )guaranteed (return|yield|profit)/i,
  /(?<!不)保证(收益|回报)/,
  /(?<!не )прода[её]м (отч[её]т|данн)/i,
  /(?<!(not|n't) )sell (archive )?reports/i,
  /\bOCR\b/,
  /нейросет/i,
  new RegExp(`(?<!${CYR})ИИ(?!${CYR})`),
  /\bAI\b/,
  /人工智能/,
  /портфел/i,
  /portfolio/i,
  /投资组合/,
  /маркетплейс|marketplace/i,
  /obtain the licen[cs]e/i,
];

/**
 * Internal links, read from the rendered HTML so that every markdown form
 * (titles, references, <…>, raw <a>) is seen. A link must stay in the
 * article's language and lead to a public page or a guide written in it.
 */
function linkProblems(markdown: string, locale: string): string[] {
  const problems: string[] = [];
  for (const [, href] of renderMarkdown(markdown).matchAll(/href="([^"]*)"/g)) {
    if (href.startsWith('#')) continue;
    if (/^https?:\/\//i.test(href)) {
      if (/^https?:\/\/(www\.)?qaznedr\.kz(\/|$)/i.test(href)) {
        problems.push(`own site as an absolute link: ${href}`);
      }
      continue;
    }
    if (!href.startsWith(`/${locale}/`)) {
      problems.push(`not a /${locale}/ path: ${href}`);
      continue;
    }
    const rest = href
      .slice(locale.length + 1)
      .replace(/[#?].*$/, '')
      .replace(/\/$/, '');
    const guide = /^\/insights\/([\w-]+)$/.exec(rest);
    if (guide) {
      const entry = INSIGHTS.find((e) => e.slug === guide[1]);
      if (!entry || !(entry.locales as readonly string[]).includes(locale)) {
        problems.push(`no such guide in ${locale}: ${href}`);
      }
      continue;
    }
    if (!(PUBLIC_PAGES as readonly string[]).includes(rest)) {
      problems.push(`not a public page: ${href}`);
    }
  }
  return problems;
}

describe('linkProblems', () => {
  it.each([
    ['titled link', '[x](/ru/blog "t")'],
    ['reference link', '[x][b]\n\n[b]: /ru/listings'],
    ['angle brackets', '[x](</ru/listings>)'],
    ['raw anchor', '<a href="/ru/blog">x</a>'],
    ['relative link', '[x](leads)'],
    ['absolute own link', '[x](https://qaznedr.kz/ru/leads)'],
    ['mistyped guide', '[x](/ru/insights/foreign-investor-subsoil-rights)'],
    ['other language', '[x](/en/leads)'],
  ])('flags a %s', (_kind, markdown) => {
    expect(linkProblems(markdown, 'ru')).not.toEqual([]);
  });

  it('accepts public pages, written guides and external sources', () => {
    expect(
      linkProblems(
        '[a](/ru/leads) [b](/ru/insights/foreign-investor-subsoil-rights-kazakhstan) ' +
          '[c](https://adilet.zan.kz/rus/docs/K1700000125) [d](/ru/services/legal) [e](#top)',
        'ru'
      )
    ).toEqual([]);
  });
});

const files = INSIGHTS.flatMap((entry) =>
  entry.locales.map((locale) => ({ entry, locale: locale as Locale }))
);

describe('guide files', () => {
  it('match the registry languages exactly', () => {
    for (const entry of INSIGHTS) {
      const dir = path.join(INSIGHTS_DIR, entry.slug);
      const onDisk = existsSync(dir)
        ? readdirSync(dir)
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

  it('every published guide is written in ru, en, zh and kz', () => {
    for (const entry of INSIGHTS) {
      expect([...entry.locales].sort()).toEqual(['en', 'kz', 'ru', 'zh']);
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

      it('renders emphasis without stray markers', () => {
        // CJK text: a closing ** right after ）or 。 and before a character
        // does not close the bold, and the reader sees raw asterisks.
        const { body } = parseFrontMatter(source);
        const visible = renderMarkdown(body).replace(/<[^>]+>/g, '');
        expect(visible).not.toMatch(/\*\*|__/);
      });

      it('keeps the copy red lines', () => {
        const hits = FORBIDDEN.filter((re) => re.test(source)).map(String);
        expect(hits).toEqual([]);
      });

      it('links only to live pages in its own language', () => {
        const { body } = parseFrontMatter(source);
        expect(linkProblems(body, locale)).toEqual([]);
      });
    }
  );
});

describe('geological map guide', () => {
  const slug = GUIDE.geologicalMap;

  it.each(['ru', 'kz', 'en', 'zh'] as Locale[])(
    '%s publishes the same practical structure without editorial notes',
    (locale) => {
      const source = readFileSync(articlePath(slug, locale), 'utf8');
      const { data, body } = parseFrontMatter(source);
      expect(data.title).toBeTruthy();
      expect(data.description).toBeTruthy();
      expect(body.match(/^## /gm) ?? []).toHaveLength(5);
      expect(body.match(/^\d\. /gm) ?? []).toHaveLength(5);
      expect(body).toContain('1:200 000');
      expect(body).toContain('1:50 000');
      expect(body).toMatch(/2 (?:километр|kilomet|公里)/);
      expect(body).toMatch(/500 (?:метр|metr|米)/);
      expect(body).toContain(
        `/${locale}/insights/${GUIDE.reserveClassification}`
      );
      expect(body).toContain(`/${locale}/services/geological`);
      expect(body).toContain(`/${locale}/minerals/gold`);
      expect(body).not.toMatch(
        /редакционн|не для публикации|до публикации|editorial|not for publication/i
      );
    }
  );

  it('registers all four translations as an educational geology article', () => {
    const entry = INSIGHTS.find((guide) => guide.slug === slug);
    expect(entry).toMatchObject({
      category: 'geology',
      published: '2026-09-28',
      updated: '2026-09-28',
      legal: false,
      locales: ['ru', 'en', 'zh', 'kz'],
    });
    expect(entry?.lawAsOf).toBeUndefined();
  });
});
