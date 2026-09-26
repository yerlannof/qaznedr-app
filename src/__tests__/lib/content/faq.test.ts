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

  // Negations such as 不保证收益 ("we do not guarantee returns") are allowed.
  it('keeps the copy red lines', () => {
    const all = Object.values(FAQ)
      .flat()
      .map((i) => `${i.q} ${i.a}`)
      .join('\n');
    expect(all).not.toMatch(
      /гарантированн|guaranteed return|(?<!不)保证收益|портфел|portfolio|маркетплейс|marketplace|obtain the licen[cs]e|JORC/i
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
      const page = (translations[locale] as Record<string, unknown>).faqPage as
        | Record<string, string>
        | undefined;
      for (const key of ['eyebrow', 'title', 'subtitle']) {
        expect(page?.[key]).toBeTruthy();
      }
    }
  );
});
