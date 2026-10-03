import { z } from 'zod';
import {
  EQUIPMENT_STATUSES,
  ownerDraftSchema,
  ownerSubmissionSchema,
  type EquipmentListing,
  type OwnerDraft,
} from './domain';

const uuid = z.string().uuid();
const listingSchema = z.object({
  id: uuid,
  ownerId: z.string().min(1),
  revision: z.number().int().min(1).max(2147483647),
  status: z.enum(EQUIPMENT_STATUSES),
  data: ownerDraftSchema,
});
const imageSchema = z.object({
  id: uuid,
  width: z.number().int().min(1).max(1600),
  height: z.number().int().min(1).max(1600),
  bytes: z
    .number()
    .int()
    .min(1)
    .max(3 * 1024 * 1024),
  position: z.number().int().min(0).max(7),
});
const imageMutation = z.object({
  revision: z.number().int().positive().max(2147483647),
  status: z.enum(EQUIPMENT_STATUSES),
});
export type IntakeImage = z.infer<typeof imageSchema>;
export type IntakeErrorCode =
  | 'UNAUTHORIZED'
  | 'CONFLICT'
  | 'UNAVAILABLE'
  | 'INVALID'
  | 'UNCERTAIN';
export class IntakeClientError extends Error {
  constructor(public readonly code: IntakeErrorCode) {
    super(code);
    this.name = 'IntakeClientError';
  }
}

