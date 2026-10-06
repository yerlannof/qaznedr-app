/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Footer from '@/components/layouts/Footer';
import ServicesPage from '@/app/[locale]/services/page';
import LegalServicesPage, {
  generateMetadata as legalMetadata,
} from '@/app/[locale]/services/legal/page';
import GeologicalServicesPage, {
  generateMetadata as geologicalMetadata,
} from '@/app/[locale]/services/geological/page';
import { GUIDE } from '@/lib/insights/registry';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

const pages = [
  ['services', ServicesPage, undefined],
  ['services/legal', LegalServicesPage, 'licensing'],
  ['services/geological', GeologicalServicesPage, 'geology'],
] as const;

it.each(['ru', 'kz', 'en', 'zh'] as const)(
  'propagates a known guide through service CTAs in %s',
  async (locale) => {
    const slug = GUIDE.geologicalDueDiligence;
    for (const [path, Page, topic] of pages) {
      const html = renderToStaticMarkup(
        await Page({
          params: Promise.resolve({ locale }),
          searchParams: Promise.resolve({ guide: slug }),
        })
      );
      expect(html).toContain(
        `/${locale}/contact?${topic ? `service=${topic}&amp;` : ''}guide=${slug}`
      );
      if (topic)
        expect(html).toContain(`href="/${locale}/services?guide=${slug}"`);
      else {
        expect(html).toContain(
          `href="/${locale}/services/legal?guide=${slug}"`
        );
        expect(html).toContain(
          `href="/${locale}/services/geological?guide=${slug}"`
        );
      }
      expect(html).not.toContain(`https://qaznedr.kz/${locale}/${path}?guide=`);
    }
  }
);

it.each([['unknown'], [[GUIDE.geologicalDueDiligence]]] as const)(
  'ignores invalid or array service guide',
  async (value) => {
    const html = renderToStaticMarkup(
      await LegalServicesPage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({ guide: value }),
      })
    );
    expect(html).toContain('/en/contact?service=licensing');
    expect(html).not.toContain('/en/contact?service=licensing&amp;guide=');
  }
);

it('keeps metadata URLs queryless', async () => {
  for (const metadata of [legalMetadata, geologicalMetadata]) {
    const result = await metadata({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({ guide: GUIDE.geologicalDueDiligence }),
    });
    expect(String(result.alternates?.canonical)).not.toContain('?');
    expect(JSON.stringify(result.openGraph)).not.toContain('guide=');
  }
});

it('keeps direct service visit footer context unchanged', async () => {
  for (const [, Page] of pages) {
    (Footer as jest.Mock).mockClear();
    renderToStaticMarkup(
      await Page({ params: Promise.resolve({ locale: 'ru' }) })
    );
    expect((Footer as jest.Mock).mock.calls[0][0]).toMatchObject({
      guideSlug: undefined,
    });
    expect((Footer as jest.Mock).mock.calls[0][0].serviceTopic).toBeUndefined();
  }
});
