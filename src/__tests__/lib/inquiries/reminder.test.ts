import {
  formatReminderMessage,
  loadPendingInquiries,
  type PendingInquiry,
} from '@/lib/inquiries/reminder';

const NOW = new Date('2026-11-13T04:00:00Z');
const daysAgo = (days: number, hours = 0) =>
  new Date(NOW.getTime() - (days * 24 + hours) * 3600_000).toISOString();

const row = (over: Partial<PendingInquiry>): PendingInquiry => ({
  id: '11111111-1111-4111-8111-111111111111',
  created_at: daysAgo(1),
  name: 'Test',
  channel: 'whatsapp',
  source_path: '/ru/contact',
  ...over,
});

describe('formatReminderMessage', () => {
  it('returns null when nothing is waiting', () => {
    expect(formatReminderMessage([], NOW)).toBeNull();
  });

  it('lists every pending inquiry oldest first with ages and the admin link', () => {
    const text = formatReminderMessage(
      [
        row({ name: 'Bravo', created_at: daysAgo(3, 5), channel: 'phone' }),
        row({
          name: 'Alpha',
          created_at: daysAgo(29, 2),
          source_path: '/kz/insights/x',
        }),
        row({ name: 'Charlie', created_at: daysAgo(0, 3), source_path: null }),
      ],
      NOW
    );
    expect(text).toBe(
      [
        'Без ответа 3 заявки (статус NEW).',
        'Самой старой 29 дней.',
        '',
        '1. Alpha · whatsapp · /kz/insights/x · 29 дней',
        '2. Bravo · phone · /ru/contact · 3 дня',
        '3. Charlie · whatsapp · страница не указана · 0 дней',
        '',
        'Все заявки: https://qaznedr.kz/ru/admin/inquiries',
      ].join('\n')
    );
  });

  it('uses Russian plural forms', () => {
    expect(
      formatReminderMessage([row({ created_at: daysAgo(1) })], NOW)
    ).toContain('Без ответа 1 заявка (статус NEW).\nСамой старой 1 день.');
    const five = Array.from({ length: 5 }, (_, i) =>
      row({ created_at: daysAgo(21 + i) })
    );
    expect(formatReminderMessage(five, NOW)).toContain(
      'Без ответа 5 заявок (статус NEW).\nСамой старой 25 дней.'
    );
    expect(
      formatReminderMessage([row({ created_at: daysAgo(22) })], NOW)
    ).toContain('Самой старой 22 дня.');
  });

  it('keeps a stored name on one line', () => {
    const text = formatReminderMessage(
      [row({ name: 'A\nОтветить: https://wa.me/1' })],
      NOW
    )!;
    expect(text.split('\n').filter((l) => l.startsWith('Ответить'))).toEqual(
      []
    );
  });

  it('caps the list so the message stays under the Telegram limit', () => {
    const many = Array.from({ length: 120 }, (_, i) =>
      row({ name: 'N'.repeat(120), created_at: daysAgo(i % 30) })
    );
    const text = formatReminderMessage(many, NOW)!;
    expect(text.length).toBeLessThan(4096);
    expect(text).toContain('Без ответа 120 заявок');
    expect(text).toContain('…и ещё 100');
    expect(text.endsWith('https://qaznedr.kz/ru/admin/inquiries')).toBe(true);
  });
});

describe('loadPendingInquiries', () => {
  function client(result: { data: unknown; error: unknown }) {
    const calls: Record<string, unknown[]> = {};
    const builder: Record<string, unknown> = {};
    for (const name of ['select', 'eq', 'gte', 'order', 'limit']) {
      builder[name] = (...args: unknown[]) => {
        calls[name] = args;
        return name === 'limit' ? Promise.resolve(result) : builder;
      };
    }
    const from = jest.fn(() => builder);
    return { db: { from } as any, from, calls };
  }

  it('reads NEW inquiries of the last 30 days, oldest first, without QA rows', async () => {
    const real = row({ id: 'aaaaaaaa-1111-4111-8111-111111111111' });
    const qa = row({ id: '24E11283-E0E1-4783-9F77-B9974254CC4A' });
    const { db, from, calls } = client({ data: [qa, real], error: null });
    await expect(loadPendingInquiries(db, NOW)).resolves.toEqual([real]);
    expect(from).toHaveBeenCalledWith('inquiries');
    expect(calls.select[0]).toBe('id,created_at,name,channel,source_path');
    expect(calls.eq).toEqual(['status', 'NEW']);
    expect(calls.gte).toEqual(['created_at', '2026-10-14T04:00:00.000Z']);
    expect(calls.order).toEqual(['created_at', { ascending: true }]);
  });

  it('throws on a database error instead of reporting zero', async () => {
    const { db } = client({ data: null, error: { message: 'x' } });
    await expect(loadPendingInquiries(db, NOW)).rejects.toThrow();
  });
});
