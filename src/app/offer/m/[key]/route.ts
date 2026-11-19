import { keyMatches, NOINDEX_HEADERS, OFFER_BUCKET } from '@/lib/offer-files/manifest';
import { loadManifest, notFound, openCounts } from '@/lib/offer-files/store';

export const dynamic = 'force-dynamic';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1).replace('.', ',')} МБ`;

/** Unlisted page for the partner: one bookmark, always the current files. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const loaded = await loadManifest();
  if (!loaded || !keyMatches(key, loaded.manifest.keys.muhtar)) return notFound();
  const { db, manifest } = loaded;
  const origin = new URL(request.url).origin;
  const counts = await openCounts(db);
  const seen = (doc: string) => {
    const c = counts[doc];
    return c ? `открыли ${c.total} раз, за неделю ${c.week}` : 'ещё не открывали';
  };

  const when = new Date(manifest.published_at).toLocaleString('ru-RU', {
    timeZone: 'Asia/Almaty',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rows: string[] = [];
  const titles = { ru: 'Основной список, русский', en: 'Основной список, английский', zh: 'Основной список, китайский' } as const;
  for (const doc of ['ru', 'en', 'zh'] as const) {
    const f = manifest.docs[doc];
    if (!f) continue;
    const link = `${origin}/offer/${doc}`;
    rows.push(`<li><a class="btn" href="/offer/${doc}?m=1">${titles[doc]}</a>
      <div class="meta">${esc(f.version)} · ${mb(f.bytes)} · ${seen(doc)}</div>
      <div class="link">Ссылка для покупателя: <code>${esc(link)}</code></div></li>`);
  }
  const s = manifest.docs.search_ru;
  if (s) {
    rows.push(`<li><a class="btn" href="/offer/s/${esc(manifest.keys.search)}?m=1">Объекты для поисков, русский</a>
      <div class="meta">${esc(s.version)} · ${mb(s.bytes)} · ${seen('search_ru')}</div>
      <div class="link">Скрытая ссылка: <code>${esc(`${origin}/offer/s/${manifest.keys.search}`)}</code></div></li>`);
  }

  let gallery = '';
  const status = manifest.status?.files ?? [];
  if (status.length) {
    const paths = status.map((f) => f.path);
    const bucket = db.storage.from(OFFER_BUCKET);
    const [view, dl] = await Promise.all([
      bucket.createSignedUrls(paths, 3600),
      Promise.all(status.map((f) => bucket.createSignedUrl(f.path, 3600, { download: f.name }))),
    ]);
    const cards = status.map((f, i) => {
      const src = view.data?.[i]?.signedUrl;
      const href = dl[i]?.data?.signedUrl;
      if (!src || !href) return '';
      return `<figure><a href="${esc(src)}"><img loading="lazy" src="${esc(src)}" alt="${esc(f.name)}"></a>
        <figcaption><a href="${esc(href)}">Скачать</a> <span>${esc(f.name)}</span></figcaption></figure>`;
    });
    gallery = `<h2>Картинки для статусов (${status.length}, ${esc(manifest.status!.version)})</h2>
      <p class="meta">Нажмите «Скачать» под картинкой. Ссылки на картинки живут час, обновите страницу, если не открывается.</p>
      <div class="grid">${cards.join('')}</div>`;
  }

  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive"><meta name="referrer" content="no-referrer">
<title>QazNedr: текущие файлы</title>
<style>
:root{--bg:#fff;--fg:#14171a;--mute:#5f6b76;--line:#e3e7eb;--acc:#0b5cad}
@media (prefers-color-scheme:dark){:root{--bg:#0f1214;--fg:#e8ecef;--mute:#9aa6b1;--line:#2a3036;--acc:#6fb0f2}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:860px;margin:0 auto;padding:20px 16px 48px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:18px;margin:32px 0 6px}
.meta{color:var(--mute);font-size:14px}
ul{list-style:none;padding:0;margin:16px 0 0}li{padding:14px 0;border-top:1px solid var(--line)}
.btn{display:inline-block;background:var(--acc);color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:600}
.link{font-size:13px;color:var(--mute);margin-top:4px;word-break:break-all}code{font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:12px}
figure{margin:0;border:1px solid var(--line);border-radius:8px;overflow:hidden}
img{display:block;width:100%;height:auto;background:var(--line)}
figcaption{padding:6px 8px;font-size:12px;color:var(--mute);word-break:break-all}
figcaption a{color:var(--acc);font-weight:600;font-size:14px;margin-right:4px}
</style></head><body><main>
<h1>Текущие файлы QazNedr</h1>
<div class="meta">Обновлено ${esc(when)} (Алматы). Эта страница всегда показывает последнюю версию.</div>
<ul>${rows.join('')}</ul>
${gallery}
</main></body></html>`;

  return new Response(html, {
    status: 200,
    headers: { ...NOINDEX_HEADERS, 'Content-Type': 'text/html; charset=utf-8' },
  });
}
