/** @jest-environment node */
import * as about from '@/app/[locale]/about/page';
import * as faq from '@/app/[locale]/faq/page';
import * as terms from '@/app/[locale]/legal/terms/page';
import { LOCALES } from '@/lib/seo/site';

// Pages that read no cookies, headers, query or database are prerendered per
// locale. The params live on the pages, not on [locale]/layout.tsx, so pages
// that read data without declaring it stay dynamic.
it.each([
  ['about', about],
  ['faq', faq],
  ['legal/terms', terms],
] as const)('prerenders /%s for every locale', (_, page) => {
  expect(page.generateStaticParams()).toEqual(
    LOCALES.map((locale) => ({ locale }))
  );
  expect('dynamic' in page).toBe(false);
});
