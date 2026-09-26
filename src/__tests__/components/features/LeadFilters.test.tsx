import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import LeadFilters from '@/components/features/LeadFilters';

const filters = {
  mineral: 'copper',
  region: 'Карагандинская',
  type: 'bedrock' as const,
  tier: 'TIER2_BOMB',
  freeOnly: true,
  sort: 'newest' as const,
};

it('offers actual mineral and geological type filters while retaining legacy tier', () => {
  render(
    <LeadFilters locale="en" filters={filters} regions={['Карагандинская']} />
  );
  const desktop = screen.getByTestId('desktop-lead-filters');
  expect(within(desktop).getByLabelText('Mineral')).toHaveValue('copper');
  expect(within(desktop).getByLabelText('Type')).toHaveValue('bedrock');
  expect(within(desktop).getByLabelText('Region')).toHaveValue(
    'Карагандинская'
  );
  expect(within(desktop).getByDisplayValue('Copper')).toBeInTheDocument();
  expect(desktop.querySelector('input[name="tier"]')).toHaveValue('TIER2_BOMB');
  expect(within(desktop).getByLabelText('Free only')).toBeChecked();
});

it('shows selected filters outside mobile sheet and restores focus after Escape', async () => {
  render(
    <LeadFilters locale="en" filters={filters} regions={['Карагандинская']} />
  );
  const trigger = screen.getByRole('button', { name: 'Filters' });
  fireEvent.click(trigger);
  const sheet = screen.getByRole('dialog');
  expect(within(sheet).getByLabelText('Mineral')).toHaveValue('copper');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(screen.getByTestId('selected-lead-filters')).toHaveTextContent(
    'Copper'
  );
});

it('localizes the mobile close control', () => {
  render(<LeadFilters locale="ru" filters={{}} regions={[]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Фильтры' }));
  expect(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Закрыть' })
  ).toBeInTheDocument();
});

it('makes a retained commercial tier visible rather than silently narrowing results', () => {
  render(<LeadFilters locale="en" filters={filters} regions={[]} />);
  expect(screen.getByTestId('selected-lead-filters')).toHaveTextContent(
    'Investment object'
  );
});
