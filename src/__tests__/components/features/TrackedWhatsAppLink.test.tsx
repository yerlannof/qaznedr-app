import { fireEvent, render, screen } from '@testing-library/react';
import TrackedWhatsAppLink from '@/components/features/TrackedWhatsAppLink';
import { safeTrack } from '@/lib/analytics/events';

jest.mock('@/lib/analytics/events', () => ({ safeTrack: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

it('opens WhatsApp in a new tab and counts the click', () => {
  render(
    <TrackedWhatsAppLink
      href="https://wa.me/77000000000?text=hi"
      locale="ru"
      place="equipment_assisted"
      className="x"
    >
      Написать
    </TrackedWhatsAppLink>
  );
  const link = screen.getByRole('link', { name: 'Написать' });
  expect(link).toHaveAttribute('href', 'https://wa.me/77000000000?text=hi');
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  expect(link).toHaveClass('x');
  expect(link).not.toHaveAttribute('data-contact');
  link.addEventListener('click', (event) => event.preventDefault());
  fireEvent.click(link);
  expect(safeTrack).toHaveBeenCalledWith('click_whatsapp', {
    locale: 'ru',
    place: 'equipment_assisted',
    lead: undefined,
  });
});

it('keeps the data-contact marker for the listing contact beacon', () => {
  render(
    <TrackedWhatsAppLink
      href="https://wa.me/77000000000"
      locale="kz"
      place="equipment_team"
      contact
    >
      Team
    </TrackedWhatsAppLink>
  );
  expect(screen.getByRole('link', { name: 'Team' })).toHaveAttribute(
    'data-contact'
  );
});
