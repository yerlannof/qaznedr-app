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
