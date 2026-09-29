import { parseFrontMatter } from '@/lib/insights/front-matter';
import { readFileSync } from 'fs';
import path from 'path';

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

  it('unwraps quoted values and YAML doubled single quotes', () => {
    const { data } = parseFrontMatter(
      "---\ntitle: 'An investor''s report: a guide'\ndescription: \"A \\\"quoted\\\" note: \\\\ source\"\nplain: An investor's report: a guide\n---\n"
    );
    expect(data).toEqual({
      title: "An investor's report: a guide",
      description: 'A "quoted" note: \\ source',
      plain: "An investor's report: a guide",
    });
  });

  it.each(['ru', 'kz', 'en'] as const)(
    'reads the published %s geological review title without outer quotes',
    (locale) => {
      const source = readFileSync(
        path.join(
          process.cwd(),
          'content/insights/geological-due-diligence-kazakhstan',
          `${locale}.md`
        ),
        'utf8'
      );
      const { data } = parseFrontMatter(source);
      expect(data.title).not.toMatch(/^['"]|['"]$/);
      expect(data.title).toContain(':');
      if (locale === 'ru') expect(data.description).not.toMatch(/^['"]|['"]$/);
    }
  );

  it('throws when the header is missing', () => {
    expect(() => parseFrontMatter('# Title\n\nText')).toThrow(/front matter/);
  });

  it('throws on a line without a key', () => {
    expect(() => parseFrontMatter('---\njust text\n---\n')).toThrow(
      /just text/
    );
  });
});
