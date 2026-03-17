import { createClient } from './server';
import { Database } from './database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type ProfileType = 'subsoil_user' | 'service_provider' | 'investor';

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

export async function createProfile(
  profile: ProfileInsert
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('profiles')
    .insert([profile])
    .select()
    .single();
  if (error) {
    console.error('Failed to create profile:', error);
    return null;
  }
  return data;
}

export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) {
    console.error('Failed to update profile:', error);
    return null;
  }
  return data;
}

export async function trackContactView(
  viewerId: string,
  sellerId: string,
  listingId?: string
): Promise<void> {
  const supabase = await createClient();
  await (supabase as any).from('contact_views').insert([
    {
      viewer_id: viewerId,
      seller_id: sellerId,
      listing_id: listingId || null,
    },
  ]);
}

export async function hasProfileSetup(userId: string): Promise<boolean> {
  const profile = await getProfile(userId);
  return profile !== null;
}
