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
