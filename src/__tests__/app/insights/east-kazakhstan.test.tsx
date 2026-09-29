/** @jest-environment node */
import { readFileSync } from 'fs';
import path from 'path';
import { getArticle } from '@/lib/insights/content';
import { GUIDE } from '@/lib/insights/registry';
import { parseFrontMatter } from '@/lib/insights/front-matter';
import type { Locale } from '@/lib/seo/site';

const locales = ['ru', 'kz', 'en', 'zh'] as const satisfies readonly Locale[];
const sourcesHeading = {
  ru: 'Источники',
  kz: 'Дереккөздер',
  en: 'Sources',
  zh: '参考资料',
};
const sourceUrls = [
  'https://www.gov.kz/memleket/entities/mps/press/news/details/945522?lang=ru',
  'https://minerals.e-qazyna.kz/ru/guest/reestr/geological-reports',
  'https://minerals-map.e-qazyna.kz/ru/start',
  'https://www.gov.kz/memleket/entities/geology/press/news/details/1160134?lang=ru',
  'https://www.gov.kz/memleket/entities/mod/press/events/details/15850',
  'https://www.gov.kz/memleket/entities/geology/press/news/details/1143562?lang=ru',
];

it.each(locales)(
  '%s publishes the approved regional guide with sources and links',
  (locale) => {
    const file = path.join(
      process.cwd(),
      'content/insights',
      GUIDE.eastKazakhstanGoldMap,
      `${locale}.md`
    );
    const source = readFileSync(file, 'utf8');
    const { data, body } = parseFrontMatter(source);
    const article = getArticle(GUIDE.eastKazakhstanGoldMap, locale);
    expect(article).not.toBeNull();
    expect(article?.title).toBe(data.title);
    expect(article?.description).toBe(data.description);
    expect(body).not.toMatch(/^# /m);
    expect(body).toMatch(new RegExp(`^## ${sourcesHeading[locale]}$`, 'm'));
    expect(body.match(/^## /gm)).toHaveLength(6);
    expect(body).toContain(`/${locale}/insights/geological-map-kazakhstan`);
    expect(body).toContain(
      `/${locale}/insights/geological-due-diligence-kazakhstan`
    );
    expect(body).toContain(`/${locale}/contact`);
    expect(body).toContain('NDA');
    expect(body).toContain('qaznedr.kz');
    for (const url of sourceUrls) expect(body).toContain(url);
    const internal = [...body.matchAll(/\]\((\/[^)]+)\)/g)].map(
      (match) => match[1]
    );
    expect(internal.every((url) => url.startsWith(`/${locale}/`))).toBe(true);
  }
);

it.each(locales)(
  '%s geological map links readers to the regional guide',
  (locale) => {
    const file = path.join(
      process.cwd(),
      'content/insights/geological-map-kazakhstan',
      `${locale}.md`
    );
    const { body } = parseFrontMatter(readFileSync(file, 'utf8'));
    expect(body).toContain(
      `/${locale}/insights/east-kazakhstan-gold-map-guide`
    );
    expect(body.indexOf('east-kazakhstan-gold-map-guide')).toBeLessThan(
      body.lastIndexOf(`## ${sourcesHeading[locale]}`)
    );
  }
);
