#!/usr/bin/env node
// Load a geobase showcase package into Supabase (leads.showcase + storage).
//
// The package itself never enters git: this repository is public and its
// history would keep withdrawn cards (a withdrawal date narrows the place).
// Keep it in the gitignored data/showcase/<version>/ folder.
//
//   node scripts/import-showcase.mjs --dir data/showcase/v1 [--dry-run]
//   node scripts/import-showcase.mjs --dir data/showcase/v1 --update-published
//   node scripts/import-showcase.mjs --dir data/showcase/v1 --publish
//
// Order: validate everything → archive withdrawn/dropped cards → upload scans
// → upsert DRAFT rows → delete unreferenced scans. New cards land as DRAFT and
// an existing status is never changed by import. Changing the content of an
// already PUBLISHED card needs --update-published. --publish flips exactly the
// package's active cards to PUBLISHED and refuses a rights check older than
// RIGHTS_VALID_DAYS or a database that differs from the package.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const dir = resolve(option('dir', 'data/showcase/v1'));
const dryRun = flag('dry-run');
const publish = flag('publish');
const updatePublished = flag('update-published');
const BUCKET = 'showcase';
const RIGHTS_VALID_DAYS = 7;
const LOCALES = ['kz', 'en', 'zh'];

function env() {
  const text = readFileSync('.env.local', 'utf8');
  const get = (key) =>
    (text.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1] ?? '')
      .trim()
      .replace(/^"|"$/g, '');
  const url = get('NEXT_PUBLIC_SUPABASE_URL');
  const key = get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Supabase URL/service key missing');
  return { url, key };
}

const { url: SUPABASE_URL, key: SERVICE_KEY } = env();
const auth = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
const sha12 = (buf) =>
  createHash('sha256').update(buf).digest('hex').slice(0, 12);
