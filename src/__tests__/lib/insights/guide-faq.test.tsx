/** @jest-environment node */
import { renderToStaticMarkup } from 'react-dom/server';
import InsightArticlePage from '@/app/[locale]/insights/[slug]/page';
import { getArticle, guideFaq } from '@/lib/insights/content';
import { INSIGHTS } from '@/lib/insights/registry';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);

// Visible text of rendered HTML, as a reader sees it: block tags separate
// words, inline tags (links, emphasis) do not.
const visibleText = (html: string) =>
  html
    .replace(/<\/?(p|h[1-6]|li|ul|ol|div|table|tr|td|th|br)\b[^>]*>/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');

const schemas = (html: string) =>
  [
    ...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g),
  ].map((match) => JSON.parse(match[1]));

describe('guideFaq', () => {
  it('reads bold-question paragraphs under the FAQ heading', () => {
    expect(
      guideFaq(
        [
          '## Intro',
          '',
          '**Not a question?** Outside the block.',
          '',
          '## Frequently asked questions',
          '',
          '**Can I buy it?** No: see [the guide](/en/insights/x).',
          '',
          '**Is it free?** Check the *registry* first.',
          '',
          '## Next section',
          '',
          '**Later?** Not part of the FAQ.',
        ].join('\n')
      )
    ).toEqual([
      { q: 'Can I buy it?', a: 'No: see the guide.' },
      { q: 'Is it free?', a: 'Check the registry first.' },
    ]);
  });

  it('reads H3 questions with their answer paragraphs', () => {
    expect(
      guideFaq(
        [
          '## Частые вопросы',
          '',
          '### Можно ли по цвету найти золото?',
          '',
          'Нет. Цвет — «подразделение» по легенде.',
          '',
          '### Что отправить геологу?',
          '',
          'Полный лист с легендой.',
          '',
          'И короткий вопрос.',
          '',
          '## Источники',
          '',
          '- [USGS](https://usgs.gov)',
        ].join('\n')
      )
    ).toEqual([
      {
        q: 'Можно ли по цвету найти золото?',
        a: 'Нет. Цвет — «подразделение» по легенде.',
      },
      {
        q: 'Что отправить геологу?',
        a: 'Полный лист с легендой. И короткий вопрос.',
      },
    ]);
  });

  it('returns nothing for a guide without the block', () => {
    expect(guideFaq('## Intro\n\n**Bold** text.\n')).toEqual([]);
  });
});

// Guides with a «Частые вопросы» block on 12 Nov 2026 (audit Н5) and their
// question counts, the same in every language.
const EXPECTED: Record<string, number> = {
  'artisanal-mining-licence-kazakhstan': 4,
  'how-to-read-geological-map': 3,
  'pugfn-subsoil-fund-program-kazakhstan': 4,
  'satellite-gold-map-guide': 3,
};

describe.each(
  INSIGHTS.flatMap((entry) =>
    entry.locales.map((locale) => [entry.slug, locale] as const)
  )
)('%s (%s)', (slug, locale) => {
  it('marks up exactly the visible FAQ, or none', async () => {
    const article = getArticle(slug, locale)!;
    expect(article.faq).toHaveLength(EXPECTED[slug] ?? 0);
    const html = renderToStaticMarkup(
      await InsightArticlePage({ params: Promise.resolve({ locale, slug }) })
    );
    const faqPages = schemas(html).filter((s) => s['@type'] === 'FAQPage');
    if (!EXPECTED[slug]) {
      expect(faqPages).toHaveLength(0);
      return;
    }
    expect(faqPages).toHaveLength(1);
    const text = visibleText(article.html);
    const entities = faqPages[0].mainEntity;
    expect(entities).toHaveLength(EXPECTED[slug]);
    for (const item of entities) {
      expect(item['@type']).toBe('Question');
      expect(item.acceptedAnswer['@type']).toBe('Answer');
      expect(text).toContain(item.name);
      expect(text).toContain(item.acceptedAnswer.text);
    }
  });

  it('gives the Article its Open Graph image', async () => {
    const html = renderToStaticMarkup(
      await InsightArticlePage({ params: Promise.resolve({ locale, slug }) })
    );
    const article = schemas(html).find((s) => s['@type'] === 'Article');
    expect(article.image).toMatch(
      new RegExp(
        `^https://qaznedr\\.kz/${locale}/insights/${slug}/opengraph-image\\?v=`
      )
    );
  });
});
