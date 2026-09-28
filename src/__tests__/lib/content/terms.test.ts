import { termsFor } from '@/lib/content/terms';

describe('terms content', () => {
  it('has the same five sections, two paragraphs, date and contact in every language', () => {
    const expectedSectionCount = 5;
    for (const locale of ['ru', 'kz', 'en', 'zh'] as const) {
      const terms = termsFor(locale);
      expect(terms.sections).toHaveLength(expectedSectionCount);
      expect(terms.sections.map((section) => section.body.length)).toEqual([
        1, 1, 1, 1, 2,
      ]);
      expect(terms.eyebrow).toBeTruthy();
      expect(terms.heading).toBeTruthy();
      expect(terms.updated).toBeTruthy();
      expect(terms.contactHeading).toBeTruthy();
      expect(terms.contactBeforeLink).toBeTruthy();
      expect(terms.contactLink).toBeTruthy();
      expect(terms.contactAfterLink).toBeTruthy();
    }
  });

  it('provides translated copy in kk, en and zh instead of Russian fallback', () => {
    for (const locale of ['kz', 'en', 'zh'] as const) {
      const terms = termsFor(locale);
      const copy = [
        terms.eyebrow,
        terms.heading,
        terms.updated,
        terms.contactHeading,
        terms.contactBeforeLink,
        terms.contactLink,
        terms.contactAfterLink,
        ...terms.sections.flatMap(({ heading, body }) => [heading, ...body]),
      ].join(' ');
      const russian = termsFor('ru');
      expect(terms.eyebrow).not.toBe(russian.eyebrow);
      expect(terms.heading).not.toBe(russian.heading);
      expect(terms.updated).not.toBe(russian.updated);
      expect(terms.contactHeading).not.toBe(russian.contactHeading);
      expect(terms.contactBeforeLink).not.toBe(russian.contactBeforeLink);
      expect(terms.contactLink).not.toBe(russian.contactLink);
      for (const [index, section] of terms.sections.entries()) {
        expect(section.heading).not.toBe(russian.sections[index].heading);
        section.body.forEach((paragraph, paragraphIndex) => {
          expect(paragraph).not.toBe(
            russian.sections[index].body[paragraphIndex]
          );
        });
      }
      if (locale !== 'kz') expect(copy).not.toMatch(/[А-Яа-яЁё]/);
    }
  });
});
