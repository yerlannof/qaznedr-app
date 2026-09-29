import {
  guideContactHref,
  guideFromPath,
  guideSourcePath,
  guideTitle,
  getGuideSlug,
} from '@/lib/insights/contact-context';
import { GUIDE, findInsight } from '@/lib/insights/registry';
import { getArticle, parseArticle } from '@/lib/insights/content';

it('accepts only a single published guide slug', () => {
  expect(getGuideSlug(GUIDE.geologicalDueDiligence)).toBe(
    GUIDE.geologicalDueDiligence
  );
  expect(getGuideSlug([GUIDE.geologicalDueDiligence])).toBeUndefined();
  expect(getGuideSlug('private-notes')).toBeUndefined();
  expect(getGuideSlug('')).toBeUndefined();
});

it.each(['ru', 'kz', 'en', 'zh'] as const)(
  'uses the localized short %s title and safe source path',
  (locale) => {
    const slug = GUIDE.geologicalDueDiligence;
    expect(guideTitle(locale, slug)).toBeTruthy();
    expect(guideSourcePath(locale, slug)).toBe(`/${locale}/insights/${slug}`);
    expect(guideContactHref(locale, slug)).toBe(
      `/${locale}/contact?guide=${slug}`
    );
    expect(guideFromPath(`/${locale}/insights/${slug}`)).toBe(slug);
  }
);

it('keeps existing service context alongside a guide', () => {
  expect(guideContactHref('en', GUIDE.geologicalMap, 'geology')).toBe(
    `/en/contact?service=geology&guide=${GUIDE.geologicalMap}`
  );
  expect(guideFromPath('/en/insights/private-notes')).toBeUndefined();
});

it('rewrites a plain internal article contact link', () => {
  const guide = getArticle(GUIDE.geologicalDueDiligence, 'ru');
  expect(guide?.html).toContain(
    `href="/ru/contact?guide=${GUIDE.geologicalDueDiligence}"`
  );
});

it.each(['ru', 'kz', 'en', 'zh'] as const)(
  'keeps approved service and adds source guide in real %s articles',
  (locale) => {
    for (const slug of [GUIDE.artisanalMining, GUIDE.pugfn]) {
      const article = getArticle(slug, locale);
      expect(article?.html).toContain(
        `href="/${locale}/contact?service=geology&amp;guide=${slug}"`
      );
    }
  }
);

it('leaves unknown service, unrelated query and external contact links unchanged', () => {
  const entry = findInsight(GUIDE.geologicalMap)!;
  const article = parseArticle(
    '---\ntitle: Test\ndescription: Test description\n---\n' +
      '[known](/en/contact?service=geology) ' +
      '[unknown](/en/contact?service=private) ' +
      '[other](/en/contact?ref=private) ' +
      '[external](https://example.com/en/contact?service=geology)',
    entry,
    'en'
  );
  expect(article.html).toContain(
    `href="/en/contact?service=geology&amp;guide=${entry.slug}"`
  );
  expect(article.html).toContain('href="/en/contact?service=private"');
  expect(article.html).toContain('href="/en/contact?ref=private"');
  expect(article.html).toContain(
    'href="https://example.com/en/contact?service=geology"'
  );
});
