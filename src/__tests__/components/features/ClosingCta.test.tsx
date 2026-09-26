import { render } from '@testing-library/react';
import ClosingCta from '@/components/features/ClosingCta';

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
