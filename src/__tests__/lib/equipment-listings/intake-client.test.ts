import { EquipmentDraftClient } from '@/lib/equipment-listings/intake-client';

const owner = 'b60541ad-9031-41aa-a7c7-25fbe934e427';
const id = 'd9c6411e-7bbd-4bfc-a404-0da264156ebe';
const imageId = '5f3d1a6e-acb3-41bc-9646-c0366d5b80c1';
const draft = {
  schemaVersion: 2 as const,
  offerType: 'RENT' as const,
  category: 'drill' as const,
  title: 'XY-1',
};
const record = (revision = 1, data = draft, status = 'DRAFT') => ({
  id,
  ownerId: owner,
  revision,
  status,
  data,
});
const reply = (data: unknown, status = 200) =>
  Promise.resolve({
    ok: status < 400,
    status,
    json: async () => ({ success: status < 400, data }),
  } as Response);
let fetcher: jest.Mock;
beforeEach(() => {
  fetcher = jest.fn();
  global.fetch = fetcher;
});

it('creates once then patches cleared fields using the current revision', async () => {
  fetcher.mockImplementationOnce(() =>
    reply(record(1, { ...draft, brand: 'A' } as typeof draft), 201)
  );
  fetcher.mockImplementationOnce(() => reply(record(2)));
  const client = new EquipmentDraftClient(owner);
  await client.save({ ...draft, brand: 'A' });
  await client.save(draft);
  expect(fetcher.mock.calls[0][0]).toBe('/api/equipment-listings');
  expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({
    expectedRevision: 1,
    patch: { brand: null },
  });
  expect(client.listing?.revision).toBe(2);
});

it('serializes concurrent saves so responses cannot overwrite a newer edit', async () => {
  let release: (value: Response) => void = () => {};
  fetcher.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = resolve;
      })
  );
  fetcher.mockImplementationOnce(() =>
    reply(record(2, { ...draft, title: 'XY-2' }))
  );
  const client = new EquipmentDraftClient(owner);
  const a = client.save(draft),
    b = client.save({ ...draft, title: 'XY-2' });
  await Promise.resolve();
  await Promise.resolve();
  expect(fetcher).toHaveBeenCalledTimes(1);
  release({
    ok: true,
    status: 201,
    json: async () => ({ success: true, data: record() }),
  } as Response);
  await Promise.all([a, b]);
  expect(JSON.parse(fetcher.mock.calls[1][1].body).expectedRevision).toBe(1);
  expect(client.listing?.data.title).toBe('XY-2');
});

it('snapshots caller data before an operation is queued', async () => {
  fetcher.mockImplementation(() => reply(record(), 201));
  const client = new EquipmentDraftClient(owner),
    input = { ...draft };
  const saving = client.save(input);
  input.title = 'mutated';
  await saving;
  expect(JSON.parse(fetcher.mock.calls[0][1].body).title).toBe('XY-1');
});

it('rejects private identity injection before sending', async () => {
  await expect(
    new EquipmentDraftClient(owner).save({
      ...draft,
      ownerId: 'other',
    } as never)
  ).rejects.toMatchObject({ code: 'INVALID' });
  expect(fetcher).not.toHaveBeenCalled();
});

