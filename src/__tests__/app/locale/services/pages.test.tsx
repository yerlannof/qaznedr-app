/** @jest-environment node */
import React from 'react';
import { translate } from '@/lib/i18n/translations';
import { renderToStaticMarkup } from 'react-dom/server';
import ServicesPage from '@/app/[locale]/services/page';
import GeologicalServicesPage, {
  generateMetadata as geologicalMetadata,
} from '@/app/[locale]/services/geological/page';
import LegalServicesPage, {
  generateMetadata as legalMetadata,
} from '@/app/[locale]/services/legal/page';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);

const titles: Record<string, string[]> = {
  ru: [
    'Лицензирование',
    'Геология и полевые работы',
    'Due diligence участка',
    'Аналитика',
  ],
  kz: [
    'Лицензиялау',
    'Геология және далалық жұмыстар',
    'Учаскеге қатысты due diligence',
    'Талдау',
  ],
  en: ['Licensing', 'Geology and fieldwork', 'Area due diligence', 'Analytics'],
  zh: ['许可证办理', '地质与野外工作', '矿区尽职调查', '分析'],
};

it.each(['ru', 'kz', 'en', 'zh'])(
  'server-renders four approved %s services and contextual contact links',
  async (locale) => {
    const html = renderToStaticMarkup(
      await ServicesPage({ params: Promise.resolve({ locale }) })
    );
    for (const title of titles[locale]) expect(html).toContain(title);
    for (const slug of ['licensing', 'geology', 'due-diligence', 'analytics']) {
      expect(html).toContain(`/${locale}/contact?service=${slug}`);
    }
    expect(html).toContain(`/${locale}/services/geological`);
    expect(html).toContain(`/${locale}/services/legal`);
    expect(html).toContain('"@type":"Service"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).not.toMatch(
      /Идёт набор|поставщик|Найдите эксперта|type="search"/i
    );
  }
);

it.each([
  ['geological', GeologicalServicesPage, geologicalMetadata, 'geology'],
  ['legal', LegalServicesPage, legalMetadata, 'licensing'],
] as const)(
  'renders approved %s detail and metadata on four locales',
  async (_kind, Page, metadata, slug) => {
    for (const locale of ['ru', 'kz', 'en', 'zh']) {
      const html = renderToStaticMarkup(
        await Page({ params: Promise.resolve({ locale }) })
      );
      expect(html).toContain(`/${locale}/contact?service=${slug}`);
      expect(html).not.toContain(`href="/${locale}/contact"`);
      expect(html).toContain('"@type":"Service"');
      expect(html).toContain('"@type":"BreadcrumbList"');
      expect(html).not.toMatch(
        /Идёт набор|поставщик|Найдите эксперта|type="search"/i
      );
      const meta = await metadata({ params: Promise.resolve({ locale }) });
      expect(meta.description).toBe(
        translate(
          locale,
          _kind === 'legal'
            ? 'seo.servicesLegal.description'
            : 'seo.servicesGeological.description'
        )
      );
      expect(meta.title).toEqual(
        expect.objectContaining({
          absolute: expect.stringContaining(
            translate(
              locale,
              _kind === 'legal'
                ? 'seo.servicesLegal.title'
                : 'seo.servicesGeological.title'
            )
          ),
        })
      );
      expect(meta.alternates?.canonical).toBe(
        `https://qaznedr.kz/${locale}/services/${_kind}`
      );
    }
  }
);
