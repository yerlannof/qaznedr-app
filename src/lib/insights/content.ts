import { readFileSync } from 'fs';
import path from 'path';
import { marked } from 'marked';
import { translate } from '@/lib/i18n/translations';
import type { Locale } from '@/lib/seo/site';
import { parseFrontMatter } from './front-matter';
import {
  INSIGHTS,
  INSIGHT_FALLBACK_LOCALE,
  findInsight,
  type InsightCategory,
  type InsightEntry,
} from './registry';
import { guideContactHref } from './contact-context';
import { getServiceTopic } from '@/lib/services/topics';

// Server only (fs). Pages that use it are prerendered at build time.

export const INSIGHTS_DIR = path.join(process.cwd(), 'content', 'insights');

export interface ArticleCard {
  slug: string;
  /** Language of the text, which may differ from the page when a fallback is used. */
  locale: Locale;
  title: string;
  description: string;
  category: InsightCategory;
  updated: string;
  readingMinutes: number;
}

export interface Article extends ArticleCard {
  html: string;
  toc: ArticleTocItem[];
}

export interface ArticleTocItem {
  id: string;
  title: string;
  level: 2 | 3;
}

export function articlePath(slug: string, locale: Locale): string {
  return path.join(INSIGHTS_DIR, slug, `${locale}.md`);
}

function plainHeading(html: string): string {
  const entities: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    ndash: '–',
    mdash: '—',
    hellip: '…',
    lsquo: '‘',
    rsquo: '’',
    ldquo: '“',
    rdquo: '”',
  };
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, key: string) => {
      if (key.startsWith('#')) {
        const value =
          key[1].toLowerCase() === 'x'
            ? parseInt(key.slice(2), 16)
            : parseInt(key.slice(1), 10);
        return value > 0 &&
          value <= 0x10ffff &&
          !(value >= 0xd800 && value <= 0xdfff)
          ? String.fromCodePoint(value)
          : entity;
      }
      return entities[key.toLowerCase()] ?? entity;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function renderWithToc(
  markdown: string,
  tableLabel: string
): { html: string; toc: ArticleTocItem[] } {
  const toc: ArticleTocItem[] = [];
  const renderer = new marked.Renderer();
  renderer.heading = function ({ tokens, depth }) {
    const content = this.parser.parseInline(tokens);
    if (depth !== 2 && depth !== 3)
      return `<h${depth}>${content}</h${depth}>\n`;
    const id = `section-${toc.length + 1}`;
    toc.push({ id, title: plainHeading(content), level: depth });
    return `<h${depth} id="${id}" tabindex="-1" class="scroll-mt-24">${content}</h${depth}>\n`;
  };
  const html = marked.parse(markdown, {
    async: false,
    gfm: true,
    renderer,
  }) as string;
  let tableNumber = 0;
  // Focusable region: wide tables scroll inside, keyboard users reach them.
  return {
    toc,
    html: html
      .replace(/<table>/g, () => {
        tableNumber += 1;
        const label = `${tableLabel} ${tableNumber}`
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;');
        return `<div class="insight-table" tabindex="0" role="region" aria-label="${label}"><table>`;
      })
      .replace(/<\/table>/g, '</table></div>')
      .replace(
        /<a href="(https?:\/\/[^"]+)"/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer"'
      ),
  };
}

export function renderMarkdown(markdown: string, tableLabel = 'Table'): string {
  return renderWithToc(markdown, tableLabel).html;
}

export function readingMinutes(markdown: string, locale: Locale): number {
  const text = markdown.replace(/[#>*_`|[\]()-]/g, ' ');
  const units =
    locale === 'zh'
      ? (text.match(/[㐀-鿿]/g) ?? []).length / 400
      : text.split(/\s+/).filter(Boolean).length / 200;
  return Math.max(1, Math.round(units));
}

export function parseArticle(
  source: string,
  entry: InsightEntry,
  locale: Locale
): Article {
  const { data, body } = parseFrontMatter(source);
  const file = `${entry.slug}/${locale}.md`;
  if (!data.title) throw new Error(`${file}: missing title`);
  if (!data.description) throw new Error(`${file}: missing description`);
  const { html, toc } = renderWithToc(
    body,
    translate(locale, 'insights.table')
  );
  // The page prints the title as its only H1.
  if (/<h1[\s>]/i.test(html)) throw new Error(`${file}: H1 in the body`);
  return {
    slug: entry.slug,
    locale,
    title: data.title,
    description: data.description,
    category: entry.category,
    updated: entry.updated,
    readingMinutes: readingMinutes(body, locale),
    html: html.replace(
      new RegExp(`href="/${locale}/contact(?:\\?service=([^"&]+))?"`, 'g'),
      (original, rawService: string | undefined) => {
        const service = rawService ? getServiceTopic(rawService) : undefined;
        if (rawService && !service) return original;
        return `href="${guideContactHref(locale, entry.slug, service).replaceAll('&', '&amp;')}"`;
      }
    ),
    toc,
  };
}

/** null only for languages the guide is not written in; a file the registry
 * promises but that is missing throws, so the build fails instead of
 * shipping an index without the guide. */
export function getArticle(slug: string, locale: Locale): Article | null {
  const entry = findInsight(slug);
  if (!entry || !entry.locales.includes(locale)) return null;
  return parseArticle(
    readFileSync(articlePath(slug, locale), 'utf8'),
    entry,
    locale
  );
}

/** Cards for the index; articles without this language fall back to ru. */
export function listArticles(locale: Locale): ArticleCard[] {
  return INSIGHTS.flatMap((entry) => {
    const article =
      getArticle(entry.slug, locale) ??
      getArticle(entry.slug, INSIGHT_FALLBACK_LOCALE);
    if (!article) return [];
    return [
      {
        slug: article.slug,
        locale: article.locale,
        title: article.title,
        description: article.description,
        category: article.category,
        updated: article.updated,
        readingMinutes: article.readingMinutes,
      },
    ];
  });
}
