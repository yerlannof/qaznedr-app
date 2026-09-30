/** @jest-environment node */
import {
  createTimedCleanupFetch,
  processImageDeletionBatch,
} from '@/lib/equipment-listings/image-cleanup';

const listingId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const imageId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const token = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const claim = {
  listing_id: listingId,
  image_id: imageId,
  storage_path: `${listingId}/${imageId}.webp`,
  claim_token: token,
  attempts: 1,
};

function fixture(rows: unknown = [claim]) {
  const remove = jest.fn().mockResolvedValue({ error: null });
  let claimCalls = 0;
  const rpc = jest.fn().mockImplementation(async (name: string) => ({
    data:
      name === 'claim_equipment_image_deletions'
        ? claimCalls++ === 0
          ? rows
          : []
        : true,
    error: null,
  }));
  const from = jest.fn().mockReturnValue({ remove });
  return { client: { rpc, storage: { from } }, rpc, from, remove };
}

it('removes one exact queued path from the fixed bucket then acknowledges its token', async () => {
  const { client, rpc, from, remove } = fixture();
  expect(await processImageDeletionBatch(client, 2, 60)).toEqual({
    claimed: 1,
    completed: 1,
    failed: 0,
  });
  expect(from).toHaveBeenCalledWith('equipment-images');
  expect(remove).toHaveBeenCalledWith([claim.storage_path]);
  expect(rpc).toHaveBeenCalledWith('claim_equipment_image_deletions', {
    p_limit: 1,
    p_lease_seconds: 60,
  });
  expect(rpc).toHaveBeenCalledWith('ack_equipment_image_deletion', {
    p_image_id: imageId,
    p_claim_token: token,
  });
});

it('rejects all malformed claims before touching any storage object', async () => {
  for (const bad of [
    { ...claim, storage_path: '../other.webp' },
    { ...claim, listing_id: imageId },
    { ...claim, attempts: 6 },
    { ...claim, unexpected: 'path' },
    { ...claim, claim_token: 'not-a-uuid' },
  ]) {
    const { client, rpc, from } = fixture([bad]);
    await expect(processImageDeletionBatch(client, 2, 60)).rejects.toThrow();
    expect(from).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledTimes(1);
  }
});

