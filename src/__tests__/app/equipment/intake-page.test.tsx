jest.mock(
  '@/components/equipment/EquipmentIntake',
  () => ({ EquipmentIntake: () => null }),
  { virtual: true }
);
jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('404');
  }),
}));
import Page, { generateMetadata } from '@/app/[locale]/equipment/new/page';
import { notFound } from 'next/navigation';
import { EquipmentIntake } from '@/components/equipment/EquipmentIntake';
import type { ReactElement } from 'react';

// The page wraps the form in the site header, <main> and footer.
const form = (page: ReactElement) => {
  const children = (page.props as { children: ReactElement[] }).children;
  const main = children.find((child) => child.type === 'main')!;
  const inner = (main.props as { children: ReactElement }).children;
  expect(inner.type).toBe(EquipmentIntake);
  return inner;
};

const params = Promise.resolve({ locale: 'ru' });
const env = process.env;
beforeEach(() => {
  process.env = { ...env };
  jest.clearAllMocks();
  delete process.env.EQUIPMENT_MARKETPLACE_ENABLED;
  delete process.env.EQUIPMENT_INTAKE_ENABLED;
  delete process.env.MARKETPLACE_IDENTITY_ENABLED;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
});
afterAll(() => {
  process.env = env;
});

it('stays closed unless owner API and intake flags are both enabled', async () => {
  await expect(Page({ params })).rejects.toThrow('404');
  process.env.EQUIPMENT_MARKETPLACE_ENABLED = 'true';
  await expect(Page({ params })).rejects.toThrow('404');
  expect(notFound).toHaveBeenCalledTimes(2);
});
it('renders the approved form without pretending Google is configured', async () => {
  process.env.EQUIPMENT_MARKETPLACE_ENABLED = 'true';
  process.env.EQUIPMENT_INTAKE_ENABLED = 'true';
  const element = form(await Page({ params }));
  expect(element.props).toMatchObject({ locale: 'ru', googleEnabled: false });
  process.env.MARKETPLACE_IDENTITY_ENABLED = 'true';
  process.env.GOOGLE_CLIENT_ID = 'test';
  process.env.GOOGLE_CLIENT_SECRET = 'test';
  expect(form(await Page({ params })).props.googleEnabled).toBe(true);
});
it('keeps the private intake page outside search indexing', async () => {
  const metadata = await generateMetadata({ params });
  expect(metadata.robots).toMatchObject({ index: false, follow: false });
});
