import 'server-only';
import { createServiceClient } from '@/lib/supabase/server';
import type { LeadPrivate } from './types';

// THE ONLY code path that touches lead_private. Service-role read happens strictly
// AFTER an entitlement check, and is unreachable for unentitled users.

export interface ActiveEntitlement {
  leadId: string;
  entitlementId: string;
  watermarkToken: string;
}

export async function getActiveEntitlement(
  userId: string,
  code: string
): Promise<ActiveEntitlement | null> {
  const svc = await createServiceClient();
  const { data: lead } = await (svc as any)
    .from('leads')
    .select('id')
    .eq('code', code)
    .maybeSingle();
  if (!lead) return null;

  const { data: ent } = await (svc as any)
    .from('lead_entitlements')
    .select('id,watermark_token,status,expires_at')
    .eq('lead_id', lead.id)
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .maybeSingle();
  if (!ent) return null;
  if (ent.expires_at && new Date(ent.expires_at) < new Date()) return null;

  return {
    leadId: lead.id,
    entitlementId: ent.id,
    watermarkToken: ent.watermark_token,
  };
}

export async function readPrivateForEntitled(
  userId: string,
  code: string,
  ctx: {
    ip?: string;
    userAgent?: string;
    action?: 'VIEW_PRIVATE' | 'VIEW_GPS' | 'DOWNLOAD_PDF';
  }
): Promise<{ private: LeadPrivate; watermarkToken: string } | null> {
  const ent = await getActiveEntitlement(userId, code);
  if (!ent) return null; // no read attempted

  const svc = await createServiceClient();
  const { data: priv } = await (svc as any)
    .from('lead_private')
    .select('*')
    .eq('lead_id', ent.leadId)
    .maybeSingle();

  await (svc as any).from('lead_access_log').insert({
    lead_id: ent.leadId,
    user_id: userId,
    entitlement_id: ent.entitlementId,
    action: ctx.action ?? 'VIEW_PRIVATE',
    ip: ctx.ip || null,
    user_agent: ctx.userAgent || null,
    watermark_token: ent.watermarkToken,
  });

  return { private: priv as LeadPrivate, watermarkToken: ent.watermarkToken };
}
