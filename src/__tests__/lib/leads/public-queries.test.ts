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

describe('listPublishedLeads failures', () => {
  it('rejects database failures instead of returning a valid empty catalogue', async () => {
    const original = builder.then;
    builder.then = (resolve: (v: unknown) => void) =>
      resolve({
        data: null,
        count: null,
        error: { message: 'private database detail' },
      });
    try {
      await expect(listPublishedLeads()).rejects.toThrow(
        'Unable to load areas'
      );
    } finally {
      builder.then = original;
    }
  });
  it('keeps a successful empty catalogue valid', async () => {
    await expect(listPublishedLeads()).resolves.toMatchObject({
      leads: [],
      total: 0,
    });
  });
});

describe('mineral and geological type filters', () => {
  it('selects exact source values for a hub, including multiple metals without substring false positives', async () => {
    const originalThen = builder.then;
    const originalSelect = builder.select;
    const originalEq = builder.eq;
    let columns = '';
    const selected = jest.fn(() => builder);
    const equal = jest.fn(() => builder);
    builder.in = selected;
    builder.eq = equal;
    builder.select = (value: string) => {
      columns = value;
      return builder;
    };
    builder.then = (resolve: (value: unknown) => void) =>
      resolve(
        columns === 'mineral'
          ? {
              data: [
                { mineral: 'Au' },
                { mineral: 'Au+Cu' },
                { mineral: 'bauxite' },
              ],
              error: null,
            }
          : { data: [], count: 0, error: null }
      );
    try {
      await listPublishedLeads({ mineral: 'gold', type: 'bedrock' });
      expect(selected).toHaveBeenCalledWith('mineral', ['Au', 'Au+Cu']);
      expect(equal).toHaveBeenCalledWith('type', 'bedrock');
      expect(equal).not.toHaveBeenCalledWith('mineral', 'gold');
    } finally {
      builder.then = originalThen;
      builder.select = originalSelect;
      builder.eq = originalEq;
    }
  });
});

describe('showcase order', () => {
  beforeEach(() => {
    orders.length = 0;
  });

  it('shows cards in the delivered package order by default', async () => {
    await listPublishedLeads();
    expect(orders[0]).toEqual([
      'sort_order',
      { ascending: true, nullsFirst: false },
    ]);
  });

  it('ships the showcase card with every public teaser row', () => {
    const { TEASER_COLUMNS } = jest.requireActual('@/lib/leads/types');
    expect(TEASER_COLUMNS.split(',')).toEqual(
      expect.arrayContaining(['showcase', 'sort_order'])
    );
  });
});
