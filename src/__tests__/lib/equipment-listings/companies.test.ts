/**
 * @jest-environment node
 */
import {
  companyInputSchema,
  companySlug,
} from '@/lib/equipment-listings/companies';

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

it.each([
  ['ТОО «Бур-Сервис»', 'bur-servis'],
  ['Қазгеофизика', 'kazgeofizika'],
  ['GeoDrill LLP', 'geodrill-llp'],
  ['ИП Ерлан', 'erlan'],
  ['АБ', 'company-ab'],
])('slug for %s', (name, slug) => {
  expect(companySlug(name)).toBe(slug);
});

it('normalizes the website and empty fields', () => {
  expect(
    companyInputSchema.parse({
      name: ' Бур-Сервис ',
      website: 'bur-servis.kz',
      city: '',
      description: '',
    })
  ).toEqual({
    name: 'Бур-Сервис',
    website: 'https://bur-servis.kz',
    city: null,
    description: null,
  });
  expect(
    companyInputSchema.parse({ name: 'AB', website: 'http://x.kz/about' })
      .website
  ).toBe('https://x.kz/about');
});

it('rejects bad websites and unknown fields', () => {
  expect(
    companyInputSchema.safeParse({ name: 'AB', website: 'not a site' }).success
  ).toBe(false);
  expect(
    companyInputSchema.safeParse({ name: 'AB', status: 'ACTIVE' }).success
  ).toBe(false);
});