/** One owner, one draft, one serialized mutation stream. Never retry an unknown write. */
export class EquipmentDraftClient {
  private current: EquipmentListing | null = null;
  private tail: Promise<unknown> = Promise.resolve();
  private blocked: IntakeErrorCode | null = null;
  private disposed = false;
  private abort = new AbortController();
  constructor(private readonly ownerId: string) {
    if (!ownerId.trim()) throw new IntakeClientError('UNAUTHORIZED');
  }
  get listing(): EquipmentListing | null {
    return this.current ? JSON.parse(JSON.stringify(this.current)) : null;
  }
  dispose(): void {
    this.disposed = true;
    this.abort.abort();
  }
  private queue<T>(task: () => Promise<T>): Promise<T> {
    const next = this.tail.then(() => {
      if (this.disposed) throw new IntakeClientError('UNAUTHORIZED');
      return task();
    });
    this.tail = next.catch(() => undefined);
    return next;
  }
  private writable() {
    if (this.blocked) throw new IntakeClientError(this.blocked);
    if (this.current && !['DRAFT', 'REJECTED'].includes(this.current.status))
      throw new IntakeClientError('INVALID');
  }
  private snapshot(data: OwnerDraft, submitted = false): OwnerDraft {
    const parsed = (
      submitted ? ownerSubmissionSchema : ownerDraftSchema
    ).safeParse(data);
    if (!parsed.success || parsed.data.schemaVersion !== 2)
      throw new IntakeClientError('INVALID');
    return parsed.data;
  }
  private async request(
    path: string,
    init: RequestInit = {}
  ): Promise<unknown> {
    const mutation = Boolean(init.method && init.method !== 'GET');
    try {
      const response = await fetch(path, {
        ...init,
        signal: this.abort.signal,
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!response.ok) {
        const code: IntakeErrorCode =
          response.status === 401
            ? 'UNAUTHORIZED'
            : response.status === 409
              ? 'CONFLICT'
              : [400, 413, 415].includes(response.status)
                ? 'INVALID'
                : mutation && response.status >= 500
                  ? 'UNCERTAIN'
                  : 'UNAVAILABLE';
        throw new IntakeClientError(code);
      }
      const body = await response.json();
      if (body?.success !== true) throw new Error('Invalid response');
      return body.data;
    } catch (error) {
      const failure =
        error instanceof IntakeClientError
          ? error
          : new IntakeClientError(mutation ? 'UNCERTAIN' : 'UNAVAILABLE');
      if (['CONFLICT', 'UNCERTAIN', 'UNAUTHORIZED'].includes(failure.code))
        this.blocked = failure.code;
      throw failure;
    }
  }
  private accept(
    value: unknown,
    expectedId?: string,
    mutation = false
  ): EquipmentListing {
    const result = listingSchema.safeParse(value);
    if (
      !result.success ||
      result.data.ownerId !== this.ownerId ||
      (expectedId && result.data.id !== expectedId)
    ) {
      if (mutation) this.blocked = 'UNCERTAIN';
      throw new IntakeClientError(mutation ? 'UNCERTAIN' : 'UNAVAILABLE');
    }
    return result.data;
  }
  private json(body: unknown): RequestInit {
    return {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    };
  }
  private async persist(data: OwnerDraft): Promise<EquipmentListing> {
    this.writable();
    const previous = this.current;
    const patch: Record<string, unknown> = {};
    if (previous) {
      for (const key of new Set([
        ...Object.keys(previous.data),
        ...Object.keys(data),
      ])) {
        const field = key as keyof OwnerDraft;
        if (
          JSON.stringify(previous.data[field]) !== JSON.stringify(data[field])
        )
          patch[key] = data[field] ?? null;
      }
      if (!Object.keys(patch).length) return this.listing!;
    }
    const value = await this.request(
      previous
        ? `/api/equipment-listings/${previous.id}`
        : '/api/equipment-listings',
      {
        method: previous ? 'PATCH' : 'POST',
        ...this.json(
          previous ? { expectedRevision: previous.revision, patch } : data
        ),
      }
    );
    const saved = this.accept(value, previous?.id, true);
    if (
      (previous && saved.revision <= previous.revision) ||
      !['DRAFT', 'REJECTED'].includes(saved.status)
    ) {
      this.blocked = 'UNCERTAIN';
      throw new IntakeClientError('UNCERTAIN');
    }
    this.current = saved;
    return this.listing!;
  }
  async save(data: OwnerDraft): Promise<EquipmentListing> {
    const snapshot = this.snapshot(data);
    return this.queue(() => this.persist(snapshot));
  }
  async load(id: string): Promise<EquipmentListing> {
    if (!uuid.safeParse(id).success) throw new IntakeClientError('INVALID');
    return this.queue(async () => {
      const loaded = this.accept(
        await this.request(`/api/equipment-listings/${id}`),
        id
      );
      if (loaded.data.schemaVersion !== 2)
        throw new IntakeClientError('INVALID');
      this.current = loaded;
      this.blocked = null;
      return this.listing!;
    });
  }
  async recover(): Promise<EquipmentListing[]> {
    return this.queue(async () => {
      const result = z
        .array(listingSchema)
        .max(100)
        .safeParse(await this.request('/api/equipment-listings'));
      if (
        !result.success ||
        result.data.some((row) => row.ownerId !== this.ownerId)
      )
        throw new IntakeClientError('UNAVAILABLE');
      // V1 records retain their old editor contract; never silently discard their characteristics.
      return result.data.filter((row) => row.data.schemaVersion === 2);
    });
  }
  async submit(data: OwnerDraft): Promise<EquipmentListing> {
    const snapshot = this.snapshot(data, true);
    return this.queue(async () => {
      const draft = await this.persist(snapshot);
      const value = await this.request(
        `/api/equipment-listings/${draft.id}/submit`,
        { method: 'POST', ...this.json({ expectedRevision: draft.revision }) }
      );
      const saved = this.accept(value, draft.id, true);
      if (
        saved.status !== 'PENDING_MODERATION' ||
        saved.revision <= draft.revision
      ) {
        this.blocked = 'UNCERTAIN';
        throw new IntakeClientError('UNCERTAIN');
      }
      this.current = saved;
      return this.listing!;
    });
  }
  async images(): Promise<IntakeImage[]> {
    return this.queue(async () => {
      if (!this.current) return [];
      const parsed = z
        .array(imageSchema)
        .max(8)
        .safeParse(
          await this.request(
            `/api/equipment-listings/${this.current.id}/images`
          )
        );
      if (
        !parsed.success ||
        new Set(parsed.data.map((i) => i.id)).size !== parsed.data.length
      )
        throw new IntakeClientError('UNAVAILABLE');
      return parsed.data;
    });
  }
  private imageRevision(value: unknown): z.infer<typeof imageMutation> {
    const parsed = imageMutation.safeParse(value);
    if (
      !parsed.success ||
      !this.current ||
      parsed.data.revision <= this.current.revision ||
      !['DRAFT', 'REJECTED'].includes(parsed.data.status)
    ) {
      this.blocked = 'UNCERTAIN';
      throw new IntakeClientError('UNCERTAIN');
    }
    return parsed.data;
  }
  async upload(file: File, data: OwnerDraft): Promise<IntakeImage> {
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size < 1 ||
      file.size > 3 * 1024 * 1024
    )
      throw new IntakeClientError('INVALID');
    const snapshot = this.snapshot(data);
    return this.queue(async () => {
      const draft = await this.persist(snapshot);
      const value = await this.request(
        `/api/equipment-listings/${draft.id}/images`,
        {
          method: 'POST',
          headers: {
            'Content-Type': file.type,
            'X-Listing-Revision': String(draft.revision),
          },
          body: file,
        }
      );
      const result = z.object({ image: imageSchema }).safeParse(value);
      const version = this.imageRevision(value);
      if (!result.success) {
        this.blocked = 'UNCERTAIN';
        throw new IntakeClientError('UNCERTAIN');
      }
      this.current = { ...draft, ...version };
      return result.data.image;
    });
  }
  async remove(imageId: string): Promise<void> {
    if (!uuid.safeParse(imageId).success)
      throw new IntakeClientError('INVALID');
    return this.queue(async () => {
      this.writable();
      if (!this.current) throw new IntakeClientError('INVALID');
      const value = await this.request(
        `/api/equipment-listings/${this.current.id}/images/${imageId}`,
        {
          method: 'DELETE',
          ...this.json({ expectedRevision: this.current.revision }),
        }
      );
      const version = this.imageRevision(value);
      this.current = { ...this.current, ...version };
    });
  }
}