const json = (p) => JSON.parse(readFileSync(join(dir, p), 'utf8'));
const pkgFolder = dir.split('/').pop();
const objectPath = (file) => `${pkgFolder}/${file}`;
const publicUrl = (file) =>
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath(file)}`;

// Oblast names as delivered (pre-2022 grid) → leads.region short value.
const REGION = {
  'Акмолинская область': 'Акмолинская',
  'Актюбинская область': 'Актюбинская',
  'Алматинская область': 'Алматинская',
  'Атырауская область': 'Атырауская',
  'Восточно-Казахстанская область': 'ВКО',
  'Жамбылская область': 'Жамбылская',
  'Западно-Казахстанская область': 'Западно-Казахстанская',
  'Карагандинская область': 'Карагандинская',
  'Костанайская область': 'Костанайская',
  'Кызылординская область': 'Кызылординская',
  'Мангистауская область': 'Мангистауская',
  'Павлодарская область': 'Павлодарская',
  'Северо-Казахстанская область': 'Северо-Казахстанская',
  'Туркестанская область': 'Туркестанская',
  'Южно-Казахстанская область': 'Туркестанская',
};
const HEADLINE_TYPES = [
  'spike',
  'average',
  'best_interval',
  'forecast',
  'reserve',
  'unknown',
];

async function rest(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { ...auth, ...(init.headers ?? {}) },
  });
  const body = await res.text();
  if (!res.ok)
    throw new Error(`${init.method ?? 'GET'} ${path}: ${res.status} ${body}`);
  return body ? JSON.parse(body) : null;
}

function verifyPackage(cards, manifest) {
  const refs = new Set();
  for (const card of cards) {
    if (!/^QN-\d{2,}$/.test(card.card_id))
      throw new Error(`bad card_id ${card.card_id}`);
    if (!['active', 'withdrawn'].includes(card.status))
      throw new Error(`${card.card_id}: bad status ${card.status}`);
    if (card.status === 'active')
      for (const img of card.images) refs.add(img.file);
  }
  const listed = new Set(manifest.images.map((i) => i.file));
  if (refs.size !== listed.size || [...refs].some((f) => !listed.has(f)))
    throw new Error('manifest images differ from cards.json references');
  for (const img of manifest.images) {
    const got = sha12(readFileSync(join(dir, img.file)));
    if (got !== img.v) throw new Error(`${img.file}: sha ${got} != v ${img.v}`);
  }
}

// Mirrors the zod schema in src/lib/leads/showcase.ts: a card the site would
// refuse to render must never be written.
function validateShowcase(s) {
  const fail = (why) => {
    throw new Error(`${s.card_id}: invalid card (${why})`);
  };
  const text = (v) => typeof v === 'string' && v.length > 0;
  const loc = (v, name) => (v && text(v.ru)) || fail(name);
  const list = (v, name) =>
    (v && Array.isArray(v.ru) && v.ru.every(text)) || fail(name);
  if (!/^QN-\d{2,}$/.test(s.card_id)) fail('card_id');
  if (!Array.isArray(s.commodity) || !s.commodity.length) fail('commodity');
  loc(s.oblast, 'oblast');
  const z = s.zone ?? {};
  if (
    !(z.center_lat >= 40 && z.center_lat <= 56) ||
    !(z.center_lon >= 46 && z.center_lon <= 88) ||
    !(z.radius_km > 0 && z.radius_km <= 200)
  )
    fail('zone');
  loc(s.headline, 'headline');
  if (!HEADLINE_TYPES.includes(s.headline_type)) fail('headline_type');
  list(s.facts, 'facts');
  if (s.satellite) list(s.satellite, 'satellite');
  for (const img of s.images) {
    if (!/^https:\/\//.test(img.url)) fail('image url');
    if (!(Number.isInteger(img.width) && img.width > 0)) fail('image width');
    if (!(Number.isInteger(img.height) && img.height > 0)) fail('image height');
    if (!/^[0-9a-f]{12}$/.test(img.v)) fail('image v');
    loc(img.caption, 'image caption');
  }
  loc(s.rights?.status, 'rights status');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.rights?.checked_at ?? ''))
    fail('rights date');
  loc(s.whatsapp_text, 'whatsapp_text');
}

function localized(ru, t = {}) {
  const out = { ru };
  if (!translationsReviewed) return out;
  for (const l of LOCALES) if (t[l]) out[l] = t[l];
  return out;
}

function localizedList(ru, t = {}) {
  const out = { ru };
  if (!translationsReviewed) return out;
  for (const l of LOCALES)
    if (Array.isArray(t[l]) && t[l].length === ru.length) out[l] = t[l];
  return out;
}

function buildShowcase(card, tr, trOblast, pkg) {
  const typeLine = card.facts.find((f) => f.startsWith('Тип объекта:'));
  const sourceLine = card.facts.find((f) => f.startsWith('Источник:'));
  const facts = card.facts.filter((f) => f !== typeLine && f !== sourceLine);
  const showcase = {
    package: pkg,
    card_id: card.card_id,
    commodity: card.commodity,
    commodity_ru: card.commodity_ru,
    oblast: localized(card.oblast, trOblast),
    zone: card.zone,
    headline: localized(card.headline, tr.headline),
    headline_type: card.headline_type,
    object_type: typeLine
      ? localized(typeLine.split(':').slice(1).join(':').trim(), tr.object_type)
      : null,
    facts: localizedList(facts, tr.facts),
    source: sourceLine ? localized(sourceLine, tr.source) : null,
    images: card.images.map((img, i) => ({
      url: publicUrl(img.file),
      caption: localized(img.caption, tr.captions?.[i]),
      width: img.width,
      height: img.height,
      v: img.v,
    })),
    rights: {
      status: localized(card.rights.status, tr.rights_status),
      checked_at: card.rights.checked_at,
    },
    whatsapp_text: localized(card.whatsapp_text, tr.whatsapp_text),
  };
  if (Array.isArray(card.satellite) && card.satellite.length)
    showcase.satellite = localizedList(card.satellite, tr.satellite);
  if (tr.featured) {
    const fact = facts[tr.featured.fact_index];
    if (!fact)
      throw new Error(`${card.card_id}: featured fact_index out of range`);
    const factTr = {};
    for (const l of LOCALES)
      if (showcase.facts[l])
        factTr[l] = showcase.facts[l][tr.featured.fact_index];
    showcase.featured = {
      rank: tr.featured.rank,
      fact: localized(fact, factTr),
    };
  }
  validateShowcase(showcase);
  return showcase;
}

function buildRow(card, index) {
  const region = REGION[card.oblast];
  if (!region)
    throw new Error(`${card.card_id}: unknown oblast ${card.oblast}`);
  const showcase = buildShowcase(
    card,
    i18n.cards?.[card.card_id] ?? {},
    i18n.oblasts?.[card.oblast] ?? {},
    manifest.package
  );
  return {
    code: card.card_id,
    registry_ref: `showcase:${card.card_id}`,
    mineral: card.commodity.join('+'),
    type: 'bedrock',
    region,
    tier: 'TIER2_BOMB',
    teaser_title: `${card.commodity_ru} · ${card.oblast}`,
    teaser_summary: null,
    grade_display: card.headline,
    grade_label: card.headline_type,
    byproducts_display: null,
    reserve_categories: null,
    license_status: 'FREE_SHOWCASE_CHECKED',
    last_verified: card.rights.checked_at,
    distance_band: null,
    // The circle centre is drawn on the page only; the column documents a
    // region centroid, never an object point.
    map_centroid: null,
    showcase,
    sort_order: index + 1,
  };
}

// jsonb does not keep key order: compare with keys sorted at every level.
const canonical = (v) =>
  Array.isArray(v)
    ? v.map(canonical)
    : v && typeof v === 'object'
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, canonical(v[k])])
        )
      : v;
const sameJson = (a, b) =>
  JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
const inList = (codes) => `(${codes.map((c) => `"${c}"`).join(',')})`;

async function uploadImage(file) {
  const bytes = readFileSync(join(dir, file));
  if (dryRun) return;
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath(file)}`,
    {
      method: 'POST',
      headers: {
        ...auth,
        'Content-Type': 'image/webp',
        'Cache-Control': 'max-age=3600',
        'x-upsert': 'true',
      },
      body: bytes,
    }
  );
  if (!res.ok)
    throw new Error(`upload ${file}: ${res.status} ${await res.text()}`);
  // Read back through the authenticated endpoint (no CDN cache in between).
  const back = await fetch(
    `${SUPABASE_URL}/storage/v1/object/authenticated/${BUCKET}/${objectPath(file)}`,
    { headers: auth }
  );
  const stored = Buffer.from(await back.arrayBuffer());
  if (!back.ok || sha12(stored) !== sha12(bytes))
    throw new Error(`${file}: stored bytes differ`);
}