it('rejects an invalid multi-row claim response before removing anything', async () => {
  for (const duplicate of [
    claim,
    { ...claim, claim_token: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' },
  ]) {
    const { client, from } = fixture([claim, duplicate]);
    await expect(processImageDeletionBatch(client, 2, 60)).rejects.toThrow();
    expect(from).not.toHaveBeenCalled();
  }
});

it('bounds requested work before RPC', async () => {
  const { client, rpc } = fixture();
  await expect(processImageDeletionBatch(client, 21, 60)).rejects.toThrow();
  await expect(processImageDeletionBatch(client, 1, 301)).rejects.toThrow();
  expect(rpc).not.toHaveBeenCalled();
});

it('fails a storage error and never acknowledges it', async () => {
  const { client, rpc, remove } = fixture();
  remove.mockResolvedValue({ error: new Error('storage unavailable') });
  expect(await processImageDeletionBatch(client, 1, 60)).toEqual({
    claimed: 1,
    completed: 0,
    failed: 1,
  });
  expect(rpc).toHaveBeenCalledWith('fail_equipment_image_deletion', {
    p_image_id: imageId,
    p_claim_token: token,
  });
  expect(rpc).not.toHaveBeenCalledWith(
    'ack_equipment_image_deletion',
    expect.anything()
  );
});

it('does not claim completion when ack outcome is unknown', async () => {
  const { client, rpc } = fixture();
  rpc.mockImplementation(async (name: string) => {
    if (name === 'ack_equipment_image_deletion') throw new Error('reply lost');
    return { data: [claim], error: null };
  });
  await expect(processImageDeletionBatch(client, 1, 60)).rejects.toThrow();
});

it('does not claim completion when a stale token is rejected after removal', async () => {
  const { client, rpc, remove } = fixture();
  rpc.mockImplementation(async (name: string) => ({
    data: name === 'claim_equipment_image_deletions' ? [claim] : false,
    error: null,
  }));
  await expect(processImageDeletionBatch(client, 1, 60)).rejects.toThrow();
  expect(remove).toHaveBeenCalledWith([claim.storage_path]);
});

it('does not claim a second job when the first ack is rejected', async () => {
  const { client, rpc, remove } = fixture();
  rpc.mockImplementation(async (name: string) => ({
    data: name === 'claim_equipment_image_deletions' ? [claim] : false,
    error: null,
  }));
  await expect(processImageDeletionBatch(client, 2, 60)).rejects.toThrow();
  expect(
    rpc.mock.calls.filter(
      ([name]) => name === 'claim_equipment_image_deletions'
    )
  ).toHaveLength(1);
  expect(rpc).toHaveBeenCalledWith('claim_equipment_image_deletions', {
    p_limit: 1,
    p_lease_seconds: 60,
  });
  expect(remove).toHaveBeenCalledTimes(1);
});

it('claims the next task only after ack and stops at the requested cap', async () => {
  const otherId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
  const other = {
    ...claim,
    image_id: otherId,
    storage_path: `${listingId}/${otherId}.webp`,
    claim_token: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  };
  const { client, rpc, remove } = fixture();
  let claims = 0;
  rpc.mockImplementation(async (name: string) => ({
    data:
      name === 'claim_equipment_image_deletions'
        ? [[claim], [other]][claims++]
        : true,
    error: null,
  }));
  expect(await processImageDeletionBatch(client, 2, 60)).toEqual({
    claimed: 2,
    completed: 2,
    failed: 0,
  });
  expect(remove.mock.calls.map(([paths]) => paths)).toEqual([
    [claim.storage_path],
    [other.storage_path],
  ]);
  expect(
    rpc.mock.calls.filter(
      ([name]) => name === 'claim_equipment_image_deletions'
    )
  ).toHaveLength(2);
});

it('does not acknowledge a thrown storage failure', async () => {
  const { client, rpc, remove } = fixture();
  remove.mockRejectedValue(new Error('unknown storage outcome'));
  expect(await processImageDeletionBatch(client, 1, 60)).toEqual({
    claimed: 1,
    completed: 0,
    failed: 1,
  });
  expect(rpc).not.toHaveBeenCalledWith(
    'ack_equipment_image_deletion',
    expect.anything()
  );
});

it('accepts a repeated remove after a previous crash and a new lease', async () => {
  const { client, rpc } = fixture([{ ...claim, attempts: 2 }]);
  expect(await processImageDeletionBatch(client, 1, 60)).toEqual({
    claimed: 1,
    completed: 1,
    failed: 0,
  });
  expect(rpc).toHaveBeenCalledWith('ack_equipment_image_deletion', {
    p_image_id: imageId,
    p_claim_token: token,
  });
});

it('bounds a CLI network request and preserves caller cancellation', async () => {
  const baseFetch = jest.fn(
    (_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new Error('aborted'))
        );
      })
  );
  const timed = createTimedCleanupFetch(baseFetch, 10);
  await expect(timed('https://example.test')).rejects.toThrow('aborted');
  expect(baseFetch.mock.calls[0][1]?.signal?.aborted).toBe(true);

  const controller = new AbortController();
  const pending = timed('https://example.test', { signal: controller.signal });
  controller.abort();
  await expect(pending).rejects.toThrow('aborted');
  expect(baseFetch.mock.calls[1][1]?.signal?.aborted).toBe(true);

  const requestController = new AbortController();
  const request = new Request('https://example.test', {
    signal: requestController.signal,
  });
  const requestPending = timed(request);
  requestController.abort();
  await expect(requestPending).rejects.toThrow('aborted');
  expect(baseFetch.mock.calls[2][1]?.signal?.aborted).toBe(true);
});
