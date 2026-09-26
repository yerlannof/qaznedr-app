/** @jest-environment node */
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/auth/admin', () => ({
  requireAdmin: jest.fn(),
  forbidden: () =>
    jest
      .requireActual('next/server')
      .NextResponse.json({ success: false }, { status: 403 }),
}));

import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { GET, PATCH } from '@/app/api/admin/inquiries/route';

function builder(result: unknown) {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'order', 'limit', 'eq', 'update']) {
    b[m] = jest.fn(() => b);
  }
  b.then = (resolve: (v: unknown) => void) => resolve(result);
  return b as Record<string, jest.Mock> & PromiseLike<unknown>;
}

let q: ReturnType<typeof builder>;
beforeEach(() => {
  q = builder({ data: [{ id: 'i1', status: 'NEW' }], error: null });
  (createServiceClient as jest.Mock).mockResolvedValue({
    from: jest.fn(() => q),
  });
});

describe('/api/admin/inquiries', () => {
  it('403 for non-admins', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(null);
    const res = await GET(
      new NextRequest('https://qaznedr.kz/api/admin/inquiries')
    );
    expect(res.status).toBe(403);
  });

  it('lists inquiries filtered by status', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue({ role: 'super_admin' });
    const res = await GET(
      new NextRequest('https://qaznedr.kz/api/admin/inquiries?status=NEW')
    );
    expect(await res.json()).toEqual({
      success: true,
      data: [{ id: 'i1', status: 'NEW' }],
    });
    expect(q.eq).toHaveBeenCalledWith('status', 'NEW');
  });

  it('validates PATCH status', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue({ role: 'super_admin' });
    const bad = await PATCH(
      new NextRequest('https://qaznedr.kz/api/admin/inquiries', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'i1', status: 'WON' }),
      })
    );
    expect(bad.status).toBe(400);
    const ok = await PATCH(
      new NextRequest('https://qaznedr.kz/api/admin/inquiries', {
        method: 'PATCH',
        body: JSON.stringify({
          id: '3f2b8c1e-9a4d-4e2b-8f1a-2c3d4e5f6a7b',
          status: 'MEETING',
        }),
      })
    );
    expect(ok.status).toBe(200);
    expect(q.update).toHaveBeenCalledWith({ status: 'MEETING' });
  });

  it('400 for a non-uuid id without touching the database', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue({ role: 'super_admin' });
    const res = await PATCH(
      new NextRequest('https://qaznedr.kz/api/admin/inquiries', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'not-a-uuid', status: 'REJECTED' }),
      })
    );
    expect(res.status).toBe(400);
    expect(q.update).not.toHaveBeenCalled();
  });

  it('400 for an unknown status filter', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue({ role: 'super_admin' });
    const res = await GET(
      new NextRequest('https://qaznedr.kz/api/admin/inquiries?status=WON')
    );
    expect(res.status).toBe(400);
    expect(q.eq).not.toHaveBeenCalled();
  });
});
