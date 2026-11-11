jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock(
  '@/components/equipment/catalog/CompanyProfileView',
  () => () => null
);
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('404');
  }),
}));
jest.mock('@/lib/equipment-listings/companies', () => ({
  getActiveCompanyBySlug: jest.fn(),
}));
jest.mock('@/lib/equipment-listings/catalog-repository', () => ({
  activeListingsOfOwner: jest.fn(async () => []),
  coverImagesFor: jest.fn(async () => ({})),
}));
jest.mock('@/lib/equipment-listings/moderation-repository', () => ({
  trustMarksFor: jest.fn(async () => ({})),
}));

import Page, {
  generateMetadata,
} from '@/app/[locale]/equipment/company/[slug]/page';
import { getActiveCompanyBySlug } from '@/lib/equipment-listings/companies';

// Made-up company; no real advertiser data.
const company = {
  slug: 'test-burenie',
  name: 'Тест Бурение',
  ownerId: 'owner-1',
  description: 'Тестовая компания.',
};
const props = (locale: string) => ({
  params: Promise.resolve({ locale, slug: company.slug }),
});
const env = process.env;
beforeEach(() => {
  process.env = {
    ...env,
    EQUIPMENT_MARKETPLACE_ENABLED: 'true',
    EQUIPMENT_CATALOG_ENABLED: 'true',
  };
  jest.clearAllMocks();
  (getActiveCompanyBySlug as jest.Mock).mockResolvedValue(company);
});
afterAll(() => {
  process.env = env;
});

it('has one indexable URL, in Russian, without hreflang', async () => {
  for (const locale of ['ru', 'kz', 'en', 'zh']) {
    const meta = await generateMetadata(props(locale));
    expect(meta.alternates).toEqual({
      canonical: 'https://qaznedr.kz/ru/equipment/company/test-burenie',
    });
    expect(meta.robots).toEqual({ index: true, follow: true });
  }
});

it('keeps an unknown company out of the index', async () => {
  (getActiveCompanyBySlug as jest.Mock).mockResolvedValue(null);
  expect((await generateMetadata(props('ru'))).robots).toEqual({
    index: false,
    follow: false,
  });
  await expect(Page(props('ru'))).rejects.toThrow('404');
});

it('marks up the company with breadcrumbs to its original URL', async () => {
  const page = await Page(props('en'));
  const scripts = (
    page.props.children as {
      type: unknown;
      props: { dangerouslySetInnerHTML?: { __html: string } };
    }[]
  )
    .flat()
    .filter((child) => child?.type === 'script')
    .map((child) => JSON.parse(child.props.dangerouslySetInnerHTML!.__html));
  const breadcrumb = scripts.find((b) => b['@type'] === 'BreadcrumbList');
  expect(breadcrumb.itemListElement).toEqual([
    expect.objectContaining({ position: 1, item: 'https://qaznedr.kz/en' }),
    expect.objectContaining({
      position: 2,
      item: 'https://qaznedr.kz/en/equipment',
    }),
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Тест Бурение',
      item: 'https://qaznedr.kz/ru/equipment/company/test-burenie',
    },
  ]);
  expect(scripts.some((b) => b['@type'] === 'Organization')).toBe(true);
});