async function ensureBucket() {
  const buckets = await rest('/storage/v1/bucket');
  if (buckets.some((b) => b.id === BUCKET)) return;
  if (dryRun) return console.log(`would create public bucket ${BUCKET}`);
  await rest('/storage/v1/bucket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: 2 * 1024 * 1024,
      allowed_mime_types: ['image/webp'],
    }),
  });
  console.log(`created public bucket ${BUCKET}`);
}

async function listBucket(prefix = '') {
  const entries = await rest(`/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix, limit: 1000 }),
  });
  const files = [];
  for (const e of entries ?? []) {
    const path = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.id === null) files.push(...(await listBucket(path)));
    else files.push(path);
  }
  return files;
}

// ---------------------------------------------------------------- main
const cards = json('cards.json');
const manifest = json('manifest.json');
const i18n = json('i18n.json');
const translationsReviewed = Boolean(i18n.reviewed?.by && i18n.reviewed?.at);
verifyPackage(cards, manifest);
console.log(
  `package ${manifest.package}: ${cards.length} cards, images verified; translations ${
    translationsReviewed
      ? `reviewed by ${i18n.reviewed.by} ${i18n.reviewed.at}`
      : 'NOT reviewed → Russian only'
  }`
);

const active = cards.filter((c) => c.status === 'active');
const rows = active.map(buildRow);
const existing = await rest(
  '/rest/v1/leads?select=code,status,showcase,sort_order&registry_ref=like.showcase:*'
);
const byCode = new Map(existing.map((r) => [r.code, r]));

if (publish) {
  const stale = active.filter(
    (c) =>
      Date.now() - Date.parse(`${c.rights.checked_at}T00:00:00Z`) >
      (RIGHTS_VALID_DAYS + 1) * 86400000
  );
  if (stale.length)
    throw new Error(
      `rights check too old for ${stale.map((c) => c.card_id).join(', ')}: ask the geobase for a fresh check`
    );
  const differs = rows.filter(
    (r) =>
      !byCode.get(r.code) || !sameJson(byCode.get(r.code).showcase, r.showcase)
  );
  if (differs.length)
    throw new Error(
      `database differs from the package for ${differs.map((r) => r.code).join(', ')}: import first`
    );
  const codes = rows.map((r) => r.code);
  if (dryRun) {
    console.log(`would publish ${codes.join(', ')}`);
  } else {
    const changed = await rest(
      `/rest/v1/leads?status=eq.DRAFT&code=in.${inList(codes)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          status: 'PUBLISHED',
          published_at: new Date().toISOString(),
        }),
      }
    );
    console.log(
      `published ${changed.length} at ${new Date().toISOString()}: ${changed.map((r) => r.code).join(', ')}`
    );
  }
  process.exit(0);
}

