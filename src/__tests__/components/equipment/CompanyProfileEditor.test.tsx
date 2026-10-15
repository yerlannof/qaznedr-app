import { fireEvent, render, screen } from '@testing-library/react';
import CompanyProfileEditor from '@/components/equipment/CompanyProfileEditor';

it('creates a profile that goes to moderation', async () => {
  const fetcher = jest.fn(async (_url: string, init?: RequestInit) =>
    init?.method === 'PUT'
      ? {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              slug: 'bur-servis',
              name: 'ТОО «Бур-Сервис»',
              description: null,
              website: 'https://bur-servis.kz',
              city: 'Караганда',
              status: 'PENDING',
            },
          }),
        }
      : { ok: true, json: async () => ({ success: true, data: null }) }
  );
  render(
    <CompanyProfileEditor
      locale="ru"
      fetcher={fetcher as unknown as typeof fetch}
    />
  );
  fireEvent.click(
    await screen.findByRole('button', { name: 'Создать профиль' })
  );
  fireEvent.change(screen.getByLabelText(/Название компании/), {
    target: { value: 'ТОО «Бур-Сервис»' },
  });
  fireEvent.change(screen.getByLabelText('Сайт'), {
    target: { value: 'bur-servis.kz' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
  expect(
    await screen.findByText('На проверке у модератора')
  ).toBeInTheDocument();
  const put = fetcher.mock.calls.find(([, init]) => init?.method === 'PUT')!;
  expect(JSON.parse(String(put[1]!.body))).toMatchObject({
    name: 'ТОО «Бур-Сервис»',
    website: 'bur-servis.kz',
  });
});

it('links to the published company page', async () => {
  const fetcher = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      success: true,
      data: {
        slug: 'bur-servis',
        name: 'Бур-Сервис',
        description: null,
        website: null,
        city: null,
        status: 'ACTIVE',
      },
    }),
  }));
  render(
    <CompanyProfileEditor
      locale="ru"
      fetcher={fetcher as unknown as typeof fetch}
    />
  );
  expect(
    await screen.findByRole('link', { name: 'Открыть страницу компании' })
  ).toHaveAttribute('href', '/ru/equipment/company/bur-servis');
});
