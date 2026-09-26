/** @jest-environment node */
jest.mock('server-only', () => ({}));

const orders: unknown[][] = [];
const builder: Record<string, unknown> = {};
for (const m of ['from', 'select', 'eq', 'ilike', 'range']) {
  builder[m] = () => builder;
}
builder.order = (...args: unknown[]) => {
  orders.push(args);
  return builder;
};
builder.then = (resolve: (v: unknown) => void) =>
  resolve({ data: [], count: 0, error: null });

// The builder is thenable (awaited for the result), so the client wraps it.
jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ from: () => builder }),
}));

import { listPublishedLeads } from '@/lib/leads/public-queries';

describe('listPublishedLeads paging', () => {
  beforeEach(() => {
    orders.length = 0;
  });

  it.each(['newest', 'value_desc', 'confidence_desc'] as const)(
    '%s ends with a unique tiebreaker so OFFSET pages never overlap',
    async (sort) => {
      await listPublishedLeads({ sort });
      expect(orders.at(-1)).toEqual(['code', { ascending: true }]);
      expect(orders.length).toBeGreaterThanOrEqual(2);
    }
  );
});
