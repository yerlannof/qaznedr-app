import { readFileSync } from 'fs';
import path from 'path';
import { marked } from 'marked';
import type { Locale } from '@/lib/seo/site';
import { parseFrontMatter } from './front-matter';
import {
  INSIGHTS,
  INSIGHT_FALLBACK_LOCALE,
  findInsight,
  type InsightCategory,
  type InsightEntry,
} from './registry';

// Server only (fs). Pages that use it are prerendered at build time.

export const INSIGHTS_DIR = path.join(process.cwd(), 'content', 'insights');

export interface ArticleCard {
  slug: string;
  /** Language of the text, which may differ from the page (kz → ru). */
  locale: Locale;
  title: string;
  description: string;
  category: InsightCategory;
  updated: string;
  readingMinutes: number;
}

export interface Article extends ArticleCard {
  html: string;
}

export function articlePath(slug: string, locale: Locale): string {
  return path.join(INSIGHTS_DIR, slug, `${locale}.md`);
}

export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false, gfm: true }) as string;
  return html
    .replace(/<table>/g, '<div class="insight-table"><table>')
    .replace(/<\/table>/g, '</table></div>')
    .replace(
      /<a href="(https?:\/\/[^"]+)"/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer"'
    );
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
  const html = renderMarkdown(body);
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
    html,
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
