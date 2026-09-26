const HEADER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/**
 * Minimal front matter: `key: value` lines between `---` fences. Values are
 * taken verbatim after the first colon (no quotes, no multi-line values).
 */
export function parseFrontMatter(source: string): {
  data: Record<string, string>;
  body: string;
} {
  const match = HEADER.exec(source);
  if (!match) throw new Error('Missing front matter (--- … ---) at the top');
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(':');
    if (colon <= 0) throw new Error(`Bad front matter line: "${line}"`);
    data[trimmed.slice(0, colon).trim()] = trimmed.slice(colon + 1).trim();
  }
  return { data, body: source.slice(match[0].length) };
}
