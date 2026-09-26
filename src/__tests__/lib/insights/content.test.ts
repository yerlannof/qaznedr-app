/** @jest-environment node */
import {
  getArticle,
  listArticles,
  parseArticle,
  readingMinutes,
  renderMarkdown,
} from '@/lib/insights/content';
import { GUIDE, INSIGHTS, type InsightEntry } from '@/lib/insights/registry';

const entry: InsightEntry = {
  slug: 'test-guide',
  category: 'law',
  published: '2026-09-26',
  updated: '2026-09-27',
  legal: true,
  locales: ['ru'],
};

describe('renderMarkdown', () => {
  it('wraps tables in a labelled, focusable region that scrolls', () => {
    const html = renderMarkdown('| A | B |\n|---|---|\n| 1 | 2 |\n', 'Таблица');
    expect(html).toContain(
      '<div class="insight-table" tabindex="0" role="region" aria-label="Таблица 1"><table>'
    );
    expect(html).toContain('</table></div>');
  });

  it('escapes quotes in the table label', () => {
    const html = renderMarkdown('| A |\n|---|\n| 1 |\n', 'a"b');
    expect(html).toContain('aria-label="a&quot;b 1"');
  });

  it('numbers table regions in order and restarts for each render', () => {
    const markdown = '| A |\n|---|\n| 1 |\n\n| B |\n|---|\n| 2 |';
    const html = renderMarkdown(markdown, 'Table');
    expect(html.match(/aria-label="Table [12]"/g)).toEqual([
      'aria-label="Table 1"',
      'aria-label="Table 2"',
    ]);
    expect(renderMarkdown('| C |\n|---|\n| 3 |', 'Table')).toContain(
      'aria-label="Table 1"'
    );
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
  it('labels tables in the article language', () => {
    const md =
      '---\ntitle: 标题\ndescription: 描述\n---\n\n| A |\n|---|\n| 1 |\n';
    expect(parseArticle(md, entry, 'zh').html).toContain('aria-label="表格 1"');
  });

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
    expect(a.html).toContain(
      '<h2 id="section-1" tabindex="-1" class="scroll-mt-24">Раздел</h2>'
    );
    expect(a.toc).toEqual([{ id: 'section-1', title: 'Раздел', level: 2 }]);
  });

  it('creates unique heading anchors and plain-text TOC labels from inline markup and entities', () => {
    const a = parseArticle(
      '---\ntitle: T\ndescription: D\n---\n\n## *Gold* &amp; **Copper**\n\n### A &lt; B\n\n## *Gold* &amp; **Copper**',
      entry,
      'en'
    );
    expect(a.toc).toEqual([
      { id: 'section-1', title: 'Gold & Copper', level: 2 },
      { id: 'section-2', title: 'A < B', level: 3 },
      { id: 'section-3', title: 'Gold & Copper', level: 2 },
    ]);
    expect(a.html).toContain(
      '<h3 id="section-2" tabindex="-1" class="scroll-mt-24">'
    );
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

describe('getArticle', () => {
  // The module object itself, so spies reach the loader's fs calls.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  afterEach(() => jest.restoreAllMocks());

  it('fails loudly when a language the registry lists has no file', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw Object.assign(new Error('ENOENT: no such file'), {
        code: 'ENOENT',
      });
    });
    expect(() => getArticle(GUIDE.foreignInvestor, 'ru')).toThrow(/ENOENT/);
  });

  it('returns null for a language the guide is not written in', () => {
    expect(getArticle(GUIDE.foreignInvestor, 'kz')).toBeNull();
  });
});
