import { renderToStaticMarkup } from 'react-dom/server';
import InsightArticlePage from '@/app/[locale]/insights/[slug]/page';
import { getArticle } from '@/lib/insights/content';
import { INSIGHTS } from '@/lib/insights/registry';
import type { Locale } from '@/lib/seo/site';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('@/components/features/ClosingCta', () => () => null);
jest.mock('@/components/features/GeologicalSupport', () => () => null);

const sourceHeadings = new Set([
  'Источники',
  'Sources',
  'Дереккөздер',
  '参考资料',
]);

const pages = INSIGHTS.flatMap((entry) =>
  entry.locales.map((locale) => ({ slug: entry.slug, locale }))
);

it.each(pages)(
  '$locale/$slug cites exactly the visible Sources links',
  async ({ slug, locale }) => {
    const article = getArticle(slug, locale as Locale);
    expect(article).not.toBeNull();
    const root = document.createElement('div');
    root.innerHTML = article!.html;
    const heading = [...root.querySelectorAll('h2')].find((node) =>
      sourceHeadings.has(node.textContent?.trim() ?? '')
    );
    expect(heading).toBeDefined();
    const visibleUrls: string[] = [];
    let sibling = heading!.nextElementSibling;
    while (sibling && sibling.tagName !== 'H2') {
      for (const link of sibling.querySelectorAll('a[href]')) {
        const url = new URL(link.getAttribute('href')!);
        if (
          ['http:', 'https:'].includes(url.protocol) &&
          url.hostname !== 'qaznedr.kz' &&
          !visibleUrls.includes(url.href)
        ) {
          visibleUrls.push(url.href);
        }
      }
      sibling = sibling.nextElementSibling;
    }
    expect(visibleUrls.length).toBeGreaterThan(0);
    const html = renderToStaticMarkup(
      await InsightArticlePage({ params: Promise.resolve({ slug, locale }) })
    );
    const blocks = [
      ...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g),
    ];
    const schema = blocks
      .map((match) => JSON.parse(match[1]))
      .find((data) => data['@type'] === 'Article');
    expect(schema.citation).toEqual(visibleUrls);
  }
);
