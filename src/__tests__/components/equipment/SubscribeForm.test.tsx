import { fireEvent, render, screen } from '@testing-library/react';
import SubscribeForm from '@/components/equipment/catalog/SubscribeForm';

it('subscribes to the filters on screen', async () => {
  const fetcher = jest.fn().mockResolvedValue({ ok: true, status: 200 });
  render(
    <SubscribeForm
      locale="ru"
      filters={{ category: 'drill', region: 'karagandy' }}
      fetcher={fetcher as unknown as typeof fetch}
    />
  );
  fireEvent.change(screen.getByLabelText('Электронная почта'), {
    target: { value: 'a@mail.kz' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Подписаться' }));
  expect(await screen.findByRole('status')).toHaveTextContent(
    'подтвердите подписку'
  );
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
    email: 'a@mail.kz',
    filters: { category: 'drill', region: 'karagandy' },
    locale: 'ru',
  });
});
