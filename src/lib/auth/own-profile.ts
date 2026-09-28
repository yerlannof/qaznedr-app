import 'server-only';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

const profileTypeSchema = z.enum([
  'subsoil_user',
  'service_provider',
  'investor',
]);
const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullable();
const phoneSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\+[1-9]\d{6,14}$/.test(value))
  .transform((value) => value || null)
  .nullable();
const websiteSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (value === '') return true;
    try {
      const url = new URL(value);
      return (
        url.protocol === 'https:' &&
        !url.username &&
        !url.password &&
        !!url.hostname
      );
    } catch {
      return false;
    }
  })
  .transform((value) => value || null)
  .nullable();
const serviceTypesSchema = z
  .array(z.string().trim().min(1).max(80))
  .max(20)
  .refine((values) => new Set(values).size === values.length)
  .nullable();

export const profileSetupSchema = z.strictObject({
  profile_type: profileTypeSchema,
});

export const profilePatchSchema = z
  .strictObject({
    full_name: z.string().trim().min(1).max(200),
    company_name: nullableText(200),
    city: nullableText(120),
    country: nullableText(120),
    description: nullableText(3000),
    phone: phoneSchema,
    website: websiteSchema,
    service_types: serviceTypesSchema,
    profile_type: profileTypeSchema,
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0);

export type OwnProfile = Pick<
  Database['public']['Tables']['profiles']['Row'],
  | 'id'
  | 'full_name'
  | 'email'
  | 'profile_type'
  | 'country'
  | 'company_name'
  | 'phone'
  | 'description'
  | 'city'
  | 'website'
  | 'service_types'
>;

const ownProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  email: z.string(),
  profile_type: profileTypeSchema,
  country: z.string().nullable(),
  company_name: z.string().nullable(),
  phone: z.string().nullable(),
  description: z.string().nullable(),
  city: z.string().nullable(),
  website: z.string().nullable(),
  service_types: z.array(z.string()).nullable(),
});

const OWN_PROFILE_COLUMNS =
  'id,full_name,email,profile_type,country,company_name,phone,description,city,website,service_types';
const userIdSchema = z.string().uuid();
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type ProfileResult = { data: unknown; error: unknown };
type ProfileQuery = {
  select(columns: string): ProfileQuery;
  update(values: ProfileUpdate): ProfileQuery;
  eq(column: 'id', value: string): ProfileQuery;
  maybeSingle(): Promise<ProfileResult>;
};
type ProfileClient = { from(table: 'profiles'): ProfileQuery };

async function serviceClient(): Promise<ProfileClient> {
  return (await createServiceClient()) as unknown as ProfileClient;
}

export class ProfileStorageError extends Error {
  constructor() {
    super('Unable to access profile');
    this.name = 'ProfileStorageError';
  }
}

export async function getOwnProfile(
  userId: string
): Promise<OwnProfile | null> {
  const id = userIdSchema.parse(userId);
  try {
    const client = await serviceClient();
    const { data, error } = await client
      .from('profiles')
      .select(OWN_PROFILE_COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data === null ? null : ownProfileSchema.parse(data);
  } catch {
    throw new ProfileStorageError();
  }
}

export async function updateOwnProfile(
  userId: string,
  patch: unknown
): Promise<OwnProfile | null> {
  const id = userIdSchema.parse(userId);
  const parsedPatch = profilePatchSchema.parse(patch);
  try {
    const client = await serviceClient();
    const { data, error } = await client
      .from('profiles')
      .update({ ...parsedPatch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(OWN_PROFILE_COLUMNS)
      .maybeSingle();
    if (error) throw error;
    return data === null ? null : ownProfileSchema.parse(data);
  } catch {
    throw new ProfileStorageError();
  }
}
