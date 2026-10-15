import { fireEvent, render, screen } from '@testing-library/react';
import ResponseForm from '@/components/equipment/catalog/ResponseForm';

const fill = () => {
  fireEvent.change(screen.getByLabelText('Имя или компания'), {
    target: { value: 'Бур-Сервис' },
  });
  fireEvent.change(screen.getByLabelText('Телефон'), {
    target: { value: '8 701 123 45 67' },
  });
  fireEvent.change(screen.getByLabelText('Предложение'), {
    target: { value: 'Есть УКБ-5, 300 тыс. за смену' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Отправить предложение' })
  );
};

it('sends the offer and thanks the visitor', async () => {
  const fetcher = jest.fn().mockResolvedValue({ ok: true, status: 200 });
  render(
    <ResponseForm
      listingId="abc"
      locale="ru"
      fetcher={fetcher as unknown as typeof fetch}
    />
  );
  fill();
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Предложение отправлено'
  );
  expect(fetcher.mock.calls[0][0]).toBe('/api/equipment-catalog/abc/responses');
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
    name: 'Бур-Сервис',
    phone: '8 701 123 45 67',
    message: 'Есть УКБ-5, 300 тыс. за смену',
  });
});

it('explains a repeated offer', async () => {
  const fetcher = jest.fn().mockResolvedValue({ ok: false, status: 429 });
  render(
    <ResponseForm
      listingId="abc"
      locale="ru"
      fetcher={fetcher as unknown as typeof fetch}
    />
  );
  fill();
  expect(await screen.findByRole('alert')).toHaveTextContent('уже отправили');
});