it('stops automatic creation after an uncertain network outcome', async () => {
  fetcher.mockRejectedValue(new Error('network'));
  const client = new EquipmentDraftClient(owner);
  await expect(client.save(draft)).rejects.toMatchObject({ code: 'UNCERTAIN' });
  await expect(client.save(draft)).rejects.toMatchObject({ code: 'UNCERTAIN' });
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it('stops conflict retries until a deliberate reload', async () => {
  fetcher
    .mockImplementationOnce(() => reply(record(), 201))
    .mockImplementationOnce(() => reply(null, 409))
    .mockImplementationOnce(() => reply(record(3)))
    .mockImplementationOnce(() =>
      reply(record(4, { ...draft, title: 'latest' }))
    );
  const client = new EquipmentDraftClient(owner);
  await client.save(draft);
  await expect(client.save({ ...draft, title: 'local' })).rejects.toMatchObject(
    { code: 'CONFLICT' }
  );
  await expect(client.save({ ...draft, title: 'again' })).rejects.toMatchObject(
    { code: 'CONFLICT' }
  );
  expect(fetcher).toHaveBeenCalledTimes(2);
  await client.load(id);
  await client.save({ ...draft, title: 'latest' });
  expect(JSON.parse(fetcher.mock.calls[3][1].body).expectedRevision).toBe(3);
});

it('never accepts a different owner or a mismatched listing ID', async () => {
  fetcher.mockImplementationOnce(() =>
    reply({ ...record(), ownerId: 'other' }, 201)
  );
  await expect(
    new EquipmentDraftClient(owner).save(draft)
  ).rejects.toMatchObject({ code: 'UNCERTAIN' });
  fetcher.mockImplementationOnce(() => reply({ ...record(), id: owner }));
  await expect(new EquipmentDraftClient(owner).load(id)).rejects.toMatchObject({
    code: 'UNAVAILABLE',
  });
});

it('validates submission before saving and stops edits once pending', async () => {
  const data = {
    ...draft,
    region: 'Абай',
    city: 'Семей',
    availability: 'Ноябрь',
    contactName: 'Автор',
    phone: '+77001234567',
    contactVisibility: 'PRIVATE' as const,
  };
  fetcher
    .mockImplementationOnce(() => reply(record(1, data), 201))
    .mockImplementationOnce(() => reply(record(2, data, 'PENDING_MODERATION')));
  const client = new EquipmentDraftClient(owner);
  await expect(client.submit(draft)).rejects.toMatchObject({ code: 'INVALID' });
  expect(fetcher).not.toHaveBeenCalled();
  await client.submit(data);
  expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({
    expectedRevision: 1,
  });
  await expect(client.save(data)).rejects.toMatchObject({ code: 'INVALID' });
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it('uses photo revisions for the next save and omits private storage paths', async () => {
  const image = {
    id: imageId,
    width: 600,
    height: 800,
    bytes: 100,
    position: 0,
  };
  fetcher
    .mockImplementationOnce(() => reply(record(), 201))
    .mockImplementationOnce(() =>
      reply(
        {
          image: { ...image, storage_path: 'private' },
          revision: 2,
          status: 'DRAFT',
        },
        201
      )
    )
    .mockImplementationOnce(() => reply(record(3, { ...draft, title: 'new' })));
  const client = new EquipmentDraftClient(owner);
  expect(
    await client.upload(
      new File(['data'], 'photo.png', { type: 'image/png' }),
      draft
    )
  ).toEqual(image);
  expect(fetcher.mock.calls[1][1].headers['X-Listing-Revision']).toBe('1');
  await client.save({ ...draft, title: 'new' });
  expect(JSON.parse(fetcher.mock.calls[2][1].body).expectedRevision).toBe(2);
});

it('rejects unsupported photos without creating a draft', async () => {
  const client = new EquipmentDraftClient(owner);
  await expect(
    client.upload(new File(['x'], 'photo.heic', { type: 'image/heic' }), draft)
  ).rejects.toMatchObject({ code: 'INVALID' });
  expect(fetcher).not.toHaveBeenCalled();
});

it('does not retry a mutation after authorization expires', async () => {
  fetcher.mockImplementation(() => reply(null, 401));
  const client = new EquipmentDraftClient(owner);
  await expect(client.save(draft)).rejects.toMatchObject({
    code: 'UNAUTHORIZED',
  });
  await expect(client.save(draft)).rejects.toMatchObject({
    code: 'UNAUTHORIZED',
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it('cancels queued work when its owner session is replaced', async () => {
  let release: (value: Response) => void = () => {};
  fetcher.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = resolve;
      })
  );
  const client = new EquipmentDraftClient(owner);
  const first = client.save(draft);
  const queued = client.save({ ...draft, title: 'Old owner contact' });
  await Promise.resolve();
  await Promise.resolve();
  client.dispose();
  release({
    ok: true,
    status: 201,
    json: async () => ({ success: true, data: record() }),
  } as Response);
  await first;
  await expect(queued).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it('can list owned v2 drafts for deliberate recovery without trusting another owner', async () => {
  fetcher
    .mockImplementationOnce(() =>
      reply([record(), { ...record(), id: owner, data: { offerType: 'RENT' } }])
    )
    .mockImplementationOnce(() => reply([{ ...record(), ownerId: 'other' }]));
  const client = new EquipmentDraftClient(owner);
  expect(await client.recover()).toEqual([record()]);
  expect(fetcher.mock.calls[0][0]).toBe('/api/equipment-listings');
  await expect(client.recover()).rejects.toMatchObject({ code: 'UNAVAILABLE' });
});

it('does not silently load a legacy draft into the v2 form', async () => {
  fetcher.mockImplementationOnce(() =>
    reply({
      ...record(),
      data: {
        offerType: 'RENT',
        category: 'drill',
        method: 'CORE',
        depth: 500,
      },
    })
  );
  const client = new EquipmentDraftClient(owner);
  await expect(client.load(id)).rejects.toMatchObject({ code: 'INVALID' });
  expect(client.listing).toBeNull();
});
