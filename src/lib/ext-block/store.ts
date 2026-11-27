import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import {
  FP_RE,
  KEY_RE,
  LIMITS,
  NO_STORE,
  OPEN_REGISTRATION,
  almatyDay,
  blockMinutes,
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
  if (!OPEN_REGISTRATION) return json({ error: 'invite_only' }, 403);
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
  const fpHash = hashWithDay(e.secret, 'fp', fp, 'all');
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
    .insert({ key_hash: hashKey(key), fp_hash: fpHash, net_day: netDay });
  if (error) return json({ error: 'unavailable' }, 503);
  return json({ key, perDay: LIMITS.keyPerDay });
}

type ViewRow = { code: string; key_hash: string; fp_hash: string; net_day: string };

// «Tap any block» (T-0220, 27.11): for showcase keys only (Erlan 27.11 «Да, только ключам показа»), objects within 5 km of
// the block with names, report volumes, pages and quotes, plus the volumes of the 1:100 000 sheet. The point itself is never
// returned, only the distance. Data: scripts/site_block_info.py in the geology repo.
const INFO_KM = 5.75; // the 1′ block's half-diagonal on top of the 5 km ring, as in the public teaser
const INFO_MAX = 12;
const VOLS_MAX = 40;
type InfoObject = { lat: number; lon: number; payload: Record<string, unknown> };

function kmBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2
    + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

async function blockReport(db: SupabaseClient, code: string) {
  const bm = blockMinutes(code);
  if (!bm) return null;
  const lat = 40 + (bm.my + 0.5) / 60;
  const lon = 42 + (bm.mx + 0.5) / 60;
  const [{ data: objs }, { data: sh }, { data: cov }] = await Promise.all([
    db.from('ext_info_objects').select('lat, lon, payload')
      .gte('lat', lat - 0.06).lte('lat', lat + 0.06).gte('lon', lon - 0.1).lte('lon', lon + 0.1).limit(1000),
    db.from('ext_info_sheets').select('payload').eq('sheet', sheetOf(code)).maybeSingle(),
    // coverage light (p.3): «изученность по нашей базе»; a block row wins over its sheet row
    db.from('ext_coverage').select('code, level, light, why_ru, why_zh, order_n, page').in('code', [code, sheetOf(code)]),
  ]);
  type Cov = { code: string; level: string; light: string; why_ru: string; why_zh: string; order_n: number; page: string };
  const covRows = (cov ?? []) as Cov[];
  const light = covRows.find((r) => r.code === code) ?? covRows.find((r) => r.code === sheetOf(code)) ?? null;
  const near = ((objs ?? []) as InfoObject[])
    .map((o) => ({ km: kmBetween(lat, lon, o.lat, o.lon), ...o.payload }))
    .filter((o) => o.km <= INFO_KM)
    .sort((a, b) => a.km - b.km);
  const vols = ((sh as { payload?: { vols?: unknown[] } } | null)?.payload?.vols ?? []);
  return {
    objects: near.slice(0, INFO_MAX).map((o) => ({ ...o, km: Math.round(o.km * 10) / 10 })),
    objectsMore: Math.max(0, near.length - INFO_MAX),
    vols: vols.slice(0, VOLS_MAX),
    volsMore: Math.max(0, vols.length - VOLS_MAX),
    light: light
      ? { light: light.light, level: light.level, why: light.why_ru, whyZh: light.why_zh, orderN: light.order_n, page: light.page }
      : null,
  };
}

