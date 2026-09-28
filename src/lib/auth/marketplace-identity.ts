import 'server-only';
import { z } from 'zod';
import { isEnvAdminEmail } from '@/lib/auth/env-admin';
import { createServiceClient } from '@/lib/supabase/server';

const imageSchema = z
  .string()
  .max(2048)
  .url()
  .refine((url) => new URL(url).protocol === 'https:');

const inputSchema = z.strictObject({
  subject: z.string().trim().min(1).max(255),
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().min(1).max(200).nullable(),
  image: imageSchema.nullable(),
});

const identitySchema = z.strictObject({
  id: z.string().uuid(),
  email: z.string().email().max(254),
  name: z.string().max(200).nullable(),
  image: imageSchema.nullable(),
});

export type GoogleMarketplaceClaims = z.input<typeof inputSchema>;
export type MarketplaceIdentity = z.infer<typeof identitySchema>;

/** Call only after Google's subject and email claims have been verified. */
export async function provisionGoogleIdentity(
  claims: GoogleMarketplaceClaims
): Promise<MarketplaceIdentity> {
  try {
    const parsed = inputSchema.parse(claims);
    if (isEnvAdminEmail(parsed.email)) throw new Error('Reserved identity');

    const client = await createServiceClient();
    const { data, error } = await client.rpc(
      'provision_google_marketplace_identity' as never,
      {
        p_subject: parsed.subject,
        p_email: parsed.email,
        p_name: parsed.name,
        p_image: parsed.image,
      } as never
    );
    if (error) throw error;
    return identitySchema.parse(data);
  } catch {
    // Neither unique-key conflicts nor raw provider claims should reach the client.
    throw new Error('Unable to provision marketplace identity');
  }
}
