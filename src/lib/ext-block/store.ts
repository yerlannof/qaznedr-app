import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import {
  FP_RE,
  KEY_RE,
  LIMITS,
  NO_STORE,
  almatyDay,
  clientIp,
  decide,
  hashKey,
  hashWithDay,
  isBlockCode,
  isGridWalk,
  networkOf,
  sheetOf,
} from './rules';

function env(): { db: SupabaseClient; secret: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return { db, secret: `ext-block|${key}` };
}

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

/** POST /api/ext/register {fp} → {key}. Few installs per network and per browser per day. */
export async function register(request: Request): Promise<Response> {
  const e = env();
  if (!e) return json({ error: 'unavailable' }, 503);
  let fp = '';
  try {
    fp = String(((await request.json()) as { fp?: unknown }).fp ?? '');
  } catch {
    /* empty body */
  }
  if (!FP_RE.test(fp)) return json({ error: 'bad_request' }, 400);
  const day = almatyDay();
  const fpHash = hashKey(e.secret, `fp|${fp}`);
  const netDay = hashWithDay(e.secret, 'net', networkOf(clientIp(request.headers)), day);
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const [byNet, byFp] = await Promise.all([
    e.db.from('ext_installs').select('key_hash', { count: 'exact', head: true }).eq('net_day', netDay).gte('created_at', since),
    e.db.from('ext_installs').select('key_hash', { count: 'exact', head: true }).eq('fp_hash', fpHash).gte('created_at', since),
  ]);
  if ((byNet.count ?? 0) >= LIMITS.newKeysPerNetDay || (byFp.count ?? 0) >= LIMITS.newKeysPerFpDay) {
    return json({ error: 'too_many_installs' }, 429);
  }
  const key = randomBytes(24).toString('base64url');
  const { error } = await e.db
    .from('ext_installs')
    .insert({ key_hash: hashKey(e.secret, key), fp_hash: fpHash, net_day: netDay });
  if (error) return json({ error: 'unavailable' }, 503);
  return json({ key, perDay: LIMITS.keyPerDay });
}

type ViewRow = { code: string; key_hash: string; fp_hash: string; net_day: string };

/** GET /api/ext/block/<code> with x-qz-key and x-qz-fp. */
export async function blockInfo(request: Request, rawCode: string): Promise<Response> {
  const e = env();
  if (!e) return json({ error: 'unavailable' }, 503);
  const code = decodeURIComponent(rawCode).trim();
  if (!isBlockCode(code)) return json({ error: 'bad_code' }, 400);
  const key = request.headers.get('x-qz-key') ?? '';
  const fp = request.headers.get('x-qz-fp') ?? '';
  if (!KEY_RE.test(key) || !FP_RE.test(fp)) return json({ error: 'no_key' }, 401);

  const keyHash = hashKey(e.secret, key);
  const fpHash = hashKey(e.secret, `fp|${fp}`);
  const day = almatyDay();
  const netDay = hashWithDay(e.secret, 'net', networkOf(clientIp(request.headers)), day);

  const { data: inst } = await e.db.from('ext_installs').select('blocked').eq('key_hash', keyHash).maybeSingle();
  if (!inst) return json({ error: 'no_key' }, 401);
  if (inst.blocked) return json({ error: 'blocked' }, 403);

  const { data: views } = await e.db
    .from('ext_views')
    .select('code, key_hash, fp_hash, net_day')
    .eq('day', day)
    .or(`key_hash.eq.${keyHash},fp_hash.eq.${fpHash},net_day.eq.${netDay}`)
    .order('id', { ascending: true })
    .limit(2000);
  const rows = (views ?? []) as ViewRow[];
  const today = {
    key: new Set(rows.filter((r) => r.key_hash === keyHash).map((r) => r.code)),
    fp: new Set(rows.filter((r) => r.fp_hash === fpHash).map((r) => r.code)),
    net: new Set(rows.filter((r) => r.net_day === netDay).map((r) => r.code)),
  };
  const verdict = decide(code, today);
  if (!verdict.ok) {
    return json({ error: 'limit', reason: verdict.reason, perDay: LIMITS.keyPerDay, left: 0 }, 429);
  }

  const [{ data: t }, { data: s }] = await Promise.all([
    e.db.from('ext_block_teaser').select('n, metals, stage').eq('code', code).maybeSingle(),
    e.db.from('ext_sheet_reports').select('reports').eq('sheet', sheetOf(code)).maybeSingle(),
  ]);

  let used = today.key.size;
  if (!verdict.repeat) {
    used += 1;
    await e.db
      .from('ext_views')
      .insert({ key_hash: keyHash, fp_hash: fpHash, net_day: netDay, code, found: !!t, day });
    const keyCodes = [...today.key, code];
    if (isGridWalk(keyCodes)) {
      await e.db.from('ext_installs').update({ blocked: 'grid_walk' }).eq('key_hash', keyHash);
    }
  }
  return json({
    code,
    sheet: sheetOf(code),
    found: !!t,
    n: t?.n ?? null,
    metals: (t?.metals as string[] | undefined) ?? [],
    stage: t?.stage ?? null,
    sheetReports: s?.reports ?? 0,
    perDay: LIMITS.keyPerDay,
    left: Math.max(0, LIMITS.keyPerDay - used),
  });
}
