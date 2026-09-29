#!/usr/bin/env node
// Load a geobase showcase package into Supabase (leads.showcase + storage).
//
// The package itself never enters git: this repository is public and its
// history would keep withdrawn cards (a withdrawal date narrows the place).
// Keep it in the gitignored data/showcase/<version>/ folder.
//
//   node scripts/import-showcase.mjs --dir data/showcase/v1 [--dry-run]
//   node scripts/import-showcase.mjs --dir data/showcase/v1 --publish
//
// Import writes new cards as DRAFT and never changes an existing status.
// --publish flips exactly the package's active cards to PUBLISHED; run it only
// after the geobase leak gate and the owner's "yes".
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
const BUCKET = 'showcase';

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

function localized(ru, t = {}) {
  const out = { ru };
  for (const loc of ['kz', 'en', 'zh']) if (t[loc]) out[loc] = t[loc];
  return out;
}

function localizedList(ru, t = {}) {
  const out = { ru };
  for (const loc of ['kz', 'en', 'zh'])
    if (Array.isArray(t[loc]) && t[loc].length === ru.length) out[loc] = t[loc];
  return out;
}

function buildShowcase(card, tr, trOblast, pkg, publicUrl) {
  const typeLine = card.facts.find((f) => f.startsWith('Тип объекта:'));
  const sourceLine = card.facts.find((f) => f.startsWith('Источник:'));
  const facts = card.facts.filter((f) => f !== typeLine && f !== sourceLine);
  const showcase = {
    package: pkg,
    card_id: card.card_id,
    commodity: card.commodity,
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
  if (tr.featured) {
    const fact = facts[tr.featured.fact_index];
    if (!fact)
      throw new Error(`${card.card_id}: featured fact_index out of range`);
    const factTr = {};
    for (const loc of ['kz', 'en', 'zh'])
      if (showcase.facts[loc])
        factTr[loc] = showcase.facts[loc][tr.featured.fact_index];
    showcase.featured = {
      rank: tr.featured.rank,
      fact: localized(fact, factTr),
    };
  }
  return showcase;
}

async function uploadImage(file) {
  const bytes = readFileSync(join(dir, file));
  const objectPath = `${pkgFolder}/${file}`;
  if (!dryRun) {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`,
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
    const back = Buffer.from(
      await (
        await fetch(
          `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`
        )
      ).arrayBuffer()
    );
    if (sha12(back) !== sha12(bytes))
      throw new Error(`${file}: stored bytes differ`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
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

const cards = json('cards.json');
const manifest = json('manifest.json');
const i18n = json('i18n.json');
const pkgFolder = dir.split('/').pop();
verifyPackage(cards, manifest);
console.log(
  `package ${manifest.package}: ${cards.length} cards, images verified`
);

const active = cards.filter((c) => c.status === 'active');
const withdrawn = cards.filter((c) => c.status === 'withdrawn');

if (publish) {
  const codes = active.map((c) => c.card_id);
  const rows = await rest(
    `/rest/v1/leads?select=code,status,showcase&code=in.(${codes.map((c) => `"${c}"`).join(',')})`
  );
  if (rows.length !== codes.length || rows.some((r) => !r.showcase))
    throw new Error('import the package before publishing');
  if (dryRun) {
    console.log(`would publish ${codes.join(', ')}`);
  } else {
    const changed = await rest(
      `/rest/v1/leads?status=eq.DRAFT&code=in.(${codes.map((c) => `"${c}"`).join(',')})`,
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
      `published ${changed.length}: ${changed.map((r) => r.code).join(', ')}`
    );
  }
  process.exit(0);
}

await ensureBucket();
const publicUrls = new Map();
for (const card of active)
  for (const img of card.images)
    if (!publicUrls.has(img.file))
      publicUrls.set(img.file, await uploadImage(img.file));
console.log(
  `images in storage: ${publicUrls.size}${dryRun ? ' (dry run)' : ''}`
);

// A scan that left the package must not stay reachable by its old URL.
const stored = await rest(`/storage/v1/object/list/${BUCKET}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prefix: `${pkgFolder}/img`, limit: 1000 }),
});
const stale = stored
  .map((o) => `img/${o.name}`)
  .filter((file) => !publicUrls.has(file))
  .map((file) => `${pkgFolder}/${file}`);
if (stale.length) {
  if (dryRun) console.log(`would delete ${stale.join(', ')}`);
  else {
    await rest(`/storage/v1/object/${BUCKET}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: stale }),
    });
    console.log(`deleted from storage: ${stale.join(', ')}`);
  }
}

const rows = active.map((card, index) => {
  const region = REGION[card.oblast];
  if (!region)
    throw new Error(`${card.card_id}: unknown oblast ${card.oblast}`);
  const showcase = buildShowcase(
    card,
    i18n.cards?.[card.card_id] ?? {},
    i18n.oblasts?.[card.oblast] ?? {},
    manifest.package,
    (file) => publicUrls.get(file)
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
    map_centroid: { lat: card.zone.center_lat, lon: card.zone.center_lon },
    showcase,
    sort_order: index + 1,
  };
});

if (dryRun) {
  console.log(
    JSON.stringify(
      rows.map((r) => ({
        code: r.code,
        sort: r.sort_order,
        langs: Object.keys(r.showcase.headline),
        featured: r.showcase.featured?.rank ?? null,
      })),
      null,
      1
    )
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

// Withdrawn or dropped cards leave the showcase (their scans were deleted above).
const existing = await rest(
  `/rest/v1/leads?select=code,status&registry_ref=like.showcase:*`
);
const keep = new Set(active.map((c) => c.card_id));
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
if (withdrawn.length)
  console.log(
    `withdrawn in package: ${withdrawn.map((c) => c.card_id).join(', ')}`
  );
