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
    'table',
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

describe.each(['ru', 'kz', 'en', 'zh'] as const)(
  '%s insights copy',
  (locale) => {
    it.each(KEYS)('%s is translated in this locale', (key) => {
      const value = own(translations[locale], key);
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    });

    it('keeps placeholders in parametrised strings', () => {
      expect(own(translations[locale], 'insights.readingTime')).toMatch(
        /\{n\}/
      );
      expect(own(translations[locale], 'insights.legalNote')).toMatch(
        /\{date\}/
      );
    });
  }
);
