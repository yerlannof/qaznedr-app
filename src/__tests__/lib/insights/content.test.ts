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

describe('parseArticle rejects a second H1', () => {
  // The page renders the title as the only H1; build must fail otherwise.
  it.each([
    ['atx', '# Title'],
    ['indented atx', '   # Title'],
    ['setext', 'Title\n====='],
    ['raw html', '<h1>Title</h1>'],
  ])('%s heading', (_kind, heading) => {
    expect(() =>
      parseArticle(
        `---\ntitle: T\ndescription: D\n---\n\n${heading}\n\nText`,
        entry,
        'ru'
      )
    ).toThrow('test-guide/ru.md: H1 in the body');
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
