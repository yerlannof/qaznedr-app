import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import OwnerCabinet from '@/components/equipment/OwnerCabinet';

let mockStatus = 'authenticated';
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data:
      mockStatus === 'authenticated'
        ? { user: { id: 'owner-1', email: 'a@example.com' } }
        : null,
    status: mockStatus,
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));
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

const base = {
  ownerId: 'owner-1',
  revision: 2,
  data: {
    schemaVersion: 2,
    offerType: 'RENT',
    category: 'excavator',
    kind: 'BULLDOZER',
    title: 'Бульдозер',
    region: 'abai',
    city: 'Семей',
  },
};
const listings = [
  {
    ...base,
    id: '00000000-0000-4000-8000-000000000001',
    status: 'REJECTED',
    moderationNotes: 'Контакты в тексте',
  },
  {
    ...base,
    id: '00000000-0000-4000-8000-000000000002',
    status: 'ACTIVE',
    data: { ...base.data, title: 'Буровая' },
  },
  {
    ...base,
    id: '00000000-0000-4000-8000-000000000003',
    status: 'DRAFT',
    data: { schemaVersion: 2 },
  },
];

function mockFetch() {
  const fn = jest.fn(async (url: string, init?: RequestInit) => {
    if (url === '/api/equipment-listings')
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: listings,
          trustMarks: {
            '00000000-0000-4000-8000-000000000002': [
              { mark: 'PHONE_CONFIRMED', setAt: '2026-10-12T00:00:00Z' },
            ],
          },
        }),
      };
    if (url === '/api/profile')
      return {
        ok: true,
        json: async () => ({
          profile: {
            full_name: 'Айдар',
            email: 'a@example.com',
            company_name: null,
            phone: '+77001234567',
          },
        }),
      };
    if (url.endsWith('/archive'))
      return {
        ok: true,
        json: async () => ({ success: true, body: init?.body }),
      };
    return { ok: true, json: async () => ({ success: true, data: [] }) };
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

beforeEach(() => {
  mockStatus = 'authenticated';
  localStorage.clear();
});

it('shows listings as cards with counts, reasons and trust marks', async () => {
  mockFetch();
  render(
    <OwnerCabinet locale="ru" googleEnabled whatsappNumber="77000000000" />
  );
  expect(await screen.findByText('Контакты в тексте')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /Отклонены 1/ })
  ).toBeInTheDocument();
  expect(screen.getByText(/Телефон подтверждён/)).toBeInTheDocument();
  expect(screen.getByText('Без названия')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Карточки/ })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  fireEvent.click(screen.getByRole('button', { name: /Список/ }));
  expect(localStorage.getItem('qaznedr:equipment-cabinet:view')).toBe('list');
  fireEvent.click(screen.getByRole('button', { name: /Отклонены 1/ }));
  expect(screen.queryByText('Буровая')).not.toBeInTheDocument();
});

it('binds the chosen draft for the intake form and archives after confirmation', async () => {
  const fn = mockFetch();
  const assign = jest.fn();
  render(
    <OwnerCabinet
      locale="ru"
      googleEnabled
      whatsappNumber={null}
      navigate={assign}
    />
  );
  fireEvent.click(
    await screen.findByRole('button', { name: 'Исправить и отправить снова' })
  );
  expect(localStorage.getItem('qaznedr:equipment-draft:owner-1')).toBe(
    '00000000-0000-4000-8000-000000000001'
  );
  expect(assign).toHaveBeenCalledWith('/ru/equipment/new');
  fireEvent.click(screen.getByRole('button', { name: 'Изменить' }));
  expect(assign).toHaveBeenLastCalledWith('/ru/equipment/new?edit=1');
  fireEvent.click(screen.getByRole('button', { name: 'Снять с публикации' }));
  fireEvent.click(screen.getByRole('button', { name: 'Да, в архив' }));
  await waitFor(() =>
    expect(fn).toHaveBeenCalledWith(
      '/api/equipment-listings/00000000-0000-4000-8000-000000000002/archive',
      expect.objectContaining({ body: JSON.stringify({ expectedRevision: 2 }) })
    )
  );
});

it('asks a visitor to sign in first', () => {
  mockStatus = 'unauthenticated';
  render(<OwnerCabinet locale="ru" googleEnabled whatsappNumber={null} />);
  expect(
    screen.getByText('Войдите, чтобы увидеть свои объявления')
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Продолжить с Google' })
  ).toBeInTheDocument();
});

it('copies a listing into a new draft and opens it in the form', async () => {
  const fn = mockFetch();
  const base = fn.getMockImplementation()!;
  fn.mockImplementation(async (url: string, init?: RequestInit) =>
    url === '/api/equipment-listings' && init?.method === 'POST'
      ? ({
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            data: { id: '00000000-0000-4000-8000-000000000009' },
          }),
        } as never)
      : base(url, init)
  );
  const navigate = jest.fn();
  render(
    <OwnerCabinet
      locale="ru"
      googleEnabled
      whatsappNumber={null}
      navigate={navigate}
    />
  );
  await screen.findByText('Буровая');
  fireEvent.click(
    screen.getAllByRole('button', { name: 'Разместить похожее' })[1]
  );
  await waitFor(() =>
    expect(navigate).toHaveBeenCalledWith('/ru/equipment/new')
  );
  const post = fn.mock.calls.find(
    ([url, init]) =>
      url === '/api/equipment-listings' && init?.method === 'POST'
  )!;
  expect(JSON.parse(String(post[1]!.body)).title).toBe('Буровая');
  expect(localStorage.getItem('qaznedr:equipment-draft:owner-1')).toBe(
    '00000000-0000-4000-8000-000000000009'
  );
});