const liveChanges = rows.filter((r) => {
  const cur = byCode.get(r.code);
  return (
    cur?.status === 'PUBLISHED' &&
    (!sameJson(cur.showcase, r.showcase) || cur.sort_order !== r.sort_order)
  );
});
if (liveChanges.length && !updatePublished)
  throw new Error(
    `published cards would change (${liveChanges.map((r) => r.code).join(', ')}); rerun with --update-published after the owner's yes`
  );

// 1. Withdrawn or dropped cards leave the showcase first.
const keep = new Set(rows.map((r) => r.code));
const gone = existing.filter(
  (r) => !keep.has(r.code) && r.status !== 'ARCHIVED'
);
for (const row of gone) {
  if (dryRun) {
    console.log(`would archive ${row.code}`);
    continue;
  }
  await rest(`/rest/v1/leads?code=eq.${row.code}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'ARCHIVED' }),
  });
  console.log(`archived ${row.code}`);
}

// 2. Scans.
await ensureBucket();
const files = [...new Set(active.flatMap((c) => c.images.map((i) => i.file)))];
for (const file of files) await uploadImage(file);
console.log(`images in storage: ${files.length}${dryRun ? ' (dry run)' : ''}`);

// 3. Rows (status untouched: new rows default to DRAFT).
if (dryRun) {
  console.log(
    rows
      .map(
        (r) =>
          `${r.code} sort=${r.sort_order} langs=${Object.keys(r.showcase.headline).join('/')} featured=${r.showcase.featured?.rank ?? '-'} current=${byCode.get(r.code)?.status ?? 'new'}`
      )
      .join('\n')
  );
} else {
  const saved = await rest('/rest/v1/leads?on_conflict=code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
  });
  console.log(
    `upserted ${saved.length}: ${saved.map((r) => `${r.code}=${r.status}`).join(', ')}`
  );
}

// 4. No scan outside the active package stays reachable (any folder).
const referenced = new Set(files.map(objectPath));
const staleFiles = (await listBucket()).filter((p) => !referenced.has(p));
if (staleFiles.length) {
  if (dryRun) console.log(`would delete ${staleFiles.join(', ')}`);
  else {
    await rest(`/storage/v1/object/${BUCKET}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: staleFiles }),
    });
    console.log(`deleted from storage: ${staleFiles.join(', ')}`);
  }
}
