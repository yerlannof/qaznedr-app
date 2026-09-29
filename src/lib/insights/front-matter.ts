const HEADER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/**
 * Minimal front matter: `key: value` lines between `---` fences. Values are
 * read after the first colon. Unquoted values stay literal, including inner
 * colons and apostrophes. Paired single quotes use YAML's doubled-apostrophe
 * escape; paired double quotes use JSON-compatible escapes. No multiline
 * values or other YAML features are supported.
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
    const raw = trimmed.slice(colon + 1).trim();
    let value = raw;
    if (raw.length >= 2 && raw.startsWith("'") && raw.endsWith("'")) {
      value = raw.slice(1, -1).replace(/''/g, "'");
    } else if (raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')) {
      value = JSON.parse(raw) as string;
    }
    data[trimmed.slice(0, colon).trim()] = value;
  }
  return { data, body: source.slice(match[0].length) };
}
