import 'server-only';
import { createServiceClient } from '@/lib/supabase/server';
import { getActiveEntitlement } from '@/lib/leads/private-access';

// Gold showcase v1 (APPSALE T-0206): rows in public.leads with tier GOLD_V1 and status MEMBERS.
// MEMBERS is not PUBLISHED, so the anon RLS policy and every public query skip these rows; this
// module reads them with the service role and is called only after a session check.

export interface GoldSquare {
  lat: number;
  lon: number;
  size_km: number;
}

/** Open part of a card: what every signed-in user sees. No name, sheet, degrees or holders. */
export interface GoldOpen {
  code: string;
  level: number;
  price_usd: number;
  price_mark: string;
  label: string;
  label_emoji: string;
  region: string;
  type: string;
  main_number: string;
  open_md: string;
  square: GoldSquare | null;
  crops: string[];
  rights_date: string; // YYYY-MM-DD of the live rights check
  sold: number; // paid grants so far (shown honestly on the card)
  status: string;
}

const COLS = 'id,code,level,status,gold';

/** Rights captions live 30 days (APPSALE re-measures before 28.12); after that the caption is withdrawn. */
export const RIGHTS_TTL_DAYS = 30;
export function rightsFresh(iso: string, now: Date = new Date()): boolean {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) return false;
  return now.getTime() - t <= RIGHTS_TTL_DAYS * 86400_000;
}

function toOpen(row: any, sold: number): GoldOpen | null {
  const g = row?.gold;
  if (!g || typeof g !== 'object') return null;
  return {
    code: row.code,
    level: row.level ?? g.level,
    price_usd: g.price_usd,
    price_mark: g.price_mark,
    label: g.label,
    label_emoji: g.label_emoji,
    region: g.region,
    type: g.type,
    main_number: g.main_number,
    open_md: g.open_md,
    square: g.square ?? null,
    crops: Array.isArray(g.crops) ? g.crops : [],
    rights_date: g.rights_date,
    sold,
    status: row.status,
  };
}

async function soldCounts(
  svc: any,
  ids: string[]
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!ids.length) return out;
  const { data } = await svc
    .from('lead_entitlements')
    .select('lead_id')
    .in('lead_id', ids)
    .eq('status', 'ACTIVE')
    .eq('grant_reason', 'PAYMENT');
  for (const r of data ?? []) out.set(r.lead_id, (out.get(r.lead_id) ?? 0) + 1);
  return out;
}

/** The showcase list (status MEMBERS only: an exclusive deal moves a card to SOLD and off the list). */
export async function listGoldCards(): Promise<GoldOpen[]> {
  const svc: any = await createServiceClient();
  const { data } = await svc
    .from('leads')
    .select(COLS)
    .eq('tier', 'GOLD_V1')
    .eq('status', 'MEMBERS')
    .order('level', { ascending: false })
    .order('code', { ascending: true })
    .limit(1000);
  const rows = data ?? [];
  const sold = await soldCounts(
    svc,
    rows.map((r: any) => r.id)
  );
  return rows
    .map((r: any) => toOpen(r, sold.get(r.id) ?? 0))
    .filter((x: GoldOpen | null): x is GoldOpen => x !== null);
}

/** One card. A buyer keeps access after an exclusive deal, so SOLD rows open for entitled users too. */
export async function getGoldCard(
  code: string
): Promise<(GoldOpen & { id: string }) | null> {
  if (!/^AU-\d{4}$/.test(code)) return null;
  const svc: any = await createServiceClient();
  const { data } = await svc
    .from('leads')
    .select(COLS)
    .eq('tier', 'GOLD_V1')
    .eq('code', code)
    .in('status', ['MEMBERS', 'SOLD'])
    .maybeSingle();
  if (!data) return null;
  const sold = await soldCounts(svc, [data.id]);
  const open = toOpen(data, sold.get(data.id) ?? 0);
  return open ? { ...open, id: data.id } : null;
}

/** Paid part — read only after an ACTIVE entitlement; every read is logged with the watermark token. */
export async function readGoldPaid(
  userId: string,
  code: string,
  ctx: { ip?: string; userAgent?: string }
): Promise<{ paid_md: string; watermarkToken: string } | null> {
  const ent = await getActiveEntitlement(userId, code);
  if (!ent) return null;
  const svc: any = await createServiceClient();
  const { data } = await svc
    .from('lead_private')
    .select('paid_md')
    .eq('lead_id', ent.leadId)
    .maybeSingle();
  await svc.from('lead_access_log').insert({
    lead_id: ent.leadId,
    user_id: userId,
    entitlement_id: ent.entitlementId,
    action: 'VIEW_PRIVATE',
    ip: ctx.ip || null,
    user_agent: ctx.userAgent || null,
    watermark_token: ent.watermarkToken,
  });
  if (!data?.paid_md) return null;
  return { paid_md: data.paid_md, watermarkToken: ent.watermarkToken };
}
