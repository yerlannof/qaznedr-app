/** @jest-environment node */
import { renderToStaticMarkup } from 'react-dom/server';
import Page from '@/app/[locale]/leads/[code]/page';
import { leadSeoText } from '@/lib/seo/lead-metadata';
jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock(
  '@/components/features/ContactChannels',
  () =>
    function MockChannels({ leadCode }: { leadCode: string }) {
      return <div data-contact-code={leadCode} />;
    }
);
jest.mock(
  '@/components/features/InquiryForm',
  () =>
    function MockForm({ leadCode }: { leadCode: string }) {
      return <div data-form-code={leadCode} />;
    }
);
const lead = {
  code: 'CU-TEST',
  mineral: 'Cu',
  type: 'bedrock',
  region: 'Карагандинская',
  teaser_title: 'Русское название',
  grade_display: '0.4%',
  grade_label: 'среднее',
  reserve_categories: ['P1'],
  last_verified: '2026-09-20',
  license_status: 'FREE',
  status: 'PUBLISHED',
};
jest.mock('@/lib/leads/public-queries', () => ({
  getPublishedLeadByCode: () => Promise.resolve(lead),
}));
it.each(['en', 'zh', 'kz'] as const)(
  'renders localized %s teaser and keeps contact context',
  async (locale) => {
    const html = renderToStaticMarkup(
      await Page({ params: Promise.resolve({ locale, code: lead.code }) })
    );
    expect(html).toContain(leadSeoText(lead, locale).title);
    expect(html).not.toContain('Русское название');
    expect(html).not.toContain('<main');
    expect(html).toContain('data-contact-code="CU-TEST"');
    expect(html).toContain('data-form-code="CU-TEST"');
    expect(html).not.toContain('48.6');
    expect(html).not.toContain('Au content');
    expect(html).toContain('P1');
  }
);
