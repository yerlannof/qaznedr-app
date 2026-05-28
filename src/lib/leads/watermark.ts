import { createHmac } from 'crypto';

// Deterministic per-(user,lead) token. Persisted on grant (lead_entitlements.watermark_token)
// and recomputed/rendered on every private view → leaks are traceable to the buyer.
export function watermarkToken(userId: string, leadId: string): string {
  const secret =
    process.env.WATERMARK_SECRET || process.env.NEXTAUTH_SECRET || 'qaznedr-wm';
  return createHmac('sha256', secret)
    .update(`${userId}:${leadId}`)
    .digest('hex')
    .slice(0, 16);
}