/** GET /api/ext/block/<code> with x-qz-key and x-qz-fp. */
export async function blockInfo(request: Request, rawCode: string): Promise<Response> {
  const e = env();
  if (!e) return json({ error: 'unavailable' }, 503);
  const code = decodeURIComponent(rawCode).trim();
  if (!isBlockCode(code)) return json({ error: 'bad_code' }, 400);
  const key = request.headers.get('x-qz-key') ?? '';
  const fp = request.headers.get('x-qz-fp') ?? '';
  if (!KEY_RE.test(key) || !FP_RE.test(fp)) return json({ error: 'no_key' }, 401);

  const keyHash = hashKey(key);
  const fpHash = hashWithDay(e.secret, 'fp', fp, 'all');
  const day = almatyDay();
  const netDay = hashWithDay(e.secret, 'net', networkOf(clientIp(request.headers)), day);

  const { data: inst } = await e.db
    .from('ext_installs')
    .select('blocked, showcase, nolimit')
    .eq('key_hash', keyHash)
    .maybeSingle();
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
  // Testers (nolimit, set by hand: Erlan 24.11 for Mukhtar) skip the daily limits and the grid-walk watchdog.
  const verdict = inst.nolimit ? { ok: true as const, repeat: today.key.has(code) } : decide(code, today);
  if (!verdict.ok) {
    return json({ error: 'limit', reason: verdict.reason, perDay: LIMITS.keyPerDay, left: 0 }, 429);
  }

  const [{ data: t }, { data: s }, { data: sc }, info] = await Promise.all([
    e.db.from('ext_block_teaser').select('n, metals, more, stage, prec').eq('code', code).maybeSingle(),
    e.db.from('ext_sheet_reports').select('reports, volumes, volumes_wide').eq('sheet', sheetOf(code)).maybeSingle(),
    inst.showcase
      ? e.db.from('ext_showcase').select('payload').eq('code', code).maybeSingle()
      : Promise.resolve({ data: null }),
    inst.showcase ? blockReport(e.db, code) : Promise.resolve(null),
  ]);

  let used = today.key.size;
  if (!verdict.repeat) {
    used += 1;
    await e.db
      .from('ext_views')
      .insert({ key_hash: keyHash, fp_hash: fpHash, net_day: netDay, code, found: !!t, day });
    const keyCodes = [...today.key, code];
    if (!inst.nolimit && isGridWalk(keyCodes)) {
      await e.db.from('ext_installs').update({ blocked: 'grid_walk' }).eq('key_hash', keyHash);
    }
  }
  return json({
    code,
    sheet: sheetOf(code),
    found: !!t,
    n: t?.n ?? null,
    metals: (t?.metals as string[] | undefined) ?? [],
    more: t?.more ?? 0,
    stage: t?.stage ?? null,
    prec: t?.prec ?? null,
    sheetReports: s?.reports ?? 0,
    sheetVolumes: s?.volumes ?? 0, // our reports naming this 1:100 000 sheet or its 1:50 000 parts (Erlan 26.11, 'not empty')
    sheetVolumesWide: s?.volumes_wide ?? 0, // reports tied only through the enclosing 1:200 000 sheet
    perDay: inst.nolimit ? '∞' : LIMITS.keyPerDay,
    left: inst.nolimit ? '∞' : Math.max(0, LIMITS.keyPerDay - used),
    unlimited: !!inst.nolimit,
    showcase: (sc as { payload?: unknown } | null)?.payload ?? null,
    info, // showcase keys only; null for everyone else
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Showcase (T-0220, 24.11): a few blocks with maps over the portal, rights and a chat. Only installs with showcase=true.

type ShowcasePayload = { maps?: { id: string }[] };

async function showcaseInstall(request: Request) {
  const e = env();
  if (!e) return { error: json({ error: 'unavailable' }, 503) };
  const key = request.headers.get('x-qz-key') ?? '';
  if (!KEY_RE.test(key)) return { error: json({ error: 'no_key' }, 401) };
  const keyHash = hashKey(key);
  const { data: inst } = await e.db.from('ext_installs').select('blocked, showcase').eq('key_hash', keyHash).maybeSingle();
  if (!inst || inst.blocked || !inst.showcase) return { error: json({ error: 'no_showcase' }, 403) };
  return { e, keyHash };
}

async function showcasePayload(e: { db: SupabaseClient }, code: string): Promise<ShowcasePayload | null> {
  const { data } = await e.db.from('ext_showcase').select('payload').eq('code', code).maybeSingle();
  return ((data as { payload?: ShowcasePayload } | null)?.payload ?? null);
}

/** GET /api/ext/showcase/<code>/<map> — the overlay picture, streamed from the private bucket. */
export async function showcaseMap(request: Request, rawCode: string, mapId: string): Promise<Response> {
  const s = await showcaseInstall(request);
  if ('error' in s) return s.error as Response;
  const code = decodeURIComponent(rawCode).trim();
  if (!isBlockCode(code) || !/^[a-z0-9_]{3,40}$/.test(mapId)) return json({ error: 'bad_code' }, 400);
  const p = await showcasePayload(s.e, code);
  if (!p?.maps?.some((m) => m.id === mapId)) return json({ error: 'not_found' }, 404);
  const { data, error } = await s.e.db.storage.from('ext-showcase').download(`${mapId}.jpg`);
  if (error || !data) return json({ error: 'unavailable' }, 503);
  return new Response(data, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=600', 'X-Robots-Tag': 'noindex' } });
}

export const CHAT_PER_DAY = 20;

/** POST /api/ext/chat {code, q} — puts a question in the queue; our machine answers it from the block's volumes. */
export async function chatAsk(request: Request): Promise<Response> {
  const s = await showcaseInstall(request);
  if ('error' in s) return s.error as Response;
  let body: { code?: unknown; q?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    /* empty */
  }
  const code = String(body.code ?? '').trim();
  const q = String(body.q ?? '').trim();
  if (!isBlockCode(code) || q.length < 3 || q.length > 600) return json({ error: 'bad_request' }, 400);
  if (!(await showcasePayload(s.e, code))) return json({ error: 'not_found' }, 404);
  const day = almatyDay();
  const { count } = await s.e.db
    .from('ext_chat')
    .select('id', { count: 'exact', head: true })
    .eq('key_hash', s.keyHash)
    .eq('day', day);
  if ((count ?? 0) >= CHAT_PER_DAY) return json({ error: 'limit', perDay: CHAT_PER_DAY }, 429);
  const { data, error } = await s.e.db
    .from('ext_chat')
    .insert({ key_hash: s.keyHash, code, q, day })
    .select('id')
    .single();
  if (error || !data) return json({ error: 'unavailable' }, 503);
  return json({ id: (data as { id: number }).id, left: CHAT_PER_DAY - (count ?? 0) - 1 });
}

/** GET /api/ext/chat/<id> — status and answer of the caller's own question. */
export async function chatGet(request: Request, rawId: string): Promise<Response> {
  const s = await showcaseInstall(request);
  if ('error' in s) return s.error as Response;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) return json({ error: 'bad_request' }, 400);
  const { data } = await s.e.db
    .from('ext_chat')
    .select('status, answer, sources')
    .eq('id', id)
    .eq('key_hash', s.keyHash)
    .maybeSingle();
  if (!data) return json({ error: 'not_found' }, 404);
  return json(data);
}
