import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminEquipmentPage from '@/app/[locale]/admin/equipment/page';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({ locale: 'ru' }),
}));

const id = '00000000-0000-4000-8000-000000000007';
const queue = {
  success: true,
  data: [
    {
      id,
      ownerId: 'owner',
      status: 'PENDING_MODERATION',
      revision: 2,
      data: {
        schemaVersion: 2,
        offerType: 'SERVICE',
        category: 'labService',
        serviceMethods: ['FIRE_ASSAY'],
        serviceArea: ['ALL_KZ'],
        title: 'Пробирная лаборатория',
        region: 'abai',
        city: 'Семей',
        availability: 'Сейчас',
        contactName: 'Владелец',
        phone: '+77001112233',
        contactVisibility: 'PRIVATE',
      },
    },
  ],
  trustMarks: { [id]: [{ mark: 'PHONE_CONFIRMED', setAt: '2026-10-15' }] },
  prechecks: {
    [id]: {
      verdict: 'REVIEW',
      flags: [{ code: 'CONTACT_IN_TEXT', note: 'Контакты в тексте' }],
      summary: null,
      model: 'rules',
    },
  },
};

function mockFetch() {
  const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
    if (String(url).includes('/images'))
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { images: [] } }),
      };
    if (init?.method === 'POST')
      return { ok: true, status: 200, json: async () => ({ success: true }) };
    return { ok: true, status: 200, json: async () => queue };
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

it('shows the listing, its pre-check and trust marks in Russian', async () => {
  mockFetch();
  render(<AdminEquipmentPage />);
  expect(await screen.findByText('Пробирная лаборатория')).toBeInTheDocument();
  expect(screen.getByText(/Посмотрите внимательно/)).toBeInTheDocument();
  expect(screen.getByText('Контакты в тексте')).toBeInTheDocument();
  expect(screen.getByText('Пробирный анализ')).toBeInTheDocument();
  expect(screen.getByText('Весь Казахстан')).toBeInTheDocument();
  expect(screen.getByLabelText('Телефон подтверждён')).toBeChecked();
});

it('approves with the current revision and requires a reason to reject', async () => {
  const fetchMock = mockFetch();
  render(<AdminEquipmentPage />);
  await screen.findByText('Пробирная лаборатория');
  expect(screen.getByRole('button', { name: /Отклонить/ })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: /Опубликовать/ }));
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/admin/equipment-listings/${id}/moderate`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ decision: 'APPROVE', expectedRevision: 2 }),
      })
    )
  );
});

it('toggles a trust mark through the trust API', async () => {
  const fetchMock = mockFetch();
  render(<AdminEquipmentPage />);
  await screen.findByText('Пробирная лаборатория');
  fireEvent.click(screen.getByLabelText('Документы просмотрены'));
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/admin/equipment-listings/${id}/trust`,
      expect.objectContaining({
        body: JSON.stringify({ mark: 'DOCUMENTS_REVIEWED', enabled: true }),
      })
    )
  );
});

it('explains when the visitor is not a moderator', async () => {
  global.fetch = jest.fn(async () => ({ ok: false, status: 403 })) as never;
  render(<AdminEquipmentPage />);
  expect(await screen.findByText('Доступ запрещён')).toBeInTheDocument();
});
