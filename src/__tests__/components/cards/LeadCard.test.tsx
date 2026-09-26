import { render, screen } from '@testing-library/react';
import LeadCard from '@/components/cards/LeadCard';
import type { LeadTeaser } from '@/lib/leads/types';

const lead = {
  code: 'CU-42',
  mineral: 'Cu',
  type: 'bedrock',
  region: 'Карагандинская',
  tier: 'TIER2_BOMB',
  exclusivity: 'MASS',
  teaser_title: 'Русское название',
  teaser_summary: null,
  grade_display: '1.2% Cu',
  grade_label: 'локальная проба',
  byproducts_display: null,
  reserve_categories: ['P1'],
  license_status: 'FREE',
  last_verified: '2026-05-14',
  distance_band: null,
  map_centroid: null,
  fair_value_min_usd_m: null,
  fair_value_max_usd_m: null,
  jorc_potential_usd_m: null,
  price_display: null,
  confidence: null,
  status: 'PUBLISHED',
  sold_count: 0,
} as LeadTeaser;

it('shows localized SEO title, code, geology and check date without recasting source grade', () => {
  render(<LeadCard lead={lead} locale="en" />);
  expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(
    /Copper.*CU-42/
  );
  expect(screen.getByText('Karagandy')).toBeInTheDocument();
  expect(screen.getByText('Bedrock')).toBeInTheDocument();
  expect(screen.getByText('14 May 2026')).toBeInTheDocument();
  expect(screen.getByText('1.2% Cu')).toBeInTheDocument();
  expect(screen.getByText('локальная проба')).toHaveAttribute('lang', 'ru');
  expect(screen.queryByText('Русское название')).not.toBeInTheDocument();
  expect(screen.queryByText(/P1/)).not.toBeInTheDocument();
});
