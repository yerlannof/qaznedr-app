/**
 * @jest-environment node
 */
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import { searchEquipmentCatalog } from '@/lib/equipment-listings/catalog-repository';
import {
  cleanFilters,
  confirmSubscription,
  sendDigests,
  subscribe,
} from '@/lib/equipment-listings/subscriptions';

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/email/resend', () => ({ sendEmail: jest.fn() }));
jest.mock('@/lib/equipment-listings/catalog-repository', () => ({
  searchEquipmentCatalog: jest.fn(),
}));

type Call = { table: string; op: string; args: unknown[] };
let calls: Call[];
let results: Record<string, unknown>;
function chain(table: string) {
  const q: Record<string, unknown> = {};
  const record =
    (op: string) =>
    (...args: unknown[]) => {
      calls.push({ table, op, args });
      return q;
    };
  for (const op of [
    'select',
    'eq',
    'gte',
    'not',
    'order',
    'limit',
    'insert',
    'update',
    'delete',
  ])
    q[op] = record(op);
  q.then = (resolve: (v: unknown) => void) => {
    const ops = calls.filter((c) => c.table === table).map((c) => c.op);
    const key = ops.includes('insert')
      ? 'insert'
      : ops.includes('update')
        ? 'update'
        : ops.includes('delete')
          ? 'delete'
          : 'select';
    const queue = results[key] as unknown[];
    resolve(
      Array.isArray(queue) && queue.length ? queue.shift() : results[key]
    );
    calls = calls.filter((c) => c.table !== table);
  };
  return q;
}
beforeEach(() => {
  jest.clearAllMocks();
  calls = [];
  results = {};
  process.env.NEXTAUTH_SECRET = 's';
  (createServiceClient as jest.Mock).mockResolvedValue({ from: chain });
});

it('keeps only valid catalogue filters', () => {
  expect(
    cleanFilters({ category: 'drill', region: 'karagandy', page: '3' })
  ).toEqual({
    category: 'drill',
    region: 'karagandy',
  });
  expect(cleanFilters({ category: 'nope' })).toBeNull();
  expect(cleanFilters({ category: 'drill', offerType: 'SERVICE' })).toBeNull();
  expect(cleanFilters([])).toBeNull();
});

it('stores hashes and mails a confirmation link', async () => {
  results.select = [
    { count: 0, error: null },
    { count: 0, error: null },
  ];
  results.insert = { error: null };
  await expect(
    subscribe({
      email: ' A@Mail.kz ',
      filters: { category: 'drill' },
      locale: 'kz',
      ip: '1.1.1.1',
    })
  ).resolves.toBe('sent');
  const mail = (sendEmail as jest.Mock).mock.calls[0][0];
  expect(mail.to).toBe('a@mail.kz');
  expect(mail.text).toMatch(
    /\/kz\/equipment\/subscription#confirm=[A-Za-z0-9_-]{43}/
  );
});

it('limits subscriptions per IP', async () => {
  results.select = [
    { count: 5, error: null },
    { count: 0, error: null },
  ];
  await expect(
    subscribe({ email: 'a@mail.kz', filters: {}, locale: 'ru', ip: '1.1.1.1' })
  ).resolves.toBe('rate_limited');
  expect(sendEmail).not.toHaveBeenCalled();
});

it('confirms only with a well-formed known token', async () => {
  await expect(confirmSubscription('short')).resolves.toBe(false);
  results.update = { data: [{ id: 'x' }], error: null };
  await expect(confirmSubscription('A'.repeat(43))).resolves.toBe(true);
});

it('mails only listings newer than the last letter', async () => {
  results.select = {
    data: [
      {
        id: '00000000-0000-4000-8000-000000000001',
        email: 'a@mail.kz',
        filters: { category: 'drill' },
        locale: 'ru',
        confirmed_at: '2026-10-10T00:00:00Z',
        last_sent_at: '2026-10-14T00:00:00Z',
      },
    ],
    error: null,
  };
  results.update = { error: null };
  (searchEquipmentCatalog as jest.Mock).mockResolvedValue({
    items: [
      {
        id: 'new',
        title: 'Буровая',
        offerType: 'RENT',
        category: 'drill',
        region: 'karagandy',
        updatedAt: '2026-10-15T00:00:00Z',
      },
      {
        id: 'old',
        title: 'Старая',
        offerType: 'RENT',
        category: 'drill',
        region: 'karagandy',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    ],
  });
  await expect(sendDigests()).resolves.toEqual({ checked: 1, sent: 1 });
  const mail = (sendEmail as jest.Mock).mock.calls[0][0];
  expect(mail.subject).toBe('Новые объявления на QAZNEDR: 1');
  expect(mail.text).toContain('/ru/equipment/new');
  expect(mail.text).not.toContain('Старая');
  expect(mail.text).toMatch(/#unsubscribe=[A-Za-z0-9_-]{43}/);
});
