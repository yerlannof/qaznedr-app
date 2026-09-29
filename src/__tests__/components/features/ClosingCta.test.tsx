import { render } from '@testing-library/react';
import ClosingCta from '@/components/features/ClosingCta';
import { GUIDE } from '@/lib/insights/registry';

it('keeps the guide slug in the closing contact link', () => {
  const { container } = render(
    <ClosingCta locale="en" variant="brand" guideSlug={GUIDE.geologicalMap} />
  );
  expect(container.querySelector('a[href^="/en/contact"]')).toHaveAttribute(
    'href',
    `/en/contact?guide=${GUIDE.geologicalMap}`
  );
});

it('preserves an approved service topic in the closing contact action', () => {
  const { container } = render(
    <ClosingCta locale="en" variant="brand" serviceTopic="geology" />
  );
  expect(container.querySelector('a[href^="/en/contact"]')).toHaveAttribute(
    'href',
    '/en/contact?service=geology'
  );
});

it('keeps the general closing contact action without a service topic', () => {
  const { container } = render(<ClosingCta locale="en" variant="brand" />);
  expect(container.querySelector('a[href^="/en/contact"]')).toHaveAttribute(
    'href',
    '/en/contact'
  );
});
