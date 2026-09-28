jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('@/components/features/PortalWelcomeHero', () => () => null);
jest.mock('@/components/features/GeologyScene', () => () => null);
import { render, screen } from '@testing-library/react';
import HomePageContent from '@/components/features/HomePageContent';
import type { LeadTeaser } from '@/lib/leads/types';

const areasTitle = 'Свободные участки с изученной геологией';

it('omits the areas section while no area is published', () => {
  render(
    <HomePageContent
      locale="ru"
      snapshot={{ stats: { total: 0, regions: 0 }, leads: [] }}
    />
  );
  expect(screen.queryByText(areasTitle)).not.toBeInTheDocument();
});

it('keeps the areas section with published teasers', () => {
  const lead = {
    code: 'QN-06',
    mineral: 'Au',
    region: 'Жамбылская',
    type: 'bedrock',
    last_verified: '2026-09-28',
  } as unknown as LeadTeaser;
  render(
    <HomePageContent
      locale="ru"
      snapshot={{ stats: { total: 1, regions: 1 }, leads: [lead] }}
    />
  );
  expect(screen.getByText(areasTitle)).toBeInTheDocument();
});
