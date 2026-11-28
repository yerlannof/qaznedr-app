import { marked } from 'marked';

// Gold showcase cards (APPSALE gold_v1) arrive as Markdown written by our own export.
// Raw HTML inside is never trusted: it is printed as text. Crop images point to `crops/<file>`
// in the export; on the site they go through the gated route /api/gold/<code>/crop/<file>,
// and only files listed in the card's own `crops` survive — anything else is dropped.

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ] as string
  );

export function cropUrl(code: string, file: string): string {
  return `/api/gold/${encodeURIComponent(code)}/crop/${encodeURIComponent(file)}`;
}

export function renderGoldMd(
  md: string,
  code: string,
  crops: readonly string[] = []
): string {
  const renderer = new marked.Renderer();
  renderer.html = ({ text }) => esc(text);
  renderer.image = ({ href, text }) => {
    const m = /^crops\/([A-Za-z0-9._-]+)$/.exec(href || '');
    if (!m || !crops.includes(m[1])) return '';
    return `<img src="${esc(cropUrl(code, m[1]))}" alt="${esc(text || '')}" loading="lazy" class="gold-crop">`;
  };
  renderer.link = function ({ tokens }) {
    // the export has no outside links; keep the words, drop the address
    return this.parser.parseInline(tokens);
  };
  const html = marked.parse(md, { async: false, gfm: true, renderer }) as string;
  // the export opens each key/value table with an empty «| | |» header: drop that empty row
  return html.replace(/<thead>\s*<tr>(?:\s*<th[^>]*>\s*<\/th>)+\s*<\/tr>\s*<\/thead>\s*/g, '');
}

/** Rights row of the open table («| Права | 🟠 под разведкой |»): dropped once the 30-day rights check has expired. */
export function dropRightsRow(md: string): string {
  return md
    .split('\n')
    .filter((l) => !/^\|\s*Права\s*\|/.test(l))
    .join('\n');
}
