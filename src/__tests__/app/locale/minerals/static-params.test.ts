/** @jest-environment node */
import * as hubPage from '@/app/[locale]/minerals/[mineral]/page';
import { MINERAL_HUBS } from '@/lib/leads/minerals';
import { LOCALES } from '@/lib/seo/site';

jest.mock('@/lib/leads/public-queries', () => ({
  listPublishedLeads: jest.fn(),
}));

// Hubs are served from the ISR cache like the home page: prerendered for every
// locale and hub, regenerated at most every five minutes.
it('prerenders every hub in every locale and revalidates every 5 minutes', () => {
  expect(hubPage.revalidate).toBe(300);
  expect('dynamic' in hubPage).toBe(false);
  const params = hubPage.generateStaticParams();
  expect(params).toHaveLength(LOCALES.length * MINERAL_HUBS.length);
  for (const locale of LOCALES)
    for (const { slug } of MINERAL_HUBS)
      expect(params).toContainEqual({ locale, mineral: slug });
});
